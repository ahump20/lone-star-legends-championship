/**
 * Cloudflare Worker: Players API Endpoint
 * Fetches and normalizes player data from multiple sports APIs
 */

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const teamId = url.searchParams.get('teamId');
    const playerId = url.searchParams.get('playerId');
    const league = url.searchParams.get('league');
    const position = url.searchParams.get('position');

    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
    }

    try {
        let data;
        
        if (playerId) {
            data = await getPlayerById(playerId, league, env);
        } else if (teamId) {
            data = await getPlayersByTeam(teamId, env);
        } else if (position && league) {
            data = await getPlayersByPosition(position, league, env);
        } else {
            data = await getFeaturedPlayers(env);
        }

        return new Response(JSON.stringify(data), { headers });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers }
        );
    }
}

async function getPlayerById(playerId, league, env) {
    // Fetch specific player details
    const player = await fetchPlayerDetails(playerId, league, env);
    
    return {
        success: true,
        timestamp: new Date().toISOString(),
        data: player
    };
}

async function getPlayersByTeam(teamId, env) {
    // Generate roster based on team
    const roster = await generateTeamRoster(teamId);
    
    return {
        success: true,
        teamId,
        timestamp: new Date().toISOString(),
        data: roster,
        count: roster.length
    };
}

async function getPlayersByPosition(position, league, env) {
    // Get top players by position
    const players = await getTopPlayersByPosition(position, league);
    
    return {
        success: true,
        league,
        position,
        timestamp: new Date().toISOString(),
        data: players,
        count: players.length
    };
}

async function getFeaturedPlayers(env) {
    // Return featured players across all leagues
    const featured = {
        mlb: await getMLBFeaturedPlayers(),
        nfl: await getNFLFeaturedPlayers(),
        ncaa: await getNCAAFeaturedPlayers(),
        nba: await getNBAFeaturedPlayers()
    };
    
    return {
        success: true,
        timestamp: new Date().toISOString(),
        data: featured,
        count: Object.values(featured).flat().length
    };
}

async function generateTeamRoster(teamId) {
    const league = teamId.split('_')[0];
    let positions, rosterSize;
    
    switch(league) {
        case 'mlb':
            positions = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
            rosterSize = 26;
            break;
        case 'nfl':
            positions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S'];
            rosterSize = 53;
            break;
        case 'nba':
            positions = ['PG', 'SG', 'SF', 'PF', 'C'];
            rosterSize = 15;
            break;
        case 'ncaa':
            positions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB'];
            rosterSize = 85;
            break;
        default:
            positions = ['Player'];
            rosterSize = 20;
    }
    
    const roster = [];
    const firstNames = ['Michael', 'David', 'James', 'Robert', 'John', 'William', 'Richard', 'Joseph', 
                       'Thomas', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Paul'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
                      'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'];
    
    for (let i = 0; i < Math.min(rosterSize, 25); i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const position = positions[i % positions.length];
        
        roster.push({
            id: `${teamId}_player_${i}`,
            name: `${firstName} ${lastName}`,
            number: Math.floor(Math.random() * 99) + 1,
            position,
            age: 18 + Math.floor(Math.random() * 20),
            height: generateHeight(position, league),
            weight: generateWeight(position, league),
            experience: Math.floor(Math.random() * 10),
            college: getRandomCollege(),
            stats: generatePlayerStats(position, league),
            nilValue: calculateNILValue(league)
        });
    }
    
    return roster;
}

function generateHeight(position, league) {
    // Heights in inches
    const baseHeight = {
        mlb: { P: 74, C: 72, '1B': 74, '2B': 70, '3B': 72, 'SS': 71, 'LF': 72, 'CF': 71, 'RF': 73 },
        nfl: { QB: 75, RB: 70, WR: 73, TE: 76, OL: 77, DL: 76, LB: 74, CB: 71, S: 72 },
        nba: { PG: 74, SG: 77, SF: 79, PF: 81, C: 83 },
        ncaa: { QB: 74, RB: 70, WR: 72, TE: 76, OL: 76, DL: 75, LB: 73, DB: 71 }
    };
    
    const heights = baseHeight[league] || { Player: 72 };
    const base = heights[position] || 72;
    const variance = Math.floor(Math.random() * 4) - 2;
    const totalInches = base + variance;
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    
    return `${feet}'${inches}"`;
}

function generateWeight(position, league) {
    // Weights in pounds
    const baseWeight = {
        mlb: { P: 210, C: 205, '1B': 220, '2B': 185, '3B': 200, 'SS': 190, 'LF': 200, 'CF': 195, 'RF': 205 },
        nfl: { QB: 225, RB: 215, WR: 200, TE: 250, OL: 310, DL: 300, LB: 240, CB: 195, S: 210 },
        nba: { PG: 190, SG: 215, SF: 225, PF: 240, C: 265 },
        ncaa: { QB: 215, RB: 205, WR: 190, TE: 240, OL: 295, DL: 285, LB: 225, DB: 190 }
    };
    
    const weights = baseWeight[league] || { Player: 200 };
    const base = weights[position] || 200;
    const variance = Math.floor(Math.random() * 20) - 10;
    
    return base + variance;
}

