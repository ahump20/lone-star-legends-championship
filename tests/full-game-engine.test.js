/**
 * Tests for FullGameEngine
 */

import FullGameEngine from '../js/full-game-engine.js';

describe('FullGameEngine', () => {
    let engine;
    let mockHomeTeam;
    let mockAwayTeam;

    beforeEach(() => {
        mockHomeTeam = {
            name: 'Home Team',
            lineup: [
                { name: 'Player 1' },
                { name: 'Player 2' },
                { name: 'Player 3' },
            ],
        };

        mockAwayTeam = {
            name: 'Away Team',
            lineup: [
                { name: 'Player A' },
                { name: 'Player B' },
                { name: 'Player C' },
            ],
        };

        engine = new FullGameEngine({
            homeTeam: mockHomeTeam,
            awayTeam: mockAwayTeam,
        });
    });

    describe('initialization', () => {
        test('initializes with correct starting state', () => {
            expect(engine.currentInning).toBe(1);
            expect(engine.isTopOfInning).toBe(true);
            expect(engine.homeScore).toBe(0);
            expect(engine.awayScore).toBe(0);
            expect(engine.outs).toBe(0);
            expect(engine.balls).toBe(0);
            expect(engine.strikes).toBe(0);
        });

        test('initializes bases as empty', () => {
            expect(engine.bases).toEqual([null, null, null]);
        });
    });

    describe('getCurrentBatter', () => {
        test('returns away team batter when top of inning', () => {
            engine.isTopOfInning = true;
            const batter = engine.getCurrentBatter();
            expect(batter.name).toBe('Player A');
        });

        test('returns home team batter when bottom of inning', () => {
            engine.isTopOfInning = false;
            const batter = engine.getCurrentBatter();
            expect(batter.name).toBe('Player 1');
        });
    });

    describe('handleStrike', () => {
        test('increments strike count', () => {
            engine.handleStrike('strike_swinging');
            expect(engine.strikes).toBe(1);
        });

        test('handles strikeout on third strike', () => {
            engine.strikes = 2;
            engine.handleStrike('strike_swinging');
            expect(engine.outs).toBe(1);
            expect(engine.strikes).toBe(0); // Reset after strikeout
        });

        test('foul ball does not count as third strike', () => {
            engine.strikes = 2;
            engine.handleStrike('foul');
            expect(engine.strikes).toBe(2);
            expect(engine.outs).toBe(0);
        });
    });

    describe('handleBall', () => {
        test('increments ball count', () => {
            engine.handleBall();
            expect(engine.balls).toBe(1);
        });

        test('walks batter on fourth ball', () => {
            engine.balls = 3;
            engine.handleBall();
            expect(engine.bases[0]).toBeTruthy();
            expect(engine.balls).toBe(0); // Reset after walk
        });
    });

    describe('handleHit', () => {
        test('single places runner on first', () => {
            const batter = engine.getCurrentBatter();
            engine.handleHit('single');
            expect(engine.bases[0]).toBe(batter);
        });

        test('double places runner on second', () => {
            const batter = engine.getCurrentBatter();
            engine.handleHit('double');
            expect(engine.bases[1]).toBe(batter);
        });

        test('home run clears bases and scores runs', () => {
            engine.handleHit('home_run');
            expect(engine.awayScore).toBe(1); // Top of inning
            expect(engine.bases).toEqual([null, null, null]);
        });
    });

    describe('advanceRunners', () => {
        test('advances runners correctly', () => {
            engine.bases[0] = { name: 'Runner 1' };
            engine.bases[1] = { name: 'Runner 2' };

            const runsScored = engine.advanceRunners(1, true);
            expect(runsScored).toBe(0);
            expect(engine.bases[1]).toEqual({ name: 'Runner 1' });
            expect(engine.bases[2]).toEqual({ name: 'Runner 2' });
        });

        test('scores runners that advance past third', () => {
            engine.bases[2] = { name: 'Runner on 3rd' };
            const runsScored = engine.advanceRunners(1, true);
            expect(runsScored).toBe(1);
            expect(engine.bases[2]).toBe(null);
        });
    });

    describe('endInning', () => {
        test('switches from top to bottom of inning', () => {
            engine.isTopOfInning = true;
            engine.endInning();
            expect(engine.isTopOfInning).toBe(false);
            expect(engine.currentInning).toBe(1);
        });

        test('advances inning after bottom half', () => {
            engine.isTopOfInning = false;
            engine.endInning();
            expect(engine.isTopOfInning).toBe(true);
            expect(engine.currentInning).toBe(2);
        });

        test('clears bases at end of inning', () => {
            engine.bases = [{ name: 'R1' }, { name: 'R2' }, { name: 'R3' }];
            engine.endInning();
            expect(engine.bases).toEqual([null, null, null]);
        });
    });

    describe('game ending', () => {
        test('ends game after 9 innings if not tied', () => {
            engine.currentInning = 9;
            engine.isTopOfInning = false;
            engine.homeScore = 5;
            engine.awayScore = 3;
            engine.outs = 3;

            engine.endInning();
            expect(engine.gameOver).toBe(true);
            expect(engine.winner).toBe('home');
        });

        test('continues to extra innings if tied', () => {
            engine.currentInning = 9;
            engine.isTopOfInning = false;
            engine.homeScore = 3;
            engine.awayScore = 3;
            engine.outs = 3;

            engine.endInning();
            expect(engine.gameOver).toBe(false);
            expect(engine.currentInning).toBe(10);
        });
    });
});
