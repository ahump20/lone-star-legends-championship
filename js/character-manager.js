/**
 * Character Manager - Handles loading and managing game characters
 */

class CharacterManager {
    constructor() {
        this.characters = [];
        this.teams = [];
        this.selectedTeam = null;
        this.opponentTeam = null;
    }

    /**
     * Load character roster from JSON
     */
    async loadRoster() {
        try {
            const response = await fetch('/data/backyard-roster.json');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Validate data structure
            if (!data.characters || !Array.isArray(data.characters)) {
                throw new Error('Invalid roster data: missing characters array');
            }
            if (!data.teams || !Array.isArray(data.teams)) {
                throw new Error('Invalid roster data: missing teams array');
            }

            this.characters = data.characters;
            this.teams = data.teams;

            console.log(`✅ Loaded ${this.characters.length} characters and ${this.teams.length} teams`);
            return true;
        } catch (error) {
            console.error('Failed to load character roster:', error);
            this.showUserError('Failed to load game data. Please refresh the page.');
            return false;
        }
    }

    /**
     * Show user-friendly error message
     */
    showUserError(message) {
        // Create error overlay if it doesn't exist
        let errorDiv = document.getElementById('game-error-overlay');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'game-error-overlay';
            errorDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 0, 0, 0.9);
                color: white;
                padding: 20px 40px;
                border-radius: 10px;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            `;
            document.body.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    /**
     * Get all available characters
     */
    getAllCharacters() {
        return this.characters;
    }

    /**
     * Get character by ID
     */
    getCharacterById(id) {
        return this.characters.find(char => char.id === id);
    }

    /**
     * Get characters by position
     */
    getCharactersByPosition(position) {
        return this.characters.filter(char => char.position === position);
    }

    /**
     * Get random characters for CPU team
     */
    getRandomCharacters(count, excludeIds = []) {
        const available = this.characters.filter(char => !excludeIds.includes(char.id));
        const shuffled = [...available].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    /**
     * Create player object from character data
     */
    createPlayerFromCharacter(character, teamName, teamColor) {
        return {
            // Character data
            characterId: character.id,
            name: character.name,
            nickname: character.nickname,
            age: character.age,
            bio: character.bio,

            // Position
            position: character.position,
            number: character.favoriteNumber,

            // Stats (convert 1-10 scale to game values)
            battingAverage: this.convertBattingStat(character.stats.batting),
            power: this.convertPowerStat(character.stats.power),
            speed: this.convertSpeedStat(character.stats.speed),
            pitchingSkill: this.convertPitchingStat(character.stats.pitching),
            fieldingSkill: this.convertFieldingStat(character.stats.fielding),

            // Special ability
            specialAbility: {
                ...character.specialAbility,
                available: true,
                usesRemaining: this.calculateAbilityUses(character.specialAbility.cooldown)
            },

            // Appearance
            appearance: character.appearance,

            // Team info
            team: teamName,
            teamColor: teamColor,

            // Game stats
            atBats: 0,
            hits: 0,
            runs: 0,
            rbis: 0,
            strikeouts: 0,
            walks: 0,
            homeRuns: 0,

            // Stamina
            stamina: 100,

            // Personality
            personality: character.personality
        };
    }

    /**
     * Convert batting stat (1-10) to batting average (0.200-0.400)
     */
    convertBattingStat(batting) {
        return 0.200 + (batting / 10) * 0.200; // 1 = .200, 10 = .400
    }

    /**
     * Convert power stat (1-10) to power (0.05-0.50)
     */
    convertPowerStat(power) {
        return 0.05 + (power / 10) * 0.45; // 1 = .05, 10 = .50
    }

    /**
     * Convert speed stat (1-10) to speed (0.5-1.5)
     */
    convertSpeedStat(speed) {
        return 0.5 + (speed / 10) * 1.0; // 1 = 0.5, 10 = 1.5
    }

    /**
     * Convert pitching stat (1-10) to pitching skill (0.5-1.0)
     */
    convertPitchingStat(pitching) {
        return 0.5 + (pitching / 10) * 0.5; // 1 = 0.5, 10 = 1.0
    }

    /**
     * Convert fielding stat (1-10) to fielding skill (0.6-1.0)
     */
    convertFieldingStat(fielding) {
        return 0.6 + (fielding / 10) * 0.4; // 1 = 0.6, 10 = 1.0
    }

    /**
     * Get team data by ID
     */
    getTeamById(teamId) {
        return this.teams.find(team => team.id === teamId);
    }

    /**
     * Get all teams
     */
    getAllTeams() {
        return this.teams;
    }

    /**
     * Create balanced lineup (ensures all positions covered)
     */
    createBalancedLineup(characters, teamData) {
        const positions = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
        const lineup = [];

        // Try to assign characters to their preferred positions
        for (const pos of positions) {
            const charForPos = characters.find(char =>
                char.position === pos && !lineup.includes(char)
            );

            if (charForPos) {
                lineup.push(this.createPlayerFromCharacter(
                    charForPos,
                    teamData.name,
                    teamData.color
                ));
            }
        }

        // Fill remaining spots with any available characters
        while (lineup.length < 9 && characters.length > lineup.length) {
            const remaining = characters.filter(char =>
                !lineup.find(p => p.characterId === char.id)
            );
            if (remaining.length > 0) {
                const char = remaining[0];
                const player = this.createPlayerFromCharacter(
                    char,
                    teamData.name,
                    teamData.color
                );
                // Assign to unfilled position
                player.position = positions[lineup.length];
                lineup.push(player);
            } else {
                break;
            }
        }

        return lineup;
    }

    /**
     * Save team selection to localStorage
     */
    saveTeamSelection(teamId, characterIds) {
        const selection = {
            teamId,
            characterIds,
            timestamp: Date.now()
        };
        localStorage.setItem('selectedTeam', JSON.stringify(selection));
    }

    /**
     * Load team selection from localStorage
     */
    loadTeamSelection() {
        const saved = localStorage.getItem('selectedTeam');
        return saved ? JSON.parse(saved) : null;
    }

    /**
     * Get character stats summary
     */
    getCharacterStatsSummary(character) {
        const stats = character.stats;
        const total = stats.batting + stats.power + stats.speed + stats.pitching + stats.fielding;
        const average = total / 5;

        return {
            total,
            average: average.toFixed(1),
            rating: this.getOverallRating(average)
        };
    }

    /**
     * Get overall rating based on average stats
     */
    getOverallRating(average) {
        if (average >= 8.5) return 'A+ Star Player';
        if (average >= 7.5) return 'A All-Star';
        if (average >= 6.5) return 'B+ Great Player';
        if (average >= 5.5) return 'B Good Player';
        if (average >= 4.5) return 'C+ Solid Player';
        return 'C Developing Player';
    }

    /**
     * Calculate ability uses based on cooldown
     * Cooldown of 99 = one-time use (ultimate ability)
     * Cooldown of 1-9 = multiple uses per game
     * Uses formula: For 9-inning game, uses = max(1, floor(9 / cooldown))
     */
    calculateAbilityUses(cooldown) {
        // Ultimate abilities (cooldown 99) get 1 use
        if (cooldown >= 99) {
            return 1;
        }

        // Prevent division by zero or negative cooldowns
        if (cooldown <= 0) {
            console.warn(`Invalid cooldown value: ${cooldown}, defaulting to 1 use`);
            return 1;
        }

        // Calculate uses for a 9-inning game
        // Cooldown 1 = 9 uses, Cooldown 3 = 3 uses, Cooldown 5 = 1 use, etc.
        const uses = Math.floor(9 / cooldown);

        // Ensure at least 1 use
        return Math.max(1, uses);
    }
}

// Export for ES modules
export default CharacterManager;
