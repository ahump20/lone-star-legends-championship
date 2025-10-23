/**
 * Tests for AchievementSystem
 */

const AchievementSystem = require('../js/achievement-system.js');

// Mock localStorage
global.localStorage = {
    store: {},
    getItem(key) {
        return this.store[key] || null;
    },
    setItem(key, value) {
        this.store[key] = value.toString();
    },
    removeItem(key) {
        delete this.store[key];
    },
    clear() {
        this.store = {};
    },
};

describe('AchievementSystem', () => {
    let system;
    let mockGameStateManager;

    beforeEach(() => {
        localStorage.clear();
        mockGameStateManager = {};
        system = new AchievementSystem(mockGameStateManager);
    });

    describe('initialization', () => {
        test('initializes with achievements', () => {
            expect(system.achievements).toBeDefined();
            expect(Object.keys(system.achievements).length).toBeGreaterThan(0);
        });

        test('loads unlocked achievements from storage', () => {
            localStorage.setItem('sandlot_achievements', JSON.stringify({ first_game: { unlockedAt: Date.now() } }));
            const newSystem = new AchievementSystem(mockGameStateManager);
            expect(newSystem.unlockedAchievements.first_game).toBeDefined();
        });
    });

    describe('unlockAchievement', () => {
        test('unlocks achievement successfully', () => {
            const result = system.unlockAchievement('first_game');
            expect(result).toBe(true);
            expect(system.unlockedAchievements.first_game).toBeDefined();
        });

        test('does not unlock already unlocked achievement', () => {
            system.unlockAchievement('first_game');
            const result = system.unlockAchievement('first_game');
            expect(result).toBe(false);
        });

        test('returns false for invalid achievement', () => {
            const result = system.unlockAchievement('nonexistent');
            expect(result).toBe(false);
        });
    });

    describe('checkRequirement', () => {
        test('checks games_played requirement', () => {
            const req = { type: 'games_played', value: 5 };
            expect(system.checkRequirement(req, { gamesPlayed: 10 })).toBe(true);
            expect(system.checkRequirement(req, { gamesPlayed: 3 })).toBe(false);
        });

        test('checks total_hits requirement', () => {
            const req = { type: 'total_hits', value: 100 };
            expect(system.checkRequirement(req, { totalHits: 150 })).toBe(true);
            expect(system.checkRequirement(req, { totalHits: 50 })).toBe(false);
        });

        test('checks wins requirement', () => {
            const req = { type: 'wins', value: 10 };
            expect(system.checkRequirement(req, { wins: 15 })).toBe(true);
            expect(system.checkRequirement(req, { wins: 5 })).toBe(false);
        });
    });

    describe('getProgress', () => {
        test('calculates progress correctly', () => {
            system.unlockAchievement('first_game');
            system.unlockAchievement('first_hit');

            const progress = system.getProgress();
            expect(progress.unlocked).toBe(2);
            expect(progress.total).toBeGreaterThan(2);
            expect(parseFloat(progress.percentComplete)).toBeGreaterThan(0);
        });
    });

    describe('checkAchievements', () => {
        test('unlocks achievements based on stats', () => {
            const stats = {
                gamesPlayed: 1,
                totalHits: 1,
                wins: 1,
            };

            const newlyUnlocked = system.checkAchievements(stats);
            expect(newlyUnlocked.length).toBeGreaterThan(0);
            expect(newlyUnlocked.some(a => a.id === 'first_game')).toBe(true);
        });

        test('does not re-unlock achievements', () => {
            const stats = { gamesPlayed: 1 };
            system.checkAchievements(stats);
            const newlyUnlocked = system.checkAchievements(stats);
            expect(newlyUnlocked.length).toBe(0);
        });
    });
});
