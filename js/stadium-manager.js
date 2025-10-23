/**
 * Stadium Manager
 * Different fields with unique characteristics
 */

class StadiumManager {
    constructor() {
        this.stadiums = this.initializeStadiums();
        this.currentStadium = 'sunny_park';
    }

    initializeStadiums() {
        return {
            'sunny_park': {
                id: 'sunny_park',
                name: 'Sunny Park',
                description: 'Classic grass field with perfect conditions',
                characteristics: {
                    fenceDistance: 1.0,  // Multiplier for home run distance
                    ballSpeed: 1.0,      // Ball speed multiplier
                    windFactor: 0,       // Wind effect (-0.2 to 0.2)
                    groundSpeed: 1.0,    // Ground ball speed
                    visibility: 1.0      // Affects hitting
                },
                appearance: {
                    grassColor: 0x2d5016,
                    dirtColor: 0x8B4513,
                    skyColor: 0x87CEEB,
                    lighting: 'day',
                    obstacles: []
                },
                ambience: {
                    weather: 'sunny',
                    temperature: 'warm',
                    sounds: ['birds', 'crowd_light']
                }
            },

            'sandy_shores': {
                id: 'sandy_shores',
                name: 'Sandy Shores Beach',
                description: 'Beach setting with sand hazards and ocean breeze',
                characteristics: {
                    fenceDistance: 0.9,  // Shorter fences
                    ballSpeed: 0.95,     // Wind resistance
                    windFactor: 0.15,    // Strong offshore wind helps fly balls
                    groundSpeed: 0.8,    // Slow ground balls in sand
                    visibility: 0.95     // Sun in eyes
                },
                appearance: {
                    grassColor: 0xF4A460,  // Sandy color
                    dirtColor: 0xDEB887,
                    skyColor: 0x00CED1,
                    lighting: 'bright',
                    obstacles: ['palm_trees', 'beach_chairs']
                },
                ambience: {
                    weather: 'sunny',
                    temperature: 'hot',
                    sounds: ['waves', 'seagulls', 'crowd_beach']
                }
            },

            'urban_lot': {
                id: 'urban_lot',
                name: 'Urban Lot',
                description: 'City setting with building walls and street lights',
                characteristics: {
                    fenceDistance: 0.85,  // Short fences (buildings close)
                    ballSpeed: 1.0,
                    windFactor: -0.1,     // Wind tunnels between buildings
                    groundSpeed: 1.1,     // Fast concrete/asphalt
                    visibility: 0.9       // Shadow from buildings
                },
                appearance: {
                    grassColor: 0x4a6741,  // Patchy grass
                    dirtColor: 0x696969,   // Concrete
                    skyColor: 0x708090,    // Urban haze
                    lighting: 'day',
                    obstacles: ['buildings', 'fire_escape', 'dumpster']
                },
                ambience: {
                    weather: 'overcast',
                    temperature: 'warm',
                    sounds: ['traffic', 'horn', 'crowd_urban']
                }
            },

            'night_game': {
                id: 'night_game',
                name: 'Night Stadium',
                description: 'Evening game under the lights - harder visibility',
                characteristics: {
                    fenceDistance: 1.0,
                    ballSpeed: 1.0,
                    windFactor: 0.05,
                    groundSpeed: 1.0,
                    visibility: 0.85      // Harder to see in lights
                },
                appearance: {
                    grassColor: 0x1a3d0a,  // Darker grass
                    dirtColor: 0x654321,
                    skyColor: 0x191970,    // Night sky
                    lighting: 'night',
                    obstacles: ['light_posts']
                },
                ambience: {
                    weather: 'clear',
                    temperature: 'cool',
                    sounds: ['crickets', 'crowd_excited', 'stadium_announcer']
                }
            },

            'winter_field': {
                id: 'winter_field',
                name: 'Winter Wonderland',
                description: 'Snow-covered field with unique ball physics',
                characteristics: {
                    fenceDistance: 1.1,   // Cold air = less carry
                    ballSpeed: 0.9,       // Ball moves slower in cold
                    windFactor: -0.15,    // Cold wind pushes balls down
                    groundSpeed: 0.7,     // Snow slows ground balls
                    visibility: 1.0       // Clear winter day
                },
                appearance: {
                    grassColor: 0xFFFAFA,  // Snow white
                    dirtColor: 0xE0E0E0,   // Light snow
                    skyColor: 0xB0C4DE,    // Winter sky
                    lighting: 'day',
                    obstacles: ['snowmen', 'snow_piles']
                },
                ambience: {
                    weather: 'snow',
                    temperature: 'cold',
                    sounds: ['wind_cold', 'snow_crunch', 'crowd_bundled']
                }
            },

            'dusty_diamond': {
                id: 'dusty_diamond',
                name: 'Dusty Diamond',
                description: 'Desert field with dust storms and hard ground',
                characteristics: {
                    fenceDistance: 1.05,
                    ballSpeed: 1.05,      // Thin air = faster balls
                    windFactor: 0.1,      // Dust devils
                    groundSpeed: 1.2,     // Hard packed dirt
                    visibility: 0.8       // Dust in air
                },
                appearance: {
                    grassColor: 0xD2B48C,  // Tan dirt
                    dirtColor: 0xA0826D,
                    skyColor: 0xFFDAB9,    // Dusty sky
                    lighting: 'day',
                    obstacles: ['cacti', 'tumbleweeds', 'rock_formations']
                },
                ambience: {
                    weather: 'dusty',
                    temperature: 'hot',
                    sounds: ['wind_desert', 'crowd_sparse']
                }
            }
        };
    }

