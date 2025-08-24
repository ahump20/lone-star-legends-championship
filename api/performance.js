/**
 * Performance API Endpoint for Blaze Intelligence
 * Handles performance metrics and monitoring data
 */

export default async function handler(request, env, ctx) {
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        if (request.method === 'POST') {
            const performanceData = await request.json();
            
            // Validate performance report
            if (!performanceData.metrics || !performanceData.timestamp) {
                return new Response(JSON.stringify({ 
                    error: 'Invalid performance data' 
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Enhanced performance record
            const performanceRecord = {
                ...performanceData,
                ip: request.headers.get('CF-Connecting-IP') || 'unknown',
                country: request.cf?.country || 'unknown',
                datacenter: request.cf?.colo || 'unknown',
                processed_at: Date.now(),
                score: calculatePerformanceScore(performanceData.metrics)
            };

            // Store in KV storage (if available)
            if (env.PERFORMANCE_KV) {
                const key = `performance:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
                await env.PERFORMANCE_KV.put(key, JSON.stringify(performanceRecord), {
                    expirationTtl: 60 * 60 * 24 * 7 // 7 days
                });
            }

            // Log critical performance issues
            const alerts = performanceData.alerts || [];
            if (alerts.some(alert => alert.type === 'poor_web_vital')) {
                console.warn('Performance Alert:', {
                    url: performanceData.page?.url,
                    score: performanceRecord.score,
                    alerts: alerts.length,
                    country: request.cf?.country
                });
            }

            return new Response(JSON.stringify({ 
                success: true,
                score: performanceRecord.score,
                recommendations: generateRecommendations(performanceData)
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (request.method === 'GET') {
            // Performance dashboard endpoint
            const url = new URL(request.url);
            const timeframe = url.searchParams.get('timeframe') || '24h';

            // Mock performance dashboard data
            const dashboardData = {
                timeframe: timeframe,
                summary: {
                    average_score: 88,
                    total_reports: 2847,
                    critical_alerts: 12,
                    performance_trend: 'improving'
                },
                web_vitals: {
                    lcp: {
                        average: 1847,
                        p75: 2234,
                        good: 78.3,
                        needs_improvement: 18.2,
                        poor: 3.5
                    },
                    fid: {
                        average: 73,
                        p75: 89,
                        good: 89.7,
                        needs_improvement: 8.1,
                        poor: 2.2
                    },
                    cls: {
                        average: 0.087,
                        p75: 0.124,
                        good: 85.4,
                        needs_improvement: 11.8,
                        poor: 2.8
                    }
                },
                by_page: [
                    { 
                        path: '/', 
                        score: 92, 
                        lcp: 1634, 
                        fid: 45, 
                        cls: 0.06,
                        reports: 1247 
                    },
                    { 
                        path: '/analytics/', 
                        score: 89, 
                        lcp: 1789, 
                        fid: 67, 
                        cls: 0.09,
                        reports: 634 
                    },
                    { 
                        path: '/games/baseball/', 
                        score: 84, 
                        lcp: 2134, 
                        fid: 89, 
                        cls: 0.12,
                        reports: 412 
                    }
                ],
                by_device: {
                    desktop: { score: 94, reports: 1698 },
                    mobile: { score: 82, reports: 1149 }
                },
                by_connection: {
                    '4g': { score: 89, reports: 1456 },
                    '3g': { score: 76, reports: 234 },
                    'wifi': { score: 93, reports: 1157 }
                },
                recent_alerts: [
                    {
                        type: 'poor_web_vital',
                        metric: 'LCP',
                        value: 4567,
                        page: '/games/advanced/',
                        timestamp: Date.now() - 3600000,
                        severity: 'high'
                    },
                    {
                        type: 'slow_resource',
                        resource: 'hero-background.jpg',
                        duration: 3245,
                        page: '/',
                        timestamp: Date.now() - 7200000,
                        severity: 'medium'
                    }
                ],
                generated_at: Date.now()
            };

            return new Response(JSON.stringify(dashboardData), {
                status: 200,
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'max-age=180' // 3 minutes
                }
            });
        }

        return new Response(JSON.stringify({ 
            error: 'Method not allowed' 
        }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Performance API Error:', error);
        
        return new Response(JSON.stringify({ 
            error: 'Internal server error',
            message: error.message 
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

function calculatePerformanceScore(metrics) {
    let score = 100;
    
    // LCP scoring
    if (metrics.lcp > 4000) score -= 30;
    else if (metrics.lcp > 2500) score -= 15;
    
    // FID scoring
    if (metrics.fid > 300) score -= 25;
    else if (metrics.fid > 100) score -= 10;
    
    // CLS scoring
    if (metrics.cls > 0.25) score -= 25;
    else if (metrics.cls > 0.1) score -= 10;
    
    // Memory usage (if available)
    if (metrics.memory && metrics.memory.usage > 90) score -= 15;
    else if (metrics.memory && metrics.memory.usage > 80) score -= 5;
    
    return Math.max(0, Math.round(score));
}

function generateRecommendations(performanceData) {
    const recommendations = [];
    const metrics = performanceData.metrics || {};
    const alerts = performanceData.alerts || [];
    
    // Web Vitals recommendations
    if (metrics.lcp > 2500) {
        recommendations.push({
            type: 'lcp_improvement',
            priority: 'high',
            message: 'Optimize images and reduce server response time to improve LCP',
            actions: ['Enable image compression', 'Use WebP format', 'Implement CDN']
        });
    }
    
    if (metrics.fid > 100) {
        recommendations.push({
            type: 'fid_improvement',
            priority: 'high',
            message: 'Reduce JavaScript execution time to improve FID',
            actions: ['Code splitting', 'Remove unused JavaScript', 'Optimize event handlers']
        });
    }
    
    if (metrics.cls > 0.1) {
        recommendations.push({
            type: 'cls_improvement',
            priority: 'medium',
            message: 'Reduce layout shifts by setting dimensions for dynamic content',
            actions: ['Set image dimensions', 'Reserve space for ads', 'Use CSS aspect-ratio']
        });
    }
    
    // Alert-based recommendations
    alerts.forEach(alert => {
        switch (alert.type) {
            case 'slow_resource':
                recommendations.push({
                    type: 'resource_optimization',
                    priority: 'medium',
                    message: `Slow resource detected: ${alert.data.resource}`,
                    actions: ['Optimize resource size', 'Enable compression', 'Use CDN']
                });
                break;
                
            case 'high_memory_usage':
                recommendations.push({
                    type: 'memory_optimization',
                    priority: 'high',
                    message: 'High memory usage detected',
                    actions: ['Implement lazy loading', 'Clean up event listeners', 'Optimize data structures']
                });
                break;
                
            case 'slow_network':
                recommendations.push({
                    type: 'network_adaptation',
                    priority: 'low',
                    message: 'Slow network connection detected',
                    actions: ['Enable data saver mode', 'Reduce image quality', 'Defer non-critical resources']
                });
                break;
        }
    });
    
    return recommendations.slice(0, 5); // Return top 5 recommendations
}