/**
 * Blaze Intelligence - Telemetry Pipeline
 * Privacy-compliant event tracking with OpenTelemetry integration
 */

class TelemetryPipeline {
    constructor(config = {}) {
        this.config = {
            endpoint: config.endpoint || '/api/telemetry',
            batchSize: config.batchSize || 50,
            flushInterval: config.flushInterval || 30000, // 30 seconds
            enablePerformance: config.enablePerformance !== false,
            enableErrors: config.enableErrors !== false,
            enableEvents: config.enableEvents !== false,
            privacyMode: config.privacyMode !== false,
            samplingRate: config.samplingRate || 1.0,
            ...config
        };
        
        this.sessionId = this.generateSessionId();
        this.userId = this.getOrCreateUserId();
        this.batch = [];
        this.startTime = Date.now();
        
        // OpenTelemetry integration
        this.tracer = this.initializeOpenTelemetry();
        
        this.initialize();
    }
    
    generateSessionId() {
        return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }
    
    getOrCreateUserId() {
        if (!this.config.privacyMode) {
            let userId = localStorage.getItem('blaze_user_id');
            if (!userId) {
                userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
                localStorage.setItem('blaze_user_id', userId);
            }
            return userId;
        }
        // In privacy mode, use ephemeral session-based ID
        return `anon_${this.sessionId.split('_')[1]}`;
    }
    
    initializeOpenTelemetry() {
        // Initialize OpenTelemetry Web SDK
        if (typeof window !== 'undefined') {
            try {
                // Simplified OpenTelemetry setup for browser
                const tracer = {
                    startSpan: (name, attributes = {}) => {
                        const span = {
                            name,
                            startTime: Date.now(),
                            attributes: { ...attributes, sessionId: this.sessionId },
                            end: function() {
                                this.endTime = Date.now();
                                this.duration = this.endTime - this.startTime;
                            }
                        };
                        return span;
                    }
                };
                
                console.log('🔍 OpenTelemetry tracer initialized');
                return tracer;
            } catch (error) {
                console.warn('OpenTelemetry initialization failed:', error);
                return null;
            }
        }
        return null;
    }
    
    initialize() {
        this.setupPerformanceTracking();
        this.setupErrorTracking();
        this.setupPageTracking();
        this.setupGameEventTracking();
        this.setupBatchFlushing();
        
        // Send initial page load event
        this.trackEvent('page_load', {
            url: window.location.href,
            referrer: document.referrer || 'direct',
            timestamp: Date.now()
        });
        
        console.log('📊 Blaze Intelligence Telemetry Pipeline initialized');
    }
    
