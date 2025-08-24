/**
 * Blaze Intelligence Baseball Game Engine
 * Full 9-inning baseball simulation with realistic gameplay
 */

class BaseballGameEngine {
    constructor() {
        // Game state
        this.innings = 9;
        this.currentInning = 1;
        this.isTopInning = true; // true = away team batting, false = home team batting
        this.outs = 0;
        this.strikes = 0;
        this.balls = 0;
        
        // Bases: [first, second, third]
        this.bases = [null, null, null];
        
        // Teams
        this.teams = {
            away: {
                name: 'Longhorns',
                score: 0,
                hits: 0,
                errors: 0,
                lineup: this.generateLineup('Longhorns'),
                currentBatter: 0,
                color: '#FF6B35'
            },
            home: {
                name: 'Cardinals',
                score: 0,
                hits: 0,
                errors: 0,
                lineup: this.generateLineup('Cardinals'),
                currentBatter: 0,
                color: '#C41E3A'
            }
        };
        
        // Current states
        this.currentBattingTeam = this.teams.away;
        this.currentFieldingTeam = this.teams.home;
        this.currentPitcher = this.currentFieldingTeam.lineup[0]; // First player is pitcher
        this.currentBatter = this.currentBattingTeam.lineup[this.currentBattingTeam.currentBatter];
        
        // Game log
        this.gameLog = [];
        this.playByPlay = [];
        
        // Game status
        this.gameStarted = false;
        this.gameOver = false;
        this.isPaused = false;
        
        // Statistics
        this.stats = {
            totalPitches: 0,
            totalHits: 0,
            totalRuns: 0,
            homeRuns: 0,
            strikeouts: 0,
            walks: 0
        };
    }
    
    generateLineup(teamName) {
        const positions = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
        const firstNames = ['Mike', 'John', 'David', 'Carlos', 'Luis', 'Jose', 'Tony', 'Pedro', 'Roberto'];
        const lastNames = ['Johnson', 'Martinez', 'Rodriguez', 'Garcia', 'Smith', 'Williams', 'Davis', 'Lopez', 'Gonzalez'];
        
        return positions.map((pos, i) => ({
            name: `${firstNames[i]} ${lastNames[8-i]}`,
            position: pos,
            number: Math.floor(Math.random() * 90) + 10,
            battingAverage: 0.200 + Math.random() * 0.150, // .200 to .350
            power: 0.1 + Math.random() * 0.3, // Home run probability
            speed: 0.5 + Math.random() * 0.5,
            fieldingSkill: 0.7 + Math.random() * 0.3,
            // Pitcher-specific stats
            pitchingSkill: pos === 'P' ? 0.6 + Math.random() * 0.4 : 0.3,
            stamina: 100,
            // Game stats
            atBats: 0,
            hits: 0,
            runs: 0,
            rbis: 0,
            strikeouts: 0,
            walks: 0
        }));
    }
    
    startGame() {
        this.gameStarted = true;
        this.isPaused = false;
        this.addToLog(`Play Ball! ${this.teams.away.name} vs ${this.teams.home.name}`);
        this.addToLog(`Top of the 1st inning`);
        this.updateGameState();
        return this.getGameState();
    }
    
    pitch() {
        if (this.gameOver || this.isPaused) return null;
        
        this.stats.totalPitches++;
        const pitcher = this.currentPitcher;
        const batter = this.currentBatter;
        
        // Pitcher fatigue affects accuracy
        const fatigueFactor = pitcher.stamina / 100;
        const pitchQuality = pitcher.pitchingSkill * fatigueFactor;
        
        // Determine pitch outcome
        const outcome = this.determinePitchOutcome(pitchQuality, batter.battingAverage);
        
        // Reduce pitcher stamina
        pitcher.stamina = Math.max(0, pitcher.stamina - 0.5);
        
        this.processPitchOutcome(outcome);
        this.updateGameState();
        
        return {
            outcome,
            gameState: this.getGameState()
        };
    }
    
