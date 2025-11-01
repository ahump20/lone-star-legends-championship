/**
 * Backyard Legends Game Engine
 * A 3-inning baseball game with cartoon-style gameplay
 */

class BackyardGameEngine {
    constructor() {
        // Game configuration - 3 innings only!
        this.totalInnings = 3;
        this.currentInning = 1;
        this.isTopInning = true;
        
        // Count
        this.balls = 0;
        this.strikes = 0;
        this.outs = 0;
        
        // Bases (null = empty, player object = occupied)
        this.bases = [null, null, null]; // [1st, 2nd, 3rd]
        
        // Teams with fun, original names
        this.teams = {
            away: {
                name: 'Thunder Bats',
                mascot: '⚡',
                color: '#FF6B6B',
                score: 0,
                hits: 0,
                lineup: this.generateLineup('Thunder Bats'),
                currentBatter: 0
            },
            home: {
                name: 'Storm Sluggers',
                mascot: '⛈️',
                color: '#4ECDC4',
                score: 0,
                hits: 0,
                lineup: this.generateLineup('Storm Sluggers'),
                currentBatter: 0
            }
        };
        
        // Current states
        this.currentBattingTeam = this.teams.away;
        this.currentFieldingTeam = this.teams.home;
        
        // Game status
        this.gameStarted = false;
        this.gameOver = false;
        this.autoPlay = false;
        this.autoPlayInterval = null;
        
        // Play log
        this.playLog = [];
        
        // Stats
        this.stats = {
            totalPitches: 0,
            homeRuns: 0,
            strikeouts: 0,
            walks: 0
        };
    }
    
    generateLineup(teamName) {
        // Fun, original cartoon-style player names
        const funFirstNames = [
            'Buzzy', 'Rocket', 'Flash', 'Ace', 'Duke', 
            'Spike', 'Rex', 'Max', 'Dash', 'Storm'
        ];
        
        const funLastNames = [
            'Thunder', 'Lightning', 'Blaze', 'Rocket', 'Storm',
            'Flash', 'Bolt', 'Dash', 'Swift', 'Power'
        ];
        
        const positions = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
        
        // Shuffle names for variety
        const shuffledFirsts = [...funFirstNames].sort(() => Math.random() - 0.5);
        const shuffledLasts = [...funLastNames].sort(() => Math.random() - 0.5);
        
        return positions.map((pos, i) => ({
            name: `${shuffledFirsts[i]} ${shuffledLasts[i]}`,
            position: pos,
            number: Math.floor(Math.random() * 89) + 10,
            // Stats (higher for more exciting gameplay)
            battingAvg: 0.250 + Math.random() * 0.200, // .250 to .450
            power: 0.15 + Math.random() * 0.25, // 15-40% HR chance
            speed: 0.6 + Math.random() * 0.4, // 60-100% speed
            contact: 0.6 + Math.random() * 0.3, // 60-90% contact
            // Game stats
            atBats: 0,
            hits: 0,
            runs: 0,
            rbis: 0
        }));
    }
    
    startGame() {
        this.gameStarted = true;
        this.addToLog(`⚾ PLAY BALL! ${this.teams.away.name} vs ${this.teams.home.name}!`, true);
        this.addToLog(`Top of inning 1 - ${this.teams.away.name} batting`);
        this.updateUI();
    }
    
    throwPitch() {
        if (!this.gameStarted || this.gameOver) return;
        
        this.stats.totalPitches++;
        const outcome = this.determinePitchOutcome();
        this.processPitchOutcome(outcome);
        this.updateUI();
        
        // Check if inning or game is over
        if (this.outs >= 3) {
            this.endInning();
        }
    }
    
    determinePitchOutcome() {
        const batter = this.getCurrentBatter();
        const rand = Math.random();
        
        // Simplified outcomes for arcade-style gameplay
        if (rand < 0.15) {
            return 'ball';
        } else if (rand < 0.30) {
            return 'strike';
        } else if (rand < 0.38) {
            return 'foul';
        } else {
            // Ball in play!
            const contactRand = Math.random();
            
            if (contactRand < batter.power) {
                return 'home_run';
            } else if (contactRand < batter.power + 0.15) {
                return 'triple';
            } else if (contactRand < batter.power + 0.30) {
                return 'double';
            } else if (contactRand < batter.power + 0.45) {
                return 'single';
            } else {
                // Out
                const outRand = Math.random();
                if (outRand < 0.4) return 'fly_out';
                if (outRand < 0.7) return 'ground_out';
                return 'line_out';
            }
        }
    }
    
