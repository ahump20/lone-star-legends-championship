
// Roster Data
const rosterData = {
  "characters": [
    {
      "id": "char_001",
      "name": "Marcus Thunder",
      "nickname": "The Bolt",
      "age": 12,
      "bio": "Marcus grew up watching lightning storms and decided to be just as unstoppable. Known for his electric speed and shocking power at the plate.",
      "stats": {
        "batting": 9,
        "power": 8,
        "speed": 10,
        "pitching": 6,
        "fielding": 8
      },
      "position": "CF",
      "specialAbility": {
        "id": "lightning_speed",
        "name": "Lightning Speed",
        "description": "Automatically advances an extra base on any hit",
        "cooldown": 3,
        "type": "PASSIVE_RUNNING"
      },
      "personality": ["Energetic", "Competitive", "Team Leader"],
      "appearance": {
        "skinTone": "medium",
        "hairStyle": "short_spiky",
        "hairColor": "black",
        "accessories": ["headband"]
      },
      "favoriteNumber": 7
    },
    {
      "id": "char_002",
      "name": "Sofia Martinez",
      "nickname": "The Cannon",
      "age": 11,
      "bio": "Sofia's arm is legendary in the neighborhood. She once threw a ball clear over the old oak tree in center field.",
      "stats": {
        "batting": 7,
        "power": 6,
        "speed": 7,
        "pitching": 10,
        "fielding": 9
      },
      "position": "P",
      "specialAbility": {
        "id": "rocket_arm",
        "name": "Rocket Arm",
        "description": "Throws an unhittable fastball (one use per game)",
        "cooldown": 99,
        "type": "ACTIVE_PITCH"
      },
      "personality": ["Determined", "Focused", "Natural Leader"],
      "appearance": {
        "skinTone": "tan",
        "hairStyle": "long_ponytail",
        "hairColor": "dark_brown",
        "accessories": ["wristbands"]
      },
      "favoriteNumber": 22
    },
    {
      "id": "char_003",
      "name": "Tommy 'Tank' Chen",
      "nickname": "Tank",
      "age": 12,
      "bio": "The biggest kid in the neighborhood, Tommy can hit the ball farther than anyone. He's gentle off the field but a powerhouse on it.",
      "stats": {
        "batting": 8,
        "power": 10,
        "speed": 4,
        "pitching": 5,
        "fielding": 7
      },
      "position": "1B",
      "specialAbility": {
        "id": "mega_blast",
        "name": "Mega Blast",
        "description": "Next hit has double power - guaranteed home run on contact",
        "cooldown": 4,
        "type": "ACTIVE_BATTING"
      },
      "personality": ["Gentle Giant", "Reliable", "Patient"],
      "appearance": {
        "skinTone": "light",
        "hairStyle": "buzzcut",
        "hairColor": "black",
        "accessories": ["batting_gloves"]
      },
      "favoriteNumber": 88
    },
    {
      "id": "char_004",
      "name": "Jasmine 'Jazz' Williams",
      "nickname": "Jazz",
      "age": 10,
      "bio": "Quick reflexes and quicker wit. Jazz can catch anything hit her way and loves to make diving plays.",
      "stats": {
        "batting": 6,
        "power": 4,
        "speed": 9,
        "pitching": 5,
        "fielding": 10
      },
      "position": "SS",
      "specialAbility": {
        "id": "wall_climber",
        "name": "Super Catch",
        "description": "Can catch any ball in her zone, even home runs",
        "cooldown": 3,
        "type": "ACTIVE_FIELDING"
      },
      "personality": ["Acrobatic", "Cheerful", "Confident"],
      "appearance": {
        "skinTone": "dark",
        "hairStyle": "braids",
        "hairColor": "black",
        "accessories": ["sunglasses"]
      },
      "favoriteNumber": 3
    },
    {
      "id": "char_005",
      "name": "Lucas 'Lucky' O'Brien",
      "nickname": "Lucky",
      "age": 9,
      "bio": "Some kids practice for hours. Lucas just seems to have natural talent. His teammates swear he has a lucky charm.",
      "stats": {
        "batting": 9,
        "power": 7,
        "speed": 8,
        "pitching": 7,
        "fielding": 8
      },
      "position": "RF",
      "specialAbility": {
        "id": "clutch_gene",
        "name": "Clutch Gene",
        "description": "Batting bonus in innings 7-9 or when behind",
        "cooldown": 0,
        "type": "PASSIVE_BATTING"
      },
      "personality": ["Lucky", "Laid-back", "Clutch Performer"],
      "appearance": {
        "skinTone": "fair",
        "hairStyle": "messy",
        "hairColor": "red",
        "accessories": ["lucky_charm"]
      },
      "favoriteNumber": 13
    },
    {
      "id": "char_006",
      "name": "Maya Patel",
      "nickname": "The Professor",
      "age": 11,
      "bio": "Maya studies every pitcher's habits and knows exactly when to swing. Her batting average speaks for itself.",
      "stats": {
        "batting": 10,
        "power": 5,
        "speed": 7,
        "pitching": 6,
        "fielding": 8
      },
      "position": "2B",
      "specialAbility": {
        "id": "eagle_eye",
        "name": "Eagle Eye",
        "description": "Perfect strike zone vision - guaranteed walk on 4 pitches",
        "cooldown": 4,
        "type": "ACTIVE_BATTING"
      },
      "personality": ["Analytical", "Smart", "Strategic"],
      "appearance": {
        "skinTone": "brown",
        "hairStyle": "short_bob",
        "hairColor": "black",
        "accessories": ["glasses"]
      },
      "favoriteNumber": 42
    },
    {
      "id": "char_007",
      "name": "Diego 'Dash' Rodriguez",
      "nickname": "Dash",
      "age": 10,
      "bio": "Fastest kid in three zip codes. Diego can steal bases like nobody's business and turns singles into doubles.",
      "stats": {
        "batting": 7,
        "power": 3,
        "speed": 10,
        "pitching": 4,
        "fielding": 8
      },
      "position": "LF",
      "specialAbility": {
        "id": "speedster",
        "name": "Speedster",
        "description": "Steals an extra base automatically on any hit",
        "cooldown": 3,
        "type": "PASSIVE_RUNNING"
      },
      "personality": ["Hyper", "Enthusiastic", "Never Stops Moving"],
      "appearance": {
        "skinTone": "tan",
        "hairStyle": "mohawk",
        "hairColor": "brown",
        "accessories": ["sweatband"]
      },
      "favoriteNumber": 1
    },
    {
      "id": "char_008",
      "name": "Emma 'Ice' Anderson",
      "nickname": "Ice",
      "age": 12,
      "bio": "Nothing rattles Emma. Down by 5 in the last inning? She'll step up and deliver. Ice in her veins.",
      "stats": {
        "batting": 8,
        "power": 7,
        "speed": 6,
        "pitching": 9,
        "fielding": 7
      },
      "position": "P",
      "specialAbility": {
        "id": "ice_veins",
        "name": "Ice in Veins",
        "description": "Massive clutch bonus in pressure situations",
        "cooldown": 0,
        "type": "PASSIVE_CLUTCH"
      },
      "personality": ["Cool Under Pressure", "Fearless", "Reliable"],
      "appearance": {
        "skinTone": "fair",
        "hairStyle": "straight_long",
        "hairColor": "blonde",
        "accessories": ["arm_sleeve"]
      },
      "favoriteNumber": 99
    },
    {
      "id": "char_009",
      "name": "Jamal 'J-Rock' Jackson",
      "nickname": "J-Rock",
      "age": 11,
      "bio": "Solid as a rock behind the plate. J-Rock calls the pitches and keeps everyone in line. Great hitter too.",
      "stats": {
        "batting": 8,
        "power": 8,
        "speed": 5,
        "pitching": 3,
        "fielding": 9
      },
      "position": "C",
      "specialAbility": {
        "id": "rally_starter",
        "name": "Rally Starter",
        "description": "Hits are contagious - next batter gets bonus",
        "cooldown": 4,
        "type": "ACTIVE_TEAM"
      },
      "personality": ["Steady", "Encouraging", "Team Player"],
      "appearance": {
        "skinTone": "dark",
        "hairStyle": "fade",
        "hairColor": "black",
        "accessories": ["chain_necklace"]
      },
      "favoriteNumber": 24
    },
    {
      "id": "char_010",
      "name": "Olivia 'Rocket' Kim",
      "nickname": "Rocket",
      "age": 10,
      "bio": "Olivia's dad is an aerospace engineer, and she's obsessed with rockets. Her hits launch like she's sending them to space.",
      "stats": {
        "batting": 7,
        "power": 9,
        "speed": 6,
        "pitching": 5,
        "fielding": 7
      },
      "position": "3B",
      "specialAbility": {
        "id": "moon_shot",
        "name": "Moon Shot",
        "description": "Hit travels twice as far - epic home runs",
        "cooldown": 5,
        "type": "ACTIVE_BATTING"
      },
      "personality": ["Science Nerd", "Ambitious", "Dreamer"],
      "appearance": {
        "skinTone": "light",
        "hairStyle": "bun",
        "hairColor": "black",
        "accessories": ["nasa_patch"]
      },
      "favoriteNumber": 10
    },
    {
      "id": "char_011",
      "name": "Carter 'Wheels' Murphy",
      "nickname": "Wheels",
      "age": 9,
      "bio": "Carter rides his bike everywhere and has legs like pistons. He's fast, agile, and can track down any fly ball.",
      "stats": {
        "batting": 6,
        "power": 4,
        "speed": 9,
        "pitching": 5,
        "fielding": 9
      },
      "position": "CF",
      "specialAbility": {
        "id": "bike_speed",
        "name": "Bike Speed",
        "description": "Covers entire outfield - catches everything",
        "cooldown": 3,
        "type": "ACTIVE_FIELDING"
      },
      "personality": ["Active", "Adventurous", "Positive"],
      "appearance": {
        "skinTone": "medium",
        "hairStyle": "shaggy",
        "hairColor": "brown",
        "accessories": ["bike_helmet"]
      },
      "favoriteNumber": 5
    },
    {
      "id": "char_012",
      "name": "Zoe 'Zigzag' Taylor",
      "nickname": "Zigzag",
      "age": 11,
      "bio": "Unpredictable and crafty, Zoe keeps everyone guessing. As a pitcher, she throws the trickiest pitches in the game.",
      "stats": {
        "batting": 6,
        "power": 5,
        "speed": 7,
        "pitching": 9,
        "fielding": 7
      },
      "position": "P",
      "specialAbility": {
        "id": "trick_pitch",
        "name": "Trick Pitch",
        "description": "Confuses batter - high strikeout chance",
        "cooldown": 3,
        "type": "ACTIVE_PITCH"
      },
      "personality": ["Creative", "Unpredictable", "Clever"],
      "appearance": {
        "skinTone": "fair",
        "hairStyle": "pigtails",
        "hairColor": "dirty_blonde",
        "accessories": ["colorful_socks"]
      },
      "favoriteNumber": 33
    },
    {
      "id": "char_013",
      "name": "Andre 'The Wall' Johnson",
      "nickname": "The Wall",
      "age": 12,
      "bio": "Nothing gets past Andre at first base. He's a brick wall with a glove, and his patience at the plate draws walks.",
      "stats": {
        "batting": 7,
        "power": 6,
        "speed": 4,
        "pitching": 4,
        "fielding": 10
      },
      "position": "1B",
      "specialAbility": {
        "id": "defensive_wall",
        "name": "The Wall",
        "description": "Creates an impenetrable infield defense",
        "cooldown": 3,
        "type": "ACTIVE_FIELDING"
      },
      "personality": ["Dependable", "Calm", "Protective"],
      "appearance": {
        "skinTone": "dark",
        "hairStyle": "cornrows",
        "hairColor": "black",
        "accessories": ["armband"]
      },
      "favoriteNumber": 21
    },
    {
      "id": "char_014",
      "name": "Lily 'Spark' Chen",
      "nickname": "Spark",
      "age": 8,
      "bio": "The youngest player but don't let that fool you. Lily's got spark and energy that ignites the whole team.",
      "stats": {
        "batting": 5,
        "power": 3,
        "speed": 8,
        "pitching": 4,
        "fielding": 6
      },
      "position": "2B",
      "specialAbility": {
        "id": "spark_plug",
        "name": "Spark Plug",
        "description": "Energizes entire team - everyone gets stat boost",
        "cooldown": 5,
        "type": "ACTIVE_TEAM"
      },
      "personality": ["Bubbly", "Inspiring", "Fearless"],
      "appearance": {
        "skinTone": "light",
        "hairStyle": "short_pixie",
        "hairColor": "black",
        "accessories": ["ribbons"]
      },
      "favoriteNumber": 8
    },
    {
      "id": "char_015",
      "name": "Ryan 'Cannon' McGrath",
      "nickname": "Cannon",
      "age": 11,
      "bio": "Ryan's got one of the strongest arms in right field. Runners think twice before trying to advance when he's out there.",
      "stats": {
        "batting": 7,
        "power": 8,
        "speed": 6,
        "pitching": 7,
        "fielding": 9
      },
      "position": "RF",
      "specialAbility": {
        "id": "laser_throw",
        "name": "Laser Throw",
        "description": "Perfect throw to any base - guaranteed out",
        "cooldown": 4,
        "type": "ACTIVE_FIELDING"
      },
      "personality": ["Strong", "Competitive", "Focused"],
      "appearance": {
        "skinTone": "fair",
        "hairStyle": "crew_cut",
        "hairColor": "brown",
        "accessories": ["elbow_pad"]
      },
      "favoriteNumber": 44
    },
    {
      "id": "char_016",
      "name": "Keisha 'Blaze' Robinson",
      "nickname": "Blaze",
      "age": 10,
      "bio": "Fast, fierce, and on fire! Keisha plays with passion and intensity that lights up the field.",
      "stats": {
        "batting": 8,
        "power": 6,
        "speed": 9,
        "pitching": 6,
        "fielding": 8
      },
      "position": "LF",
      "specialAbility": {
        "id": "hot_streak",
        "name": "Hot Streak",
        "description": "After a hit, next at-bat is boosted significantly",
        "cooldown": 0,
        "type": "PASSIVE_BATTING"
      },
      "personality": ["Passionate", "Intense", "Driven"],
      "appearance": {
        "skinTone": "dark",
        "hairStyle": "afro",
        "hairColor": "black",
        "accessories": ["wristbands"]
      },
      "favoriteNumber": 11
    },
    {
      "id": "char_017",
      "name": "Alex 'Ace' Santos",
      "nickname": "Ace",
      "age": 12,
      "bio": "The ultimate all-around player. Alex can pitch, hit, field - you name it. A true five-tool superstar.",
      "stats": {
        "batting": 9,
        "power": 8,
        "speed": 8,
        "pitching": 9,
        "fielding": 9
      },
      "position": "SS",
      "specialAbility": {
        "id": "all_star",
        "name": "All-Star Mode",
        "description": "All stats boosted for one full inning",
        "cooldown": 6,
        "type": "ACTIVE_ALL"
      },
      "personality": ["Talented", "Humble", "Hardworking"],
      "appearance": {
        "skinTone": "tan",
        "hairStyle": "slicked_back",
        "hairColor": "black",
        "accessories": ["captain_band"]
      },
      "favoriteNumber": 1
    },
    {
      "id": "char_018",
      "name": "Mia 'Magnet' Lee",
      "nickname": "Magnet",
      "age": 9,
      "bio": "It's like the ball is attracted to her glove! Mia makes impossible catches look routine.",
      "stats": {
        "batting": 5,
        "power": 4,
        "speed": 7,
        "pitching": 5,
        "fielding": 10
      },
      "position": "3B",
      "specialAbility": {
        "id": "magnetic_glove",
        "name": "Magnetic Glove",
        "description": "Attracts all balls hit near her - auto-catch",
        "cooldown": 3,
        "type": "ACTIVE_FIELDING"
      },
      "personality": ["Graceful", "Focused", "Precise"],
      "appearance": {
        "skinTone": "light",
        "hairStyle": "high_ponytail",
        "hairColor": "black",
        "accessories": ["headband"]
      },
      "favoriteNumber": 9
    }
  ],
  "teams": [
    {
      "id": "team_sandlot",
      "name": "Sandlot Sluggers",
      "shortName": "Sluggers",
      "color": "#FF6B35",
      "secondaryColor": "#004E89",
      "logo": "⚾"
    },
    {
      "id": "team_backyard",
      "name": "Backyard Bombers",
      "shortName": "Bombers",
      "color": "#C41E3A",
      "secondaryColor": "#FFD700",
      "logo": "💥"
    },
    {
      "id": "team_diamond",
      "name": "Diamond Dogs",
      "shortName": "Dogs",
      "color": "#00A86B",
      "secondaryColor": "#FFFFFF",
      "logo": "🐕"
    },
    {
      "id": "team_legends",
      "name": "Neighborhood Legends",
      "shortName": "Legends",
      "color": "#8B4789",
      "secondaryColor": "#FFA500",
      "logo": "⭐"
    },
    {
      "id": "team_rebels",
      "name": "Rebel Runners",
      "shortName": "Rebels",
      "color": "#1E90FF",
      "secondaryColor": "#FF0000",
      "logo": "🏃"
    },
    {
      "id": "team_thunder",
      "name": "Thunder Strikers",
      "shortName": "Thunder",
      "color": "#FFD700",
      "secondaryColor": "#000000",
      "logo": "⚡"
    }
  ]
}
;

