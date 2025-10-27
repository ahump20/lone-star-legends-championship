/**
 * Stadium Customization System
 * Manages unique stadiums with special characteristics and allows custom stadium creation
 */

class StadiumCustomizationSystem {
    constructor() {
        this.customStadiums = [];
        this.storageKey = 'sandlot_custom_stadiums';

        // Extended stadium library with unique venues
        this.stadiums = {
            // Original stadiums
            sunny_park: {
                id: 'sunny_park',
                name: 'Sunny Park',
                description: 'Classic grass field with perfect conditions',
                emoji: '🌞',
                difficulty: 'Medium',
                characteristics: {
                    fenceDistance: 1.0,
                    ballSpeed: 1.0,
                    windFactor: 0,
                    groundSpeed: 1.0,
                    visibility: 1.0
                },
                appearance: {
                    skyColor: 0x87CEEB,
                    grassColor: 0x2D5016,
                    dirtColor: 0x8B7355,
                    wallColor: 0x1a4d2e,
                    lighting: 'day'
                },
                specialFeatures: [],
                unlocked: true
            },

            sandy_shores: {
                id: 'sandy_shores',
                name: 'Sandy Shores Beach',
                description: 'Beach setting with wind and slow ground balls',
                emoji: '🏖️',
                difficulty: 'Medium',
                characteristics: {
                    fenceDistance: 0.9,
                    ballSpeed: 1.0,
                    windFactor: 0.15,
                    groundSpeed: 0.8,
                    visibility: 0.95
                },
                appearance: {
                    skyColor: 0x00CED1,
                    grassColor: 0xF4A460,
                    dirtColor: 0xEDC9AF,
                    wallColor: 0x4682B4,
                    lighting: 'bright'
                },
                specialFeatures: ['windGusts', 'sandTraps'],
                unlocked: true
            },

            // NEW UNIQUE STADIUMS

            volcano_valley: {
                id: 'volcano_valley',
                name: 'Volcano Valley',
                description: 'Play at the edge of an active volcano! Rising heat affects fly balls',
                emoji: '🌋',
                difficulty: 'Hard',
                characteristics: {
                    fenceDistance: 1.2,
                    ballSpeed: 1.15,
                    windFactor: 0.25,
                    groundSpeed: 1.2,
                    visibility: 0.85,
                    thermalUplift: 0.3 // Fly balls go higher
                },
                appearance: {
                    skyColor: 0xFF4500,
                    grassColor: 0x2F1B0C,
                    dirtColor: 0x1A0A00,
                    wallColor: 0x8B0000,
                    lighting: 'volcanic',
                    particles: 'lava'
                },
                specialFeatures: ['thermalUplift', 'lavaPits', 'earthquakes'],
                hazards: ['Random eruptions shake the field'],
                unlocked: false,
                unlockCondition: 'Win 10 games'
            },

            ice_palace: {
                id: 'ice_palace',
                name: 'Ice Palace Arena',
                description: 'Frozen wonderland where balls slide on ice patches',
                emoji: '❄️',
                difficulty: 'Hard',
                characteristics: {
                    fenceDistance: 1.1,
                    ballSpeed: 0.85,
                    windFactor: -0.15,
                    groundSpeed: 1.5, // Very fast on ice
                    visibility: 1.0,
                    slipperiness: 0.8
                },
                appearance: {
                    skyColor: 0xB0E0E6,
                    grassColor: 0xE0FFFF,
                    dirtColor: 0xADD8E6,
                    wallColor: 0x4682B4,
                    lighting: 'ice',
                    particles: 'snow'
                },
                specialFeatures: ['icyPatches', 'slipSliding', 'blizzards'],
                hazards: ['Players may slip on ice'],
                unlocked: false,
                unlockCondition: 'Hit 5 home runs'
            },

            neon_city: {
                id: 'neon_city',
                name: 'Neon City Rooftop',
                description: 'High-rise rooftop stadium with cyberpunk aesthetics',
                emoji: '🌃',
                difficulty: 'Very Hard',
                characteristics: {
                    fenceDistance: 0.75, // Short fences
                    ballSpeed: 1.1,
                    windFactor: 0.3, // High altitude wind
                    groundSpeed: 1.1,
                    visibility: 0.7, // Bright neon lights
                    altitude: 50 // High elevation
                },
                appearance: {
                    skyColor: 0x191970,
                    grassColor: 0x32CD32,
                    dirtColor: 0x696969,
                    wallColor: 0xFF00FF,
                    lighting: 'neon',
                    particles: 'neon'
                },
                specialFeatures: ['neonLights', 'heightAdvantage', 'urbanNoise'],
                hazards: ['Balls may fly off building'],
                unlocked: false,
                unlockCondition: 'Complete a season'
            },

            jungle_diamond: {
                id: 'jungle_diamond',
                name: 'Jungle Diamond',
                description: 'Hidden field in dense rainforest with vines and wildlife',
                emoji: '🌴',
                difficulty: 'Hard',
                characteristics: {
                    fenceDistance: 0.95,
                    ballSpeed: 0.9,
                    windFactor: 0.1,
                    groundSpeed: 0.85,
                    visibility: 0.75,
                    humidity: 0.9
                },
                appearance: {
                    skyColor: 0x228B22,
                    grassColor: 0x006400,
                    dirtColor: 0x654321,
                    wallColor: 0x8B4513,
                    lighting: 'jungle',
                    particles: 'leaves'
                },
                specialFeatures: ['hangingVines', 'wildlifeCalls', 'suddenRain'],
                hazards: ['Balls may get stuck in vines'],
                unlocked: false,
                unlockCondition: 'Steal 10 bases total'
            },

            moon_base: {
                id: 'moon_base',
                name: 'Lunar Base Alpha',
                description: 'Low gravity moon base - balls fly incredibly far!',
                emoji: '🌙',
                difficulty: 'Extreme',
                characteristics: {
                    fenceDistance: 2.0, // Very deep fences needed
                    ballSpeed: 0.5,
                    windFactor: 0, // No atmosphere
                    groundSpeed: 0.6,
                    visibility: 1.0,
                    gravity: 0.16 // 1/6 Earth gravity
                },
                appearance: {
                    skyColor: 0x000000,
                    grassColor: 0x808080,
                    dirtColor: 0x696969,
                    wallColor: 0xC0C0C0,
                    lighting: 'space',
                    particles: 'stars'
                },
                specialFeatures: ['lowGravity', 'floatyBalls', 'spaceSuits'],
                hazards: ['Everything floats!'],
                unlocked: false,
                unlockCondition: 'Hit a 500ft home run'
            },

            underwater_dome: {
                id: 'underwater_dome',
                name: 'Aquatic Dome Stadium',
                description: 'Glass dome under the ocean with aquatic pressure effects',
                emoji: '🌊',
                difficulty: 'Hard',
                characteristics: {
                    fenceDistance: 1.05,
                    ballSpeed: 0.7,
                    windFactor: 0,
                    groundSpeed: 0.7,
                    visibility: 0.8,
                    waterResistance: 0.3
                },
                appearance: {
                    skyColor: 0x000080,
                    grassColor: 0x20B2AA,
                    dirtColor: 0x5F9EA0,
                    wallColor: 0x4682B4,
                    lighting: 'underwater',
                    particles: 'bubbles'
                },
                specialFeatures: ['waterCurrents', 'fishSwimBy', 'wavePatterns'],
                hazards: ['Pressure affects ball movement'],
                unlocked: false,
                unlockCondition: 'Win underwater-themed challenge'
            },

            ancient_colosseum: {
                id: 'ancient_colosseum',
                name: 'Ancient Colosseum',
                description: 'Historic Roman arena converted for baseball',
                emoji: '🏛️',
                difficulty: 'Medium',
                characteristics: {
                    fenceDistance: 0.85,
                    ballSpeed: 1.0,
                    windFactor: 0.05,
                    groundSpeed: 1.0,
                    visibility: 0.9,
                    echo: 0.8
                },
                appearance: {
                    skyColor: 0xFFD700,
                    grassColor: 0x8B7D6B,
                    dirtColor: 0xD2691E,
                    wallColor: 0xF0E68C,
                    lighting: 'ancient',
                    particles: 'dust'
                },
                specialFeatures: ['acousticBoost', 'crowdEcho', 'historicAura'],
                hazards: ['Crowd roar can distract'],
                unlocked: false,
                unlockCondition: 'Play 25 games'
            },

            candy_land: {
                id: 'candy_land',
                name: 'Candy Land Park',
                description: 'Whimsical candy-themed field - fun for all ages!',
                emoji: '🍭',
                difficulty: 'Easy',
                characteristics: {
                    fenceDistance: 0.8,
                    ballSpeed: 1.1,
                    windFactor: 0,
                    groundSpeed: 1.2,
                    visibility: 1.0,
                    sweetness: 1.0
                },
                appearance: {
                    skyColor: 0xFFB6C1,
                    grassColor: 0x90EE90,
                    dirtColor: 0xDDA0DD,
                    wallColor: 0xFF69B4,
                    lighting: 'rainbow',
                    particles: 'candy'
                },
                specialFeatures: ['candyBounce', 'gummyBases', 'sugarRush'],
                hazards: ['Too much fun!'],
                unlocked: false,
                unlockCondition: 'Create a custom character'
            },

            desert_oasis: {
                id: 'desert_oasis',
                name: 'Desert Oasis',
                description: 'Scorching desert heat with mirages and sandstorms',
                emoji: '🏜️',
                difficulty: 'Hard',
                characteristics: {
                    fenceDistance: 1.15,
                    ballSpeed: 1.05,
                    windFactor: 0.2,
                    groundSpeed: 1.3,
                    visibility: 0.6,
                    heat: 0.9
                },
                appearance: {
                    skyColor: 0xFFD700,
                    grassColor: 0xF4A460,
                    dirtColor: 0xDEB887,
                    wallColor: 0xD2691E,
                    lighting: 'desert',
                    particles: 'sand'
                },
                specialFeatures: ['sandstorms', 'mirages', 'heatWaves'],
                hazards: ['Limited visibility in storms'],
                unlocked: false,
                unlockCondition: 'Win 5 consecutive games'
            },

            haunted_mansion: {
                id: 'haunted_mansion',
                name: 'Haunted Mansion Grounds',
                description: 'Spooky gothic stadium with ghostly interference',
                emoji: '🏚️',
                difficulty: 'Very Hard',
                characteristics: {
                    fenceDistance: 1.0,
                    ballSpeed: 0.95,
                    windFactor: 0.15,
                    groundSpeed: 0.9,
                    visibility: 0.5,
                    spookiness: 1.0
                },
                appearance: {
                    skyColor: 0x2F4F4F,
                    grassColor: 0x1C1C1C,
                    dirtColor: 0x3C3C3C,
                    wallColor: 0x696969,
                    lighting: 'haunted',
                    particles: 'fog'
                },
                specialFeatures: ['ghostlyPlayers', 'cursedBalls', 'fogBanks'],
                hazards: ['Ghosts may move the ball'],
                unlocked: false,
                unlockCondition: 'Play on Halloween'
            },

            space_station: {
                id: 'space_station',
                name: 'Orbital Space Station',
                description: 'Rotating space station with artificial gravity zones',
                emoji: '🛸',
                difficulty: 'Extreme',
                characteristics: {
                    fenceDistance: 1.5,
                    ballSpeed: 0.8,
                    windFactor: 0,
                    groundSpeed: 0.9,
                    visibility: 1.0,
                    rotation: 0.5
                },
                appearance: {
                    skyColor: 0x000033,
                    grassColor: 0x4169E1,
                    dirtColor: 0x708090,
                    wallColor: 0xC0C0C0,
                    lighting: 'space',
                    particles: 'stars'
                },
                specialFeatures: ['rotatingField', 'gravityZones', 'earthView'],
                hazards: ['Gravity shifts unexpectedly'],
                unlocked: false,
                unlockCondition: 'Hit 100 home runs total'
            },

            cherry_blossom: {
                id: 'cherry_blossom',
                name: 'Cherry Blossom Gardens',
                description: 'Serene Japanese garden with falling petals',
                emoji: '🌸',
                difficulty: 'Easy',
                characteristics: {
                    fenceDistance: 1.0,
                    ballSpeed: 1.0,
                    windFactor: 0.08,
                    groundSpeed: 1.0,
                    visibility: 0.95,
                    tranquility: 1.0
                },
                appearance: {
                    skyColor: 0xFFB7C5,
                    grassColor: 0x90EE90,
                    dirtColor: 0xD2B48C,
                    wallColor: 0x8B4513,
                    lighting: 'zen',
                    particles: 'petals'
                },
                specialFeatures: ['fallingPetals', 'peacefulAura', 'koi Pond'],
                hazards: ['Too beautiful to focus'],
                unlocked: false,
                unlockCondition: 'Achieve inner peace (meditation mode)'
            }
        };

        this.loadCustomStadiums();
    }