    processPitchOutcome(outcome) {
        const batter = this.getCurrentBatter();
        
        switch(outcome) {
            case 'ball':
                this.balls++;
                this.addToLog(`Ball ${this.balls}`);
                if (this.balls >= 4) {
                    this.walk();
                }
                break;
                
            case 'strike':
                this.strikes++;
                this.addToLog(`Strike ${this.strikes}! Swing and a miss!`);
                if (this.strikes >= 3) {
                    this.strikeout();
                }
                break;
                
            case 'foul':
                if (this.strikes < 2) {
                    this.strikes++;
                }
                this.addToLog(`Foul ball!`);
                break;
                
            case 'single':
                this.processHit(1, batter);
                break;
                
            case 'double':
                this.processHit(2, batter);
                break;
                
            case 'triple':
                this.processHit(3, batter);
                break;
                
            case 'home_run':
                this.processHomeRun(batter);
                break;
                
            case 'ground_out':
                this.processOut('grounds out to the infield');
                break;
                
            case 'fly_out':
                this.processOut('flies out to the outfield');
                break;
                
            case 'line_out':
                this.processOut('lines out sharply');
                break;
        }
    }
    
    walk() {
        const batter = this.getCurrentBatter();
        this.addToLog(`🚶 ${batter.name} walks to first base!`, true);
        this.stats.walks++;
        
        // Walk advances runners only by force
        let runsScored = 0;
        
        // If bases are loaded, runner on third scores
        if (this.bases[0] && this.bases[1] && this.bases[2]) {
            this.bases[2].runs++;
            runsScored++;
            this.currentBattingTeam.score++;
            batter.rbis++;
            // Move everyone up
            this.bases[2] = this.bases[1];
            this.bases[1] = this.bases[0];
        } else if (this.bases[0] && this.bases[1]) {
            // First and second occupied, move to second and third
            this.bases[2] = this.bases[1];
            this.bases[1] = this.bases[0];
        } else if (this.bases[0]) {
            // Only first occupied, move to second
            this.bases[1] = this.bases[0];
        }
        // Otherwise runners stay where they are (no force)
        
        // Put batter on first
        this.bases[0] = batter;
        
        if (runsScored > 0) {
            this.addToLog(`🎉 ${runsScored} run${runsScored > 1 ? 's' : ''} score!`, true);
        }
        
        this.nextBatter();
    }
    
    strikeout() {
        const batter = this.getCurrentBatter();
        this.outs++;
        this.stats.strikeouts++;
        this.addToLog(`❌ STRIKEOUT! ${batter.name} strikes out!`, true);
        batter.atBats++;
        this.nextBatter();
    }
    
    processHit(bases, batter) {
        const hitTypes = ['', 'single', 'double', 'triple'];
        this.addToLog(`💥 HIT! ${batter.name} hits a ${hitTypes[bases]}!`, true);
        
        batter.hits++;
        batter.atBats++;
        this.currentBattingTeam.hits++;
        
        // Advance runners and count runs
        const runsScored = this.advanceRunners(bases, true);
        
        // Place batter on base
        if (bases <= 3) {
            this.bases[bases - 1] = batter;
        }
        
        if (runsScored > 0) {
            this.currentBattingTeam.score += runsScored;
            batter.rbis += runsScored;
            this.addToLog(`🎉 ${runsScored} run${runsScored > 1 ? 's' : ''} score!`, true);
        }
        
        this.nextBatter();
    }
    
    processHomeRun(batter) {
        // Count runners on base
        let runnersOnBase = 0;
        this.bases.forEach(runner => {
            if (runner) {
                runnersOnBase++;
                runner.runs++;
            }
        });
        
        let totalRuns = runnersOnBase + 1; // Runners + batter
        
        this.addToLog(`🚀💥 HOME RUN!!! ${batter.name} crushes it out of the park!`, true);
        this.addToLog(`🎊 ${totalRuns} run${totalRuns > 1 ? 's' : ''} score!!!`, true);
        
        this.stats.homeRuns++;
        batter.hits++;
        batter.atBats++;
        batter.runs++;
        batter.rbis += runnersOnBase; // RBIs are only for runners driven in, not the batter
        this.currentBattingTeam.score += totalRuns;
        this.currentBattingTeam.hits++;
        
        // Clear bases
        this.bases = [null, null, null];
        
        this.nextBatter();
    }
    
