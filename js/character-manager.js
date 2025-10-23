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
            const data = await response.json();
            this.characters = data.characters;
            this.teams = data.teams;
            return true;
        } catch (error) {
            console.error('Failed to load character roster:', error);
            return false;
        }
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
                usesRemaining: character.specialAbility.cooldown === 99 ? 1 : Math.floor(9 / character.specialAbility.cooldown)
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterManager;
}
