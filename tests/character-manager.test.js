/**
 * Tests for CharacterManager
 */

import CharacterManager from '../js/character-manager.js';

// Mock localStorage
const localStorageMock = {
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
global.localStorage = localStorageMock;

describe('CharacterManager', () => {
    let manager;

    beforeEach(() => {
        manager = new CharacterManager();
    });

    describe('calculateAbilityUses', () => {
        test('handles ultimate abilities (cooldown 99)', () => {
            expect(manager.calculateAbilityUses(99)).toBe(1);
        });

        test('handles cooldown of 1', () => {
            expect(manager.calculateAbilityUses(1)).toBe(9);
        });

        test('handles cooldown of 3', () => {
            expect(manager.calculateAbilityUses(3)).toBe(3);
        });

        test('handles cooldown of 5', () => {
            expect(manager.calculateAbilityUses(5)).toBe(1);
        });

        test('handles zero cooldown', () => {
            expect(manager.calculateAbilityUses(0)).toBe(1);
        });

        test('handles negative cooldown', () => {
            expect(manager.calculateAbilityUses(-5)).toBe(1);
        });
    });

    describe('stat conversion', () => {
        test('converts batting stat correctly', () => {
            expect(manager.convertBattingStat(1)).toBeCloseTo(0.2);
            expect(manager.convertBattingStat(10)).toBeCloseTo(0.4);
            expect(manager.convertBattingStat(5)).toBeCloseTo(0.3);
        });

        test('converts power stat correctly', () => {
            expect(manager.convertPowerStat(1)).toBeCloseTo(0.05);
            expect(manager.convertPowerStat(10)).toBeCloseTo(0.5);
        });

        test('converts speed stat correctly', () => {
            expect(manager.convertSpeedStat(1)).toBeCloseTo(0.5);
            expect(manager.convertSpeedStat(10)).toBeCloseTo(1.5);
        });

        test('converts pitching stat correctly', () => {
            expect(manager.convertPitchingStat(1)).toBeCloseTo(0.5);
            expect(manager.convertPitchingStat(10)).toBeCloseTo(1.0);
        });

        test('converts fielding stat correctly', () => {
            expect(manager.convertFieldingStat(1)).toBeCloseTo(0.6);
            expect(manager.convertFieldingStat(10)).toBeCloseTo(1.0);
        });
    });

    describe('overall rating', () => {
        test('rates A+ players correctly', () => {
            expect(manager.getOverallRating(9.0)).toBe('A+ Star Player');
        });

        test('rates B players correctly', () => {
            expect(manager.getOverallRating(6.0)).toBe('B Good Player');
        });

        test('rates C players correctly', () => {
            expect(manager.getOverallRating(4.0)).toBe('C Developing Player');
        });
    });
});
