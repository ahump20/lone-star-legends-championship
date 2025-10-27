/**
 * Character Customization System
 * Allows players to create and customize their own unique baseball characters
 */

class CharacterCustomizationSystem {
    constructor() {
        this.customCharacters = [];
        this.storageKey = 'sandlot_custom_characters';

        // Customization options
        this.options = {
            // Physical appearance
            appearance: {
                skinTones: [
                    { id: 'light', name: 'Light', hex: '#FFE0BD' },
                    { id: 'fair', name: 'Fair', hex: '#F1C27D' },
                    { id: 'medium', name: 'Medium', hex: '#E0AC69' },
                    { id: 'tan', name: 'Tan', hex: '#C68642' },
                    { id: 'brown', name: 'Brown', hex: '#8D5524' },
                    { id: 'dark', name: 'Dark', hex: '#6F3A1F' }
                ],

                hairStyles: [
                    { id: 'short_spiky', name: 'Short Spiky', icon: '✂️' },
                    { id: 'buzzcut', name: 'Buzzcut', icon: '👨‍🦲' },
                    { id: 'long_ponytail', name: 'Long Ponytail', icon: '👱‍♀️' },
                    { id: 'curly', name: 'Curly', icon: '🌀' },
                    { id: 'mohawk', name: 'Mohawk', icon: '🦅' },
                    { id: 'afro', name: 'Afro', icon: '🎾' },
                    { id: 'braids', name: 'Braids', icon: '🪢' },
                    { id: 'bald', name: 'Bald', icon: '🥚' },
                    { id: 'long_flowing', name: 'Long Flowing', icon: '💇' },
                    { id: 'side_part', name: 'Side Part', icon: '✨' }
                ],

                hairColors: [
                    { id: 'black', name: 'Black', hex: '#1A1A1A' },
                    { id: 'dark_brown', name: 'Dark Brown', hex: '#3D2817' },
                    { id: 'brown', name: 'Brown', hex: '#6F4E37' },
                    { id: 'light_brown', name: 'Light Brown', hex: '#A67B5B' },
                    { id: 'blonde', name: 'Blonde', hex: '#FFF8DC' },
                    { id: 'red', name: 'Red', hex: '#C1440E' },
                    { id: 'auburn', name: 'Auburn', hex: '#A52A2A' },
                    { id: 'gray', name: 'Gray', hex: '#808080' },
                    { id: 'blue', name: 'Blue (Fun)', hex: '#0066CC' },
                    { id: 'pink', name: 'Pink (Fun)', hex: '#FF69B4' },
                    { id: 'green', name: 'Green (Fun)', hex: '#00FF00' },
                    { id: 'purple', name: 'Purple (Fun)', hex: '#9370DB' }
                ],

                eyeColors: [
                    { id: 'brown', name: 'Brown', hex: '#654321' },
                    { id: 'blue', name: 'Blue', hex: '#4682B4' },
                    { id: 'green', name: 'Green', hex: '#228B22' },
                    { id: 'hazel', name: 'Hazel', hex: '#8E7618' },
                    { id: 'gray', name: 'Gray', hex: '#708090' },
                    { id: 'amber', name: 'Amber', hex: '#FFBF00' }
                ],

                bodyTypes: [
                    { id: 'slim', name: 'Slim', speedBonus: 2, powerPenalty: 1 },
                    { id: 'athletic', name: 'Athletic', balanced: true },
                    { id: 'muscular', name: 'Muscular', powerBonus: 2, speedPenalty: 1 },
                    { id: 'stocky', name: 'Stocky', powerBonus: 1, fieldingBonus: 1 },
                    { id: 'tall', name: 'Tall', pitchingBonus: 1, speedPenalty: 1 }
                ],

                accessories: [
                    { id: 'none', name: 'None', icon: '❌' },
                    { id: 'headband', name: 'Headband', icon: '🎀', coolBonus: 1 },
                    { id: 'cap_backwards', name: 'Cap (Backwards)', icon: '🧢', coolBonus: 2 },
                    { id: 'sunglasses', name: 'Sunglasses', icon: '😎', coolBonus: 3 },
                    { id: 'wristbands', name: 'Wristbands', icon: '💪', powerBonus: 1 },
                    { id: 'batting_gloves', name: 'Batting Gloves', icon: '🧤', battingBonus: 1 },
                    { id: 'chain', name: 'Chain Necklace', icon: '📿', coolBonus: 2 },
                    { id: 'arm_sleeve', name: 'Arm Sleeve', icon: '🎽', pitchingBonus: 1 },
                    { id: 'face_paint', name: 'Face Paint', icon: '🎨', coolBonus: 2 },
                    { id: 'eyeblack', name: 'Eye Black', icon: '⚫', battingBonus: 1 }
                ]
            },

            // Uniform customization
            uniform: {
                jerseyStyles: [
                    { id: 'classic', name: 'Classic', icon: '👕' },
                    { id: 'modern', name: 'Modern', icon: '👔' },
                    { id: 'vintage', name: 'Vintage', icon: '🎩' },
                    { id: 'sleeveless', name: 'Sleeveless', icon: '🦾' }
                ],

                primaryColors: [
                    { id: 'red', name: 'Red', hex: '#FF0000' },
                    { id: 'blue', name: 'Blue', hex: '#0000FF' },
                    { id: 'green', name: 'Green', hex: '#00FF00' },
                    { id: 'yellow', name: 'Yellow', hex: '#FFFF00' },
                    { id: 'orange', name: 'Orange', hex: '#FF6B35' },
                    { id: 'purple', name: 'Purple', hex: '#800080' },
                    { id: 'black', name: 'Black', hex: '#000000' },
                    { id: 'white', name: 'White', hex: '#FFFFFF' },
                    { id: 'pink', name: 'Pink', hex: '#FFC0CB' },
                    { id: 'teal', name: 'Teal', hex: '#008080' },
                    { id: 'navy', name: 'Navy', hex: '#000080' },
                    { id: 'gold', name: 'Gold', hex: '#FFD700' }
                ],

                numbers: Array.from({ length: 99 }, (_, i) => i + 1)
            },

            // Special abilities (can be earned or selected)
            abilities: [
                {
                    id: 'custom_power_swing',
                    name: 'Power Surge',
                    description: 'Temporary massive power boost',
                    cooldown: 5,
                    type: 'ACTIVE_BATTING',
                    requirements: { power: 7 }
                },
                {
                    id: 'custom_laser_focus',
                    name: 'Laser Focus',
                    description: 'Perfect accuracy for 3 pitches',
                    cooldown: 6,
                    type: 'ACTIVE_PITCH',
                    requirements: { pitching: 7 }
                },
                {
                    id: 'custom_flash_step',
                    name: 'Flash Step',
                    description: 'Teleport to any base',
                    cooldown: 99,
                    type: 'ACTIVE_RUNNING',
                    requirements: { speed: 8 }
                },
                {
                    id: 'custom_wall_run',
                    name: 'Wall Run',
                    description: 'Run up outfield wall for catches',
                    cooldown: 4,
                    type: 'ACTIVE_FIELDING',
                    requirements: { fielding: 8 }
                },
                {
                    id: 'custom_clutch_master',
                    name: 'Clutch Master',
                    description: 'Stats increase in close games',
                    cooldown: 1,
                    type: 'PASSIVE',
                    requirements: { batting: 6, power: 6 }
                },
                {
                    id: 'custom_ace',
                    name: 'Ace in the Hole',
                    description: 'Unhittable with 2 strikes',
                    cooldown: 1,
                    type: 'PASSIVE_PITCH',
                    requirements: { pitching: 9 }
                },
                {
                    id: 'custom_momentum',
                    name: 'Momentum Builder',
                    description: 'Each successful play boosts next one',
                    cooldown: 1,
                    type: 'PASSIVE',
                    requirements: { batting: 5, fielding: 5 }
                },
                {
                    id: 'custom_showboat',
                    name: 'Showboat',
                    description: 'Flashy plays energize entire team',
                    cooldown: 3,
                    type: 'ACTIVE_TEAM',
                    requirements: { fielding: 7 }
                }
            ],

            // Personality traits (affect AI behavior and commentary)
            personalities: [
                { id: 'competitive', name: 'Competitive', emoji: '🔥' },
                { id: 'playful', name: 'Playful', emoji: '😄' },
                { id: 'focused', name: 'Focused', emoji: '🎯' },
                { id: 'energetic', name: 'Energetic', emoji: '⚡' },
                { id: 'calm', name: 'Calm', emoji: '😌' },
                { id: 'intense', name: 'Intense', emoji: '😤' },
                { id: 'friendly', name: 'Friendly', emoji: '🤝' },
                { id: 'confident', name: 'Confident', emoji: '😎' },
                { id: 'humble', name: 'Humble', emoji: '🙏' },
                { id: 'showoff', name: 'Show-off', emoji: '💫' }
            ],

            // Batting stances
            battingStances: [
                { id: 'traditional', name: 'Traditional', icon: '⚾', balanced: true },
                { id: 'open', name: 'Open Stance', icon: '↔️', powerBonus: 1 },
                { id: 'closed', name: 'Closed Stance', icon: '→', contactBonus: 1 },
                { id: 'crouch', name: 'Crouch', icon: '⬇️', strikeZoneBonus: 1 },
                { id: 'upright', name: 'Upright', icon: '⬆️', speedBonus: 1 }
            ],

            // Pitching styles
            pitchingStyles: [
                { id: 'overhand', name: 'Overhand', icon: '↓', velocityBonus: 1 },
                { id: 'sidearm', name: 'Sidearm', icon: '→', movementBonus: 1 },
                { id: 'submarine', name: 'Submarine', icon: '↗️', deceptionBonus: 1 },
                { id: 'three_quarter', name: '3/4 Arm', icon: '↘️', balanced: true }
            ]
        };

        this.loadCustomCharacters();
    }

