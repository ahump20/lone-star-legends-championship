/**
 * Character Creator System
 * Handles character customization including stats, appearance, and abilities
 */

class CharacterCreator {
    constructor(gameStateManager) {
        this.gameStateManager = gameStateManager;
        this.currentCharacter = this.createEmptyCharacter();
        this.listeners = [];

        // Stat allocation settings
        this.statConfig = {
            min: 1,
            max: 99,
            startingPoints: 200,
            maxPerStat: 90
        };

        // Appearance options
        this.appearanceOptions = {
            skinTones: [
                { id: 'light', name: 'Light', color: '#FFE0BD' },
                { id: 'medium', name: 'Medium', color: '#D4A574' },
                { id: 'tan', name: 'Tan', color: '#C68642' },
                { id: 'dark', name: 'Dark', color: '#8D5524' }
            ],
            jerseyColors: [
                { id: 'red', name: 'Red', color: '#FF0000' },
                { id: 'blue', name: 'Blue', color: '#0000FF' },
                { id: 'green', name: 'Green', color: '#00AA00' },
                { id: 'orange', name: 'Orange', color: '#FF6B35' },
                { id: 'purple', name: 'Purple', color: '#9B59B6' },
                { id: 'yellow', name: 'Yellow', color: '#FFD700' },
                { id: 'black', name: 'Black', color: '#000000' },
                { id: 'white', name: 'White', color: '#FFFFFF' }
            ],
            battingStances: [
                { id: 'standard', name: 'Standard', description: 'Balanced stance for all-around hitting' },
                { id: 'power', name: 'Power', description: 'Wide stance optimized for home runs' },
                { id: 'contact', name: 'Contact', description: 'Choked up for better bat control' },
                { id: 'crouch', name: 'Crouch', description: 'Low stance for better pitch selection' },
                { id: 'open', name: 'Open', description: 'Open stance pulls the ball more' },
                { id: 'closed', name: 'Closed', description: 'Closed stance for opposite field hitting' }
            ],
            pitchingMotions: [
                { id: 'overhand', name: 'Overhand', description: 'Classic over-the-top delivery' },
                { id: 'three-quarter', name: 'Three-Quarter', description: 'Most common pitching motion' },
                { id: 'sidearm', name: 'Sidearm', description: 'Deceptive low arm angle' },
                { id: 'submarine', name: 'Submarine', description: 'Extreme underhand delivery' },
                { id: 'windup', name: 'Full Windup', description: 'Traditional slow windup' },
                { id: 'stretch', name: 'Stretch', description: 'Quick delivery from the stretch' }
            ]
        };

        // Ability templates
        this.abilityTemplates = {
            batting: [
                { id: 'power_surge', name: 'Power Surge', description: '+20 Power for next at-bat', cooldown: 3, tier: 'common' },
                { id: 'eagle_eye', name: 'Eagle Eye', description: 'See pitch types before thrown', cooldown: 4, tier: 'common' },
                { id: 'contact_master', name: 'Contact Master', description: '+30 Contact for 2 at-bats', cooldown: 3, tier: 'common' },
                { id: 'clutch_gene', name: 'Clutch Gene', description: '+15 to all stats in pressure situations', cooldown: 5, tier: 'rare' },
                { id: 'home_run_king', name: 'Home Run King', description: 'Next hit is automatic home run', cooldown: 99, tier: 'ultimate' },
                { id: 'rally_starter', name: 'Rally Starter', description: 'Guaranteed base hit', cooldown: 4, tier: 'rare' },
                { id: 'hot_streak', name: 'Hot Streak', description: '+10 to all batting stats for inning', cooldown: 6, tier: 'rare' }
            ],
            fielding: [
                { id: 'magnet_glove', name: 'Magnet Glove', description: 'Auto-catch next ball in play', cooldown: 5, tier: 'rare' },
                { id: 'rocket_arm', name: 'Rocket Arm', description: 'Throw speed +50% for inning', cooldown: 4, tier: 'common' },
                { id: 'quick_hands', name: 'Quick Hands', description: 'Turn any double play', cooldown: 6, tier: 'rare' },
                { id: 'wall_climb', name: 'Wall Climb', description: 'Catch any home run ball', cooldown: 99, tier: 'ultimate' },
                { id: 'dive_master', name: 'Dive Master', description: 'Extended diving range for inning', cooldown: 3, tier: 'common' }
            ],
            pitching: [
                { id: 'ace_mode', name: 'Ace Mode', description: '+20 to all pitch stats for inning', cooldown: 5, tier: 'rare' },
                { id: 'strikeout_king', name: 'Strikeout King', description: 'Next 3 pitches are strikes', cooldown: 4, tier: 'rare' },
                { id: 'movement_master', name: 'Movement Master', description: '+30 Break on pitches for at-bat', cooldown: 3, tier: 'common' },
                { id: 'perfect_control', name: 'Perfect Control', description: 'Perfect accuracy for inning', cooldown: 6, tier: 'rare' },
                { id: 'closer_mentality', name: 'Closer Mentality', description: '+25 to all stats in 9th inning', cooldown: 99, tier: 'ultimate' }
            ],
            baserunning: [
                { id: 'speed_demon', name: 'Speed Demon', description: '+40 Speed for next time on base', cooldown: 4, tier: 'common' },
                { id: 'steal_master', name: 'Steal Master', description: 'Guaranteed stolen base', cooldown: 5, tier: 'rare' },
                { id: 'aggressive_runner', name: 'Aggressive Runner', description: 'Take extra base on all hits', cooldown: 6, tier: 'rare' }
            ]
        };
    }

