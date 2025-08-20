/**
 * Blaze Intelligence Sports API Worker
 * Verified endpoints for MLB, NFL, NCAA data
 */

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
    }

    try {
        // MLB Routes (no key required)
        if (url.pathname === '/api/mlb/teams') {
            const response = await fetch('https://statsapi.mlb.com/api/v1/teams?sportId=1');
            const data = await response.json();
            return new Response(JSON.stringify(data), { headers });
        }

        if (url.pathname.startsWith('/api/mlb/teams/') && url.pathname.endsWith('/roster')) {
            const teamId = url.pathname.split('/')[4];
            const response = await fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/roster`);
            const data = await response.json();
            return new Response(JSON.stringify(data), { headers });
        }

        if (url.pathname === '/api/mlb/schedule') {
            const teamId = url.searchParams.get('teamId');
            const season = url.searchParams.get('season') || new Date().getFullYear();
            const response = await fetch(
                `https://statsapi.mlb.com/api/v1/schedule?teamId=${teamId}&season=${season}`
            );
            const data = await response.json();
            return new Response(JSON.stringify(data), { headers });
        }

        // NFL Routes (requires SportsDataIO key)
        if (url.pathname === '/api/nfl/teams') {
            if (!env.SPORTSDATAIO_KEY) {
                return new Response(
                    JSON.stringify({ error: 'NFL API key not configured' }),
                    { status: 500, headers }
                );
            }
            
            const response = await fetch('https://api.sportsdata.io/v3/nfl/scores/json/Teams', {
                headers: { 'Ocp-Apim-Subscription-Key': env.SPORTSDATAIO_KEY }
            });
            const data = await response.json();
            return new Response(JSON.stringify(data), { headers });
        }

        if (url.pathname === '/api/nfl/standings') {
            if (!env.SPORTSDATAIO_KEY) {
                return new Response(
                    JSON.stringify({ error: 'NFL API key not configured' }),
                    { status: 500, headers }
                );
            }
            
            const season = url.searchParams.get('season') || '2024';
            const response = await fetch(
                `https://api.sportsdata.io/v3/nfl/scores/json/Standings/${season}`,
                {
                    headers: { 'Ocp-Apim-Subscription-Key': env.SPORTSDATAIO_KEY }
                }
            );
            const data = await response.json();
            return new Response(JSON.stringify(data), { headers });
        }

        // NCAA Football Routes (requires CFBD key)
        if (url.pathname === '/api/cfb/teams') {
            if (!env.CFBD_KEY) {
                return new Response(
                    JSON.stringify({ error: 'NCAA API key not configured' }),
                    { status: 500, headers }
                );
            }
            
            const response = await fetch('https://api.collegefootballdata.com/teams', {
                headers: { Authorization: `Bearer ${env.CFBD_KEY}` }
            });
            const data = await response.json();
            return new Response(JSON.stringify(data), { headers });
        }

        if (url.pathname === '/api/cfb/rankings') {
            if (!env.CFBD_KEY) {
                return new Response(
                    JSON.stringify({ error: 'NCAA API key not configured' }),
                    { status: 500, headers }
                );
            }
            
            const year = url.searchParams.get('year') || '2024';
            const week = url.searchParams.get('week') || 'final';
            const response = await fetch(
                `https://api.collegefootballdata.com/rankings?year=${year}&week=${week}`,
                {
                    headers: { Authorization: `Bearer ${env.CFBD_KEY}` }
                }
            );
            const data = await response.json();
            return new Response(JSON.stringify(data), { headers });
        }

        if (url.pathname === '/api/cfb/games') {
            if (!env.CFBD_KEY) {
                return new Response(
                    JSON.stringify({ error: 'NCAA API key not configured' }),
                    { status: 500, headers }
                );
            }
            
            const year = url.searchParams.get('year') || '2024';
            const team = url.searchParams.get('team');
            let endpoint = `https://api.collegefootballdata.com/games?year=${year}`;
            if (team) endpoint += `&team=${encodeURIComponent(team)}`;
            
            const response = await fetch(endpoint, {
                headers: { Authorization: `Bearer ${env.CFBD_KEY}` }
            });
            const data = await response.json();
            return new Response(JSON.stringify(data), { headers });
        }

        // Sportradar MLB v8 (if configured)
        if (url.pathname.startsWith('/api/sportradar/mlb/')) {
            if (!env.SPORTRADAR_KEY) {
                return new Response(
                    JSON.stringify({ error: 'Sportradar API key not configured' }),
                    { status: 500, headers }
                );
            }
            
            // Example: /api/sportradar/mlb/teams
            const endpoint = url.pathname.replace('/api/sportradar/mlb/', '');
            const response = await fetch(
                `https://api.sportradar.com/mlb/trial/v8/en/${endpoint}.json?api_key=${env.SPORTRADAR_KEY}`
            );
            const data = await response.json();
            return new Response(JSON.stringify(data), { headers });
        }

        // Combined endpoint - aggregate all available data
        if (url.pathname === '/api/sports/all') {
            const allData = {
                timestamp: new Date().toISOString(),
                available: {
                    mlb: true,
                    nfl: !!env.SPORTSDATAIO_KEY,
                    ncaa: !!env.CFBD_KEY,
                    sportradar: !!env.SPORTRADAR_KEY
                },
                data: {}
            };

            // Fetch MLB teams (always available)
            try {
                const mlbResponse = await fetch('https://statsapi.mlb.com/api/v1/teams?sportId=1');
                const mlbData = await mlbResponse.json();
                allData.data.mlb = mlbData.teams?.slice(0, 5); // Sample teams
            } catch (e) {
                allData.data.mlb = { error: e.message };
            }

            return new Response(JSON.stringify(allData), { headers });
        }

        // Health check with API status
        if (url.pathname === '/api/sports/health') {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                apis: {
                    mlb: { status: 'active', auth: 'none' },
                    nfl: { 
                        status: env.SPORTSDATAIO_KEY ? 'configured' : 'missing_key',
                        auth: 'api_key'
                    },
                    ncaa: {
                        status: env.CFBD_KEY ? 'configured' : 'missing_key',
                        auth: 'bearer_token'
                    },
                    sportradar: {
                        status: env.SPORTRADAR_KEY ? 'configured' : 'missing_key',
                        auth: 'api_key'
                    }
                }
            };
            
            return new Response(JSON.stringify(health), { headers });
        }

        // 404 for unmatched routes
        return new Response(
            JSON.stringify({ error: 'Endpoint not found' }),
            { status: 404, headers }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            }),
            { status: 500, headers }
        );
    }
}