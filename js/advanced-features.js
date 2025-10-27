/**
 * Advanced Features Bundle
 * Includes: Weather Simulator, Leveling System, Stat Tracking, Leaderboards, and Sharing
 */

// ============================================
// 1. STADIUM WEATHER SIMULATOR
// ============================================

class StadiumWeatherSimulator {
    constructor() {
        this.currentWeather = null;
        this.weatherEffects = [];
        this.weatherPatterns = {
            clear: {
                name: 'Clear Skies',
                icon: '☀️',
                effects: { visibility: 1.0, windFactor: 0, ballSpeed: 1.0 },
                probability: 0.4
            },
            cloudy: {
                name: 'Cloudy',
                icon: '☁️',
                effects: { visibility: 0.9, windFactor: 0.05, ballSpeed: 0.98 },
                probability: 0.2
            },
            windy: {
                name: 'Windy',
                icon: '💨',
                effects: { visibility: 0.95, windFactor: 0.25, ballSpeed: 1.05 },
                probability: 0.15
            },
            rainy: {
                name: 'Light Rain',
                icon: '🌧️',
                effects: { visibility: 0.7, windFactor: 0.1, ballSpeed: 0.85, slippery: true },
                probability: 0.1
            },
            stormy: {
                name: 'Thunderstorm',
                icon: '⛈️',
                effects: { visibility: 0.5, windFactor: 0.35, ballSpeed: 0.75, slippery: true, dangerous: true },
                probability: 0.05
            },
            foggy: {
                name: 'Fog',
                icon: '🌫️',
                effects: { visibility: 0.4, windFactor: 0, ballSpeed: 0.95 },
                probability: 0.05
            },
            snowy: {
                name: 'Snow',
                icon: '🌨️',
                effects: { visibility: 0.6, windFactor: -0.1, ballSpeed: 0.8, slippery: true },
                probability: 0.03
            },
            heatwave: {
                name: 'Extreme Heat',
                icon: '🔥',
                effects: { visibility: 0.85, windFactor: 0.15, ballSpeed: 1.1, fatigue: 1.3 },
                probability: 0.02
            }
        };
    }

    /**
     * Generate random weather based on stadium and season
     */
    generateWeather(stadiumId, season = 'summer') {
        // Stadium-specific weather tendencies
        const stadiumModifiers = {
            'desert_oasis': { heat: 2.0, rain: 0.1 },
            'ice_palace': { snow: 3.0, heat: 0 },
            'sandy_shores': { wind: 2.0, fog: 1.5 },
            'underwater_dome': { clear: 1.0 }, // Controlled environment
            'volcano_valley': { heat: 3.0, clear: 0.5 }
        };

        const modifier = stadiumModifiers[stadiumId] || {};

        // Adjust probabilities
        const adjustedPatterns = { ...this.weatherPatterns };
        Object.keys(adjustedPatterns).forEach(key => {
            const mod = modifier[key] || 1.0;
            adjustedPatterns[key].probability *= mod;
        });

        // Select weather
        const totalProb = Object.values(adjustedPatterns).reduce((sum, w) => sum + w.probability, 0);
        let random = Math.random() * totalProb;

        for (const [key, weather] of Object.entries(adjustedPatterns)) {
            random -= weather.probability;
            if (random <= 0) {
                this.currentWeather = { id: key, ...weather };
                break;
            }
        }

        return this.currentWeather;
    }

    /**
     * Get current weather effects
     */
    getEffects() {
        return this.currentWeather ? this.currentWeather.effects : {};
    }

    /**
     * Dynamic weather changes during game
     */
    updateWeather(inning) {
        // 10% chance of weather change each inning
        if (Math.random() < 0.1) {
            const oldWeather = this.currentWeather;
            this.generateWeather(window.currentStadiumId || 'sunny_park');

            return {
                changed: true,
                from: oldWeather,
                to: this.currentWeather
            };
        }
        return { changed: false };
    }

    /**
     * Apply weather effects to ball
     */
    applyWeatherToBall(ballVelocity) {
        const effects = this.getEffects();
        const modified = { ...ballVelocity };

        // Wind effect
        if (effects.windFactor) {
            modified.x += (Math.random() - 0.5) * effects.windFactor;
            modified.z += effects.windFactor * 0.5;
        }

        // Speed modifier
        if (effects.ballSpeed) {
            modified.x *= effects.ballSpeed;
            modified.y *= effects.ballSpeed;
            modified.z *= effects.ballSpeed;
        }

        return modified;
    }