    determinePitchOutcome(pitchQuality, battingAverage) {
        const random = Math.random();
        
        // Strike zone probability based on pitch quality
        const strikeZoneProbability = 0.6 * pitchQuality;
        
        if (random < strikeZoneProbability) {
            // Pitch in strike zone
            const swingProbability = 0.7; // Batters usually swing at strikes
            
            if (Math.random() < swingProbability) {
                // Batter swings
                const contactProbability = battingAverage * 3; // Roughly maps BA to contact rate
                
                if (Math.random() < contactProbability) {
                    // Contact made
                    return this.determineHitType(battingAverage);
                } else {
                    return 'swing_miss';
                }
            } else {
                // Batter doesn't swing at strike
                return 'called_strike';
            }
        } else {
            // Pitch outside strike zone
            const swingProbability = 0.3; // Sometimes batters chase
            
            if (Math.random() < swingProbability) {
                // Batter chases
                const contactProbability = battingAverage * 2; // Harder to hit bad pitches
                
                if (Math.random() < contactProbability) {
                    return this.determineHitType(battingAverage * 0.7); // Weaker contact on bad pitches
                } else {
                    return 'swing_miss';
                }
            } else {
                // Batter takes the pitch
                return 'ball';
            }
        }
    }
    
    determineHitType(battingAverage) {
        const batter = this.currentBatter;
        const random = Math.random();
        
        // Determine if it's a hit or an out
        if (random < battingAverage) {
            // It's a hit!
            const hitRandom = Math.random();
            
            if (hitRandom < batter.power * 0.3) {
                return 'home_run';
            } else if (hitRandom < 0.1) {
                return 'triple';
            } else if (hitRandom < 0.25) {
                return 'double';
            } else {
                return 'single';
            }
        } else {
            // Ball in play but out
            const outRandom = Math.random();
            
            if (outRandom < 0.4) {
                return 'ground_out';
            } else if (outRandom < 0.7) {
                return 'fly_out';
            } else if (outRandom < 0.85) {
                return 'line_out';
            } else {
                return 'foul_out';
            }
        }
    }
    
    processPitchOutcome(outcome) {
        const batter = this.currentBatter;
        
        switch(outcome) {
            case 'ball':
                this.balls++;
                this.addToLog(`Ball ${this.balls}`);
                if (this.balls >= 4) {
                    this.walk();
                }
                break;
                
            case 'called_strike':
            case 'swing_miss':
                this.strikes++;
                this.addToLog(`Strike ${this.strikes}!`);
                if (this.strikes >= 3) {
                    this.strikeout();
                }
                break;
                
            case 'foul':
                if (this.strikes < 2) {
                    this.strikes++;
                }
                this.addToLog(`Foul ball`);
                break;
                
            case 'single':
                this.processHit(1);
                break;
                
            case 'double':
                this.processHit(2);
                break;
                
            case 'triple':
                this.processHit(3);
                break;
                
            case 'home_run':
                this.processHomeRun();
                break;
                
            case 'ground_out':
            case 'fly_out':
            case 'line_out':
            case 'foul_out':
                this.processOut(outcome);
                break;
        }
    }
    
    processHit(bases) {
        const batter = this.currentBatter;
        const team = this.currentBattingTeam;
        
        // Update stats
        batter.hits++;
        batter.atBats++;
        team.hits++;
        this.stats.totalHits++;
        
        const hitTypes = ['', 'singles', 'doubles', 'triples'];
        this.addToLog(`${batter.name} ${hitTypes[bases]} to ${this.getFieldPosition()}!`);
        
        // Move runners
        const runsScored = this.advanceRunners(bases, batter);
        
        // Update RBIs
        batter.rbis += runsScored;
        
        // Reset count for next batter
        this.nextBatter();
    }
    
    processHomeRun() {
        const batter = this.currentBatter;
        const team = this.currentBattingTeam;
        
        // Count runners on base
        let runsScored = 1; // The batter scores
        this.bases.forEach(runner => {
            if (runner) runsScored++;
        });
        
        this.addToLog(`🔥 HOME RUN! ${batter.name} hits it out of the park! ${runsScored} run${runsScored > 1 ? 's' : ''} score!`);
        
        // Clear the bases
        this.bases = [null, null, null];
        
        // Update scores and stats
        team.score += runsScored;
        this.stats.totalRuns += runsScored;
        this.stats.homeRuns++;
        batter.hits++;
        batter.atBats++;
        batter.runs++;
        batter.rbis += runsScored;
        team.hits++;
        this.stats.totalHits++;
        
        this.nextBatter();
    }
    