/**
 * Complete GameState implementation for Backyard Baseball style game.
 * Handles all game logic including pitching, batting, baserunning, and scoring.
 */

interface Player {
  id: string;
  name: string;
  nickname: string;
  stats: {
    batting: number;
    power: number;
    speed: number;
    pitching: number;
    fielding: number;
  };
  position: string;
  x?: number;
  y?: number;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  secondaryColor: string;
  roster: Player[];
  score: number;
  battingOrder: number[];
}

export interface PitchResult {
  type: 'ball' | 'strike' | 'hit' | 'foul';
  hitType?: 'single' | 'double' | 'triple' | 'homerun' | 'groundout' | 'flyout' | 'lineout';
  location?: { x: number; y: number };
  power?: number;
}

export class GameState {
  // Field positions
  public players: { x: number; y: number; team: string; position: string }[];
  public ball: { x: number; y: number; vx: number; vy: number; active: boolean };

  // Game state
  public inning: number;
  public inningHalf: 'top' | 'bottom';
  public balls: number;
  public strikes: number;
  public outs: number;
  public maxInnings: number = 3;

  // Teams
  public homeTeam: Team | null = null;
  public awayTeam: Team | null = null;
  public currentBatterIndex: number = 0;

  // Baserunners
  public bases: { [key: number]: Player | null } = { 1: null, 2: null, 3: null };

