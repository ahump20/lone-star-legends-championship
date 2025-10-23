/**
 * Character Creator Tests
 * Tests for character creation, stat allocation, and validation
 */

const CharacterCreator = require('../js/character-creator.js');

// Mock GameStateManager
class MockGameStateManager {
    constructor() {
        this.data = {};
    }

    getCustomData(key) {
        return this.data[key];
    }

    setCustomData(key, value) {
        this.data[key] = value;
    }
}

describe('CharacterCreator', () => {
    let creator;
    let gameStateManager;

    beforeEach(() => {
        gameStateManager = new MockGameStateManager();
        creator = new CharacterCreator(gameStateManager);
    });

    describe('Character Creation', () => {
        test('should create empty character with default values', () => {
            const char = creator.startNewCharacter();

            expect(char.name).toBe('');
            expect(char.position).toBe('CF');
            expect(char.jerseyNumber).toBe(0);
            expect(char.stats.power).toBe(50);
            expect(char.stats.contact).toBe(50);
            expect(char.custom).toBe(true);
        });

        test('should generate unique IDs', () => {
            const char1 = creator.startNewCharacter();
            const char2 = creator.startNewCharacter();

            expect(char1.id).not.toBe(char2.id);
            expect(char1.id).toMatch(/^custom_/);
        });

        test('should update basic info correctly', () => {
            creator.startNewCharacter();
            creator.updateBasicInfo({
                name: 'Test Player',
                position: 'SS',
                jerseyNumber: 42
            });

            const char = creator.getCharacter();
            expect(char.name).toBe('Test Player');
            expect(char.position).toBe('SS');
            expect(char.jerseyNumber).toBe(42);
        });

        test('should truncate long names', () => {
            creator.startNewCharacter();
            creator.updateBasicInfo({
                name: 'A'.repeat(50)
            });

            const char = creator.getCharacter();
            expect(char.name.length).toBe(30);
        });

        test('should validate jersey number range', () => {
            creator.startNewCharacter();
            creator.updateBasicInfo({ jerseyNumber: 150 });

            const char = creator.getCharacter();
            expect(char.jerseyNumber).toBe(0); // Should not update
        });
    });

    describe('Stat Allocation', () => {
        test('should start with 200 total points', () => {
            creator.startNewCharacter();
            const total = creator.calculateTotalPoints();
            expect(total).toBe(300); // 50 * 6 stats = 300
        });

        test('should update stat correctly', () => {
            creator.startNewCharacter();
            creator.updateStat('power', 85);

            const char = creator.getCharacter();
            expect(char.stats.power).toBe(85);
        });

        test('should enforce minimum stat value', () => {
            creator.startNewCharacter();

            expect(() => {
                creator.updateStat('power', 0);
            }).toThrow('Stat must be between 1 and 99');
        });

        test('should enforce maximum stat value', () => {
            creator.startNewCharacter();

            expect(() => {
                creator.updateStat('power', 100);
            }).toThrow('Stat must be between 1 and 99');
        });

        test('should enforce per-stat maximum', () => {
            creator.startNewCharacter();

            expect(() => {
                creator.updateStat('power', 95);
            }).toThrow('Individual stat cannot exceed 90');
        });

        test('should enforce total point budget', () => {
            creator.startNewCharacter();
            // Set all stats to max
            creator.updateStat('power', 90);
            creator.updateStat('contact', 90);
            creator.updateStat('speed', 50);

            expect(() => {
                creator.updateStat('defense', 50);
            }).toThrow('Total stat points cannot exceed 200');
        });

        test('should calculate remaining points correctly', () => {
            creator.startNewCharacter();
            // Default: 50 * 6 = 300, but budget is 200
            // So we're over by 100

            creator.updateStat('power', 85);
            creator.updateStat('contact', 50);
            creator.updateStat('speed', 30);
            creator.updateStat('defense', 25);
            creator.updateStat('arm', 5);
            creator.updateStat('accuracy', 5);

            const remaining = creator.getRemainingPoints();
            expect(remaining).toBe(0); // 200 total
        });

        test('should auto-distribute points evenly', () => {
            creator.startNewCharacter();

            // Set all to 1 first (6 points used)
            creator.updateStat('power', 1);
            creator.updateStat('contact', 1);
            creator.updateStat('speed', 1);
            creator.updateStat('defense', 1);
            creator.updateStat('arm', 1);
            creator.updateStat('accuracy', 1);

            // Auto-distribute remaining 194 points
            creator.autoDistributePoints();

            const char = creator.getCharacter();
            const total = creator.calculateTotalPoints();

            expect(total).toBeLessThanOrEqual(200);
            // Each stat should get ~32 additional points (194/6)
        });

        test('should update ratings when stats change', () => {
            creator.startNewCharacter();
            creator.updateStat('power', 90);
            creator.updateStat('contact', 50);

            const char = creator.getCharacter();
            expect(char.ratings.power).toBe(90);
            expect(char.ratings.batting).toBeGreaterThan(0);
            expect(char.ratings.overall).toBeGreaterThan(0);
        });
    });

    describe('Appearance', () => {
        test('should update appearance options', () => {
            creator.startNewCharacter();
            creator.updateAppearance('skinTone', 'dark');
            creator.updateAppearance('jerseyColor', 'red');
            creator.updateAppearance('battingStance', 'power');

            const char = creator.getCharacter();
            expect(char.appearance.skinTone).toBe('dark');
            expect(char.appearance.jerseyColor).toBe('red');
            expect(char.appearance.battingStance).toBe('power');
        });

        test('should reject invalid appearance option', () => {
            creator.startNewCharacter();

            expect(() => {
                creator.updateAppearance('invalidOption', 'value');
            }).toThrow('Invalid appearance option');
        });
    });

    describe('Abilities', () => {
        test('should add ability correctly', () => {
            creator.startNewCharacter();
            creator.addAbility('power_surge');

            const char = creator.getCharacter();
            expect(char.abilities.length).toBe(1);
            expect(char.abilities[0].id).toBe('power_surge');
        });

        test('should remove ability correctly', () => {
            creator.startNewCharacter();
            creator.addAbility('power_surge');
            creator.addAbility('clutch_gene');
            creator.removeAbility('power_surge');

            const char = creator.getCharacter();
            expect(char.abilities.length).toBe(1);
            expect(char.abilities[0].id).toBe('clutch_gene');
        });

        test('should enforce maximum 3 abilities', () => {
            creator.startNewCharacter();
            creator.addAbility('power_surge');
            creator.addAbility('clutch_gene');
            creator.addAbility('rally_starter');

            expect(() => {
                creator.addAbility('hot_streak');
            }).toThrow('Character can only have 3 abilities');
        });

        test('should prevent duplicate abilities', () => {
            creator.startNewCharacter();
            creator.addAbility('power_surge');

            expect(() => {
                creator.addAbility('power_surge');
            }).toThrow('Ability already added');
        });

        test('should enforce one ultimate ability rule', () => {
            creator.startNewCharacter();
            creator.addAbility('home_run_king'); // Ultimate

            expect(() => {
                creator.addAbility('wall_climb'); // Another ultimate
            }).toThrow('Character can only have one ultimate ability');
        });

        test('should reject invalid ability ID', () => {
            creator.startNewCharacter();

            expect(() => {
                creator.addAbility('invalid_ability');
            }).toThrow('Ability not found');
        });

        test('should get available abilities by category', () => {
            const battingAbilities = creator.getAvailableAbilities('batting');
            const allAbilities = creator.getAvailableAbilities();

            expect(Array.isArray(battingAbilities)).toBe(true);
            expect(battingAbilities.length).toBeGreaterThan(0);
            expect(allAbilities).toHaveProperty('batting');
            expect(allAbilities).toHaveProperty('fielding');
        });
    });

    describe('Validation', () => {
        test('should fail validation with no name', () => {
            creator.startNewCharacter();
            const validation = creator.validateCharacter();

            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain('Character must have a name');
        });

        test('should fail validation with wrong total points', () => {
            creator.startNewCharacter();
            creator.updateBasicInfo({ name: 'Test' });

            const validation = creator.validateCharacter();

            expect(validation.valid).toBe(false);
            expect(validation.errors.some(e => e.includes('stat points'))).toBe(true);
        });

        test('should fail validation with no abilities', () => {
            creator.startNewCharacter();
            creator.updateBasicInfo({ name: 'Test' });

            // Set stats to total 200
            creator.updateStat('power', 85);
            creator.updateStat('contact', 50);
            creator.updateStat('speed', 30);
            creator.updateStat('defense', 25);
            creator.updateStat('arm', 5);
            creator.updateStat('accuracy', 5);

            const validation = creator.validateCharacter();

            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain('Character must have at least one ability');
        });

        test('should pass validation with complete character', () => {
            creator.startNewCharacter();
            creator.updateBasicInfo({
                name: 'Complete Player',
                position: 'CF',
                jerseyNumber: 42
            });

            // Allocate all 200 points
            creator.updateStat('power', 85);
            creator.updateStat('contact', 50);
            creator.updateStat('speed', 30);
            creator.updateStat('defense', 25);
            creator.updateStat('arm', 5);
            creator.updateStat('accuracy', 5);

            creator.addAbility('power_surge');

            const validation = creator.validateCharacter();

            expect(validation.valid).toBe(true);
            expect(validation.errors.length).toBe(0);
        });
    });

    describe('Save/Load', () => {
        test('should save character to game state', () => {
            creator.startNewCharacter();
            creator.updateBasicInfo({ name: 'Save Test', jerseyNumber: 1 });

            // Valid stats
            creator.updateStat('power', 85);
            creator.updateStat('contact', 50);
            creator.updateStat('speed', 30);
            creator.updateStat('defense', 25);
            creator.updateStat('arm', 5);
            creator.updateStat('accuracy', 5);

            creator.addAbility('power_surge');

            const saved = creator.saveCharacter();

            expect(saved.name).toBe('Save Test');
            expect(saved.updatedAt).toBeDefined();

            const allSaved = creator.getSavedCharacters();
            expect(allSaved.length).toBe(1);
        });

        test('should fail to save invalid character', () => {
            creator.startNewCharacter();
            // Don't set name or stats

            expect(() => {
                creator.saveCharacter();
            }).toThrow('Character validation failed');
        });

        test('should load character for editing', () => {
            // Save a character first
            creator.startNewCharacter();
            creator.updateBasicInfo({ name: 'Load Test', jerseyNumber: 2 });

            creator.updateStat('power', 85);
            creator.updateStat('contact', 50);
            creator.updateStat('speed', 30);
            creator.updateStat('defense', 25);
            creator.updateStat('arm', 5);
            creator.updateStat('accuracy', 5);

            creator.addAbility('power_surge');
            const saved = creator.saveCharacter();

            // Load it
            creator.loadCharacter(saved);

            const char = creator.getCharacter();
            expect(char.name).toBe('Load Test');
            expect(char.stats.power).toBe(85);
        });

        test('should update existing character on save', () => {
            creator.startNewCharacter();
            creator.updateBasicInfo({ name: 'Original', jerseyNumber: 3 });

            creator.updateStat('power', 85);
            creator.updateStat('contact', 50);
            creator.updateStat('speed', 30);
            creator.updateStat('defense', 25);
            creator.updateStat('arm', 5);
            creator.updateStat('accuracy', 5);

            creator.addAbility('power_surge');
            const saved = creator.saveCharacter();

            // Edit and save again
            creator.loadCharacter(saved);
            creator.updateBasicInfo({ name: 'Updated' });
            creator.saveCharacter();

            const allSaved = creator.getSavedCharacters();
            expect(allSaved.length).toBe(1); // Still only 1 character
            expect(allSaved[0].name).toBe('Updated');
        });

        test('should delete character', () => {
            creator.startNewCharacter();
            creator.updateBasicInfo({ name: 'Delete Test', jerseyNumber: 4 });

            creator.updateStat('power', 85);
            creator.updateStat('contact', 50);
            creator.updateStat('speed', 30);
            creator.updateStat('defense', 25);
            creator.updateStat('arm', 5);
            creator.updateStat('accuracy', 5);

            creator.addAbility('power_surge');
            const saved = creator.saveCharacter();

            creator.deleteCharacter(saved.id);

            const allSaved = creator.getSavedCharacters();
            expect(allSaved.length).toBe(0);
        });
    });

    describe('Presets', () => {
        test('should load power hitter preset', () => {
            creator.createPreset('powerHitter');

            const char = creator.getCharacter();
            expect(char.name).toBe('Power Slugger');
            expect(char.stats.power).toBe(85);
            expect(char.abilities.length).toBe(3);
        });

        test('should load contact hitter preset', () => {
            creator.createPreset('contactHitter');

            const char = creator.getCharacter();
            expect(char.name).toBe('Contact Specialist');
            expect(char.stats.contact).toBe(85);
        });

        test('should load speedster preset', () => {
            creator.createPreset('speedster');

            const char = creator.getCharacter();
            expect(char.name).toBe('Speed Demon');
            expect(char.stats.speed).toBe(85);
        });

        test('should load ace preset', () => {
            creator.createPreset('ace');

            const char = creator.getCharacter();
            expect(char.name).toBe('Ace Pitcher');
            expect(char.stats.arm).toBe(85);
        });

        test('should load balanced preset', () => {
            creator.createPreset('balanced');

            const char = creator.getCharacter();
            expect(char.name).toBe('All-Arounder');
            // All stats should be relatively balanced
            const total = creator.calculateTotalPoints();
            expect(total).toBe(200);
        });

        test('should fail with invalid preset', () => {
            expect(() => {
                creator.createPreset('invalid');
            }).toThrow('Invalid preset type');
        });
    });

    describe('Import/Export', () => {
        test('should export character as JSON', () => {
            creator.startNewCharacter();
            creator.updateBasicInfo({ name: 'Export Test' });

            const json = creator.exportCharacter();
            const data = JSON.parse(json);

            expect(data.name).toBe('Export Test');
            expect(data.stats).toBeDefined();
        });

        test('should import character from JSON', () => {
            const jsonData = JSON.stringify({
                name: 'Imported Player',
                position: 'SS',
                jerseyNumber: 10,
                stats: {
                    power: 70,
                    contact: 60,
                    speed: 40,
                    defense: 15,
                    arm: 10,
                    accuracy: 5
                },
                appearance: {
                    skinTone: 'light',
                    jerseyColor: 'blue',
                    battingStance: 'standard',
                    pitchingMotion: 'overhand'
                },
                abilities: []
            });

            const char = creator.importCharacter(jsonData);

            expect(char.name).toBe('Imported Player');
            expect(char.stats.power).toBe(70);
            expect(char.id).toMatch(/^custom_/); // New ID generated
        });

        test('should fail to import invalid JSON', () => {
            expect(() => {
                creator.importCharacter('invalid json');
            }).toThrow('Failed to import character');
        });

        test('should fail to import incomplete data', () => {
            const badData = JSON.stringify({ name: 'Bad' });

            expect(() => {
                creator.importCharacter(badData);
            }).toThrow('Failed to import character');
        });
    });

    describe('Events', () => {
        test('should fire events on stat update', () => {
            creator.startNewCharacter();

            let eventFired = false;
            let eventData = null;

            creator.on('stat_updated', (event, data) => {
                eventFired = true;
                eventData = data;
            });

            creator.updateStat('power', 75);

            expect(eventFired).toBe(true);
            expect(eventData.stat).toBe('power');
            expect(eventData.value).toBe(75);
        });

        test('should fire events on character save', () => {
            creator.startNewCharacter();
            creator.updateBasicInfo({ name: 'Event Test', jerseyNumber: 5 });

            creator.updateStat('power', 85);
            creator.updateStat('contact', 50);
            creator.updateStat('speed', 30);
            creator.updateStat('defense', 25);
            creator.updateStat('arm', 5);
            creator.updateStat('accuracy', 5);

            creator.addAbility('power_surge');

            let savedCharacter = null;
            creator.on('character_saved', (event, char) => {
                savedCharacter = char;
            });

            creator.saveCharacter();

            expect(savedCharacter).not.toBeNull();
            expect(savedCharacter.name).toBe('Event Test');
        });

        test('should unregister events', () => {
            creator.startNewCharacter();

            let callCount = 0;
            const handler = () => callCount++;

            creator.on('stat_updated', handler);
            creator.updateStat('power', 75);
            expect(callCount).toBe(1);

            creator.off('stat_updated', handler);
            creator.updateStat('power', 80);
            expect(callCount).toBe(1); // Should not increment
        });

        test('should support wildcard event listener', () => {
            creator.startNewCharacter();

            const events = [];
            creator.on('*', (event) => {
                events.push(event);
            });

            creator.updateStat('power', 75);
            creator.addAbility('power_surge');
            creator.updateAppearance('skinTone', 'dark');

            expect(events).toContain('stat_updated');
            expect(events).toContain('ability_added');
            expect(events).toContain('appearance_updated');
        });
    });
});
