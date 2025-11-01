/**
 * Complete GameState implementation for Backyard Baseball style game.
 * Handles all game logic including pitching, batting, baserunning, and scoring.
 */
export class GameState {
    constructor() {
        this.maxInnings = 3;
        // Teams
        this.homeTeam = null;
        this.awayTeam = null;
        this.currentBatterIndex = 0;
        // Baserunners
        this.bases = { 1: null, 2: null, 3: null };
        // Current play state
        this.currentPitcher = null;
        this.currentBatter = null;
        this.gameOver = false;
        this.winner = null;
        // Animation/physics state
        this.pitchInProgress = false;
        this.ballInPlay = false;
        this.lastPlayResult = null;
        this.players = [];
        this.ball = { x: 512, y: 384, vx: 0, vy: 0, active: false };
        this.inning = 1;
        this.inningHalf = "top";
        this.balls = 0;
        this.strikes = 0;
        this.outs = 0;
    }
    /**
     * Initialize the game with two teams
     */
    initializeGame(homeTeam, awayTeam) {
        this.homeTeam = homeTeam;
        this.awayTeam = awayTeam;
        this.homeTeam.score = 0;
        this.awayTeam.score = 0;
        this.currentBatterIndex = 0;
        // Set up initial positions
        this.setupFieldPositions();
        this.updateCurrentPlayers();
    }
    /**
     * Set up field positions for all players
     */
    setupFieldPositions() {
        const fieldPositions = {
            'P': { x: 512, y: 480 },
            'C': { x: 512, y: 600 },
            '1B': { x: 620, y: 450 },
            '2B': { x: 580, y: 350 },
            '3B': { x: 404, y: 450 },
            'SS': { x: 444, y: 350 },
            'LF': { x: 300, y: 250 },
            'CF': { x: 512, y: 200 },
            'RF': { x: 724, y: 250 }
        };
        this.players = [];
        const fieldingTeam = this.inningHalf === 'top' ? this.homeTeam : this.awayTeam;
        if (fieldingTeam) {
            fieldingTeam.roster.forEach((player) => {
                const pos = fieldPositions[player.position];
                if (pos) {
                    this.players.push({
                        x: pos.x,
                        y: pos.y,
                        team: fieldingTeam.id,
                        position: player.position
                    });
                }
            });
        }
    }
    /**
     * Update current pitcher and batter
     */
    updateCurrentPlayers() {
        const battingTeam = this.inningHalf === 'top' ? this.awayTeam : this.homeTeam;
        const fieldingTeam = this.inningHalf === 'top' ? this.homeTeam : this.awayTeam;
        if (battingTeam && fieldingTeam) {
            this.currentBatter = battingTeam.roster[this.currentBatterIndex % battingTeam.roster.length];
            this.currentPitcher = fieldingTeam.roster.find(p => p.position === 'P') || fieldingTeam.roster[0];
        }
    }
    /**
     * Main update loop
     */
    update() {
        // Update ball physics if in play
        if (this.ballInPlay && this.ball.active) {
            this.ball.x += this.ball.vx;
            this.ball.y += this.ball.vy;
            // Apply gravity/friction
            this.ball.vy += 0.2;
            this.ball.vx *= 0.98;
            // Check if ball landed
            if (this.ball.y >= 400) {
                this.resolveBallLanding();
            }
        }
    }
    /**
     * Pitch the ball with location and speed
     */
    pitch(location, speed = 1.0) {
        if (this.pitchInProgress || this.gameOver)
            return;
        this.pitchInProgress = true;
        this.ball.active = true;
        this.ball.x = 512;
        this.ball.y = 480;
        this.ball.vx = (location.x - 512) * 0.1;
        this.ball.vy = (location.y - 480) * 0.15 * speed;
        // Auto-resolve after short delay
        setTimeout(() => {
            this.pitchInProgress = false;
        }, 500);
    }
    /**
     * Batter swings at the pitch
     */
    swingBat(timing = 0.5, power = 0.5) {
        if (!this.currentBatter || !this.currentPitcher || this.gameOver) {
            return { type: 'strike' };
        }
        const batter = this.currentBatter;
        const pitcher = this.currentPitcher;
        // Calculate hit probability based on stats and timing
        const battingSkill = batter.stats.batting / 10;
        const pitchingSkill = pitcher.stats.pitching / 10;
        const timingBonus = 1 - Math.abs(timing - 0.5) * 2; // Best at 0.5
        const hitChance = (battingSkill * 0.5 + timingBonus * 0.3 - pitchingSkill * 0.2);
        const roll = Math.random();
        let result;
        if (roll < hitChance * 0.3) {
            // Hit!
            result = this.determineHitType(batter, power);
            this.handleHit(result);
        }
        else if (roll < hitChance * 0.5) {
            // Foul ball
            result = { type: 'foul' };
            if (this.strikes < 2) {
                this.strikes++;
            }
        }
        else if (roll < hitChance) {
            // Ball in play but out
            result = this.determineOutType(batter);
            this.handleOut(result);
        }
        else {
            // Strike
            result = { type: 'strike' };
            this.strikes++;
            // Strikeout
            if (this.strikes >= 3) {
                this.handleStrikeout();
            }
        }
        this.lastPlayResult = result;
        if (this.onPitchResult) {
            this.onPitchResult(result);
        }
        return result;
    }
    /**
     * Take a pitch without swinging
     */
    takePitch() {
        if (!this.currentPitcher || this.gameOver) {
            return { type: 'ball' };
        }
        const pitcher = this.currentPitcher;
        const control = pitcher.stats.pitching / 10;
        // Determine if pitch is a strike or ball
        const strikeChance = 0.5 + (control * 0.2);
        const roll = Math.random();
        let result;
        if (roll < strikeChance) {
            result = { type: 'strike' };
            this.strikes++;
            if (this.strikes >= 3) {
                this.handleStrikeout();
            }
        }
        else {
            result = { type: 'ball' };
            this.balls++;
            // Walk
            if (this.balls >= 4) {
                this.handleWalk();
            }
        }
        this.lastPlayResult = result;
        if (this.onPitchResult) {
            this.onPitchResult(result);
        }
        return result;
    }
    /**
     * Determine the type of hit based on batter stats and power
     */
    determineHitType(batter, power) {
        const powerStat = batter.stats.power / 10;
        const combinedPower = (powerStat * 0.7 + power * 0.3);
        const roll = Math.random();
        if (roll < combinedPower * 0.15) {
            return { type: 'hit', hitType: 'homerun', power: combinedPower };
        }
        else if (roll < combinedPower * 0.3) {
            return { type: 'hit', hitType: 'triple', power: combinedPower };
        }
        else if (roll < combinedPower * 0.5) {
            return { type: 'hit', hitType: 'double', power: combinedPower };
        }
        else {
            return { type: 'hit', hitType: 'single', power: combinedPower };
        }
    }
    /**
     * Determine type of out
     */
    determineOutType(batter) {
        const roll = Math.random();
        if (roll < 0.4) {
            return { type: 'hit', hitType: 'groundout' };
        }
        else if (roll < 0.8) {
            return { type: 'hit', hitType: 'flyout' };
        }
        else {
            return { type: 'hit', hitType: 'lineout' };
        }
    }
    /**
     * Handle a hit
     */
    handleHit(result) {
        if (!result.hitType)
            return;
        // Activate ball animation
        this.ballInPlay = true;
        this.ball.active = true;
        // Advance runners based on hit type
        const basesToAdvance = {
            'single': 1,
            'double': 2,
            'triple': 3,
            'homerun': 4
        }[result.hitType] || 0;
        this.advanceRunners(basesToAdvance);
        // Reset count
        this.balls = 0;
        this.strikes = 0;
        // Next batter
        this.nextBatter();
    }
    /**
     * Handle an out
     */
    handleOut(result) {
        this.outs++;
        this.balls = 0;
        this.strikes = 0;
        if (this.outs >= 3) {
            this.endInning();
        }
        else {
            this.nextBatter();
        }
    }
    /**
     * Handle strikeout
     */
    handleStrikeout() {
        this.outs++;
        this.balls = 0;
        this.strikes = 0;
        if (this.outs >= 3) {
            this.endInning();
        }
        else {
            this.nextBatter();
        }
    }
    /**
     * Handle walk
     */
    handleWalk() {
        this.advanceRunners(1, true); // Force advance with walk
        this.balls = 0;
        this.strikes = 0;
        this.nextBatter();
    }
    /**
     * Advance runners on the bases
     */
    advanceRunners(bases, walk = false) {
        const battingTeam = this.inningHalf === 'top' ? this.awayTeam : this.homeTeam;
        if (!battingTeam || !this.currentBatter)
            return;
        let runsScored = 0;
        // Score runners from third
        if (this.bases[3] && bases >= 1) {
            runsScored++;
            this.bases[3] = null;
        }
        // Advance from second
        if (this.bases[2]) {
            if (bases >= 2) {
                runsScored++;
                this.bases[2] = null;
            }
            else if (bases === 1) {
                this.bases[3] = this.bases[2];
                this.bases[2] = null;
            }
        }
        // Advance from first
        if (this.bases[1]) {
            if (bases >= 3) {
                runsScored++;
            }
            else if (bases === 2) {
                this.bases[3] = this.bases[1];
            }
            else if (bases === 1) {
                this.bases[2] = this.bases[1];
            }
            this.bases[1] = null;
        }
        // Place batter on base
        if (bases === 4) {
            // Home run - batter scores
            runsScored++;
        }
        else if (bases > 0) {
            this.bases[bases] = this.currentBatter;
        }
        // Update score
        battingTeam.score += runsScored;
        if (this.onScoreUpdate && this.homeTeam && this.awayTeam) {
            this.onScoreUpdate(this.homeTeam.score, this.awayTeam.score);
        }
    }
    /**
     * Move to next batter
     */
    nextBatter() {
        this.currentBatterIndex++;
        this.updateCurrentPlayers();
    }
    /**
     * End the current inning
     */
    endInning() {
        // Clear bases
        this.bases = { 1: null, 2: null, 3: null };
        this.outs = 0;
        this.balls = 0;
        this.strikes = 0;
        if (this.inningHalf === 'top') {
            // Switch to bottom of inning
            this.inningHalf = 'bottom';
        }
        else {
            // Next inning
            this.inning++;
            this.inningHalf = 'top';
            // Check if game is over
            if (this.inning > this.maxInnings) {
                this.endGame();
                return;
            }
        }
        // Reset field positions
        this.setupFieldPositions();
        this.updateCurrentPlayers();
        if (this.onInningChange) {
            this.onInningChange(this.inning, this.inningHalf);
        }
    }
    /**
     * End the game
     */
    endGame() {
        this.gameOver = true;
        if (this.homeTeam && this.awayTeam) {
            if (this.homeTeam.score > this.awayTeam.score) {
                this.winner = this.homeTeam;
            }
            else if (this.awayTeam.score > this.homeTeam.score) {
                this.winner = this.awayTeam;
            }
            else {
                // Tie - play extra innings
                this.gameOver = false;
                this.maxInnings++;
                return;
            }
            if (this.onGameOver && this.winner) {
                this.onGameOver(this.winner);
            }
        }
    }
    /**
     * Resolve ball landing for fielding
     */
    resolveBallLanding() {
        this.ballInPlay = false;
        this.ball.active = false;
        this.ball.x = 512;
        this.ball.y = 384;
        this.ball.vx = 0;
        this.ball.vy = 0;
    }
    /**
     * Get current game state summary
     */
    getGameSummary() {
        return {
            inning: this.inning,
            inningHalf: this.inningHalf,
            balls: this.balls,
            strikes: this.strikes,
            outs: this.outs,
            homeScore: this.homeTeam?.score || 0,
            awayScore: this.awayTeam?.score || 0,
            bases: this.bases,
            gameOver: this.gameOver,
            winner: this.winner?.name
        };
    }
}
