/**
 * Blaze Intelligence - Telemetry API Worker
 * Privacy-compliant event collection and processing
 */

export default {
    async fetch(request, env, ctx) {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, X-Session-ID',
                    'Access-Control-Max-Age': '86400'
                }
            });
        }
        
        const url = new URL(request.url);
        
        try {
            if (url.pathname === '/api/telemetry' && request.method === 'POST') {
                return await this.handleTelemetryEvent(request, env, ctx);
            } else if (url.pathname === '/api/telemetry/health' && request.method === 'GET') {
                return await this.handleHealthCheck(request, env, ctx);
            } else if (url.pathname === '/api/telemetry/metrics' && request.method === 'GET') {
                return await this.handleMetricsQuery(request, env, ctx);
            } else {
                return new Response('Not Found', { status: 404 });
            }
        } catch (error) {
            console.error('Telemetry API Error:', error);
            return new Response(JSON.stringify({
                error: 'Internal Server Error',
                message: 'Telemetry processing failed'
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    },
    
    async handleTelemetryEvent(request, env, ctx) {
        const sessionId = request.headers.get('X-Session-ID');
        const clientIP = request.headers.get('CF-Connecting-IP');
        const userAgent = request.headers.get('User-Agent');
        const referer = request.headers.get('Referer');
        
        let payload;
        try {
            payload = await request.json();
        } catch (error) {
            return new Response(JSON.stringify({
                error: 'Invalid JSON payload'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        
        // Validate payload structure
        if (!payload.sessionId || !payload.events || !Array.isArray(payload.events)) {
            return new Response(JSON.stringify({
                error: 'Invalid payload structure'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        
        // Process events
        const processedEvents = [];
        const timestamp = Date.now();
        
        for (const event of payload.events) {
            // Privacy compliance - remove PII
            const processedEvent = await this.processEvent(event, {
                sessionId,
                clientIP,
                userAgent,
                referer,
                timestamp,
                env
            });
            
            if (processedEvent) {
                processedEvents.push(processedEvent);
            }
        }
        
        // Store events (KV for session data, Analytics Engine for metrics)
        await Promise.all([
            this.storeSessionEvents(sessionId, processedEvents, env),
            this.sendToAnalytics(processedEvents, env),
            this.updateMetrics(processedEvents, env)
        ]);
        
        return new Response(JSON.stringify({
            success: true,
            eventsProcessed: processedEvents.length,
            timestamp
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache'
            }
        });
    },
    
    async processEvent(event, context) {
        const { sessionId, clientIP, userAgent, referer, timestamp, env } = context;
        
        // Basic validation
        if (!event.type || !event.timestamp) {
            return null;
        }
        
        // Enhanced event data
        const processedEvent = {
            id: event.id || `evt_${timestamp}_${Math.random().toString(36).slice(2, 11)}`,
            type: event.type,
            timestamp: event.timestamp,
            sessionId: event.sessionId || sessionId,
            
            // Geographic data (privacy-safe)
            country: context.country || 'Unknown',
            region: context.region || 'Unknown',
            
            // Technical metadata
            userAgent: this.sanitizeUserAgent(userAgent),
            referer: this.sanitizeReferer(referer),
            
            // Event-specific data
            data: this.sanitizeEventData(event.data || {}),
            
            // Performance context
            performance: event.performance || {},
            
            // Processing metadata
            processedAt: timestamp,
            version: '1.0.0'
        };
        
        // Add Cloudflare-specific data if available
        if (context.cf) {
            processedEvent.cf = {
                country: context.cf.country,
                region: context.cf.region,
                city: context.cf.city,
                timezone: context.cf.timezone,
                asn: context.cf.asn
            };
        }
        
        return processedEvent;
    },
    
    async storeSessionEvents(sessionId, events, env) {
        if (!env.TELEMETRY_KV) return;
        
        try {
            const sessionKey = `session:${sessionId}:events`;
            const existingData = await env.TELEMETRY_KV.get(sessionKey, { type: 'json' }) || [];
            
            const updatedData = [...existingData, ...events];
            
            // Keep only last 1000 events per session
            if (updatedData.length > 1000) {
                updatedData.splice(0, updatedData.length - 1000);
            }
            
            await env.TELEMETRY_KV.put(sessionKey, JSON.stringify(updatedData), {
                expirationTtl: 86400 * 7 // 7 days
            });
            
            console.log(`Stored ${events.length} events for session ${sessionId}`);
        } catch (error) {
            console.error('Failed to store session events:', error);
        }
    },
    
    async sendToAnalytics(events, env) {
        // Send to Cloudflare Analytics Engine if available
        if (env.ANALYTICS_ENGINE) {
            try {
                for (const event of events) {
                    env.ANALYTICS_ENGINE.writeDataPoint({
                        blobs: [
                            event.sessionId,
                            event.type,
                            event.userAgent,
                            JSON.stringify(event.data)
                        ],
                        doubles: [
                            event.timestamp,
                            event.performance?.fps || 60,
                            event.performance?.memory || 0,
                            event.performance?.latency || 0
                        ],
                        indexes: [event.sessionId]
                    });
                }
                console.log(`Sent ${events.length} events to Analytics Engine`);
            } catch (error) {
                console.error('Failed to send to Analytics Engine:', error);
            }
        }
        
        // Also send to external analytics if configured
        if (env.HONEYCOMB_API_KEY) {
            try {
                await this.sendToHoneycomb(events, env);
            } catch (error) {
                console.error('Failed to send to Honeycomb:', error);
            }
        }
    },
    
    async sendToHoneycomb(events, env) {
        const honeycombEvents = events.map(event => ({
            time: new Date(event.timestamp).toISOString(),
            data: {
                'telemetry.event_id': event.id,
                'telemetry.event_type': event.type,
                'telemetry.session_id': event.sessionId,
                'telemetry.user_agent': event.userAgent,
                'telemetry.referer': event.referer,
                'telemetry.country': event.country,
                'telemetry.region': event.region,
                'game.fps': event.performance?.fps,
                'game.memory_mb': event.performance?.memory,
                'game.latency_ms': event.performance?.latency,
                ...this.flattenEventData(event.data, 'event.')
            }
        }));
        
        await fetch('https://api.honeycomb.io/1/batch/blaze-intelligence', {
            method: 'POST',
            headers: {
                'X-Honeycomb-Team': env.HONEYCOMB_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(honeycombEvents)
        });
    },
    
    async updateMetrics(events, env) {
        if (!env.METRICS_KV) return;
        
        try {
            const today = new Date().toISOString().split('T')[0];
            const metricsKey = `metrics:${today}`;
            
            const existingMetrics = await env.METRICS_KV.get(metricsKey, { type: 'json' }) || {
                totalEvents: 0,
                uniqueSessions: new Set(),
                eventTypes: {},
                errorCount: 0,
                performanceMetrics: {
                    avgFps: 0,
                    avgMemory: 0,
                    avgLatency: 0
                }
            };
            
            // Update metrics
            existingMetrics.totalEvents += events.length;
            
            for (const event of events) {
                existingMetrics.uniqueSessions.add(event.sessionId);
                existingMetrics.eventTypes[event.type] = (existingMetrics.eventTypes[event.type] || 0) + 1;
                
                if (event.type === 'error') {
                    existingMetrics.errorCount++;
                }
                
                // Update performance averages
                if (event.performance) {
                    const perf = existingMetrics.performanceMetrics;
                    perf.avgFps = ((perf.avgFps + (event.performance.fps || 60)) / 2);
                    perf.avgMemory = ((perf.avgMemory + (event.performance.memory || 0)) / 2);
                    perf.avgLatency = ((perf.avgLatency + (event.performance.latency || 0)) / 2);
                }
            }
            
            // Convert Set to array for JSON storage
            const metricsToStore = {
                ...existingMetrics,
                uniqueSessions: Array.from(existingMetrics.uniqueSessions)
            };
            
            await env.METRICS_KV.put(metricsKey, JSON.stringify(metricsToStore), {
                expirationTtl: 86400 * 30 // 30 days
            });
            
        } catch (error) {
            console.error('Failed to update metrics:', error);
        }
    },
    
    async handleHealthCheck(request, env, ctx) {
        const status = {
            status: 'healthy',
            timestamp: Date.now(),
            version: '1.0.0',
            uptime: Date.now() - (this.startTime || Date.now()),
            services: {
                kv: !!env.TELEMETRY_KV,
                analytics: !!env.ANALYTICS_ENGINE,
                metrics: !!env.METRICS_KV
            }
        };
        
        return new Response(JSON.stringify(status, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    },
    
    async handleMetricsQuery(request, env, ctx) {
        if (!env.METRICS_KV) {
            return new Response(JSON.stringify({
                error: 'Metrics not available'
            }), {
                status: 503,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        
        const url = new URL(request.url);
        const days = parseInt(url.searchParams.get('days') || '7');
        
        const metrics = await this.getMetrics(days, env);
        
        return new Response(JSON.stringify(metrics, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'max-age=300' // 5 minutes cache
            }
        });
    },
    
    async getMetrics(days, env) {
        const metrics = {
            period: `${days} days`,
            totalEvents: 0,
            uniqueSessions: new Set(),
            eventTypes: {},
            errorCount: 0,
            performanceMetrics: {
                avgFps: 0,
                avgMemory: 0,
                avgLatency: 0
            },
            dailyBreakdown: []
        };
        
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            
            try {
                const dayMetrics = await env.METRICS_KV.get(`metrics:${dateKey}`, { type: 'json' });
                if (dayMetrics) {
                    metrics.totalEvents += dayMetrics.totalEvents || 0;
                    metrics.errorCount += dayMetrics.errorCount || 0;
                    
                    // Merge unique sessions
                    if (dayMetrics.uniqueSessions) {
                        dayMetrics.uniqueSessions.forEach(session => metrics.uniqueSessions.add(session));
                    }
                    
                    // Merge event types
                    for (const [type, count] of Object.entries(dayMetrics.eventTypes || {})) {
                        metrics.eventTypes[type] = (metrics.eventTypes[type] || 0) + count;
                    }
                    
                    metrics.dailyBreakdown.push({
                        date: dateKey,
                        events: dayMetrics.totalEvents || 0,
                        sessions: dayMetrics.uniqueSessions ? dayMetrics.uniqueSessions.length : 0,
                        errors: dayMetrics.errorCount || 0
                    });
                }
            } catch (error) {
                console.error(`Failed to get metrics for ${dateKey}:`, error);
            }
        }
        
        // Convert Set to count
        metrics.uniqueSessions = metrics.uniqueSessions.size;
        
        return metrics;
    },
    
    // Utility methods
    sanitizeUserAgent(userAgent) {
        if (!userAgent) return 'Unknown';
        
        // Extract browser and version only (privacy-safe)
        const match = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/);
        return match ? match[0] : 'Unknown Browser';
    },
    
    sanitizeReferer(referer) {
        if (!referer) return 'Direct';
        
        try {
            const url = new URL(referer);
            return url.hostname;
        } catch {
            return 'Invalid';
        }
    },
    
    sanitizeEventData(data) {
        const sanitized = { ...data };
        
        // Remove potential PII
        const piiKeys = ['email', 'phone', 'name', 'address', 'ip', 'ssn'];
        for (const key of piiKeys) {
            if (sanitized[key]) {
                delete sanitized[key];
            }
        }
        
        // Truncate long strings
        for (const [key, value] of Object.entries(sanitized)) {
            if (typeof value === 'string' && value.length > 1000) {
                sanitized[key] = value.substring(0, 1000) + '...';
            }
        }
        
        return sanitized;
    },
    
    flattenEventData(data, prefix = '') {
        const flattened = {};
        
        for (const [key, value] of Object.entries(data)) {
            const flatKey = prefix + key;
            
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                Object.assign(flattened, this.flattenEventData(value, `${flatKey}.`));
            } else {
                flattened[flatKey] = value;
            }
        }
        
        return flattened;
    }
};