    setupPerformanceTracking() {
        if (!this.config.enablePerformance) return;
        
        // Core Web Vitals tracking
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.trackPerformanceMetric(entry);
            }
        });
        
        try {
            observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
        } catch (e) {
            console.warn('Performance Observer not supported:', e);
        }
        
        // Custom performance tracking
        window.addEventListener('load', () => {
            setTimeout(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                if (navigation) {
                    this.trackEvent('performance_metrics', {
                        loadTime: navigation.loadEventEnd - navigation.fetchStart,
                        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
                        firstPaint: this.getFirstPaint(),
                        pageSize: this.estimatePageSize()
                    });
                }
            }, 0);
        });
    }
    
    setupErrorTracking() {
        if (!this.config.enableErrors) return;
        
        window.addEventListener('error', (event) => {
            this.trackError('javascript_error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError('unhandled_promise_rejection', {
                reason: event.reason?.toString(),
                stack: event.reason?.stack
            });
        });
    }
    
    setupPageTracking() {
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.trackEvent('page_visibility_change', {
                visible: !document.hidden,
                timestamp: Date.now()
            });
        });
        
        // Track page unload
        window.addEventListener('beforeunload', () => {
            this.trackEvent('page_unload', {
                timeOnPage: Date.now() - this.startTime,
                timestamp: Date.now()
            });
            this.flush(true); // Force flush before unload
        });
    }
    
    setupGameEventTracking() {
        // Game-specific event tracking
        document.addEventListener('blaze-game-event', (event) => {
            const { type, data } = event.detail;
            this.trackGameEvent(type, data);
        });
        
        // Performance monitoring for game loops
        this.gamePerformanceTracker = new GamePerformanceTracker(this);
    }
    
    setupBatchFlushing() {
        // Flush batch periodically
        setInterval(() => {
            if (this.batch.length > 0) {
                this.flush();
            }
        }, this.config.flushInterval);
        
        // Flush when batch is full
        this.checkBatchFlush = () => {
            if (this.batch.length >= this.config.batchSize) {
                this.flush();
            }
        };
    }
    
    trackEvent(type, data = {}) {
        if (!this.config.enableEvents || Math.random() > this.config.samplingRate) return;
        
        const span = this.tracer?.startSpan(`event.${type}`, {
            'event.type': type,
            'session.id': this.sessionId
        });
        
        const event = {
            id: this.generateEventId(),
            type,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.config.privacyMode ? undefined : this.userId,
            url: window.location.href,
            userAgent: this.config.privacyMode ? this.sanitizeUserAgent() : navigator.userAgent,
            data: this.sanitizeEventData(data),
            traceId: span?.traceId
        };
        
        this.batch.push(event);
        this.checkBatchFlush();
        
        span?.end();
        console.debug('📊 Event tracked:', type, data);
    }
    
    trackGameEvent(type, data = {}) {
        // Specialized game event tracking with enhanced metrics
        const gameData = {
            ...data,
            gameVersion: window.blazeGameVersion || '1.0.0',
            performance: {
                fps: this.getCurrentFPS(),
                memory: this.getMemoryUsage(),
                latency: this.getNetworkLatency()
            }
        };
        
        this.trackEvent(`game.${type}`, gameData);
    }
    
    trackError(type, error = {}) {
        if (!this.config.enableErrors) return;
        
        const span = this.tracer?.startSpan(`error.${type}`, {
            'error.type': type,
            'session.id': this.sessionId
        });
        
        const errorEvent = {
            id: this.generateEventId(),
            type: 'error',
            errorType: type,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.config.privacyMode ? undefined : this.userId,
            url: window.location.href,
            error: {
                message: error.message,
                stack: this.config.privacyMode ? '[REDACTED]' : error.stack,
                filename: error.filename,
                line: error.lineno,
                column: error.colno
            },
            traceId: span?.traceId
        };
        
        this.batch.push(errorEvent);
        this.checkBatchFlush();
        
        span?.end();
        console.error('🚨 Error tracked:', type, error);
    }
    
    trackPerformanceMetric(entry) {
        const metricData = {
            name: entry.name,
            entryType: entry.entryType,
            startTime: entry.startTime,
            duration: entry.duration,
            ...this.extractRelevantMetrics(entry)
        };
        
        this.trackEvent('performance_metric', metricData);
    }
    
    async flush(force = false) {
        if (this.batch.length === 0) return;
        
        const payload = {
            sessionId: this.sessionId,
            timestamp: Date.now(),
            events: [...this.batch],
            metadata: {
                userAgent: this.config.privacyMode ? this.sanitizeUserAgent() : navigator.userAgent,
                screen: `${screen.width}x${screen.height}`,
                viewport: `${window.innerWidth}x${window.innerHeight}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language
            }
        };
        
        // Clear batch
        this.batch = [];
        
        try {
            if (force && navigator.sendBeacon) {
                // Use sendBeacon for reliable delivery during page unload
                navigator.sendBeacon(this.config.endpoint, JSON.stringify(payload));
            } else {
                // Regular fetch for normal operation
                await fetch(this.config.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Session-ID': this.sessionId
                    },
                    body: JSON.stringify(payload)
                });
            }
            
            console.debug('📤 Telemetry batch sent:', payload.events.length, 'events');
        } catch (error) {
            console.error('📤 Telemetry flush failed:', error);
            // Re-add events to batch for retry
            this.batch.unshift(...payload.events);
        }
    }
    
    // Utility methods
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }
    
    sanitizeEventData(data) {
        if (!this.config.privacyMode) return data;
        
        // Remove PII in privacy mode
        const sanitized = { ...data };
        const piiKeys = ['email', 'phone', 'name', 'address', 'ip'];
        
        for (const key of piiKeys) {
            if (sanitized[key]) {
                sanitized[key] = '[REDACTED]';
            }
        }
        
        return sanitized;
    }
    
    sanitizeUserAgent() {
        // Simplified user agent for privacy
        return navigator.userAgent.split(' ')[0] || 'Unknown';
    }
    
    getCurrentFPS() {
        return window.gameStats?.fps || 60;
    }
    
    getMemoryUsage() {
        return (performance.memory?.usedJSHeapSize / 1048576) || 0; // MB
    }
    
    getNetworkLatency() {
        return window.gameStats?.latency || 0;
    }
    
    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? firstPaint.startTime : 0;
    }
    
    estimatePageSize() {
        return document.documentElement.outerHTML.length / 1024; // KB
    }
    
    extractRelevantMetrics(entry) {
        const metrics = {};
        
        if (entry.entryType === 'largest-contentful-paint') {
            metrics.lcp = entry.startTime;
        } else if (entry.entryType === 'first-input') {
            metrics.fid = entry.processingStart - entry.startTime;
        } else if (entry.entryType === 'layout-shift') {
            metrics.cls = entry.value;
        }
        
        return metrics;
    }
}

// Game Performance Tracker
class GamePerformanceTracker {
    constructor(telemetry) {
        this.telemetry = telemetry;
        this.frameCount = 0;
        this.lastTime = Date.now();
        this.fps = 60;
        
        this.startTracking();
    }
    
    startTracking() {
        const trackFrame = () => {
            this.frameCount++;
            const now = Date.now();
            
            if (now - this.lastTime >= 1000) {
                this.fps = Math.round(this.frameCount * 1000 / (now - this.lastTime));
                
                // Track FPS drops
                if (this.fps < 30) {
                    this.telemetry.trackEvent('game.performance_warning', {
                        fps: this.fps,
                        severity: this.fps < 15 ? 'critical' : 'warning'
                    });
                }
                
                // Store for other components
                window.gameStats = window.gameStats || {};
                window.gameStats.fps = this.fps;
                
                this.frameCount = 0;
                this.lastTime = now;
            }
            
            requestAnimationFrame(trackFrame);
        };
        
        requestAnimationFrame(trackFrame);
    }
}

// Environment Variables Template Generator
class EnvironmentSetup {
    static generateTemplate() {
        return `# Blaze Intelligence - Environment Configuration
# Copy this to .env and fill in your values

# Telemetry Configuration
TELEMETRY_ENDPOINT="/api/telemetry"
TELEMETRY_SAMPLING_RATE="1.0"
TELEMETRY_PRIVACY_MODE="false"
TELEMETRY_BATCH_SIZE="50"

# OpenTelemetry Configuration  
OTEL_SERVICE_NAME="blaze-intelligence-lsl"
OTEL_SERVICE_VERSION="1.0.0"
OTEL_RESOURCE_ATTRIBUTES="service.name=blaze-intelligence-lsl,service.version=1.0.0"
OTEL_EXPORTER_OTLP_ENDPOINT="https://api.honeycomb.io"
OTEL_EXPORTER_OTLP_HEADERS="x-honeycomb-team=YOUR_HONEYCOMB_KEY"

# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_API_TOKEN="your-api-token"
CLOUDFLARE_ZONE_ID="your-zone-id"

# Database Configuration  
DATABASE_URL="your-database-url"
REDIS_URL="your-redis-url"

# External API Keys
GITHUB_TOKEN="ghp_your-github-token"
NOTION_TOKEN="ntn_your-notion-token"
ZAPIER_AUTH_TOKEN="your-zapier-token"
HUBSPOT_API_KEY="your-hubspot-key"

# Security
JWT_SECRET="your-jwt-secret-key"
ENCRYPTION_KEY="your-encryption-key"

# Monitoring
SENTRY_DSN="your-sentry-dsn"
DATADOG_API_KEY="your-datadog-key"`;
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TelemetryPipeline, GamePerformanceTracker, EnvironmentSetup };
} else if (typeof window !== 'undefined') {
    window.TelemetryPipeline = TelemetryPipeline;
    window.GamePerformanceTracker = GamePerformanceTracker;
    window.EnvironmentSetup = EnvironmentSetup;
}