  // Current play state
  public currentPitcher: Player | null = null;
  public currentBatter: Player | null = null;
  public gameOver: boolean = false;
  public winner: Team | null = null;

  // Animation/physics state
  public pitchInProgress: boolean = false;
  public ballInPlay: boolean = false;
  public lastPlayResult: PitchResult | null = null;

  // Event callbacks
  public onPitchResult?: (result: PitchResult) => void;
  public onScoreUpdate?: (home: number, away: number) => void;
  public onInningChange?: (inning: number, half: string) => void;
  public onGameOver?: (winner: Team) => void;

  constructor() {
    this.players = [];
    this.ball = { x: 512, y: 384, vx: 0, vy: 0, active: false };
    this.inning = 1;
    this.inningHalf = "top";
    this.balls = 0;
    this.strikes = 0;
    this.outs = 0;
  }

  /**
   * Initialize the game with two teams
   */
  initializeGame(homeTeam: Team, awayTeam: Team) {
    this.homeTeam = homeTeam;
    this.awayTeam = awayTeam;
    this.homeTeam.score = 0;
    this.awayTeam.score = 0;
    this.currentBatterIndex = 0;

    // Set up initial positions
    this.setupFieldPositions();
    this.updateCurrentPlayers();
  }

  /**
   * Set up field positions for all players
   */
  setupFieldPositions() {
    const fieldPositions = {
      'P': { x: 512, y: 480 },
      'C': { x: 512, y: 600 },
      '1B': { x: 620, y: 450 },
      '2B': { x: 580, y: 350 },
      '3B': { x: 404, y: 450 },
      'SS': { x: 444, y: 350 },
      'LF': { x: 300, y: 250 },
      'CF': { x: 512, y: 200 },
      'RF': { x: 724, y: 250 }
    };

    this.players = [];
    const fieldingTeam = this.inningHalf === 'top' ? this.homeTeam : this.awayTeam;

    if (fieldingTeam) {
      fieldingTeam.roster.forEach((player) => {
        const pos = fieldPositions[player.position as keyof typeof fieldPositions];
        if (pos) {
          this.players.push({
            x: pos.x,
            y: pos.y,
            team: fieldingTeam.id,
            position: player.position
          });
        }
      });
    }
  }

