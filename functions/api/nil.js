/**
 * NIL Dashboard API
 * Returns Name, Image, Likeness valuation data
 */

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const playerId = url.searchParams.get('playerId') || 'default';
    
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60' // Cache for 1 minute
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
    }

    // Generate realistic NIL data
    const baseValue = 185000;
    const now = new Date();
    
    // Timeline data (last 6 months)
    const timeline = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const variance = Math.random() * 0.3 - 0.15; // ±15% variance
        timeline.push({
            t: date.toISOString().split('T')[0],
            value: Math.round(baseValue * (1 + variance + (0.02 * (6 - i)))) // Slight upward trend
        });
    }
    
    // Champion traits
    const traits = {
        clutch: Math.floor(Math.random() * 15) + 85,      // 85-100
        killer: Math.floor(Math.random() * 15) + 83,      // 83-98
        aura: Math.floor(Math.random() * 12) + 88,        // 88-100
        mental: Math.floor(Math.random() * 20) + 80,      // 80-100
        decision: Math.floor(Math.random() * 15) + 85,    // 85-100
        leadership: Math.floor(Math.random() * 15) + 82,  // 82-97
        vision: Math.floor(Math.random() * 18) + 82,      // 82-100
        impact: Math.floor(Math.random() * 10) + 90       // 90-100
    };
    
    // Calculate current value based on traits
    const traitAverage = Object.values(traits).reduce((a, b) => a + b, 0) / Object.keys(traits).length;
    const currentValue = Math.round(baseValue * (traitAverage / 85));
    
    const data = {
        playerId,
        athlete: {
            name: playerId === 'default' ? 'Sample Athlete' : `Player ${playerId}`,
            position: 'QB',
            team: 'Texas Longhorns',
            year: 'Junior'
        },
        current: {
            value: currentValue,
            rank: Math.floor(Math.random() * 50) + 1,
            change24h: Math.random() * 0.1 - 0.05, // ±5%
            trend: 'up'
        },
        timeline,
        attribution: {
            performance: 0.45 + Math.random() * 0.15,     // 45-60%
            aura: 0.20 + Math.random() * 0.10,            // 20-30%
            social: 0.15 + Math.random() * 0.05,          // 15-20%
            potential: 0.10 + Math.random() * 0.05         // 10-15%
        },
        traits,
        confidence: {
            index: 0.75 + Math.random() * 0.20,           // 0.75-0.95
            focus: Math.random() > 0.5 ? 'High' : 'Very High',
            liveClutch: Math.random() > 0.3,
            'p(lift48h)': 0.5 + Math.random() * 0.4       // 0.5-0.9
        },
        benchmarks: {
            blaze: currentValue,
            on3: Math.round(currentValue * (0.9 + Math.random() * 0.2)), // ±10% of our value
            actual: Math.round(currentValue * (0.95 + Math.random() * 0.15)) // ±7.5% of our value
        },
        opportunities: [
            {
                brand: 'Nike',
                value: Math.round(currentValue * 0.15),
                probability: 0.75,
                category: 'Apparel'
            },
            {
                brand: 'Gatorade',
                value: Math.round(currentValue * 0.08),
                probability: 0.60,
                category: 'Beverage'
            },
            {
                brand: 'Local Auto Dealer',
                value: Math.round(currentValue * 0.05),
                probability: 0.85,
                category: 'Local'
            }
        ],
        updated: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(data), { headers });
}