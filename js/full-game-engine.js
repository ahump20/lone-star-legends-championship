/**
 * Full Game Engine
 * Implements proper baseball rules and game flow
 */

class FullGameEngine {
    constructor(options = {}) {
        this.homeTeam = options.homeTeam;
        this.awayTeam = options.awayTeam;
        this.innings = options.innings || 9;
        this.stadium = options.stadium;

        // Game state
        this.currentInning = 1;
        this.isTopOfInning = true; // true = away team batting
        this.homeScore = 0;
        this.awayScore = 0;

        // Current play state
        this.outs = 0;
        this.balls = 0;
        this.strikes = 0;
        this.bases = [null, null, null]; // [1st, 2nd, 3rd]

        // Lineup tracking
        this.homeBatterIndex = 0;
        this.awayBatterIndex = 0;
        this.homePitcherIndex = 0;
        this.awayPitcherIndex = 0;

        // Game stats
        this.gameLog = [];
        this.boxScore = this.initializeBoxScore();
        this.gameOver = false;
        this.winner = null;

        // Event listeners
        this.listeners = {};
    }

    /**
     * Initialize box score tracking
     */
    initializeBoxScore() {
        return {
            home: {
                runs: Array(this.innings).fill(0),
                hits: 0,
                errors: 0,
                leftOnBase: 0,
            },
            away: {
                runs: Array(this.innings).fill(0),
                hits: 0,
                errors: 0,
                leftOnBase: 0,
            },
        };
    }

    /**
     * Get current batting team
     */
    getCurrentBattingTeam() {
        return this.isTopOfInning ? this.awayTeam : this.homeTeam;
    }

    /**
     * Get current fielding team
     */
    getCurrentFieldingTeam() {
        return this.isTopOfInning ? this.homeTeam : this.awayTeam;
    }

    /**
     * Get current batter
     */
    getCurrentBatter() {
        const team = this.getCurrentBattingTeam();
        const index = this.isTopOfInning ? this.awayBatterIndex : this.homeBatterIndex;
        return team.lineup[index % team.lineup.length];
    }

    /**
     * Get current pitcher
     */
    getCurrentPitcher() {
        const team = this.getCurrentFieldingTeam();
        const index = this.isTopOfInning ? this.homePitcherIndex : this.awayPitcherIndex;
        return team.lineup[index % team.lineup.length];
    }

    /**
     * Process pitch result
     */
    processPitch(result) {
        this.gameLog.push({
            inning: this.currentInning,
            isTop: this.isTopOfInning,
            batter: this.getCurrentBatter().name,
            pitcher: this.getCurrentPitcher().name,
            result: result,
            timestamp: Date.now(),
        });

        switch (result) {
            case 'strike_swinging':
            case 'strike_looking':
            case 'foul':
                this.handleStrike(result);
                break;
            case 'ball':
                this.handleBall();
                break;
            case 'single':
            case 'double':
            case 'triple':
            case 'home_run':
                this.handleHit(result);
                break;
            case 'ground_out':
            case 'fly_out':
            case 'line_out':
                this.handleOut(result);
                break;
            case 'walk':
                this.handleWalk();
                break;
            case 'hit_by_pitch':
                this.handleHitByPitch();
                break;
            default:
                console.warn('Unknown pitch result:', result);
        }

        this.emit('pitchResult', {
            result,
            count: { balls: this.balls, strikes: this.strikes },
            outs: this.outs,
            bases: this.bases,
        });

        // Check if inning is over
        if (this.outs >= 3) {
            this.endInning();
        }
    }

    /**
     * Handle strike
     */
    handleStrike(type) {
        // Foul balls don't count as third strike
        if (type === 'foul' && this.strikes >= 2) {
            return;
        }

        this.strikes++;

        if (this.strikes >= 3) {
            this.handleStrikeout();
        }
    }

    /**
     * Handle ball
     */
    handleBall() {
        this.balls++;

        if (this.balls >= 4) {
            this.handleWalk();
        }
    }

    /**
     * Handle strikeout
     */
    handleStrikeout() {
        this.outs++;
        this.nextBatter();
        this.emit('strikeout', { batter: this.getCurrentBatter() });
    }

    /**
     * Handle walk
     */
    handleWalk() {
        const batter = this.getCurrentBatter();
        this.advanceRunners(1, false);
        this.bases[0] = batter;
        this.nextBatter();
        this.emit('walk', { batter });
    }

    /**
     * Handle hit by pitch
     */
    handleHitByPitch() {
        const batter = this.getCurrentBatter();
        this.advanceRunners(1, false);
        this.bases[0] = batter;
        this.nextBatter();
        this.emit('hitByPitch', { batter });
    }