  /**
   * Update current pitcher and batter
   */
  updateCurrentPlayers() {
    const battingTeam = this.inningHalf === 'top' ? this.awayTeam : this.homeTeam;
    const fieldingTeam = this.inningHalf === 'top' ? this.homeTeam : this.awayTeam;

    if (battingTeam && fieldingTeam) {
      this.currentBatter = battingTeam.roster[this.currentBatterIndex % battingTeam.roster.length];
      this.currentPitcher = fieldingTeam.roster.find(p => p.position === 'P') || fieldingTeam.roster[0];
    }
  }

  /**
   * Main update loop
   */
  update() {
    // Update ball physics if in play
    if (this.ballInPlay && this.ball.active) {
      this.ball.x += this.ball.vx;
      this.ball.y += this.ball.vy;

      // Apply gravity/friction
      this.ball.vy += 0.2;
      this.ball.vx *= 0.98;

      // Check if ball landed
      if (this.ball.y >= 400) {
        this.resolveBallLanding();
      }
    }
  }

  /**
   * Pitch the ball with location and speed
   */
  pitch(location: { x: number; y: number }, speed: number = 1.0) {
    if (this.pitchInProgress || this.gameOver) return;

    this.pitchInProgress = true;
    this.ball.active = true;
    this.ball.x = 512;
    this.ball.y = 480;
    this.ball.vx = (location.x - 512) * 0.1;
    this.ball.vy = (location.y - 480) * 0.15 * speed;

    // Auto-resolve after short delay
    setTimeout(() => {
      this.pitchInProgress = false;
    }, 500);
  }

  /**
   * Batter swings at the pitch
   */
  swingBat(timing: number = 0.5, power: number = 0.5): PitchResult {
    if (!this.currentBatter || !this.currentPitcher || this.gameOver) {
      return { type: 'strike' };
    }

    const batter = this.currentBatter;
    const pitcher = this.currentPitcher;

    // Calculate hit probability based on stats and timing
    const battingSkill = batter.stats.batting / 10;
    const pitchingSkill = pitcher.stats.pitching / 10;
    const timingBonus = 1 - Math.abs(timing - 0.5) * 2; // Best at 0.5

    const hitChance = (battingSkill * 0.5 + timingBonus * 0.3 - pitchingSkill * 0.2);
    const roll = Math.random();

    let result: PitchResult;

    if (roll < hitChance * 0.3) {
      // Hit!
      result = this.determineHitType(batter, power);
      this.handleHit(result);
    } else if (roll < hitChance * 0.5) {
      // Foul ball
      result = { type: 'foul' };
      if (this.strikes < 2) {
        this.strikes++;
      }
    } else if (roll < hitChance) {
      // Ball in play but out
      result = this.determineOutType(batter);
      this.handleOut(result);
    } else {
      // Strike
      result = { type: 'strike' };
      this.strikes++;

      // Strikeout
      if (this.strikes >= 3) {
        this.handleStrikeout();
      }
    }

    this.lastPlayResult = result;
    if (this.onPitchResult) {
      this.onPitchResult(result);
    }

    return result;
  }

  /**
   * Take a pitch without swinging
   */
  takePitch(): PitchResult {
    if (!this.currentPitcher || this.gameOver) {
      return { type: 'ball' };
    }

    const pitcher = this.currentPitcher;
    const control = pitcher.stats.pitching / 10;

    // Determine if pitch is a strike or ball
    const strikeChance = 0.5 + (control * 0.2);
    const roll = Math.random();

    let result: PitchResult;

    if (roll < strikeChance) {
      result = { type: 'strike' };
      this.strikes++;

      if (this.strikes >= 3) {
        this.handleStrikeout();
      }
    } else {
      result = { type: 'ball' };
      this.balls++;

      // Walk
      if (this.balls >= 4) {
        this.handleWalk();
      }
    }

    this.lastPlayResult = result;
    if (this.onPitchResult) {
      this.onPitchResult(result);
    }

    return result;
  }

  /**
   * Determine the type of hit based on batter stats and power
   */
  determineHitType(batter: Player, power: number): PitchResult {
    const powerStat = batter.stats.power / 10;
    const combinedPower = (powerStat * 0.7 + power * 0.3);

    const roll = Math.random();

    if (roll < combinedPower * 0.15) {
      return { type: 'hit', hitType: 'homerun', power: combinedPower };
    } else if (roll < combinedPower * 0.3) {
      return { type: 'hit', hitType: 'triple', power: combinedPower };
    } else if (roll < combinedPower * 0.5) {
      return { type: 'hit', hitType: 'double', power: combinedPower };
    } else {
      return { type: 'hit', hitType: 'single', power: combinedPower };
    }
  }

