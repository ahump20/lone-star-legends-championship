/**
 * Analytics API Endpoint for Blaze Intelligence
 * Handles custom analytics and performance data collection
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
            const data = await request.json();
            
            // Validate required fields
            if (!data.event || !data.timestamp) {
                return new Response(JSON.stringify({ 
                    error: 'Missing required fields: event, timestamp' 
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Process analytics event
            const analyticsEvent = {
                event: data.event,
                data: data.data || {},
                session_id: data.session_id,
                user_agent: data.user_agent,
                timestamp: data.timestamp,
                ip: request.headers.get('CF-Connecting-IP') || 'unknown',
                country: request.cf?.country || 'unknown',
                processed_at: Date.now()
            };

            // Store in KV storage (if available)
            if (env.ANALYTICS_KV) {
                const key = `analytics:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
                await env.ANALYTICS_KV.put(key, JSON.stringify(analyticsEvent), {
                    expirationTtl: 60 * 60 * 24 * 30 // 30 days
                });
            }

            // Log for debugging (will appear in Cloudflare dashboard)
            console.log('Analytics Event:', {
                event: data.event,
                session: data.session_id?.substr(-8),
                timestamp: new Date(data.timestamp).toISOString()
            });

            return new Response(JSON.stringify({ 
                success: true,
                event_id: analyticsEvent.processed_at
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (request.method === 'GET') {
            // Analytics dashboard endpoint
            const url = new URL(request.url);
            const timeframe = url.searchParams.get('timeframe') || '24h';
            const metric = url.searchParams.get('metric') || 'all';

            // Mock analytics data for now
            const mockData = {
                timeframe: timeframe,
                metrics: {
                    page_views: 1247,
                    unique_visitors: 892,
                    bounce_rate: 34.2,
                    avg_session_duration: 185,
                    core_web_vitals: {
                        lcp: 1834,
                        fid: 67,
                        cls: 0.08
                    },
                    top_pages: [
                        { path: '/', views: 423, bounce_rate: 28.1 },
                        { path: '/analytics/', views: 287, bounce_rate: 22.4 },
                        { path: '/games/', views: 198, bounce_rate: 41.2 },
                        { path: '/capabilities/', views: 165, bounce_rate: 35.7 },
                        { path: '/pricing/', views: 174, bounce_rate: 38.9 }
                    ],
                    conversions: {
                        contact_form: 23,
                        newsletter_signup: 67,
                        demo_request: 15,
                        pricing_inquiry: 31
                    },
                    real_time: {
                        active_users: 14,
                        current_page_views: {
                            '/': 8,
                            '/analytics/': 3,
                            '/games/baseball/': 2,
                            '/capabilities/': 1
                        }
                    }
                },
                generated_at: Date.now()
            };

            return new Response(JSON.stringify(mockData), {
                status: 200,
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'max-age=300' // 5 minutes
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
        console.error('Analytics API Error:', error);
        
        return new Response(JSON.stringify({ 
            error: 'Internal server error',
            message: error.message 
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}