    createEmptyCharacter() {
        return {
            id: this.generateId(),
            name: '',
            position: 'CF',
            jerseyNumber: 0,

            // Base stats
            stats: {
                power: 50,
                contact: 50,
                speed: 50,
                defense: 50,
                arm: 50,
                accuracy: 50
            },

            // Appearance
            appearance: {
                skinTone: 'medium',
                jerseyColor: 'blue',
                battingStance: 'standard',
                pitchingMotion: 'three-quarter'
            },

            // Abilities (player chooses up to 3)
            abilities: [],

            // Derived ratings (calculated from stats)
            ratings: {},

            // Metadata
            custom: true,
            createdAt: Date.now()
        };
    }

    generateId() {
        return 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Start creating a new character
     */
    startNewCharacter() {
        this.currentCharacter = this.createEmptyCharacter();
        this.notifyListeners('character_reset');
        return this.currentCharacter;
    }

    /**
     * Load an existing character for editing
     */
    loadCharacter(characterData) {
        this.currentCharacter = JSON.parse(JSON.stringify(characterData));
        this.notifyListeners('character_loaded', this.currentCharacter);
        return this.currentCharacter;
    }

    /**
     * Get current character
     */
    getCharacter() {
        return this.currentCharacter;
    }

    /**
     * Update character basic info
     */
    updateBasicInfo(info) {
        if (info.name !== undefined) {
            this.currentCharacter.name = info.name.substring(0, 30);
        }
        if (info.position !== undefined) {
            this.currentCharacter.position = info.position;
        }
        if (info.jerseyNumber !== undefined) {
            const num = parseInt(info.jerseyNumber);
            if (!isNaN(num) && num >= 0 && num <= 99) {
                this.currentCharacter.jerseyNumber = num;
            }
        }

        this.notifyListeners('basic_info_updated', info);
        return this.currentCharacter;
    }

    /**
     * Update character stats with validation
     */
    updateStat(statName, value) {
        const numValue = parseInt(value);

        if (isNaN(numValue)) {
            throw new Error('Stat value must be a number');
        }

        if (numValue < this.statConfig.min || numValue > this.statConfig.max) {
            throw new Error(`Stat must be between ${this.statConfig.min} and ${this.statConfig.max}`);
        }

        if (numValue > this.statConfig.maxPerStat) {
            throw new Error(`Individual stat cannot exceed ${this.statConfig.maxPerStat}`);
        }

        // Check total points
        const totalPoints = this.calculateTotalPoints(statName, numValue);
        if (totalPoints > this.statConfig.startingPoints) {
            throw new Error(`Total stat points cannot exceed ${this.statConfig.startingPoints}`);
        }

        this.currentCharacter.stats[statName] = numValue;
        this.updateRatings();
        this.notifyListeners('stat_updated', { stat: statName, value: numValue, total: totalPoints });

        return this.currentCharacter;
    }

    /**
     * Calculate total stat points allocated
     */
    calculateTotalPoints(excludeStat = null, newValue = null) {
        let total = 0;

        for (const [statName, value] of Object.entries(this.currentCharacter.stats)) {
            if (statName === excludeStat) {
                total += newValue !== null ? newValue : value;
            } else {
                total += value;
            }
        }

        return total;
    }

    /**
     * Get remaining stat points
     */
    getRemainingPoints() {
        return this.statConfig.startingPoints - this.calculateTotalPoints();
    }

    /**
     * Auto-distribute remaining points evenly
     */
    autoDistributePoints() {
        const remaining = this.getRemainingPoints();
        if (remaining <= 0) return;

        const statNames = Object.keys(this.currentCharacter.stats);
        const pointsPerStat = Math.floor(remaining / statNames.length);

        statNames.forEach(statName => {
            const currentValue = this.currentCharacter.stats[statName];
            const newValue = Math.min(this.statConfig.maxPerStat, currentValue + pointsPerStat);
            this.currentCharacter.stats[statName] = newValue;
        });

        this.updateRatings();
        this.notifyListeners('stats_auto_distributed');
    }

    /**
     * Update appearance option
     */
    updateAppearance(option, value) {
        const validOptions = ['skinTone', 'jerseyColor', 'battingStance', 'pitchingMotion'];

        if (!validOptions.includes(option)) {
            throw new Error(`Invalid appearance option: ${option}`);
        }

        this.currentCharacter.appearance[option] = value;
        this.notifyListeners('appearance_updated', { option, value });

        return this.currentCharacter;
    }

    /**
     * Add ability to character (max 3)
     */
    addAbility(abilityId) {
        if (this.currentCharacter.abilities.length >= 3) {
            throw new Error('Character can only have 3 abilities');
        }

        // Find ability in templates
        let ability = null;
        for (const category of Object.values(this.abilityTemplates)) {
            ability = category.find(a => a.id === abilityId);
            if (ability) break;
        }

        if (!ability) {
            throw new Error(`Ability not found: ${abilityId}`);
        }

        // Check if already added
        if (this.currentCharacter.abilities.find(a => a.id === abilityId)) {
            throw new Error('Ability already added');
        }

        // Only allow one ultimate ability
        if (ability.tier === 'ultimate') {
            const hasUltimate = this.currentCharacter.abilities.some(a => a.tier === 'ultimate');
            if (hasUltimate) {
                throw new Error('Character can only have one ultimate ability');
            }
        }

        this.currentCharacter.abilities.push(JSON.parse(JSON.stringify(ability)));
        this.notifyListeners('ability_added', ability);

        return this.currentCharacter;
    }

    /**
     * Remove ability from character
     */
    removeAbility(abilityId) {
        const index = this.currentCharacter.abilities.findIndex(a => a.id === abilityId);

        if (index === -1) {
            throw new Error(`Ability not found: ${abilityId}`);
        }

        const removed = this.currentCharacter.abilities.splice(index, 1)[0];
        this.notifyListeners('ability_removed', removed);

        return this.currentCharacter;
    }

    /**
     * Get available abilities by category
     */
    getAvailableAbilities(category = null) {
        if (category && this.abilityTemplates[category]) {
            return this.abilityTemplates[category];
        }
        return this.abilityTemplates;
    }

    /**
     * Update derived ratings based on stats
     */
    updateRatings() {
        const stats = this.currentCharacter.stats;

        // Calculate composite ratings
        this.currentCharacter.ratings = {
            batting: Math.round((stats.contact * 0.6 + stats.power * 0.4)),
            power: stats.power,
            fielding: Math.round((stats.defense * 0.7 + stats.speed * 0.3)),
            throwing: Math.round((stats.arm * 0.7 + stats.accuracy * 0.3)),
            baserunning: stats.speed,
            overall: Math.round(
                (stats.power + stats.contact + stats.speed + stats.defense + stats.arm + stats.accuracy) / 6
            )
        };

        return this.currentCharacter.ratings;
    }

    /**
     * Validate character is ready to save
     */
    validateCharacter() {
        const errors = [];

        if (!this.currentCharacter.name || this.currentCharacter.name.trim().length === 0) {
            errors.push('Character must have a name');
        }

        if (this.currentCharacter.jerseyNumber < 0 || this.currentCharacter.jerseyNumber > 99) {
            errors.push('Jersey number must be between 0 and 99');
        }

        const totalPoints = this.calculateTotalPoints();
        if (totalPoints !== this.statConfig.startingPoints) {
            errors.push(`Must allocate all ${this.statConfig.startingPoints} stat points (currently ${totalPoints})`);
        }

        if (this.currentCharacter.abilities.length === 0) {
            errors.push('Character must have at least one ability');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Save character to game state
     */
    saveCharacter() {
        const validation = this.validateCharacter();

        if (!validation.valid) {
            throw new Error('Character validation failed: ' + validation.errors.join(', '));
        }

        this.updateRatings();
        this.currentCharacter.updatedAt = Date.now();

        // Save to game state manager
        const customCharacters = this.gameStateManager.getCustomData('customCharacters') || [];

        // Check if updating existing character
        const existingIndex = customCharacters.findIndex(c => c.id === this.currentCharacter.id);

        if (existingIndex >= 0) {
            customCharacters[existingIndex] = this.currentCharacter;
        } else {
            customCharacters.push(this.currentCharacter);
        }

        this.gameStateManager.setCustomData('customCharacters', customCharacters);
        this.notifyListeners('character_saved', this.currentCharacter);

        return this.currentCharacter;
    }

    /**
     * Get all saved custom characters
     */
    getSavedCharacters() {
        return this.gameStateManager.getCustomData('customCharacters') || [];
    }

    /**
     * Delete a saved character
     */
    deleteCharacter(characterId) {
        const customCharacters = this.getSavedCharacters();
        const filtered = customCharacters.filter(c => c.id !== characterId);

        this.gameStateManager.setCustomData('customCharacters', filtered);
        this.notifyListeners('character_deleted', characterId);

        return filtered;
    }

    /**
     * Export character as JSON
     */
    exportCharacter(characterId = null) {
        const character = characterId
            ? this.getSavedCharacters().find(c => c.id === characterId)
            : this.currentCharacter;

        if (!character) {
            throw new Error('Character not found');
        }

        return JSON.stringify(character, null, 2);
    }

    /**
     * Import character from JSON
     */
    importCharacter(jsonString) {
        try {
            const character = JSON.parse(jsonString);

            // Validate basic structure
            if (!character.name || !character.stats || !character.appearance) {
                throw new Error('Invalid character data structure');
            }

            // Generate new ID for imported character
            character.id = this.generateId();
            character.custom = true;
            character.importedAt = Date.now();

            this.loadCharacter(character);
            return character;

        } catch (error) {
            throw new Error('Failed to import character: ' + error.message);
        }
    }

    /**
     * Create a preset character template
     */
    createPreset(presetType) {
        this.startNewCharacter();

        const presets = {
            powerHitter: {
                name: 'Power Slugger',
                stats: { power: 85, contact: 40, speed: 25, defense: 20, arm: 15, accuracy: 15 },
                abilities: ['power_surge', 'home_run_king', 'rally_starter'],
                appearance: { battingStance: 'power' }
            },
            contactHitter: {
                name: 'Contact Specialist',
                stats: { power: 20, contact: 85, speed: 40, defense: 25, arm: 15, accuracy: 15 },
                abilities: ['contact_master', 'eagle_eye', 'hot_streak'],
                appearance: { battingStance: 'contact' }
            },
            speedster: {
                name: 'Speed Demon',
                stats: { power: 15, contact: 40, speed: 85, defense: 30, arm: 15, accuracy: 15 },
                abilities: ['speed_demon', 'steal_master', 'aggressive_runner'],
                appearance: { battingStance: 'crouch' }
            },
            ace: {
                name: 'Ace Pitcher',
                stats: { power: 15, contact: 15, speed: 20, defense: 25, arm: 85, accuracy: 40 },
                abilities: ['ace_mode', 'strikeout_king', 'closer_mentality'],
                appearance: { pitchingMotion: 'overhand' }
            },
            goldGlove: {
                name: 'Gold Glove',
                stats: { power: 20, contact: 25, speed: 40, defense: 85, arm: 15, accuracy: 15 },
                abilities: ['magnet_glove', 'quick_hands', 'wall_climb'],
                appearance: { battingStance: 'standard' }
            },
            balanced: {
                name: 'All-Arounder',
                stats: { power: 35, contact: 35, speed: 30, defense: 35, arm: 30, accuracy: 35 },
                abilities: ['clutch_gene', 'hot_streak', 'rally_starter'],
                appearance: { battingStance: 'standard' }
            }
        };

        const preset = presets[presetType];
        if (!preset) {
            throw new Error('Invalid preset type');
        }

        this.currentCharacter.name = preset.name;
        this.currentCharacter.stats = preset.stats;
        this.currentCharacter.abilities = preset.abilities.map(id => {
            for (const category of Object.values(this.abilityTemplates)) {
                const ability = category.find(a => a.id === id);
                if (ability) return JSON.parse(JSON.stringify(ability));
            }
            return null;
        }).filter(a => a !== null);

        Object.assign(this.currentCharacter.appearance, preset.appearance);

        this.updateRatings();
        this.notifyListeners('preset_loaded', presetType);

        return this.currentCharacter;
    }

    /**
     * Register event listener
     */
    on(event, callback) {
        this.listeners.push({ event, callback });
    }

    /**
     * Unregister event listener
     */
    off(event, callback) {
        this.listeners = this.listeners.filter(
            l => l.event !== event || l.callback !== callback
        );
    }

    /**
     * Notify listeners of events
     */
    notifyListeners(event, data = null) {
        this.listeners
            .filter(l => l.event === event || l.event === '*')
            .forEach(l => {
                try {
                    l.callback(event, data);
                } catch (error) {
                    console.error('Error in character creator listener:', error);
                }
            });
    }
}

// Export for use in Node.js tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterCreator;
}