    /**
     * Get weather display info
     */
    getWeatherDisplay() {
        if (!this.currentWeather) return null;

        return {
            icon: this.currentWeather.icon,
            name: this.currentWeather.name,
            effects: Object.entries(this.currentWeather.effects)
                .map(([key, value]) => {
                    if (typeof value === 'boolean') return value ? key : null;
                    if (typeof value === 'number' && value !== 1.0) {
                        const percent = Math.round((value - 1.0) * 100);
                        return `${key}: ${percent > 0 ? '+' : ''}${percent}%`;
                    }
                    return null;
                })
                .filter(Boolean)
        };
    }
}

// ============================================
// 2. CHARACTER LEVELING SYSTEM
// ============================================

class CharacterLevelingSystem {
    constructor() {
        this.storageKey = 'sandlot_character_levels';
        this.characterData = this.loadData();
    }

    loadData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            return {};
        }
    }

    saveData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.characterData));
        } catch (error) {
            console.error('Failed to save character leveling data:', error);
        }
    }

    /**
     * Initialize character in leveling system
     */
    initializeCharacter(characterId) {
        if (!this.characterData[characterId]) {
            this.characterData[characterId] = {
                level: 1,
                xp: 0,
                xpToNextLevel: 100,
                totalGames: 0,
                statBoosts: {
                    batting: 0,
                    power: 0,
                    speed: 0,
                    pitching: 0,
                    fielding: 0
                },
                achievements: [],
                specialUnlocks: []
            };
            this.saveData();
        }
        return this.characterData[characterId];
    }

    /**
     * Add XP to character
     */
    addXP(characterId, xp, reason = '') {
        const char = this.initializeCharacter(characterId);
        char.xp += xp;

        const leveledUp = [];

        // Check for level ups
        while (char.xp >= char.xpToNextLevel) {
            char.xp -= char.xpToNextLevel;
            char.level++;
            char.xpToNextLevel = Math.floor(char.xpToNextLevel * 1.5);

            // Stat boost on level up
            const statBoost = this.getStatBoostForLevel(char.level);
            leveledUp.push({
                level: char.level,
                statBoost
            });

            // Apply stat boost
            Object.keys(statBoost).forEach(stat => {
                char.statBoosts[stat] += statBoost[stat];
            });
        }

        this.saveData();

        return {
            currentLevel: char.level,
            currentXP: char.xp,
            xpToNext: char.xpToNextLevel,
            leveledUp
        };
    }

    /**
     * Get stat boost for level
     */
    getStatBoostForLevel(level) {
        const boosts = {};

        // Every level: random stat +1
        const stats = ['batting', 'power', 'speed', 'pitching', 'fielding'];
        const randomStat = stats[Math.floor(Math.random() * stats.length)];
        boosts[randomStat] = 1;

        // Every 5 levels: all stats +1
        if (level % 5 === 0) {
            stats.forEach(stat => {
                boosts[stat] = (boosts[stat] || 0) + 1;
            });
        }

        // Every 10 levels: choose 2 stats for +2
        if (level % 10 === 0) {
            const stat1 = stats[Math.floor(Math.random() * stats.length)];
            let stat2 = stat1;
            while (stat2 === stat1) {
                stat2 = stats[Math.floor(Math.random() * stats.length)];
            }
            boosts[stat1] = (boosts[stat1] || 0) + 2;
            boosts[stat2] = (boosts[stat2] || 0) + 2;
        }

        return boosts;
    }

    /**
     * Get character level data
     */
    getCharacterData(characterId) {
        return this.characterData[characterId] || this.initializeCharacter(characterId);
    }

    /**
     * Award XP for game actions
     */
    awardXPForAction(characterId, action, value = 1) {
        const xpRewards = {
            hit: 10,
            homerun: 50,
            double: 20,
            triple: 35,
            rbi: 15,
            stolenBase: 25,
            strikeout: 30,
            catch: 15,
            assist: 20,
            win: 100,
            loss: 25,
            perfectGame: 500,
            noHitter: 300
        };

        const xp = (xpRewards[action] || 5) * value;
        return this.addXP(characterId, xp, action);
    }

    /**
     * Get boosted stats for character
     */
    getBoostedStats(characterId, baseStats) {
        const charData = this.getCharacterData(characterId);
        const boosted = { ...baseStats };

        Object.keys(charData.statBoosts).forEach(stat => {
            if (boosted[stat]) {
                boosted[stat] = Math.min(10, boosted[stat] + charData.statBoosts[stat]);
            }
        });

        return boosted;
    }
}