    getStadium(stadiumId) {
        return this.stadiums[stadiumId] || this.stadiums['sunny_park'];
    }

    setCurrentStadium(stadiumId) {
        if (this.stadiums[stadiumId]) {
            this.currentStadium = stadiumId;
            return true;
        }
        return false;
    }

    getCurrentStadium() {
        return this.getStadium(this.currentStadium);
    }

    getAllStadiums() {
        return Object.values(this.stadiums);
    }

    /**
     * Apply stadium effects to game physics
     */
    applyStadiumEffects(baseValue, effectType) {
        const stadium = this.getCurrentStadium();
        const chars = stadium.characteristics;

        switch (effectType) {
            case 'homeRunDistance':
                return baseValue * chars.fenceDistance;

            case 'ballSpeed':
                return baseValue * chars.ballSpeed;

            case 'windEffect':
                return baseValue + chars.windFactor;

            case 'groundBallSpeed':
                return baseValue * chars.groundSpeed;

            case 'hitProbability':
                return baseValue * chars.visibility;

            default:
                return baseValue;
        }
    }

    /**
     * Get random stadium for variety
     */
    getRandomStadium() {
        const stadiumIds = Object.keys(this.stadiums);
        const randomId = stadiumIds[Math.floor(Math.random() * stadiumIds.length)];
        return this.getStadium(randomId);
    }

    /**
     * Get stadium display info for UI
     */
    getStadiumDisplayInfo(stadiumId) {
        const stadium = this.getStadium(stadiumId);
        return {
            name: stadium.name,
            description: stadium.description,
            weather: stadium.ambience.weather,
            difficulty: this.calculateDifficulty(stadium),
            pros: this.getStadiumPros(stadium),
            cons: this.getStadiumCons(stadium)
        };
    }

    calculateDifficulty(stadium) {
        const chars = stadium.characteristics;
        let difficulty = 0;

        // Factors that make hitting harder
        difficulty += (1 - chars.visibility) * 30;
        difficulty += Math.abs(chars.windFactor) * 20;
        difficulty += (chars.fenceDistance - 1) * 15;

        if (difficulty < 15) return 'Easy';
        if (difficulty < 30) return 'Medium';
        return 'Hard';
    }

    getStadiumPros(stadium) {
        const pros = [];
        const chars = stadium.characteristics;

        if (chars.fenceDistance < 1) pros.push('Short fences - easier home runs');
        if (chars.windFactor > 0.1) pros.push('Wind helps fly balls');
        if (chars.groundSpeed > 1.1) pros.push('Fast ground balls');
        if (chars.visibility === 1.0) pros.push('Perfect visibility');

        return pros.length > 0 ? pros : ['Balanced field'];
    }

    getStadiumCons(stadium) {
        const cons = [];
        const chars = stadium.characteristics;

        if (chars.fenceDistance > 1) cons.push('Deep fences - harder home runs');
        if (chars.windFactor < -0.1) cons.push('Wind pushes balls down');
        if (chars.visibility < 0.9) cons.push('Reduced visibility');
        if (chars.groundSpeed < 0.9) cons.push('Slow ground balls');

        return cons.length > 0 ? cons : ['No major disadvantages'];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StadiumManager;
}
