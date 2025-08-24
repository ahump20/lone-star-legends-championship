/**
 * NIL (Name, Image, Likeness) Valuation API
 * Calculates athlete valuations based on performance, social media, and market factors
 */

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    
    // Enable CORS
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };
    
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }
    
    try {
        // Route handling
        if (url.pathname === '/api/nil/calculate' && request.method === 'POST') {
            const data = await request.json();
            const valuation = await calculateNILValuation(data, env);
            return new Response(JSON.stringify(valuation), { headers: corsHeaders });
        }
        
        if (url.pathname === '/api/nil/athlete' && request.method === 'GET') {
            const athleteId = url.searchParams.get('id');
            const athlete = await getAthleteProfile(athleteId, env);
            return new Response(JSON.stringify(athlete), { headers: corsHeaders });
        }
        
        if (url.pathname === '/api/nil/market' && request.method === 'GET') {
            const sport = url.searchParams.get('sport');
            const marketData = await getMarketData(sport, env);
            return new Response(JSON.stringify(marketData), { headers: corsHeaders });
        }
        
        // Default response for API info
        return new Response(JSON.stringify({
            name: 'Blaze NIL Valuation API',
            version: '1.0.0',
            endpoints: [
                '/api/nil/calculate - Calculate NIL valuation (POST)',
                '/api/nil/athlete?id={id} - Get athlete profile (GET)',
                '/api/nil/market?sport={sport} - Get market data (GET)'
            ]
        }), { headers: corsHeaders });
        
    } catch (error) {
        console.error('NIL API Error:', error);
        return new Response(JSON.stringify({
            error: 'Internal server error',
            message: error.message
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

async function calculateNILValuation(data, env) {
    const {
        athleteName,
        sport,
        position,
        school,
        stats,
        socialMedia,
        achievements
    } = data;
    
    // Base valuation components
    let baseValue = 0;
    let multipliers = [];
    let breakdown = {};
    
    // 1. Performance Value (40% weight)
    const performanceValue = calculatePerformanceValue(sport, position, stats);
    baseValue += performanceValue;
    breakdown.performance = performanceValue;
    
    // 2. Social Media Value (30% weight)
    const socialValue = calculateSocialMediaValue(socialMedia);
    baseValue += socialValue;
    breakdown.socialMedia = socialValue;
    
    // 3. Market Value (20% weight)
    const marketValue = calculateMarketValue(school, sport);
    baseValue += marketValue;
    breakdown.market = marketValue;
    
    // 4. Achievement Bonuses (10% weight)
    const achievementValue = calculateAchievementValue(achievements);
    baseValue += achievementValue;
    breakdown.achievements = achievementValue;
    
    // Apply multipliers
    if (isElitePerformer(stats, sport)) {
        multipliers.push({ name: 'Elite Performer', value: 1.5 });
    }
    
    if (isHighProfileSchool(school)) {
        multipliers.push({ name: 'High Profile School', value: 1.3 });
    }
    
    if (hasNationalExposure(achievements)) {
        multipliers.push({ name: 'National Exposure', value: 1.4 });
    }
    
    // Calculate final value
    let finalValue = baseValue;
    multipliers.forEach(m => {
        finalValue *= m.value;
    });
    
    // Round to reasonable increments
    finalValue = Math.round(finalValue / 1000) * 1000;
    
    // Create valuation tiers
    const tier = getValuationTier(finalValue);
    
    // Generate deal recommendations
    const deals = generateDealRecommendations(finalValue, sport, position);
    
    return {
        athlete: athleteName,
        sport,
        position,
        school,
        valuation: {
            annual: finalValue,
            monthly: Math.round(finalValue / 12),
            perPost: Math.round(finalValue / 100), // Assuming 100 posts per year
        },
        tier,
        breakdown,
        multipliers,
        recommendations: {
            deals,
            focusAreas: identifyGrowthAreas(breakdown),
            comparables: await findComparableAthletes(sport, position, finalValue, env)
        },
        confidence: calculateConfidence(data),
        lastUpdated: new Date().toISOString()
    };
}

function calculatePerformanceValue(sport, position, stats) {
    let value = 0;
    
    switch(sport.toLowerCase()) {
        case 'football':
            if (position === 'QB') {
                value = (stats.passingYards || 0) * 10 + 
                       (stats.touchdowns || 0) * 1000 +
                       (stats.completionPct || 0) * 500;
            } else if (position === 'RB') {
                value = (stats.rushingYards || 0) * 8 +
                       (stats.touchdowns || 0) * 800 +
                       (stats.yardsPerCarry || 0) * 1000;
            } else if (position === 'WR') {
                value = (stats.receivingYards || 0) * 9 +
                       (stats.receptions || 0) * 100 +
                       (stats.touchdowns || 0) * 900;
            }
            break;
            
        case 'basketball':
            value = (stats.pointsPerGame || 0) * 1000 +
                   (stats.assistsPerGame || 0) * 800 +
                   (stats.reboundsPerGame || 0) * 600 +
                   (stats.fieldGoalPct || 0) * 500;
            break;
            
        case 'baseball':
            if (position === 'P') {
                value = (stats.wins || 0) * 2000 +
                       (stats.strikeouts || 0) * 50 +
                       (1 / (stats.era || 4)) * 10000;
            } else {
                value = (stats.battingAverage || 0) * 50000 +
                       (stats.homeRuns || 0) * 1500 +
                       (stats.rbi || 0) * 100;
            }
            break;
    }
    
    return Math.round(value);
}

function calculateSocialMediaValue(socialMedia) {
    if (!socialMedia) return 0;
    
    let value = 0;
    
    // Instagram (highest value)
    value += (socialMedia.instagramFollowers || 0) * 2;
    value += (socialMedia.instagramEngagement || 0) * 1000;
    
    // TikTok (high engagement value)
    value += (socialMedia.tiktokFollowers || 0) * 1.5;
    value += (socialMedia.tiktokEngagement || 0) * 1200;
    
    // Twitter/X
    value += (socialMedia.twitterFollowers || 0) * 1;
    value += (socialMedia.twitterEngagement || 0) * 800;
    
    // YouTube
    value += (socialMedia.youtubeSubscribers || 0) * 3;
    value += (socialMedia.youtubeViews || 0) * 0.01;
    
    return Math.round(value);
}

function calculateMarketValue(school, sport) {
    // Base market values by conference/school size
    const powerFiveSchools = [
        'Texas', 'Alabama', 'Ohio State', 'Michigan', 'Georgia',
        'LSU', 'Florida', 'Notre Dame', 'USC', 'Oklahoma'
    ];
    
    const majorMarkets = {
        'Texas': 50000,
        'California': 45000,
        'Florida': 40000,
        'New York': 35000,
        'Illinois': 30000
    };
    
    let value = 10000; // Base value
    
    if (powerFiveSchools.some(s => school.includes(s))) {
        value += 40000;
    }
    
    // Add market size bonus
    Object.entries(majorMarkets).forEach(([state, bonus]) => {
        if (school.includes(state)) {
            value += bonus;
        }
    });
    
    // Sport popularity multiplier
    const sportMultipliers = {
        'football': 1.5,
        'basketball': 1.3,
        'baseball': 1.0,
        'soccer': 0.8
    };
    
    value *= sportMultipliers[sport.toLowerCase()] || 1.0;
    
    return Math.round(value);
}

function calculateAchievementValue(achievements) {
    if (!achievements || !Array.isArray(achievements)) return 0;
    
    let value = 0;
    
    const achievementValues = {
        'All-American': 25000,
        'Conference Player of the Year': 20000,
        'National Championship': 30000,
        'Heisman Finalist': 50000,
        'All-Conference First Team': 15000,
        'All-Conference Second Team': 10000,
        'Conference Championship': 12000,
        'Bowl Game MVP': 18000,
        'NCAA Tournament Appearance': 8000,
        'College World Series': 15000
    };
    
    achievements.forEach(achievement => {
        Object.entries(achievementValues).forEach(([key, val]) => {
            if (achievement.toLowerCase().includes(key.toLowerCase())) {
                value += val;
            }
        });
    });
    
    return value;
}

function isElitePerformer(stats, sport) {
    // Simplified elite performer check
    switch(sport.toLowerCase()) {
        case 'football':
            return stats.touchdowns > 30 || stats.passingYards > 4000;
        case 'basketball':
            return stats.pointsPerGame > 20;
        case 'baseball':
            return stats.battingAverage > 0.350 || stats.era < 2.5;
        default:
            return false;
    }
}

function isHighProfileSchool(school) {
    const highProfile = [
        'Texas', 'Alabama', 'Ohio State', 'Michigan', 'Notre Dame',
        'USC', 'Georgia', 'LSU', 'Florida', 'Oklahoma', 'Clemson'
    ];
    
    return highProfile.some(s => school.includes(s));
}

function hasNationalExposure(achievements) {
    if (!achievements) return false;
    
    const nationalAchievements = [
        'All-American', 'Heisman', 'National Championship',
        'NCAA Tournament', 'College World Series'
    ];
    
    return achievements.some(a => 
        nationalAchievements.some(na => a.includes(na))
    );
}

function getValuationTier(value) {
    if (value >= 1000000) return 'Elite (7-Figure)';
    if (value >= 500000) return 'Star (High 6-Figure)';
    if (value >= 100000) return 'Impact (6-Figure)';
    if (value >= 50000) return 'Solid Contributor';
    if (value >= 25000) return 'Rising Talent';
    return 'Developing';
}

function generateDealRecommendations(value, sport, position) {
    const deals = [];
    
    // Tier-based recommendations
    if (value >= 500000) {
        deals.push({
            type: 'National Brand Ambassador',
            estimatedValue: '$100,000+',
            brands: ['Nike', 'Adidas', 'Gatorade', 'State Farm']
        });
    }
    
    if (value >= 100000) {
        deals.push({
            type: 'Regional Partnerships',
            estimatedValue: '$25,000-50,000',
            brands: ['Local Auto Dealers', 'Regional Banks', 'Restaurant Chains']
        });
    }
    
    deals.push({
        type: 'Social Media Campaigns',
        estimatedValue: `$${Math.round(value / 100)} per post`,
        frequency: 'Monthly'
    });
    
    deals.push({
        type: 'Merchandise & Licensing',
        estimatedValue: `$${Math.round(value * 0.1)} annually`,
        products: ['Jerseys', 'Trading Cards', 'Video Games']
    });
    
    if (sport === 'football' && value >= 250000) {
        deals.push({
            type: 'Bowl Game Appearances',
            estimatedValue: '$10,000-25,000',
            opportunities: 'Playoff/Major Bowl Games'
        });
    }
    
    return deals;
}

function identifyGrowthAreas(breakdown) {
    const areas = [];
    const avg = Object.values(breakdown).reduce((a, b) => a + b, 0) / Object.keys(breakdown).length;
    
    Object.entries(breakdown).forEach(([key, value]) => {
        if (value < avg * 0.8) {
            areas.push({
                area: key,
                currentValue: value,
                potential: Math.round(avg * 1.2),
                recommendation: getGrowthRecommendation(key)
            });
        }
    });
    
    return areas;
}

function getGrowthRecommendation(area) {
    const recommendations = {
        performance: 'Focus on improving key statistics and consistency',
        socialMedia: 'Increase posting frequency and engagement strategies',
        market: 'Build relationships with local businesses and media',
        achievements: 'Target conference and national recognition opportunities'
    };
    
    return recommendations[area] || 'Continue development in this area';
}

async function findComparableAthletes(sport, position, value, env) {
    // This would query a database of athlete valuations
    // For now, return sample comparables
    
    const range = value * 0.2;
    const minValue = value - range;
    const maxValue = value + range;
    
    return [
        {
            name: 'Sample Athlete 1',
            school: 'Similar University',
            position: position,
            valuation: Math.round(value * 0.95),
            deals: 3
        },
        {
            name: 'Sample Athlete 2',
            school: 'Comparable State',
            position: position,
            valuation: Math.round(value * 1.05),
            deals: 5
        }
    ];
}

function calculateConfidence(data) {
    let confidence = 0.5;
    
    if (data.stats) confidence += 0.2;
    if (data.socialMedia) confidence += 0.15;
    if (data.achievements) confidence += 0.1;
    if (data.school) confidence += 0.05;
    
    return Math.min(0.95, confidence);
}

async function getAthleteProfile(athleteId, env) {
    // Fetch athlete profile from database
    // This is a placeholder implementation
    
    return {
        id: athleteId,
        name: 'Sample Athlete',
        sport: 'Football',
        position: 'QB',
        school: 'Texas',
        year: 'Junior',
        stats: {
            passingYards: 3500,
            touchdowns: 28,
            completionPct: 65.5
        },
        socialMedia: {
            instagramFollowers: 45000,
            twitterFollowers: 22000,
            tiktokFollowers: 85000
        },
        currentDeals: [],
        estimatedValue: 250000
    };
}

async function getMarketData(sport, env) {
    // Return market analysis for the sport
    
    return {
        sport,
        totalMarketSize: '$1.2B',
        averageDeals: {
            elite: '$500,000+',
            star: '$100,000-500,000',
            contributor: '$25,000-100,000',
            developing: '$5,000-25,000'
        },
        topSchools: [
            { name: 'Texas', avgDealValue: '$125,000' },
            { name: 'Alabama', avgDealValue: '$115,000' },
            { name: 'Ohio State', avgDealValue: '$110,000' }
        ],
        trends: [
            'Social media engagement increasingly important',
            'Local business partnerships growing 40% YoY',
            'Video game licensing emerging as major opportunity'
        ]
    };
}