    /**
     * Create custom stadium
     */
    createStadium(stadiumData) {
        const stadium = {
            id: `custom_stadium_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            isCustom: true,
            createdAt: Date.now(),

            name: stadiumData.name || 'Custom Stadium',
            description: stadiumData.description || 'A player-created stadium',
            emoji: stadiumData.emoji || '⚾',
            difficulty: this.calculateDifficulty(stadiumData.characteristics),

            characteristics: {
                fenceDistance: stadiumData.fenceDistance || 1.0,
                ballSpeed: stadiumData.ballSpeed || 1.0,
                windFactor: stadiumData.windFactor || 0,
                groundSpeed: stadiumData.groundSpeed || 1.0,
                visibility: stadiumData.visibility || 1.0,
                ...stadiumData.customCharacteristics
            },

            appearance: {
                skyColor: stadiumData.skyColor || 0x87CEEB,
                grassColor: stadiumData.grassColor || 0x2D5016,
                dirtColor: stadiumData.dirtColor || 0x8B7355,
                wallColor: stadiumData.wallColor || 0x1a4d2e,
                lighting: stadiumData.lighting || 'day',
                particles: stadiumData.particles || 'none'
            },

            specialFeatures: stadiumData.specialFeatures || [],
            hazards: stadiumData.hazards || [],
            unlocked: true
        };

        this.customStadiums.push(stadium);
        this.saveCustomStadiums();

        console.log(`✅ Created custom stadium: ${stadium.name}`);
        return stadium;
    }

    /**
     * Calculate difficulty based on characteristics
     */
    calculateDifficulty(characteristics) {
        const avgDeviation = (
            Math.abs(characteristics.fenceDistance - 1.0) +
            Math.abs(characteristics.ballSpeed - 1.0) +
            Math.abs(characteristics.windFactor) +
            Math.abs(characteristics.groundSpeed - 1.0) +
            Math.abs(characteristics.visibility - 1.0)
        ) / 5;

        if (avgDeviation < 0.1) return 'Easy';
        if (avgDeviation < 0.2) return 'Medium';
        if (avgDeviation < 0.4) return 'Hard';
        if (avgDeviation < 0.6) return 'Very Hard';
        return 'Extreme';
    }

    /**
     * Get all stadiums (built-in + custom)
     */
    getAllStadiums() {
        return {
            ...this.stadiums,
            ...this.customStadiums.reduce((acc, stadium) => {
                acc[stadium.id] = stadium;
                return acc;
            }, {})
        };
    }

    /**
     * Get stadium by ID
     */
    getStadium(stadiumId) {
        return this.stadiums[stadiumId] || this.customStadiums.find(s => s.id === stadiumId);
    }

    /**
     * Check if stadium is unlocked
     */
    isUnlocked(stadiumId) {
        const stadium = this.getStadium(stadiumId);
        if (!stadium) return false;
        if (stadium.isCustom) return true;
        return stadium.unlocked;
    }

    /**
     * Unlock stadium
     */
    unlockStadium(stadiumId) {
        const stadium = this.stadiums[stadiumId];
        if (stadium) {
            stadium.unlocked = true;
            console.log(`🔓 Unlocked stadium: ${stadium.name}`);

            // Save to game progress
            if (window.saveSystem) {
                window.saveSystem.unlockContent('stadiums', stadiumId);
            }

            return true;
        }
        return false;
    }

    /**
     * Get unlocked stadiums
     */
    getUnlockedStadiums() {
        const allStadiums = this.getAllStadiums();
        return Object.values(allStadiums).filter(s => this.isUnlocked(s.id));
    }

    /**
     * Apply home field advantage
     */
    applyHomeFieldAdvantage(character, stadiumId) {
        if (!character.homeStadium || character.homeStadium !== stadiumId) {
            return { ...character.stats };
        }

        // Boost all stats by 1 when playing at home stadium
        const boostedStats = { ...character.stats };
        Object.keys(boostedStats).forEach(stat => {
            boostedStats[stat] = Math.min(10, boostedStats[stat] + 1);
        });

        console.log(`🏠 Home field advantage for ${character.name} at ${stadiumId}`);
        return boostedStats;
    }

    /**
     * Get character-stadium synergy bonuses
     */
    getCharacterStadiumSynergy(character, stadiumId) {
        const stadium = this.getStadium(stadiumId);
        if (!stadium) return {};

        const synergies = {};

        // Speed characters excel in ice/slippery stadiums
        if (character.stats.speed >= 8 && stadium.id === 'ice_palace') {
            synergies.speedBonus = 2;
            synergies.description = '⚡ Speed demon on ice!';
        }

        // Power hitters love low gravity
        if (character.stats.power >= 8 && (stadium.id === 'moon_base' || stadium.id === 'space_station')) {
            synergies.powerBonus = 2;
            synergies.description = '💪 Power surge in low gravity!';
        }

        // Pitchers excel in underwater dome (resistance helps)
        if (character.stats.pitching >= 8 && stadium.id === 'underwater_dome') {
            synergies.pitchingBonus = 1;
            synergies.description = '🌊 Master of water resistance!';
        }

        // Fielders shine in jungle (quick reflexes)
        if (character.stats.fielding >= 8 && stadium.id === 'jungle_diamond') {
            synergies.fieldingBonus = 2;
            synergies.description = '🌴 Jungle cat reflexes!';
        }

        // Contact hitters do well in candy land (easy visibility)
        if (character.stats.batting >= 8 && stadium.id === 'candy_land') {
            synergies.battingBonus = 1;
            synergies.description = '🍭 Sweet spot master!';
        }

        return synergies;
    }

    /**
     * Save custom stadiums
     */
    saveCustomStadiums() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.customStadiums));
            console.log(`💾 Saved ${this.customStadiums.length} custom stadiums`);
            return true;
        } catch (error) {
            console.error('Failed to save custom stadiums:', error);
            return false;
        }
    }

    /**
     * Load custom stadiums
     */
    loadCustomStadiums() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                this.customStadiums = JSON.parse(saved);
                console.log(`📥 Loaded ${this.customStadiums.length} custom stadiums`);
            }
        } catch (error) {
            console.error('Failed to load custom stadiums:', error);
            this.customStadiums = [];
        }
    }

    /**
     * Delete custom stadium
     */
    deleteStadium(stadiumId) {
        const index = this.customStadiums.findIndex(s => s.id === stadiumId);
        if (index === -1) return false;

        this.customStadiums.splice(index, 1);
        this.saveCustomStadiums();
        return true;
    }

    /**
     * Get stadium weather effects
     */
    getWeatherEffects(stadiumId) {
        const stadium = this.getStadium(stadiumId);
        if (!stadium || !stadium.specialFeatures) return [];

        const weatherMap = {
            'windGusts': { name: 'Wind Gusts', effect: 'Ball curves unpredictably', icon: '💨' },
            'sandstorms': { name: 'Sandstorms', effect: 'Reduced visibility', icon: '🌪️' },
            'suddenRain': { name: 'Rain Showers', effect: 'Slippery ball', icon: '🌧️' },
            'blizzards': { name: 'Blizzards', effect: 'Freezing cold', icon: '🌨️' },
            'heatWaves': { name: 'Heat Waves', effect: 'Player fatigue', icon: '🌡️' },
            'earthquakes': { name: 'Tremors', effect: 'Field shakes', icon: '🌋' }
        };

        return stadium.specialFeatures
            .map(feature => weatherMap[feature])
            .filter(Boolean);
    }

    /**
     * Generate random stadium
     */
    generateRandomStadium() {
        const themes = ['Space', 'Ocean', 'Mountain', 'City', 'Forest', 'Desert', 'Arctic', 'Tropical'];
        const adjectives = ['Mega', 'Super', 'Ultimate', 'Extreme', 'Epic', 'Legendary', 'Mystic', 'Cosmic'];

        const theme = themes[Math.floor(Math.random() * themes.length)];
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];

        return this.createStadium({
            name: `${adjective} ${theme} Arena`,
            description: `A randomly generated ${theme.toLowerCase()}-themed stadium`,
            emoji: ['🏟️', '⚾', '🎪', '🎯'][Math.floor(Math.random() * 4)],
            fenceDistance: 0.7 + Math.random() * 0.6,
            ballSpeed: 0.8 + Math.random() * 0.4,
            windFactor: -0.2 + Math.random() * 0.4,
            groundSpeed: 0.7 + Math.random() * 0.6,
            visibility: 0.6 + Math.random() * 0.4,
            skyColor: Math.floor(Math.random() * 0xFFFFFF),
            grassColor: Math.floor(Math.random() * 0xFFFFFF),
            lighting: ['day', 'night', 'neon', 'space'][Math.floor(Math.random() * 4)]
        });
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StadiumCustomizationSystem;
}