    processOut(description) {
        const batter = this.getCurrentBatter();
        this.outs++;
        this.addToLog(`OUT! ${batter.name} ${description}.`);
        batter.atBats++;
        this.nextBatter();
    }
    
    advanceRunners(bases, isHit) {
        let runsScored = 0;
        
        // Move runners from third
        if (this.bases[2]) {
            if (isHit || bases >= 1) {
                this.bases[2].runs++;
                runsScored++;
                this.bases[2] = null;
            }
        }
        
        // Move runners from second
        if (this.bases[1]) {
            if (bases >= 2 || isHit) {
                if (bases >= 2) {
                    this.bases[1].runs++;
                    runsScored++;
                    this.bases[1] = null;
                } else {
                    this.bases[2] = this.bases[1];
                    this.bases[1] = null;
                }
            }
        }
        
        // Move runners from first
        if (this.bases[0]) {
            if (bases >= 3) {
                this.bases[0].runs++;
                runsScored++;
                this.bases[0] = null;
            } else if (bases >= 2) {
                this.bases[2] = this.bases[0];
                this.bases[0] = null;
            } else if (isHit) {
                this.bases[1] = this.bases[0];
                this.bases[0] = null;
            }
        }
        
        return runsScored;
    }
    
    nextBatter() {
        // Reset count
        this.balls = 0;
        this.strikes = 0;
        
        // Move to next batter
        this.currentBattingTeam.currentBatter = 
            (this.currentBattingTeam.currentBatter + 1) % this.currentBattingTeam.lineup.length;
    }
    
    endInning() {
        this.addToLog(`━━━━━━ End of ${this.isTopInning ? 'top' : 'bottom'} ${this.currentInning} ━━━━━━`, true);
        
        // Reset
        this.outs = 0;
        this.balls = 0;
        this.strikes = 0;
        this.bases = [null, null, null];
        
        if (!this.isTopInning) {
            // End of full inning
            this.currentInning++;
            
            if (this.currentInning > this.totalInnings) {
                this.endGame();
                return;
            }
            
            this.addToLog(`━━━━━━ INNING ${this.currentInning} ━━━━━━`, true);
        }
        
        // Switch teams
        this.isTopInning = !this.isTopInning;
        
        if (this.isTopInning) {
            this.currentBattingTeam = this.teams.away;
            this.currentFieldingTeam = this.teams.home;
            this.addToLog(`Top ${this.currentInning} - ${this.teams.away.name} batting`);
        } else {
            this.currentBattingTeam = this.teams.home;
            this.currentFieldingTeam = this.teams.away;
            this.addToLog(`Bottom ${this.currentInning} - ${this.teams.home.name} batting`);
        }
        
        this.updateUI();
    }
    
    endGame() {
        this.gameOver = true;
        this.gameStarted = false;
        
        if (this.autoPlay) {
            this.toggleAutoPlay();
        }
        
        const awayScore = this.teams.away.score;
        const homeScore = this.teams.home.score;
        
        let winner, loser;
        if (awayScore > homeScore) {
            winner = this.teams.away;
            loser = this.teams.home;
        } else if (homeScore > awayScore) {
            winner = this.teams.home;
            loser = this.teams.away;
        }
        
        if (winner) {
            this.addToLog(`🏆🎉 GAME OVER! ${winner.name} WIN! 🎉🏆`, true);
            this.addToLog(`Final Score: ${winner.name} ${winner.score}, ${loser.name} ${loser.score}`, true);
        } else {
            this.addToLog(`GAME OVER! It's a TIE! ${awayScore} - ${homeScore}`, true);
        }
        
        // Show game over screen
        this.showGameOverScreen();
    }
    