    advanceRunners(basesToAdvance, batter) {
        let runsScored = 0;
        const team = this.currentBattingTeam;
        
        // Move existing runners
        for (let i = 2; i >= 0; i--) {
            if (this.bases[i]) {
                const newBase = i + basesToAdvance;
                if (newBase >= 3) {
                    // Runner scores
                    runsScored++;
                    team.score++;
                    this.stats.totalRuns++;
                    this.bases[i].runs++;
                    this.addToLog(`${this.bases[i].name} scores!`);
                    this.bases[i] = null;
                } else {
                    // Move runner to new base
                    this.bases[newBase] = this.bases[i];
                    this.bases[i] = null;
                }
            }
        }
        
        // Place batter on base
        if (basesToAdvance <= 3) {
            this.bases[basesToAdvance - 1] = batter;
        }
        
        return runsScored;
    }
    
    walk() {
        const batter = this.currentBatter;
        const team = this.currentBattingTeam;
        
        this.addToLog(`${batter.name} walks`);
        batter.walks++;
        this.stats.walks++;
        
        // Move runners if forced
        let runsScored = 0;
        if (this.bases[0]) {
            // First base occupied, check for force situations
            if (this.bases[1] && this.bases[2]) {
                // Bases loaded - runner from third scores
                runsScored = 1;
                team.score++;
                this.stats.totalRuns++;
                this.bases[2].runs++;
                this.addToLog(`${this.bases[2].name} scores on the walk!`);
                this.bases[2] = this.bases[1];
                this.bases[1] = this.bases[0];
            } else if (this.bases[1]) {
                // First and second occupied
                this.bases[2] = this.bases[1];
                this.bases[1] = this.bases[0];
            } else {
                // Only first occupied
                this.bases[1] = this.bases[0];
            }
        }
        
        // Put batter on first
        this.bases[0] = batter;
        batter.rbis += runsScored;
        
        this.nextBatter();
    }
    
    strikeout() {
        const batter = this.currentBatter;
        
        this.addToLog(`${batter.name} strikes out!`);
        batter.strikeouts++;
        batter.atBats++;
        this.stats.strikeouts++;
        
        this.outs++;
        this.checkInningEnd();
        
        if (!this.gameOver && this.outs < 3) {
            this.nextBatter();
        }
    }
    
    processOut(type) {
        const batter = this.currentBatter;
        batter.atBats++;
        
        const fieldPositions = {
            'ground_out': ['shortstop', 'second base', 'third base', 'first base'],
            'fly_out': ['center field', 'left field', 'right field'],
            'line_out': ['shortstop', 'second base', 'pitcher'],
            'foul_out': ['catcher', 'first base', 'third base']
        };
        
        const position = fieldPositions[type][Math.floor(Math.random() * fieldPositions[type].length)];
        this.addToLog(`${batter.name} ${type.replace('_', ' ')} to ${position}`);
        
        this.outs++;
        this.checkInningEnd();
        
        if (!this.gameOver && this.outs < 3) {
            this.nextBatter();
        }
    }
    
    nextBatter() {
        // Reset count
        this.strikes = 0;
        this.balls = 0;
        
        // Move to next batter in lineup
        this.currentBattingTeam.currentBatter = (this.currentBattingTeam.currentBatter + 1) % 9;
        this.currentBatter = this.currentBattingTeam.lineup[this.currentBattingTeam.currentBatter];
        
        this.addToLog(`Now batting: ${this.currentBatter.name}`);
    }
    
    checkInningEnd() {
        if (this.outs >= 3) {
            this.endHalfInning();
        }
    }
    
