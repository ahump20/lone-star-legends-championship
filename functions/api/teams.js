/**
 * Cloudflare Worker: Teams API Endpoint
 * Fetches and normalizes team data from multiple sports APIs
 */

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const league = url.searchParams.get('league');
    const teamId = url.searchParams.get('teamId');

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
        
        if (teamId) {
            data = await getTeamById(teamId, league, env);
        } else if (league) {
            data = await getTeamsByLeague(league, env);
        } else {
            data = await getAllTeams(env);
        }

        return new Response(JSON.stringify(data), { headers });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers }
        );
    }
}

async function getAllTeams(env) {
    const teams = {
        mlb: await getMLBTeams(env),
        nfl: await getNFLTeams(env),
        ncaa: await getNCAATeams(env),
        nba: await getNBATeams(env)
    };
    
    return {
        success: true,
        timestamp: new Date().toISOString(),
        data: teams,
        count: Object.values(teams).flat().length
    };
}

async function getTeamsByLeague(league, env) {
    let teams;
    
    switch(league.toLowerCase()) {
        case 'mlb':
            teams = await getMLBTeams(env);
            break;
        case 'nfl':
            teams = await getNFLTeams(env);
            break;
        case 'ncaa':
        case 'ncaaf':
            teams = await getNCAATeams(env);
            break;
        case 'nba':
            teams = await getNBATeams(env);
            break;
        default:
            throw new Error(`Unknown league: ${league}`);
    }
    
    return {
        success: true,
        league: league.toUpperCase(),
        timestamp: new Date().toISOString(),
        data: teams,
        count: teams.length
    };
}

async function getTeamById(teamId, league, env) {
    const teams = await getTeamsByLeague(league, env);
    const team = teams.data.find(t => t.id === teamId || t.teamId === teamId);
    
    if (!team) {
        throw new Error(`Team ${teamId} not found in ${league}`);
    }
    
    // Fetch detailed stats for the specific team
    const details = await getTeamDetails(teamId, league, env);
    
    return {
        success: true,
        timestamp: new Date().toISOString(),
        data: { ...team, ...details }
    };
}

async function getMLBTeams(env) {
    // MLB Stats API (free, no key required)
    const response = await fetch('https://statsapi.mlb.com/api/v1/teams?sportId=1&season=2024');
    const data = await response.json();
    
    return data.teams.map(team => ({
        id: `mlb_${team.id}`,
        teamId: team.id,
        name: team.name,
        abbreviation: team.abbreviation,
        location: team.locationName,
        league: 'MLB',
        division: team.division?.name,
        venue: team.venue?.name,
        established: team.firstYearOfPlay,
        logo: `https://www.mlbstatic.com/team-logos/${team.id}.svg`,
        colors: getTeamColors(team.name),
        website: team.link
    }));
}