// ============================================
// 3. ONLINE CHARACTER SHARING SYSTEM
// ============================================

class OnlineCharacterSharing {
    constructor() {
        this.shareEndpoint = '/api/share'; // Would need backend
        this.localShares = [];
    }

    /**
     * Generate shareable code for character
     */
    generateShareCode(character) {
        // Encode character data to base64
        const jsonStr = JSON.stringify({
            v: 1, // Version
            c: character,
            t: Date.now()
        });

        const encoded = btoa(encodeURIComponent(jsonStr));
        const shareCode = this.generateShortCode(encoded);

        // Store locally
        this.localShares.push({
            code: shareCode,
            character: character,
            created: Date.now()
        });

        return shareCode;
    }

    /**
     * Generate short code (8 characters)
     */
    generateShortCode(data) {
        const hash = this.simpleHash(data);
        return hash.substring(0, 8).toUpperCase();
    }

    /**
     * Simple hash function
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Import character from share code
     */
    importFromShareCode(shareCode) {
        // Check local shares first
        const localShare = this.localShares.find(s => s.code === shareCode);
        if (localShare) {
            return localShare.character;
        }

        // Would query backend here
        return null;
    }

    /**
     * Generate shareable URL
     */
    generateShareableURL(character) {
        const code = this.generateShareCode(character);
        const baseURL = window.location.origin;
        return `${baseURL}/games/baseball/import.html?code=${code}`;
    }

    /**
     * Copy share link to clipboard
     */
    async copyShareLink(character) {
        const url = this.generateShareableURL(character);

        try {
            await navigator.clipboard.writeText(url);
            return { success: true, url };
        } catch (error) {
            return { success: false, error };
        }
    }

    /**
     * Generate QR code for sharing
     */
    generateQRCode(character) {
        const url = this.generateShareableURL(character);
        // Would use QR code library here
        return {
            url,
            qrData: url // Placeholder for QR code data
        };
    }
}

// ============================================
// 4. CHARACTER STAT TRACKING
// ============================================

class CharacterStatTracking {
    constructor() {
        this.storageKey = 'sandlot_character_stats';
        this.stats = this.loadStats();
    }

    loadStats() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            return {};
        }
    }

    saveStats() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.stats));
        } catch (error) {
            console.error('Failed to save character stats:', error);
        }
    }

    /**
     * Initialize character stats
     */
    initializeCharacter(characterId) {
        if (!this.stats[characterId]) {
            this.stats[characterId] = {
                gamesPlayed: 0,
                gamesWon: 0,
                atBats: 0,
                hits: 0,
                doubles: 0,
                triples: 0,
                homeRuns: 0,
                rbis: 0,
                runs: 0,
                strikeouts: 0,
                walks: 0,
                stolenBases: 0,
                caughtStealing: 0,
                pitchesThrown: 0,
                pitchingWins: 0,
                earnedRuns: 0,
                fieldingPutouts: 0,
                fieldingAssists: 0,
                fieldingErrors: 0,
                history: []
            };
            this.saveStats();
        }
        return this.stats[characterId];
    }

    /**
     * Record game stats
     */
    recordGame(characterId, gameStats) {
        const char = this.initializeCharacter(characterId);

        // Update cumulative stats
        Object.keys(gameStats).forEach(key => {
            if (typeof gameStats[key] === 'number' && char.hasOwnProperty(key)) {
                char[key] += gameStats[key];
            }
        });

        // Add to history
        char.history.push({
            date: Date.now(),
            stats: gameStats,
            result: gameStats.won ? 'W' : 'L'
        });

        // Keep only last 50 games
        if (char.history.length > 50) {
            char.history.shift();
        }

        this.saveStats();
    }

    /**
     * Get batting average
     */
    getBattingAverage(characterId) {
        const char = this.stats[characterId];
        if (!char || char.atBats === 0) return 0;
        return char.hits / char.atBats;
    }

    /**
     * Get slugging percentage
     */
    getSluggingPercentage(characterId) {
        const char = this.stats[characterId];
        if (!char || char.atBats === 0) return 0;

        const totalBases = char.hits + char.doubles + (char.triples * 2) + (char.homeRuns * 3);
        return totalBases / char.atBats;
    }

    /**
     * Get OPS (On-base Plus Slugging)
     */
    getOPS(characterId) {
        const char = this.stats[characterId];
        if (!char) return 0;

        const onBase = (char.hits + char.walks) / (char.atBats + char.walks);
        const slugging = this.getSluggingPercentage(characterId);
        return onBase + slugging;
    }

    /**
     * Get advanced stats
     */
    getAdvancedStats(characterId) {
        const char = this.stats[characterId];
        if (!char) return null;

        return {
            battingAverage: this.getBattingAverage(characterId),
            sluggingPercentage: this.getSluggingPercentage(characterId),
            onBasePercentage: (char.hits + char.walks) / (char.atBats + char.walks),
            ops: this.getOPS(characterId),
            stolenBasePercentage: char.stolenBases / (char.stolenBases + char.caughtStealing) || 0,
            fieldingPercentage: (char.fieldingPutouts + char.fieldingAssists) /
                               (char.fieldingPutouts + char.fieldingAssists + char.fieldingErrors) || 1.0
        };
    }

    /**
     * Get performance trend
     */
    getPerformanceTrend(characterId, games = 10) {
        const char = this.stats[characterId];
        if (!char || char.history.length === 0) return null;

        const recentGames = char.history.slice(-games);
        const trend = {
            games: recentGames.length,
            avgBA: 0,
            avgHRs: 0,
            winRate: 0
        };

        recentGames.forEach(game => {
            const ba = game.stats.hits / (game.stats.atBats || 1);
            trend.avgBA += ba;
            trend.avgHRs += game.stats.homeRuns || 0;
            if (game.result === 'W') trend.winRate++;
        });

        trend.avgBA /= trend.games;
        trend.avgHRs /= trend.games;
        trend.winRate /= trend.games;

        return trend;
    }
}

