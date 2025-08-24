/**
 * Champion Enigma Live Score API
 * Provides real-time Champion Enigma scoring for navigation widget
 */

export async function onRequest(context) {
  const { request, env, params } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Simulate Champion Enigma calculation
    // In production, this would connect to real athlete data
    const currentTime = Date.now();
    const dayOfWeek = new Date().getDay();
    const hour = new Date().getHours();

    // Simulate dynamic scoring based on time and game conditions
    let baseScore = 65;
    
    // Higher during game hours (7-10 PM)
    if (hour >= 19 && hour <= 22) {
      baseScore += 15;
    }
    
    // Weekend boost
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      baseScore += 5;
    }
    
    // Add some realistic variance
    const variance = Math.sin(currentTime / 100000) * 10;
    const overallScore = Math.min(100, Math.max(0, baseScore + variance));

    // Component scores
    const response = {
      overallScore: overallScore,
      timestamp: currentTime,
      components: {
        clutchGene: Math.min(100, overallScore + Math.random() * 10 - 5),
        killerInstinct: Math.min(100, overallScore + Math.random() * 8 - 4),
        championAura: Math.min(100, overallScore + Math.random() * 12 - 6),
        mentalFortness: Math.min(100, overallScore + Math.random() * 6 - 3),
        flowState: Math.min(100, overallScore + Math.random() * 15 - 7.5)
      },
      status: overallScore > 85 ? 'championship' : overallScore > 70 ? 'elite' : 'developing',
      lastUpdated: new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60'
      }
    });

  } catch (error) {
    console.error('Champion Enigma API error:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      overallScore: null,
      timestamp: Date.now()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}