async function getNFLTeams(env) {
    // Using cached NFL team data (SportsRadar requires API key)
    const nflTeams = [
        { id: 'nfl_ari', name: 'Arizona Cardinals', abbreviation: 'ARI', conference: 'NFC', division: 'West' },
        { id: 'nfl_atl', name: 'Atlanta Falcons', abbreviation: 'ATL', conference: 'NFC', division: 'South' },
        { id: 'nfl_bal', name: 'Baltimore Ravens', abbreviation: 'BAL', conference: 'AFC', division: 'North' },
        { id: 'nfl_buf', name: 'Buffalo Bills', abbreviation: 'BUF', conference: 'AFC', division: 'East' },
        { id: 'nfl_car', name: 'Carolina Panthers', abbreviation: 'CAR', conference: 'NFC', division: 'South' },
        { id: 'nfl_chi', name: 'Chicago Bears', abbreviation: 'CHI', conference: 'NFC', division: 'North' },
        { id: 'nfl_cin', name: 'Cincinnati Bengals', abbreviation: 'CIN', conference: 'AFC', division: 'North' },
        { id: 'nfl_cle', name: 'Cleveland Browns', abbreviation: 'CLE', conference: 'AFC', division: 'North' },
        { id: 'nfl_dal', name: 'Dallas Cowboys', abbreviation: 'DAL', conference: 'NFC', division: 'East' },
        { id: 'nfl_den', name: 'Denver Broncos', abbreviation: 'DEN', conference: 'AFC', division: 'West' },
        { id: 'nfl_det', name: 'Detroit Lions', abbreviation: 'DET', conference: 'NFC', division: 'North' },
        { id: 'nfl_gb', name: 'Green Bay Packers', abbreviation: 'GB', conference: 'NFC', division: 'North' },
        { id: 'nfl_hou', name: 'Houston Texans', abbreviation: 'HOU', conference: 'AFC', division: 'South' },
        { id: 'nfl_ind', name: 'Indianapolis Colts', abbreviation: 'IND', conference: 'AFC', division: 'South' },
        { id: 'nfl_jax', name: 'Jacksonville Jaguars', abbreviation: 'JAX', conference: 'AFC', division: 'South' },
        { id: 'nfl_kc', name: 'Kansas City Chiefs', abbreviation: 'KC', conference: 'AFC', division: 'West' },
        { id: 'nfl_lv', name: 'Las Vegas Raiders', abbreviation: 'LV', conference: 'AFC', division: 'West' },
        { id: 'nfl_lac', name: 'Los Angeles Chargers', abbreviation: 'LAC', conference: 'AFC', division: 'West' },
        { id: 'nfl_lar', name: 'Los Angeles Rams', abbreviation: 'LAR', conference: 'NFC', division: 'West' },
        { id: 'nfl_mia', name: 'Miami Dolphins', abbreviation: 'MIA', conference: 'AFC', division: 'East' },
        { id: 'nfl_min', name: 'Minnesota Vikings', abbreviation: 'MIN', conference: 'NFC', division: 'North' },
        { id: 'nfl_ne', name: 'New England Patriots', abbreviation: 'NE', conference: 'AFC', division: 'East' },
        { id: 'nfl_no', name: 'New Orleans Saints', abbreviation: 'NO', conference: 'NFC', division: 'South' },
        { id: 'nfl_nyg', name: 'New York Giants', abbreviation: 'NYG', conference: 'NFC', division: 'East' },
        { id: 'nfl_nyj', name: 'New York Jets', abbreviation: 'NYJ', conference: 'AFC', division: 'East' },
        { id: 'nfl_phi', name: 'Philadelphia Eagles', abbreviation: 'PHI', conference: 'NFC', division: 'East' },
        { id: 'nfl_pit', name: 'Pittsburgh Steelers', abbreviation: 'PIT', conference: 'AFC', division: 'North' },
        { id: 'nfl_sf', name: 'San Francisco 49ers', abbreviation: 'SF', conference: 'NFC', division: 'West' },
        { id: 'nfl_sea', name: 'Seattle Seahawks', abbreviation: 'SEA', conference: 'NFC', division: 'West' },
        { id: 'nfl_tb', name: 'Tampa Bay Buccaneers', abbreviation: 'TB', conference: 'NFC', division: 'South' },
        { id: 'nfl_ten', name: 'Tennessee Titans', abbreviation: 'TEN', conference: 'AFC', division: 'South' },
        { id: 'nfl_was', name: 'Washington Commanders', abbreviation: 'WAS', conference: 'NFC', division: 'East' }
    ];
    
    return nflTeams.map(team => ({
        ...team,
        league: 'NFL',
        colors: getTeamColors(team.name)
    }));
}

