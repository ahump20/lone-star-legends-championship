/**
 * Statistics CSV Export API
 * Generates downloadable CSV data
 */

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'csv';
    const type = url.searchParams.get('type') || 'full';
    
    // CORS headers for downloads
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
    }

    try {
        // Generate sample statistical data
        const stats = generateStatisticsData(type);
        
        if (format === 'csv') {
            const csv = convertToCSV(stats);
            return new Response(csv, {
                headers: {
                    ...headers,
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="blaze-intelligence-stats-${new Date().toISOString().split('T')[0]}.csv"`
                }
            });
        } else if (format === 'json') {
            return new Response(JSON.stringify(stats, null, 2), {
                headers: {
                    ...headers,
                    'Content-Type': 'application/json',
                    'Content-Disposition': `attachment; filename="blaze-intelligence-stats-${new Date().toISOString().split('T')[0]}.json"`
                }
            });
        }
        
        return new Response('Unsupported format', { status: 400, headers });
        
    } catch (error) {
        console.error('Export error:', error);
        return new Response('Export failed', { 
            status: 500, 
            headers: { ...headers, 'Content-Type': 'text/plain' }
        });
    }
}

function generateStatisticsData(type) {
    const baseStats = {
        teamStats: [
            { metric: 'Decision Velocity', value: 88.5, category: 'Champion Enigma', trend: 'up' },
            { metric: 'Clutch Factor', value: 92.1, category: 'Champion Enigma', trend: 'stable' },
            { metric: 'Mental Toughness', value: 85.7, category: 'Champion Enigma', trend: 'up' },
            { metric: 'Aura Score', value: 91.3, category: 'Champion Enigma', trend: 'down' },
            { metric: 'Pattern Recognition', value: 89.4, category: 'Champion Enigma', trend: 'up' },
            { metric: 'Killer Instinct', value: 87.8, category: 'Champion Enigma', trend: 'stable' },
            { metric: 'Leadership Impact', value: 93.2, category: 'Champion Enigma', trend: 'up' },
            { metric: 'Vision & Anticipation', value: 90.6, category: 'Champion Enigma', trend: 'stable' }
        ],
        playerStats: [
            { player: 'Nolan Arenado', position: '3B', decisionVelocity: 91, clutchFactor: 95, overallScore: 93 },
            { player: 'Paul Goldschmidt', position: '1B', decisionVelocity: 89, clutchFactor: 92, overallScore: 91 },
            { player: 'Tommy Edman', position: '2B', decisionVelocity: 87, clutchFactor: 88, overallScore: 88 },
            { player: 'Jordan Walker', position: 'OF', decisionVelocity: 85, clutchFactor: 83, overallScore: 84 },
            { player: 'Dylan Carlson', position: 'OF', decisionVelocity: 82, clutchFactor: 85, overallScore: 84 }
        ],
        gameData: [
            { date: '2024-08-20', opponent: 'Cubs', result: 'W 7-3', decisionVelocityAvg: 89.2, clutchMoments: 4 },
            { date: '2024-08-19', opponent: 'Cubs', result: 'W 5-2', decisionVelocityAvg: 91.1, clutchMoments: 3 },
            { date: '2024-08-18', opponent: 'Cubs', result: 'L 4-6', decisionVelocityAvg: 85.7, clutchMoments: 2 },
            { date: '2024-08-17', opponent: 'Brewers', result: 'W 8-4', decisionVelocityAvg: 92.3, clutchMoments: 5 },
            { date: '2024-08-16', opponent: 'Brewers', result: 'W 6-1', decisionVelocityAvg: 88.9, clutchMoments: 3 }
        ]
    };
    
    if (type === 'team') return { teamStats: baseStats.teamStats };
    if (type === 'players') return { playerStats: baseStats.playerStats };
    if (type === 'games') return { gameData: baseStats.gameData };
    
    return baseStats;
}

function convertToCSV(data) {
    let csv = '';
    
    // Add team stats
    if (data.teamStats) {
        csv += 'Team Statistics\n';
        csv += 'Metric,Value,Category,Trend\n';
        data.teamStats.forEach(stat => {
            csv += `"${stat.metric}",${stat.value},"${stat.category}","${stat.trend}"\n`;
        });
        csv += '\n';
    }
    
    // Add player stats
    if (data.playerStats) {
        csv += 'Player Statistics\n';
        csv += 'Player,Position,Decision Velocity,Clutch Factor,Overall Score\n';
        data.playerStats.forEach(player => {
            csv += `"${player.player}","${player.position}",${player.decisionVelocity},${player.clutchFactor},${player.overallScore}\n`;
        });
        csv += '\n';
    }
    
    // Add game data
    if (data.gameData) {
        csv += 'Game Data\n';
        csv += 'Date,Opponent,Result,Decision Velocity Avg,Clutch Moments\n';
        data.gameData.forEach(game => {
            csv += `"${game.date}","${game.opponent}","${game.result}",${game.decisionVelocityAvg},${game.clutchMoments}\n`;
        });
        csv += '\n';
    }
    
    // Add metadata
    csv += 'Export Information\n';
    csv += `Generated,${new Date().toISOString()}\n`;
    csv += 'Source,Blaze Intelligence Platform\n';
    csv += 'Contact,ahump20@outlook.com\n';
    
    return csv;
}