    /**
     * Create a new custom character
     */
    createCharacter(characterData) {
        const character = {
            id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            isCustom: true,
            createdAt: Date.now(),

            // Basic info
            name: characterData.name || 'Custom Player',
            nickname: characterData.nickname || '',
            age: characterData.age || 12,
            bio: characterData.bio || 'A custom created player',
            favoriteNumber: characterData.favoriteNumber || Math.floor(Math.random() * 99) + 1,
            position: characterData.position || 'CF',

            // Stats (allocated from pool)
            stats: this.calculateStats(characterData.statAllocation, characterData.bodyType),

            // Appearance
            appearance: {
                skinTone: characterData.skinTone || 'medium',
                hairStyle: characterData.hairStyle || 'short_spiky',
                hairColor: characterData.hairColor || 'black',
                eyeColor: characterData.eyeColor || 'brown',
                bodyType: characterData.bodyType || 'athletic',
                accessories: characterData.accessories || []
            },

            // Uniform
            uniform: {
                style: characterData.uniformStyle || 'classic',
                primaryColor: characterData.primaryColor || 'blue',
                secondaryColor: characterData.secondaryColor || 'white',
                number: characterData.number || Math.floor(Math.random() * 99) + 1
            },

            // Gameplay
            specialAbility: characterData.ability || this.options.abilities[0],
            battingStance: characterData.battingStance || 'traditional',
            pitchingStyle: characterData.pitchingStyle || 'overhand',

            // Personality
            personality: characterData.personality || ['competitive', 'focused'],

            // Home stadium (for bonuses)
            homeStadium: characterData.homeStadium || 'sunny_park'
        };

        this.customCharacters.push(character);
        this.saveCustomCharacters();

        console.log(`✅ Created custom character: ${character.name}`);
        return character;
    }