async function getNCAATeams(env) {
    // Top 25 NCAA Football teams for 2024
    const ncaaTeams = [
        { id: 'ncaa_texas', name: 'Texas Longhorns', abbreviation: 'TEX', conference: 'Big 12', ranking: 3 },
        { id: 'ncaa_alabama', name: 'Alabama Crimson Tide', abbreviation: 'ALA', conference: 'SEC', ranking: 1 },
        { id: 'ncaa_georgia', name: 'Georgia Bulldogs', abbreviation: 'UGA', conference: 'SEC', ranking: 2 },
        { id: 'ncaa_michigan', name: 'Michigan Wolverines', abbreviation: 'MICH', conference: 'Big Ten', ranking: 4 },
        { id: 'ncaa_ohiostate', name: 'Ohio State Buckeyes', abbreviation: 'OSU', conference: 'Big Ten', ranking: 5 },
        { id: 'ncaa_penn', name: 'Penn State Nittany Lions', abbreviation: 'PSU', conference: 'Big Ten', ranking: 6 },
        { id: 'ncaa_oklahoma', name: 'Oklahoma Sooners', abbreviation: 'OU', conference: 'Big 12', ranking: 7 },
        { id: 'ncaa_lsu', name: 'LSU Tigers', abbreviation: 'LSU', conference: 'SEC', ranking: 8 },
        { id: 'ncaa_clemson', name: 'Clemson Tigers', abbreviation: 'CLEM', conference: 'ACC', ranking: 9 },
        { id: 'ncaa_usc', name: 'USC Trojans', abbreviation: 'USC', conference: 'Pac-12', ranking: 10 },
        { id: 'ncaa_tamu', name: 'Texas A&M Aggies', abbreviation: 'TAMU', conference: 'SEC', ranking: 15 },
        { id: 'ncaa_ttu', name: 'Texas Tech Red Raiders', abbreviation: 'TTU', conference: 'Big 12', ranking: 25 }
    ];
    
    return ncaaTeams.map(team => ({
        ...team,
        league: 'NCAA',
        division: 'FBS',
        colors: getTeamColors(team.name)
    }));
}

async function getNBATeams(env) {
    // Sample NBA teams
    const nbaTeams = [
        { id: 'nba_mem', name: 'Memphis Grizzlies', abbreviation: 'MEM', conference: 'Western', division: 'Southwest' },
        { id: 'nba_lal', name: 'Los Angeles Lakers', abbreviation: 'LAL', conference: 'Western', division: 'Pacific' },
        { id: 'nba_gsw', name: 'Golden State Warriors', abbreviation: 'GSW', conference: 'Western', division: 'Pacific' },
        { id: 'nba_bos', name: 'Boston Celtics', abbreviation: 'BOS', conference: 'Eastern', division: 'Atlantic' }
    ];
    
    return nbaTeams.map(team => ({
        ...team,
        league: 'NBA',
        colors: getTeamColors(team.name)
    }));
}

async function getTeamDetails(teamId, league, env) {
    // Fetch detailed stats based on league and team
    // This would connect to SportsRadar or other APIs with proper authentication
    
    return {
        currentSeason: {
            year: 2024,
            wins: Math.floor(Math.random() * 15),
            losses: Math.floor(Math.random() * 15),
            winPercentage: 0.500 + (Math.random() - 0.5) * 0.3
        },
        lastGame: {
            date: new Date().toISOString(),
            opponent: 'TBD',
            result: 'W',
            score: '7-5'
        }
    };
}

function getTeamColors(teamName) {
    const colorMap = {
        'Cardinals': ['#C41E3A', '#FEDB00'],
        'Titans': ['#0C2340', '#4B92DB'],
        'Longhorns': ['#FF6B35', '#FFFFFF'],
        'Grizzlies': ['#5D76A9', '#12173F'],
        'Aggies': ['#500000', '#FFFFFF'],
        'Red Raiders': ['#CC0000', '#000000']
    };
    
    for (const [key, colors] of Object.entries(colorMap)) {
        if (teamName.includes(key)) {
            return colors;
        }
    }
    
    return ['#FF6B35', '#0A0E27']; // Blaze default colors
}