// ============================================
// 5. STADIUM LEADERBOARDS
// ============================================

class StadiumLeaderboards {
    constructor() {
        this.storageKey = 'sandlot_stadium_leaderboards';
        this.leaderboards = this.loadLeaderboards();
    }

    loadLeaderboards() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            return {};
        }
    }

    saveLeaderboards() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.leaderboards));
        } catch (error) {
            console.error('Failed to save leaderboards:', error);
        }
    }

    /**
     * Initialize stadium leaderboard
     */
    initializeStadium(stadiumId) {
        if (!this.leaderboards[stadiumId]) {
            this.leaderboards[stadiumId] = {
                highestScore: [],
                longestHomeRun: [],
                mostHits: [],
                perfectGames: [],
                fastestWin: []
            };
            this.saveLeaderboards();
        }
        return this.leaderboards[stadiumId];
    }

    /**
     * Submit score to leaderboard
     */
    submitScore(stadiumId, category, entry) {
        const board = this.initializeStadium(stadiumId);

        if (!board[category]) {
            board[category] = [];
        }

        // Add entry with timestamp
        entry.timestamp = Date.now();
        board[category].push(entry);

        // Sort based on category
        if (category === 'fastestWin') {
            board[category].sort((a, b) => a.value - b.value);
        } else {
            board[category].sort((a, b) => b.value - a.value);
        }

        // Keep only top 10
        board[category] = board[category].slice(0, 10);

        this.saveLeaderboards();

        // Return rank
        const rank = board[category].findIndex(e => e.timestamp === entry.timestamp);
        return rank + 1;
    }

    /**
     * Get leaderboard for stadium
     */
    getLeaderboard(stadiumId, category = 'highestScore') {
        const board = this.leaderboards[stadiumId];
        if (!board) return [];
        return board[category] || [];
    }

    /**
     * Get player rank in category
     */
    getPlayerRank(stadiumId, category, playerName) {
        const board = this.getLeaderboard(stadiumId, category);
        return board.findIndex(entry => entry.playerName === playerName) + 1;
    }

    /**
     * Get all-time stadium stats
     */
    getStadiumStats(stadiumId) {
        const board = this.leaderboards[stadiumId];
        if (!board) return null;

        return {
            totalGamesPlayed: Object.values(board).flat().length,
            highestScore: board.highestScore[0],
            longestHR: board.longestHomeRun[0],
            perfectGamesCount: board.perfectGames.length
        };
    }
}

// ============================================
// EXPORTS
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        StadiumWeatherSimulator,
        CharacterLevelingSystem,
        OnlineCharacterSharing,
        CharacterStatTracking,
        StadiumLeaderboards
    };
}