    /**
     * Handle hit
     */
    handleHit(type) {
        const batter = this.getCurrentBatter();
        const bases = { single: 1, double: 2, triple: 3, home_run: 4 }[type];

        // Track hit in box score
        const side = this.isTopOfInning ? 'away' : 'home';
        this.boxScore[side].hits++;

        // Score runners and advance batter
        const runsScored = this.advanceRunners(bases, true);

        // Update score
        if (this.isTopOfInning) {
            this.awayScore += runsScored;
            this.boxScore.away.runs[this.currentInning - 1] += runsScored;
        } else {
            this.homeScore += runsScored;
            this.boxScore.home.runs[this.currentInning - 1] += runsScored;
        }

        // Place batter on base (unless home run)
        if (bases < 4) {
            this.bases[bases - 1] = batter;
        }

        this.nextBatter();
        this.emit('hit', { type, batter, runsScored });
    }

    /**
     * Handle out
     */
    handleOut(type) {
        this.outs++;
        this.nextBatter();
        this.emit('out', { type, batter: this.getCurrentBatter() });
    }

    /**
     * Advance runners on bases
     */
    advanceRunners(basesToAdvance, includeRunners) {
        let runsScored = 0;

        // New array for updated bases
        const newBases = [null, null, null];

        // Process each base in reverse order (3rd to 1st)
        for (let i = 2; i >= 0; i--) {
            const runner = this.bases[i];
            if (!runner) {
                continue;
            }

            const newBase = i + basesToAdvance;

            if (newBase >= 3) {
                // Runner scores
                runsScored++;
                this.emit('runScored', { runner });
            } else {
                // Runner advances but doesn't score
                newBases[newBase] = runner;
            }
        }

        this.bases = newBases;
        return runsScored;
    }

    /**
     * Move to next batter
     */
    nextBatter() {
        // Reset count
        this.balls = 0;
        this.strikes = 0;

        // Increment batter index
        if (this.isTopOfInning) {
            this.awayBatterIndex++;
        } else {
            this.homeBatterIndex++;
        }
    }

    /**
     * End current inning
     */
    endInning() {
        const side = this.isTopOfInning ? 'away' : 'home';

        // Count left on base
        const leftOnBase = this.bases.filter(b => b !== null).length;
        this.boxScore[side].leftOnBase += leftOnBase;

        // Clear bases
        this.bases = [null, null, null];
        this.outs = 0;
        this.balls = 0;
        this.strikes = 0;

        this.emit('inningEnd', {
            inning: this.currentInning,
            isTop: this.isTopOfInning,
            score: { home: this.homeScore, away: this.awayScore },
        });

        if (this.isTopOfInning) {
            // Switch to bottom of inning
            this.isTopOfInning = false;
        } else {
            // Move to next inning
            this.isTopOfInning = true;
            this.currentInning++;

            // Check if game is over
            if (this.currentInning > this.innings) {
                this.checkGameOver();
            }
        }
    }

    /**
     * Check if game is over
     */
    checkGameOver() {
        // Game ends after 9 innings if score is not tied
        if (this.currentInning > this.innings) {
            if (this.homeScore !== this.awayScore) {
                this.endGame();
            } else {
                // Extra innings
                console.info('⚾ Extra innings!');
            }
        }

        // Walk-off victory (home team wins in bottom of 9th or later)
        if (!this.isTopOfInning && this.homeScore > this.awayScore && this.currentInning >= this.innings) {
            this.endGame();
        }
    }

    /**
     * End the game
     */
    endGame() {
        this.gameOver = true;
        this.winner = this.homeScore > this.awayScore ? 'home' : 'away';

        this.emit('gameEnd', {
            winner: this.winner,
            finalScore: { home: this.homeScore, away: this.awayScore },
            innings: this.currentInning - 1,
            boxScore: this.boxScore,
        });

        console.info(`⚾ Game Over! ${this.winner === 'home' ? this.homeTeam.name : this.awayTeam.name} wins!`);
    }

    /**
     * Get game state
     */
    getGameState() {
        return {
            currentInning: this.currentInning,
            isTopOfInning: this.isTopOfInning,
            homeScore: this.homeScore,
            awayScore: this.awayScore,
            outs: this.outs,
            balls: this.balls,
            strikes: this.strikes,
            bases: this.bases,
            currentBatter: this.getCurrentBatter(),
            currentPitcher: this.getCurrentPitcher(),
            gameOver: this.gameOver,
            winner: this.winner,
        };
    }

    /**
     * Get box score
     */
    getBoxScore() {
        return {
            ...this.boxScore,
            homeTotal: this.homeScore,
            awayTotal: this.awayScore,
        };
    }

    /**
     * Register event listener
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    /**
     * Emit event
     */
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Event listener error (${event}):`, error);
                }
            });
        }
    }

    /**
     * Pause game
     */
    pause() {
        this.paused = true;
        this.emit('pause', {});
    }

    /**
     * Resume game
     */
    resume() {
        this.paused = false;
        this.emit('resume', {});
    }
}

// Export for ES modules
export default FullGameEngine;