function generatePlayerStats(position, league) {
    switch(league) {
        case 'mlb':
            return {
                battingAverage: (0.200 + Math.random() * 0.150).toFixed(3),
                homeRuns: Math.floor(Math.random() * 40),
                rbi: Math.floor(Math.random() * 100),
                stolenBases: Math.floor(Math.random() * 30),
                era: position === 'P' ? (2.50 + Math.random() * 2.50).toFixed(2) : null,
                strikeouts: position === 'P' ? Math.floor(Math.random() * 200) : null
            };
        case 'nfl':
            return {
                touchdowns: Math.floor(Math.random() * 15),
                yards: Math.floor(Math.random() * 1500),
                completions: position === 'QB' ? Math.floor(Math.random() * 300) : null,
                tackles: ['LB', 'S', 'CB'].includes(position) ? Math.floor(Math.random() * 100) : null,
                sacks: ['DL', 'LB'].includes(position) ? Math.floor(Math.random() * 15) : null
            };
        case 'nba':
            return {
                ppg: (5 + Math.random() * 25).toFixed(1),
                rpg: (2 + Math.random() * 10).toFixed(1),
                apg: (1 + Math.random() * 8).toFixed(1),
                fg_percentage: (0.400 + Math.random() * 0.150).toFixed(3),
                three_point_percentage: (0.300 + Math.random() * 0.150).toFixed(3)
            };
        case 'ncaa':
            return {
                gamesPlayed: Math.floor(Math.random() * 14),
                starts: Math.floor(Math.random() * 14),
                totalYards: Math.floor(Math.random() * 1000),
                touchdowns: Math.floor(Math.random() * 10)
            };
        default:
            return {};
    }
}

function calculateNILValue(league) {
    if (league !== 'ncaa') return null;
    
    // NIL values range from $1,000 to $1,000,000
    const baseValue = 1000;
    const multiplier = Math.pow(10, Math.random() * 3);
    return Math.floor(baseValue * multiplier);
}

function getRandomCollege() {
    const colleges = [
        'Alabama', 'Ohio State', 'Michigan', 'Georgia', 'Texas',
        'Oklahoma', 'LSU', 'Clemson', 'Penn State', 'USC',
        'Notre Dame', 'Florida', 'Tennessee', 'Auburn', 'Oregon'
    ];
    return colleges[Math.floor(Math.random() * colleges.length)];
}

async function getMLBFeaturedPlayers() {
    return [
        {
            id: 'mlb_star_1',
            name: 'Nolan Arenado',
            team: 'St. Louis Cardinals',
            position: '3B',
            stats: {
                battingAverage: '.266',
                homeRuns: 26,
                rbi: 93
            }
        },
        {
            id: 'mlb_star_2',
            name: 'Paul Goldschmidt',
            team: 'St. Louis Cardinals',
            position: '1B',
            stats: {
                battingAverage: '.268',
                homeRuns: 22,
                rbi: 65
            }
        }
    ];
}

async function getNFLFeaturedPlayers() {
    return [
        {
            id: 'nfl_star_1',
            name: 'Will Levis',
            team: 'Tennessee Titans',
            position: 'QB',
            stats: {
                passingYards: 1808,
                touchdowns: 8,
                completionPct: '58.4%'
            }
        },
        {
            id: 'nfl_star_2',
            name: 'Derrick Henry',
            team: 'Tennessee Titans',
            position: 'RB',
            stats: {
                rushingYards: 1167,
                touchdowns: 12,
                yardsPerCarry: 4.2
            }
        }
    ];
}

async function getNCAAFeaturedPlayers() {
    return [
        {
            id: 'ncaa_star_1',
            name: 'Quinn Ewers',
            team: 'Texas Longhorns',
            position: 'QB',
            stats: {
                passingYards: 3479,
                touchdowns: 29,
                completionPct: '69.0%'
            },
            nilValue: 1600000
        },
        {
            id: 'ncaa_star_2',
            name: 'Bijan Robinson',
            team: 'Texas Longhorns',
            position: 'RB',
            stats: {
                rushingYards: 1580,
                touchdowns: 18,
                yardsPerCarry: 5.8
            },
            nilValue: 1100000
        }
    ];
}

async function getNBAFeaturedPlayers() {
    return [
        {
            id: 'nba_star_1',
            name: 'Ja Morant',
            team: 'Memphis Grizzlies',
            position: 'PG',
            stats: {
                ppg: 25.1,
                apg: 8.1,
                rpg: 5.6
            }
        },
        {
            id: 'nba_star_2',
            name: 'Jaren Jackson Jr.',
            team: 'Memphis Grizzlies',
            position: 'PF/C',
            stats: {
                ppg: 22.5,
                rpg: 5.5,
                bpg: 3.0
            }
        }
    ];
}

async function fetchPlayerDetails(playerId, league, env) {
    // This would connect to real APIs
    // For now, return mock data
    return {
        id: playerId,
        name: 'Sample Player',
        team: 'Sample Team',
        position: 'POS',
        age: 25,
        height: "6'2\"",
        weight: 200,
        college: 'State University',
        experience: 3,
        stats: generatePlayerStats('POS', league),
        careerHighlights: [
            'All-Star Selection 2023',
            'Rookie of the Year 2021',
            'Conference Champion 2022'
        ],
        injuryStatus: 'Healthy',
        contractDetails: {
            years: 4,
            totalValue: 50000000,
            averagePerYear: 12500000
        }
    };
}

async function getTopPlayersByPosition(position, league) {
    // Generate top 10 players for the position
    const players = [];
    for (let i = 0; i < 10; i++) {
        players.push({
            id: `${league}_${position}_top_${i}`,
            name: `Top ${position} Player ${i + 1}`,
            team: `Team ${i + 1}`,
            position,
            ranking: i + 1,
            stats: generatePlayerStats(position, league)
        });
    }
    return players;
}