  /**
   * Determine type of out
   */
  determineOutType(batter: Player): PitchResult {
    const roll = Math.random();

    if (roll < 0.4) {
      return { type: 'hit', hitType: 'groundout' };
    } else if (roll < 0.8) {
      return { type: 'hit', hitType: 'flyout' };
    } else {
      return { type: 'hit', hitType: 'lineout' };
    }
  }

  /**
   * Handle a hit
   */
  handleHit(result: PitchResult) {
    if (!result.hitType) return;

    // Activate ball animation
    this.ballInPlay = true;
    this.ball.active = true;

    // Advance runners based on hit type
    const basesToAdvance = {
      'single': 1,
      'double': 2,
      'triple': 3,
      'homerun': 4
    }[result.hitType] || 0;

    this.advanceRunners(basesToAdvance);

    // Reset count
    this.balls = 0;
    this.strikes = 0;

    // Next batter
    this.nextBatter();
  }

  /**
   * Handle an out
   */
  handleOut(result: PitchResult) {
    this.outs++;
    this.balls = 0;
    this.strikes = 0;

    if (this.outs >= 3) {
      this.endInning();
    } else {
      this.nextBatter();
    }
  }

  /**
   * Handle strikeout
   */
  handleStrikeout() {
    this.outs++;
    this.balls = 0;
    this.strikes = 0;

    if (this.outs >= 3) {
      this.endInning();
    } else {
      this.nextBatter();
    }
  }

  /**
   * Handle walk
   */
  handleWalk() {
    this.advanceRunners(1, true); // Force advance with walk
    this.balls = 0;
    this.strikes = 0;
    this.nextBatter();
  }

  /**
   * Advance runners on the bases
   */
  advanceRunners(bases: number, walk: boolean = false) {
    const battingTeam = this.inningHalf === 'top' ? this.awayTeam : this.homeTeam;
    if (!battingTeam || !this.currentBatter) return;

    let runsScored = 0;

    // Score runners from third
    if (this.bases[3] && bases >= 1) {
      runsScored++;
      this.bases[3] = null;
    }

    // Advance from second
    if (this.bases[2]) {
      if (bases >= 2) {
        runsScored++;
        this.bases[2] = null;
      } else if (bases === 1) {
        this.bases[3] = this.bases[2];
        this.bases[2] = null;
      }
    }

    // Advance from first
    if (this.bases[1]) {
      if (bases >= 3) {
        runsScored++;
      } else if (bases === 2) {
        this.bases[3] = this.bases[1];
      } else if (bases === 1) {
        this.bases[2] = this.bases[1];
      }
      this.bases[1] = null;
    }

    // Place batter on base
    if (bases === 4) {
      // Home run - batter scores
      runsScored++;
    } else if (bases > 0) {
      this.bases[bases] = this.currentBatter;
    }

    // Update score
    battingTeam.score += runsScored;

    if (this.onScoreUpdate && this.homeTeam && this.awayTeam) {
      this.onScoreUpdate(this.homeTeam.score, this.awayTeam.score);
    }
  }

  /**
   * Move to next batter
   */
  nextBatter() {
    this.currentBatterIndex++;
    this.updateCurrentPlayers();
  }

  /**
   * End the current inning
   */
  endInning() {
    // Clear bases
    this.bases = { 1: null, 2: null, 3: null };
    this.outs = 0;
    this.balls = 0;
    this.strikes = 0;

    if (this.inningHalf === 'top') {
      // Switch to bottom of inning
      this.inningHalf = 'bottom';
    } else {
      // Next inning
      this.inning++;
      this.inningHalf = 'top';

      // Check if game is over
      if (this.inning > this.maxInnings) {
        this.endGame();
        return;
      }
    }

    // Reset field positions
    this.setupFieldPositions();
    this.updateCurrentPlayers();

    if (this.onInningChange) {
      this.onInningChange(this.inning, this.inningHalf);
    }
  }

  /**
   * End the game
   */
  endGame() {
    this.gameOver = true;

    if (this.homeTeam && this.awayTeam) {
      if (this.homeTeam.score > this.awayTeam.score) {
        this.winner = this.homeTeam;
      } else if (this.awayTeam.score > this.homeTeam.score) {
        this.winner = this.awayTeam;
      } else {
        // Tie - play extra innings
        this.gameOver = false;
        this.maxInnings++;
        return;
      }

      if (this.onGameOver && this.winner) {
        this.onGameOver(this.winner);
      }
    }
  }

  /**
   * Resolve ball landing for fielding
   */
  resolveBallLanding() {
    this.ballInPlay = false;
    this.ball.active = false;
    this.ball.x = 512;
    this.ball.y = 384;
    this.ball.vx = 0;
    this.ball.vy = 0;
  }

  /**
   * Get current game state summary
   */
  getGameSummary() {
    return {
      inning: this.inning,
      inningHalf: this.inningHalf,
      balls: this.balls,
      strikes: this.strikes,
      outs: this.outs,
      homeScore: this.homeTeam?.score || 0,
      awayScore: this.awayTeam?.score || 0,
      bases: this.bases,
      gameOver: this.gameOver,
      winner: this.winner?.name
    };
  }
}

/**
 * TeamBuilder - Creates teams from the Backyard Baseball roster
 */


class TeamBuilder {
  private characters: any[];
  private teams: any[];

  constructor() {
    this.characters = rosterData.characters;
    this.teams = rosterData.teams;
  }

  /**
   * Get all available characters
   */
  getAllCharacters(): Player[] {
    return this.characters.map(char => this.convertToPlayer(char));
  }

  /**
   * Convert roster character to Player format
   */
  private convertToPlayer(char: any): Player {
    return {
      id: char.id,
      name: char.name,
      nickname: char.nickname,
      stats: {
        batting: char.stats.batting,
        power: char.stats.power,
        speed: char.stats.speed,
        pitching: char.stats.pitching,
        fielding: char.stats.fielding
      },
      position: char.position
    };
  }

  /**
   * Create a balanced team by selecting players for each position
   */
  createBalancedTeam(teamId: string, playerIds: string[]): Team | null {
    const teamData = this.teams.find(t => t.id === teamId);
    if (!teamData) return null;

    const roster: Player[] = [];
    const selectedPlayers = playerIds.map(id =>
      this.characters.find(c => c.id === id)
    ).filter(p => p);

    // Ensure we have players for each position
    const requiredPositions = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];