    showGameOverScreen() {
        const gameOverScreen = document.getElementById('gameOverScreen');
        const winnerText = document.getElementById('winnerText');
        const finalScoreText = document.getElementById('finalScoreText');
        
        const awayScore = this.teams.away.score;
        const homeScore = this.teams.home.score;
        
        if (awayScore > homeScore) {
            winnerText.textContent = `${this.teams.away.mascot} ${this.teams.away.name} WIN! ${this.teams.away.mascot}`;
        } else if (homeScore > awayScore) {
            winnerText.textContent = `${this.teams.home.mascot} ${this.teams.home.name} WIN! ${this.teams.home.mascot}`;
        } else {
            winnerText.textContent = "IT'S A TIE!";
        }
        
        finalScoreText.textContent = `Final Score: ${this.teams.away.name} ${awayScore} - ${homeScore} ${this.teams.home.name}`;
        
        gameOverScreen.classList.add('show');
    }
    
    getCurrentBatter() {
        return this.currentBattingTeam.lineup[this.currentBattingTeam.currentBatter];
    }
    
    toggleAutoPlay() {
        this.autoPlay = !this.autoPlay;
        
        const autoBtn = document.getElementById('autoBtn');
        const pitchBtn = document.getElementById('pitchBtn');
        
        if (this.autoPlay) {
            autoBtn.textContent = 'STOP AUTO';
            pitchBtn.disabled = true;
            this.autoPlayInterval = setInterval(() => {
                if (!this.gameOver) {
                    this.throwPitch();
                } else {
                    this.toggleAutoPlay();
                }
            }, 1000); // 1 second per pitch
        } else {
            autoBtn.textContent = 'AUTO PLAY';
            pitchBtn.disabled = false;
            if (this.autoPlayInterval) {
                clearInterval(this.autoPlayInterval);
                this.autoPlayInterval = null;
            }
        }
    }
    
    addToLog(message, important = false) {
        this.playLog.push({ message, important, timestamp: Date.now() });
        
        // Keep only last 50 entries
        if (this.playLog.length > 50) {
            this.playLog.shift();
        }
        
        // Update log display
        const logEntries = document.getElementById('logEntries');
        const entry = document.createElement('div');
        entry.className = 'log-entry' + (important ? ' important' : '');
        entry.textContent = message;
        logEntries.insertBefore(entry, logEntries.firstChild);
        
        // Keep only last 20 displayed
        while (logEntries.children.length > 20) {
            logEntries.removeChild(logEntries.lastChild);
        }
    }
    
    updateUI() {
        // Update team names and scores
        document.getElementById('awayTeamName').textContent = 
            `${this.teams.away.mascot} ${this.teams.away.name}`;
        document.getElementById('homeTeamName').textContent = 
            `${this.teams.home.mascot} ${this.teams.home.name}`;
        document.getElementById('awayScore').textContent = this.teams.away.score;
        document.getElementById('homeScore').textContent = this.teams.home.score;
        
        // Update inning
        document.getElementById('inningNumber').textContent = this.currentInning;
        document.getElementById('halfInning').textContent = this.isTopInning ? 'Top ▲' : 'Bottom ▼';
        
        // Update count
        this.updateCount('ballCircles', this.balls);
        this.updateCount('strikeCircles', this.strikes);
        this.updateCount('outCircles', this.outs);
        
        // Update bases
        document.getElementById('base1').classList.toggle('occupied', this.bases[0] !== null);
        document.getElementById('base2').classList.toggle('occupied', this.bases[1] !== null);
        document.getElementById('base3').classList.toggle('occupied', this.bases[2] !== null);
        
        // Update current batter
        const batter = this.getCurrentBatter();
        document.getElementById('batterName').textContent = batter.name;
        document.getElementById('batterAvg').textContent = batter.battingAvg.toFixed(3);
        document.getElementById('batterPos').textContent = batter.position;
    }
    
    updateCount(elementId, count) {
        const circles = document.getElementById(elementId).children;
        for (let i = 0; i < circles.length; i++) {
            circles[i].classList.toggle('active', i < count);
        }
    }
}

// Global game instance
let game = null;

function startGame() {
    game = new BackyardGameEngine();
    game.startGame();
    
    // Enable controls
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pitchBtn').disabled = false;
    document.getElementById('autoBtn').disabled = false;
}

function throwPitch() {
    if (game) {
        game.throwPitch();
    }
}

function toggleAuto() {
    if (game) {
        game.toggleAutoPlay();
    }
}

// Add keyboard controls
document.addEventListener('keydown', (e) => {
    if (!game || !game.gameStarted || game.gameOver) return;
    
    if (e.code === 'Space') {
        e.preventDefault();
        if (!game.autoPlay) {
            throwPitch();
        }
    }
});