    endHalfInning() {
        // Clear bases
        this.bases = [null, null, null];
        this.outs = 0;
        this.strikes = 0;
        this.balls = 0;
        
        if (this.isTopInning) {
            // Switch to bottom of inning
            this.isTopInning = false;
            this.currentBattingTeam = this.teams.home;
            this.currentFieldingTeam = this.teams.away;
            this.addToLog(`Bottom of inning ${this.currentInning}`);
        } else {
            // Move to next inning
            this.currentInning++;
            
            if (this.currentInning > this.innings) {
                // Check if game is over
                if (this.teams.home.score !== this.teams.away.score) {
                    this.endGame();
                    return;
                } else {
                    // Extra innings
                    this.addToLog(`Extra innings! Score tied ${this.teams.home.score}-${this.teams.away.score}`);
                }
            }
            
            this.isTopInning = true;
            this.currentBattingTeam = this.teams.away;
            this.currentFieldingTeam = this.teams.home;
            
            if (this.currentInning <= this.innings || this.teams.home.score === this.teams.away.score) {
                this.addToLog(`Top of inning ${this.currentInning}`);
            }
        }
        
        // Reset pitcher and batter
        this.currentPitcher = this.currentFieldingTeam.lineup[0];
        this.currentBatter = this.currentBattingTeam.lineup[this.currentBattingTeam.currentBatter];
    }
    
    endGame() {
        this.gameOver = true;
        const winner = this.teams.home.score > this.teams.away.score ? this.teams.home : this.teams.away;
        const loser = winner === this.teams.home ? this.teams.away : this.teams.home;
        
        this.addToLog(`🏆 GAME OVER! ${winner.name} wins ${winner.score}-${loser.score}!`);
        this.addToLog(`Total hits: ${this.teams.home.hits + this.teams.away.hits}`);
        this.addToLog(`Home runs: ${this.stats.homeRuns}`);
        this.addToLog(`Strikeouts: ${this.stats.strikeouts}`);
    }
    
    getFieldPosition() {
        const positions = ['left field', 'center field', 'right field', 'the gap', 'down the line'];
        return positions[Math.floor(Math.random() * positions.length)];
    }
    
    addToLog(message) {
        const timestamp = new Date().toLocaleTimeString();
        this.gameLog.push({ timestamp, message });
        this.playByPlay.unshift(message);
        if (this.playByPlay.length > 10) {
            this.playByPlay.pop();
        }
    }
    
    updateGameState() {
        // Update any UI or state listeners here
    }
    
    getGameState() {
        return {
            inning: this.currentInning,
            isTopInning: this.isTopInning,
            outs: this.outs,
            strikes: this.strikes,
            balls: this.balls,
            bases: this.bases.map(player => player ? player.name : null),
            teams: {
                away: {
                    name: this.teams.away.name,
                    score: this.teams.away.score,
                    hits: this.teams.away.hits,
                    errors: this.teams.away.errors
                },
                home: {
                    name: this.teams.home.name,
                    score: this.teams.home.score,
                    hits: this.teams.home.hits,
                    errors: this.teams.home.errors
                }
            },
            currentBatter: this.currentBatter ? this.currentBatter.name : null,
            currentPitcher: this.currentPitcher ? this.currentPitcher.name : null,
            gameStarted: this.gameStarted,
            gameOver: this.gameOver,
            playByPlay: this.playByPlay,
            stats: this.stats
        };
    }
    
    // Control methods
    pauseGame() {
        this.isPaused = true;
        this.addToLog('Game paused');
    }
    
    resumeGame() {
        this.isPaused = false;
        this.addToLog('Game resumed');
    }
    
    resetGame() {
        // Reset to initial state
        Object.assign(this, new BaseballGameEngine());
        this.addToLog('Game reset');
    }
    
    simulateInning() {
        if (this.gameOver) return;
        
        const startInning = this.currentInning;
        while (this.currentInning === startInning && !this.gameOver) {
            this.pitch();
        }
    }
    
    simulateGame() {
        if (!this.gameStarted) {
            this.startGame();
        }
        
        while (!this.gameOver) {
            this.pitch();
        }
        
        return this.getGameState();
    }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaseballGameEngine;
}