    for (const pos of requiredPositions) {
      const player = selectedPlayers.find(p => p.position === pos);
      if (player) {
        roster.push(this.convertToPlayer(player));
      } else {
        // Find a substitute from all characters
        const substitute = this.characters.find(c => c.position === pos);
        if (substitute) {
          roster.push(this.convertToPlayer(substitute));
        }
      }
    }

    return {
      id: teamData.id,
      name: teamData.name,
      shortName: teamData.shortName,
      color: teamData.color,
      secondaryColor: teamData.secondaryColor,
      roster: roster,
      score: 0,
      battingOrder: Array.from({ length: roster.length }, (_, i) => i)
    };
  }

  /**
   * Create two pre-made teams for quick play
   */
  createQuickPlayTeams(): { homeTeam: Team; awayTeam: Team } {
    // Home Team: Sandlot Sluggers
    const homeTeam = this.createBalancedTeam('team_sandlot', [
      'char_003', // Tommy 'Tank' Chen - 1B
      'char_006', // Maya Patel - 2B
      'char_010', // Olivia 'Rocket' Kim - 3B
      'char_004', // Jasmine 'Jazz' Williams - SS
      'char_002', // Sofia Martinez - P
      'char_009', // Jamal 'J-Rock' Jackson - C
      'char_007', // Diego 'Dash' Rodriguez - LF
      'char_001', // Marcus Thunder - CF
      'char_005'  // Lucas 'Lucky' O'Brien - RF
    ])!;

    // Away Team: Thunder Strikers
    const awayTeam = this.createBalancedTeam('team_thunder', [
      'char_013', // Andre 'The Wall' Johnson - 1B
      'char_014', // Lily 'Spark' Chen - 2B
      'char_018', // Mia 'Magnet' Lee - 3B
      'char_017', // Alex 'Ace' Santos - SS
      'char_008', // Emma 'Ice' Anderson - P
      'char_009', // Jamal 'J-Rock' Jackson - C (duplicate, will use different catcher)
      'char_016', // Keisha 'Blaze' Robinson - LF
      'char_011', // Carter 'Wheels' Murphy - CF
      'char_015'  // Ryan 'Cannon' McGrath - RF
    ])!;

    // Fix duplicate - use char_012 as pitcher for away team
    const zigzagPitcher = this.characters.find(c => c.id === 'char_012');
    if (zigzagPitcher) {
      awayTeam.roster[4] = this.convertToPlayer(zigzagPitcher);
    }

    return { homeTeam, awayTeam };
  }

  /**
   * Get team by ID
   */
  getTeamData(teamId: string) {
    return this.teams.find(t => t.id === teamId);
  }

  /**
   * Get all available teams
   */
  getAllTeams() {
    return this.teams;
  }
}


/**
 * InputManager - Handles all user input for the game
 * Supports keyboard, mouse, and touch controls
 */

type InputAction = 'swing' | 'pitch' | 'steal' | 'pause' | 'menu';

interface InputCallback {
  (action: InputAction, data?: any): void;
}

class InputManager {
  private callbacks: Map<InputAction, InputCallback[]> = new Map();
  private keyStates: Map<string, boolean> = new Map();
  private canvas: HTMLCanvasElement | null = null;
  private enabled: boolean = true;

  constructor() {
    this.setupKeyboardListeners();
  }

  /**
   * Set the canvas for mouse/touch input
   */
  setCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupMouseListeners();
    this.setupTouchListeners();
  }

  /**
   * Register a callback for an input action
   */
  on(action: InputAction, callback: InputCallback) {
    if (!this.callbacks.has(action)) {
      this.callbacks.set(action, []);
    }
    this.callbacks.get(action)!.push(callback);
  }

  /**
   * Remove a callback for an input action
   */
  off(action: InputAction, callback: InputCallback) {
    const callbacks = this.callbacks.get(action);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Trigger an input action
   */
  trigger(action: InputAction, data?: any) {
    if (!this.enabled) return;

    const callbacks = this.callbacks.get(action);
    if (callbacks) {
      callbacks.forEach(cb => cb(action, data));
    }
  }

  /**
   * Enable/disable input
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Check if a key is currently pressed
   */
  isKeyDown(key: string): boolean {
    return this.keyStates.get(key) || false;
  }

  /**
   * Setup keyboard event listeners
   */
  private setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      this.keyStates.set(e.key, true);
      this.handleKeyDown(e);
    });

    window.addEventListener('keyup', (e) => {
      this.keyStates.set(e.key, false);
    });
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown(e: KeyboardEvent) {
    if (!this.enabled) return;

    // Prevent default for game keys
    const gameKeys = [' ', 'Enter', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (gameKeys.includes(e.key)) {
      e.preventDefault();
    }

    switch (e.key) {
      case ' ':
      case 'Enter':
        // Space or Enter to swing
        this.trigger('swing', {
          timing: Math.random(), // Random timing for now
          power: 0.5 + Math.random() * 0.5 // Random power between 0.5 and 1.0
        });
        break;

      case 'p':
      case 'P':
        // P to pitch
        this.trigger('pitch', {
          location: { x: 512 + (Math.random() - 0.5) * 100, y: 550 },
          speed: 0.8 + Math.random() * 0.4
        });
        break;

      case 's':
      case 'S':
        // S to steal
        this.trigger('steal');
        break;

      case 'Escape':
        // Escape to pause/menu
        this.trigger('pause');
        break;

      case 'm':
      case 'M':
        this.trigger('menu');
        break;
    }
  }

  /**
   * Setup mouse event listeners
   */
  private setupMouseListeners() {
    if (!this.canvas) return;

    this.canvas.addEventListener('click', (e) => {
      if (!this.enabled) return;

      const rect = this.canvas!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Click to swing
      this.trigger('swing', {
        timing: 0.5 + (Math.random() - 0.5) * 0.3,
        power: 0.5 + (y / rect.height) * 0.5
      });
    });
  }

  /**
   * Setup touch event listeners
   */
  private setupTouchListeners() {
    if (!this.canvas) return;

    this.canvas.addEventListener('touchstart', (e) => {
      if (!this.enabled) return;
      e.preventDefault();

      const rect = this.canvas!.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      // Touch to swing
      this.trigger('swing', {
        timing: 0.5 + (Math.random() - 0.5) * 0.3,
        power: 0.5 + (y / rect.height) * 0.5
      });
    });
  }

  /**
   * Cleanup event listeners
   */
  destroy() {
    // Remove event listeners
    this.callbacks.clear();
    this.keyStates.clear();
  }
}