    /**
     * Calculate stats based on allocation and body type
     */
    calculateStats(allocation, bodyType = 'athletic') {
        const statPool = 35; // Total points to allocate
        const stats = allocation || {
            batting: 7,
            power: 7,
            speed: 7,
            pitching: 7,
            fielding: 7
        };

        // Apply body type modifiers
        const bodyTypeData = this.options.appearance.bodyTypes.find(bt => bt.id === bodyType);
        if (bodyTypeData) {
            if (bodyTypeData.speedBonus) stats.speed += bodyTypeData.speedBonus;
            if (bodyTypeData.speedPenalty) stats.speed -= bodyTypeData.speedPenalty;
            if (bodyTypeData.powerBonus) stats.power += bodyTypeData.powerBonus;
            if (bodyTypeData.powerPenalty) stats.power -= bodyTypeData.powerPenalty;
            if (bodyTypeData.pitchingBonus) stats.pitching += bodyTypeData.pitchingBonus;
            if (bodyTypeData.fieldingBonus) stats.fielding += bodyTypeData.fieldingBonus;
        }

        // Clamp stats between 1-10
        Object.keys(stats).forEach(key => {
            stats[key] = Math.max(1, Math.min(10, stats[key]));
        });

        return stats;
    }

    /**
     * Edit existing custom character
     */
    editCharacter(characterId, updates) {
        const index = this.customCharacters.findIndex(c => c.id === characterId);
        if (index === -1) {
            console.error('Character not found:', characterId);
            return null;
        }

        this.customCharacters[index] = {
            ...this.customCharacters[index],
            ...updates,
            id: characterId, // Preserve ID
            isCustom: true,
            updatedAt: Date.now()
        };

        this.saveCustomCharacters();
        return this.customCharacters[index];
    }

    /**
     * Delete custom character
     */
    deleteCharacter(characterId) {
        const index = this.customCharacters.findIndex(c => c.id === characterId);
        if (index === -1) return false;

        this.customCharacters.splice(index, 1);
        this.saveCustomCharacters();

        console.log(`🗑️ Deleted custom character: ${characterId}`);
        return true;
    }

    /**
     * Get all custom characters
     */
    getCustomCharacters() {
        return this.customCharacters;
    }

    /**
     * Get character by ID
     */
    getCharacter(characterId) {
        return this.customCharacters.find(c => c.id === characterId);
    }

    /**
     * Save custom characters to localStorage
     */
    saveCustomCharacters() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.customCharacters));
            console.log(`💾 Saved ${this.customCharacters.length} custom characters`);
            return true;
        } catch (error) {
            console.error('Failed to save custom characters:', error);
            return false;
        }
    }

    /**
     * Load custom characters from localStorage
     */
    loadCustomCharacters() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                this.customCharacters = JSON.parse(saved);
                console.log(`📥 Loaded ${this.customCharacters.length} custom characters`);
            }
        } catch (error) {
            console.error('Failed to load custom characters:', error);
            this.customCharacters = [];
        }
    }

    /**
     * Generate random character
     */
    generateRandomCharacter() {
        const randomChoice = (array) => array[Math.floor(Math.random() * array.length)];

        const firstNames = ['Alex', 'Jordan', 'Casey', 'Morgan', 'Taylor', 'Riley', 'Quinn', 'Avery', 'Dakota', 'Sage'];
        const lastNames = ['Rodriguez', 'Johnson', 'Smith', 'Chen', 'Williams', 'Kim', 'Martinez', 'Brown', 'Lee', 'Garcia'];
        const nicknames = ['Rocket', 'Flash', 'Ace', 'Thunder', 'Blaze', 'Storm', 'Phoenix', 'Viper', 'Hawk', 'Titan'];

        return this.createCharacter({
            name: `${randomChoice(firstNames)} ${randomChoice(lastNames)}`,
            nickname: randomChoice(nicknames),
            age: 10 + Math.floor(Math.random() * 5),
            skinTone: randomChoice(this.options.appearance.skinTones).id,
            hairStyle: randomChoice(this.options.appearance.hairStyles).id,
            hairColor: randomChoice(this.options.appearance.hairColors).id,
            eyeColor: randomChoice(this.options.appearance.eyeColors).id,
            bodyType: randomChoice(this.options.appearance.bodyTypes).id,
            accessories: [randomChoice(this.options.appearance.accessories).id],
            uniformStyle: randomChoice(this.options.uniform.jerseyStyles).id,
            primaryColor: randomChoice(this.options.uniform.primaryColors).id,
            secondaryColor: randomChoice(this.options.uniform.primaryColors).id,
            number: Math.floor(Math.random() * 99) + 1,
            ability: randomChoice(this.options.abilities),
            battingStance: randomChoice(this.options.battingStances).id,
            pitchingStyle: randomChoice(this.options.pitchingStyles).id,
            personality: [
                randomChoice(this.options.personalities).id,
                randomChoice(this.options.personalities).id
            ],
            statAllocation: {
                batting: 4 + Math.floor(Math.random() * 5),
                power: 4 + Math.floor(Math.random() * 5),
                speed: 4 + Math.floor(Math.random() * 5),
                pitching: 4 + Math.floor(Math.random() * 5),
                fielding: 4 + Math.floor(Math.random() * 5)
            },
            position: randomChoice(['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'])
        });
    }

    /**
     * Export character to JSON
     */
    exportCharacter(characterId) {
        const character = this.getCharacter(characterId);
        if (!character) return null;

        const blob = new Blob([JSON.stringify(character, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${character.name.replace(/\s+/g, '_')}_character.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return character;
    }

    /**
     * Import character from JSON
     */
    importCharacter(jsonData) {
        try {
            const character = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

            // Generate new ID to avoid conflicts
            character.id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            character.isCustom = true;
            character.importedAt = Date.now();

            this.customCharacters.push(character);
            this.saveCustomCharacters();

            console.log(`📥 Imported character: ${character.name}`);
            return character;
        } catch (error) {
            console.error('Failed to import character:', error);
            return null;
        }
    }

    /**
     * Get available abilities based on stats
     */
    getAvailableAbilities(stats) {
        return this.options.abilities.filter(ability => {
            if (!ability.requirements) return true;

            return Object.keys(ability.requirements).every(stat => {
                return stats[stat] >= ability.requirements[stat];
            });
        });
    }

    /**
     * Calculate character rating
     */
    calculateRating(character) {
        const stats = character.stats;
        const total = stats.batting + stats.power + stats.speed + stats.pitching + stats.fielding;
        const average = total / 5;

        if (average >= 9) return 'S+ (Legendary)';
        if (average >= 8) return 'A+ (Star)';
        if (average >= 7) return 'A (All-Star)';
        if (average >= 6) return 'B+ (Great)';
        if (average >= 5) return 'B (Solid)';
        return 'C+ (Developing)';
    }

    /**
     * Get customization options
     */
    getOptions() {
        return this.options;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterCustomizationSystem;
}