/**
 * Backyard Baseball Demo - Complete 3-Inning Game
 * Production-ready playable demo
 */


class BackyardBaseballDemo {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState;
  private inputManager: InputManager;
  private teamBuilder: TeamBuilder;
  private isRunning: boolean = false;
  private gameMode: 'menu' | 'playing' | 'gameover' = 'menu';
  private autoPlay: boolean = false;
  private autoPlayTimer: number | null = null;

  constructor() {
    console.log('⚾ Backyard Baseball Demo - Starting up!');

    // Get canvas
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Canvas not found!');
    }

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('2D context not supported!');
    }
    this.ctx = ctx;

    // Set canvas size
    this.canvas.width = 1024;
    this.canvas.height = 768;

    // Initialize systems
    this.gameState = new GameState();
    this.inputManager = new InputManager();
    this.teamBuilder = new TeamBuilder();

    this.setupInput();
    this.setupGameCallbacks();
    this.start();
  }

  /**
   * Setup input handlers
   */
  private setupInput() {
    this.inputManager.setCanvas(this.canvas);

    this.inputManager.on('swing', (action, data) => {
      if (this.gameMode === 'playing' && !this.gameState.gameOver) {
        const result = this.gameState.swingBat(data.timing, data.power);
        this.handlePlayResult(result);
      } else if (this.gameMode === 'menu' || this.gameMode === 'gameover') {
        this.startNewGame();
      }
    });

    this.inputManager.on('pitch', (action, data) => {
      if (this.gameMode === 'playing' && !this.gameState.gameOver) {
        this.gameState.pitch(data.location, data.speed);
      }
    });

    this.inputManager.on('menu', () => {
      if (this.gameMode === 'playing') {
        this.gameMode = 'menu';
      }
    });
  }

  /**
   * Setup game state callbacks
   */
  private setupGameCallbacks() {
    this.gameState.onPitchResult = (result: PitchResult) => {
      console.log('Pitch result:', result.type, result.hitType);
    };

    this.gameState.onScoreUpdate = (home: number, away: number) => {
      console.log(`Score Update - Home: ${home}, Away: ${away}`);
    };

    this.gameState.onInningChange = (inning: number, half: string) => {
      console.log(`Inning Change - ${half} of ${inning}`);
    };

    this.gameState.onGameOver = (winner: Team) => {
      console.log(`Game Over! Winner: ${winner.name}`);
      this.gameMode = 'gameover';
      this.autoPlay = false;
      if (this.autoPlayTimer) {
        clearInterval(this.autoPlayTimer);
      }
    };
  }

  /**
   * Start a new game
   */
  private startNewGame() {
    console.log('🎮 Starting new game...');

    // Create teams
    const { homeTeam, awayTeam } = this.teamBuilder.createQuickPlayTeams();

    // Initialize game
    this.gameState = new GameState();
    this.gameState.initializeGame(homeTeam, awayTeam);
    this.setupGameCallbacks();

    this.gameMode = 'playing';
    this.autoPlay = false;

    console.log(`${homeTeam.name} vs ${awayTeam.name}`);
    console.log('Press SPACE to swing, P to pitch, A to auto-play');
  }

  /**
   * Handle pitch result
   */
  private handlePlayResult(result: PitchResult) {
    const message = this.getResultMessage(result);
    console.log(message);
  }

  /**
   * Get message for pitch result
   */
  private getResultMessage(result: PitchResult): string {
    if (result.type === 'hit' && result.hitType) {
      switch (result.hitType) {
        case 'homerun':
          return '💥 HOME RUN!!!';
        case 'triple':
          return '⚡ TRIPLE!';
        case 'double':
          return '✨ DOUBLE!';
        case 'single':
          return '✓ Single';
        case 'flyout':
          return '✗ Fly out';
        case 'groundout':
          return '✗ Ground out';
        case 'lineout':
          return '✗ Line out';
      }
    } else if (result.type === 'strike') {
      return '⚾ Strike!';
    } else if (result.type === 'ball') {
      return '○ Ball';
    } else if (result.type === 'foul') {
      return '⚠ Foul ball';
    }
    return '';
  }

  /**
   * Toggle auto-play mode
   */
  toggleAutoPlay() {
    this.autoPlay = !this.autoPlay;

    if (this.autoPlay) {
      console.log('🤖 Auto-play enabled');
      this.autoPlayTimer = setInterval(() => {
        if (this.gameMode === 'playing' && !this.gameState.gameOver) {
          // Auto swing with random timing
          const result = this.gameState.swingBat(0.3 + Math.random() * 0.4, 0.5 + Math.random() * 0.5);
          this.handlePlayResult(result);
        }
      }, 1500) as unknown as number;
    } else {
      console.log('🎮 Manual control');
      if (this.autoPlayTimer) {
        clearInterval(this.autoPlayTimer);
        this.autoPlayTimer = null;
      }
    }
  }

  /**
   * Start game loop
   */
  private start() {
    this.isRunning = true;
    this.gameLoop();
  }

  /**
   * Main game loop
   */
  private gameLoop() {
    if (!this.isRunning) return;

    // Update
    this.gameState.update();

    // Render
    this.render();

    // Next frame
    requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * Render the game
   */
  private render() {
    // Clear canvas
    this.ctx.fillStyle = '#2a5c2a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.gameMode === 'menu') {
      this.renderMenu();
    } else if (this.gameMode === 'playing') {
      this.renderField();
      this.renderPlayers();
      this.renderBall();
      this.renderHUD();
      this.renderScoreboard();
    } else if (this.gameMode === 'gameover') {
      this.renderGameOver();
    }
  }

  /**
   * Render menu screen
   */
  private renderMenu() {
    // Title
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 72px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BACKYARD BASEBALL', 512, 250);

    // Subtitle
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '32px Arial';
    this.ctx.fillText('Demo Edition', 512, 310);

    // Instructions
    this.ctx.fillStyle = '#FFEB3B';
    this.ctx.font = 'bold 36px Arial';
    this.ctx.fillText('Click or Press SPACE to Start!', 512, 450);

    // Controls
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '24px Arial';
    this.ctx.fillText('Controls:', 512, 550);
    this.ctx.font = '20px Arial';
    this.ctx.fillText('SPACE / Click - Swing Bat', 512, 590);
    this.ctx.fillText('P - Pitch (Auto-pitches)', 512, 620);
    this.ctx.fillText('A - Toggle Auto-Play', 512, 650);

    // Footer
    this.ctx.fillStyle = '#888';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('A Blaze Intelligence Production', 512, 730);
  }

  /**
   * Render baseball field
   */
  private renderField() {
    const ctx = this.ctx;

    // Grass
    ctx.fillStyle = '#2a5c2a';
    ctx.fillRect(0, 0, 1024, 768);

    // Infield dirt
    ctx.fillStyle = '#c19a6b';
    ctx.beginPath();
    ctx.ellipse(512, 550, 280, 200, 0, 0, Math.PI * 2);
    ctx.fill();

    // Foul lines
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(512, 550);
    ctx.lineTo(50, 150);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(512, 550);
    ctx.lineTo(974, 150);
    ctx.stroke();

    // Home plate
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(512, 580);
    ctx.lineTo(500, 570);
    ctx.lineTo(500, 560);
    ctx.lineTo(524, 560);
    ctx.lineTo(524, 570);
    ctx.closePath();
    ctx.fill();

    // Bases
    const bases = [
      { x: 620, y: 450 }, // 1st
      { x: 512, y: 350 }, // 2nd
      { x: 404, y: 450 }  // 3rd
    ];

    ctx.fillStyle = '#FFFFFF';
    bases.forEach((base, i) => {
      // Highlight if runner on base
      if (this.gameState.bases[i + 1]) {
        ctx.fillStyle = '#FFD700';
      } else {
        ctx.fillStyle = '#FFFFFF';
      }

      ctx.save();
      ctx.translate(base.x, base.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-8, -8, 16, 16);
      ctx.restore();
    });

    // Pitcher's mound
    ctx.fillStyle = '#d4a574';
    ctx.beginPath();
    ctx.arc(512, 480, 25, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Render players
   */
  private renderPlayers() {
    const ctx = this.ctx;

    this.gameState.players.forEach((player) => {
      // Player circle
      ctx.fillStyle = '#0066CC';
      ctx.beginPath();
      ctx.arc(player.x, player.y, 15, 0, Math.PI * 2);
      ctx.fill();

      // Outline
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Position label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(player.position, player.x, player.y - 20);
    });

    // Batter
    if (this.gameState.currentBatter) {
      ctx.fillStyle = '#FF4444';
      ctx.beginPath();
      ctx.arc(540, 560, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  /**
   * Render ball
   */
  private renderBall() {
    if (this.gameState.ball.active) {
      const ctx = this.ctx;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(this.gameState.ball.x, 600, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ball
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(this.gameState.ball.x, this.gameState.ball.y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Stitches
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.gameState.ball.x, this.gameState.ball.y, 4, 0, Math.PI);
      ctx.stroke();
    }
  }

  /**
   * Render HUD
   */
  private renderHUD() {
    const ctx = this.ctx;

    // Count display
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(20, 20, 200, 120);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('COUNT', 30, 45);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px Arial';
    ctx.fillText(`Balls: ${this.gameState.balls}`, 30, 75);
    ctx.fillText(`Strikes: ${this.gameState.strikes}`, 30, 100);
    ctx.fillText(`Outs: ${this.gameState.outs}`, 30, 125);

    // Current batter
    if (this.gameState.currentBatter) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(20, 160, 250, 80);

      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('AT BAT', 30, 185);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Arial';
      ctx.fillText(this.gameState.currentBatter.name, 30, 210);
      ctx.fillText(`"${this.gameState.currentBatter.nickname}"`, 30, 230);
    }

    // Instructions
    if (!this.autoPlay) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(804, 20, 200, 60);

      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'right';
      ctx.fillText('SPACE - Swing', 994, 45);
      ctx.fillText('A - Auto-play', 994, 70);
    } else {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.fillRect(804, 20, 200, 40);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'right';
      ctx.fillText('AUTO-PLAY ON', 994, 48);
    }
  }

  /**
   * Render scoreboard
   */
  private renderScoreboard() {
    const ctx = this.ctx;

    // Scoreboard background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(312, 20, 400, 80);

    // Header
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SCOREBOARD', 512, 45);

    // Team names and scores
    if (this.gameState.homeTeam && this.gameState.awayTeam) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px Arial';

      // Away team
      ctx.textAlign = 'left';
      ctx.fillText(this.gameState.awayTeam.shortName, 330, 75);
      ctx.textAlign = 'right';
      ctx.fillText(this.gameState.awayTeam.score.toString(), 450, 75);

      // Home team
      ctx.textAlign = 'left';
      ctx.fillText(this.gameState.homeTeam.shortName, 550, 75);
      ctx.textAlign = 'right';
      ctx.fillText(this.gameState.homeTeam.score.toString(), 680, 75);

      // Inning
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${this.gameState.inningHalf.toUpperCase()} ${this.gameState.inning}`,
        475,
        75
      );
    }
  }

  /**
   * Render game over screen
   */
  private renderGameOver() {
    // Draw final field state
    this.renderField();
    this.renderScoreboard();

    // Game over overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, 1024, 768);

    // Title
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 72px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER!', 512, 250);

    // Winner
    if (this.gameState.winner) {
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillText(`${this.gameState.winner.name} WIN!`, 512, 350);

      // Final score
      this.ctx.font = '36px Arial';
      this.ctx.fillText(
        `${this.gameState.awayTeam!.score} - ${this.gameState.homeTeam!.score}`,
        512,
        420
      );
    }

    // Play again
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 32px Arial';
    this.ctx.fillText('Click or Press SPACE to Play Again', 512, 550);
  }

  /**
   * Public API for controls
   */
  public swing() {
    if (this.gameMode === 'playing' && !this.gameState.gameOver) {
      const result = this.gameState.swingBat(0.5, 0.7);
      this.handlePlayResult(result);
    }
  }

  public getGameState() {
    return this.gameState.getGameSummary();
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    const game = new BackyardBaseballDemo();

    // Expose to window for debugging
    (window as any).game = game;

    // Add keyboard shortcut for auto-play
    window.addEventListener('keydown', (e) => {
      if (e.key === 'a' || e.key === 'A') {
        game.toggleAutoPlay();
      }
    });

    console.log('⚾ Backyard Baseball Demo Ready!');
    console.log('   window.game - Access game instance');
    console.log('   game.swing() - Manual swing');
    console.log('   game.toggleAutoPlay() - Toggle auto-play');
  } catch (error) {
    console.error('Failed to start game:', error);
  }
});

