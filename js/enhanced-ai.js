/**
 * Enhanced AI System for Sandlot Superstars
 * Provides multiple difficulty levels and intelligent gameplay decisions
 */

class EnhancedAISystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;

        // Difficulty levels
        this.difficulties = {
            easy: {
                name: 'Rookie',
                reactionTime: 800,
                accuracyMultiplier: 0.6,
                decisionQuality: 0.5,
                pitchVariety: 0.3,
                swingDecision: 0.4,
                fieldingSpeed: 0.7,
                baseballIQ: 0.4
            },
            medium: {
                name: 'All-Star',
                reactionTime: 500,
                accuracyMultiplier: 0.8,
                decisionQuality: 0.7,
                pitchVariety: 0.6,
                swingDecision: 0.6,
                fieldingSpeed: 0.85,
                baseballIQ: 0.7
            },
            hard: {
                name: 'Hall of Fame',
                reactionTime: 300,
                accuracyMultiplier: 0.95,
                decisionQuality: 0.9,
                pitchVariety: 0.9,
                swingDecision: 0.85,
                fieldingSpeed: 1.0,
                baseballIQ: 0.95
            }
        };

        // Current difficulty
        this.currentDifficulty = 'medium';
        this.difficultySettings = this.difficulties[this.currentDifficulty];

        // AI state
        this.pitchCount = 0;
        this.batterHistory = [];
        this.situationalAwareness = {
            inning: 1,
            outs: 0,
            runnersOnBase: [],
            score: { home: 0, away: 0 }
        };
    }

    /**
     * Set AI difficulty
     */
    setDifficulty(level) {
        if (this.difficulties[level]) {
            this.currentDifficulty = level;
            this.difficultySettings = this.difficulties[level];
            console.log(`🤖 AI Difficulty set to: ${this.difficultySettings.name}`);
            return true;
        }
        return false;
    }

    /**
     * AI decides what pitch to throw
     */
    decidePitch(batter, gameState) {
        this.updateSituationalAwareness(gameState);

        const pitcher = gameState.pitcher || {};
        const difficulty = this.difficultySettings;

        // Gather intelligence
        const batterTendencies = this.analyzeBatterTendencies(batter);
        const gameContext = this.analyzeGameContext(gameState);

        // Pitch selection weights
        let pitchOptions = {
            fastball: 0.4,
            curveball: 0.2,
            slider: 0.2,
            changeup: 0.15,
            knuckleball: 0.05
        };

        // Adjust based on count
        const count = gameState.count || { balls: 0, strikes: 0 };

        if (count.balls > count.strikes) {
            // Behind in count - throw more strikes
            pitchOptions.fastball += 0.2;
            pitchOptions.curveball -= 0.1;
        } else if (count.strikes === 2) {
            // Two strikes - waste pitch or strikeout pitch
            if (difficulty.pitchVariety > 0.7 && Math.random() < 0.4) {
                // Waste pitch
                pitchOptions.slider += 0.2;
                pitchOptions.curveball += 0.2;
            }
        }

        // Adjust based on batter tendencies
        if (batterTendencies.pullHitter) {
            // Pitch away
            pitchOptions.slider += 0.15;
        }

        if (batterTendencies.powerHitter) {
            // More breaking balls
            pitchOptions.curveball += 0.15;
            pitchOptions.changeup += 0.1;
            pitchOptions.fastball -= 0.2;
        }

        // Adjust based on game situation
        if (gameContext.highLeverageSituation) {
            // Use pitcher's best stuff
            const bestPitch = pitcher.bestPitch || 'fastball';
            pitchOptions[bestPitch] += 0.2;
        }

        // Apply difficulty multiplier
        const varietyFactor = difficulty.pitchVariety;
        if (varietyFactor < 0.5) {
            // Easy mode - mostly fastballs
            pitchOptions.fastball += 0.3;
        }

        // Select pitch based on weights
        const selectedPitch = this.weightedRandomSelection(pitchOptions);

        // Determine location
        const location = this.decidePitchLocation(batter, count, difficulty);

        this.pitchCount++;

        return {
            type: selectedPitch,
            location: location,
            velocity: this.calculatePitchVelocity(selectedPitch, pitcher, difficulty),
            movement: this.calculatePitchMovement(selectedPitch, pitcher)
        };
    }

    /**
     * AI decides whether to swing at a pitch
     */
    decideSwing(pitch, batter, gameState) {
        const difficulty = this.difficultySettings;
        const count = gameState.count || { balls: 0, strikes: 0 };

        // Calculate pitch quality (how hittable it is)
        const pitchQuality = this.evaluatePitchQuality(pitch, batter);

        // Base swing probability
        let swingProbability = pitchQuality * difficulty.swingDecision;

        // Adjust based on count
        if (count.balls === 3) {
            // Don't swing at balls on 3-0 unless it's a meatball
            swingProbability *= 0.3;
        } else if (count.strikes === 2) {
            // Protect the plate with 2 strikes
            swingProbability += 0.2;
        }

        // Adjust based on batter's aggressiveness
        const aggressiveness = (batter.stats?.batting || 5) / 10;
        swingProbability *= (0.8 + aggressiveness * 0.4);

        // Situational adjustment
        const situational = this.getSituationalSwingAdjustment(gameState);
        swingProbability *= situational;

        // Add some randomness
        swingProbability += (Math.random() - 0.5) * 0.1;

        // Clamp
        swingProbability = Math.max(0, Math.min(1, swingProbability));

        const shouldSwing = Math.random() < swingProbability;

        // If swinging, calculate swing timing and power
        if (shouldSwing) {
            return {
                swing: true,
                timing: this.calculateSwingTiming(pitch, batter, difficulty),
                power: this.calculateSwingPower(batter, pitch, gameState)
            };
        }

        return { swing: false };
    }

    /**
     * AI fielding decision
     */
    makeFieldingDecision(ball, fielders, gameState) {
        const difficulty = this.difficultySettings;

        // Find the best fielder for this ball
        const closestFielder = this.findBestFielder(ball, fielders, difficulty);

        if (!closestFielder) {
            return null;
        }

        // Calculate catch probability
        const catchProbability = this.calculateCatchProbability(
            ball,
            closestFielder,
            difficulty
        );

        const catchSuccess = Math.random() < catchProbability;

        // Decide where to throw if catch is successful
        let throwTarget = null;
        if (catchSuccess && gameState.runners) {
            throwTarget = this.decideThrowTarget(
                ball.position,
                gameState.runners,
                difficulty
            );
        }

        return {
            fielder: closestFielder,
            catchSuccess: catchSuccess,
            throwTarget: throwTarget,
            reactionTime: difficulty.reactionTime
        };
    }

    /**
     * AI base running decision
     */
    makeBaseRunningDecision(runner, ball, gameState, difficulty) {
        const settings = difficulty || this.difficultySettings;

        // Evaluate the play
        const ballDepth = Math.abs(ball.position?.z || 0);
        const ballLocation = ball.position;
        const runnerBase = runner.currentBase || 0;

        // Calculate advance probability
        let advanceProbability = 0.5;

        // Ball depth factor
        if (ballDepth > 60) {
            advanceProbability += 0.3; // Deep fly ball
        } else if (ballDepth < 30) {
            advanceProbability -= 0.2; // Infield hit
        }

        // Outs factor
        const outs = gameState.outs || 0;
        if (outs < 2) {
            advanceProbability -= 0.1; // Be more conservative
        } else {
            advanceProbability += 0.2; // Go for it with 2 outs
        }

        // Score factor
        const scoreDiff = gameState.homeScore - gameState.awayScore;
        if (scoreDiff < 0 && gameState.inning >= 7) {
            advanceProbability += 0.15; // Need runs, be aggressive
        }

        // Runner speed
        const speed = runner.stats?.speed || 5;
        advanceProbability += (speed - 5) * 0.05;

        // AI difficulty
        advanceProbability *= settings.baseballIQ;

        // Make decision
        return Math.random() < advanceProbability;
    }

    /**
     * Analyze batter tendencies
     */
    analyzeBatterTendencies(batter) {
        const stats = batter.stats || {};

        return {
            pullHitter: stats.power > stats.batting,
            powerHitter: stats.power > 7,
            contactHitter: stats.batting > 7,
            patient: stats.batting > stats.power,
            aggressive: stats.power > stats.batting
        };
    }

    /**
     * Analyze game context
     */
    analyzeGameContext(gameState) {
        const awareness = this.situationalAwareness;

        const scoreDiff = Math.abs(awareness.score.home - awareness.score.away);
        const isLateInning = awareness.inning >= 7;
        const runnersInScoringPosition = awareness.runnersOnBase.includes(1) || awareness.runnersOnBase.includes(2);

        return {
            highLeverageSituation: (
                (isLateInning && scoreDiff <= 2) ||
                (runnersInScoringPosition && awareness.outs < 2)
            ),
            needRuns: scoreDiff > 2 && isLateInning,
            protectLead: scoreDiff > 0 && isLateInning
        };
    }

    /**
     * Decide pitch location
     */
    decidePitchLocation(batter, count, difficulty) {
        const zones = {
            highInside: { x: -0.3, y: 1.2, z: 0 },
            highOutside: { x: 0.3, y: 1.2, z: 0 },
            middleInside: { x: -0.2, y: 0.8, z: 0 },
            middleOutside: { x: 0.2, y: 0.8, z: 0 },
            lowInside: { x: -0.3, y: 0.4, z: 0 },
            lowOutside: { x: 0.3, y: 0.4, z: 0 },
            center: { x: 0, y: 0.8, z: 0 }
        };

        // Behind in count - throw more strikes (center)
        if (count.balls > count.strikes) {
            if (Math.random() < 0.6) {
                return zones.center;
            }
        }

        // Ahead in count - paint corners
        if (count.strikes > count.balls) {
            const cornerZones = ['highInside', 'highOutside', 'lowInside', 'lowOutside'];
            return zones[cornerZones[Math.floor(Math.random() * cornerZones.length)]];
        }

        // Even count - mix it up
        const allZones = Object.keys(zones);
        return zones[allZones[Math.floor(Math.random() * allZones.length)]];
    }

    /**
     * Calculate pitch velocity
     */
    calculatePitchVelocity(pitchType, pitcher, difficulty) {
        const baseVelocities = {
            fastball: 0.9,
            curveball: 0.6,
            slider: 0.75,
            changeup: 0.65,
            knuckleball: 0.5
        };

        let velocity = baseVelocities[pitchType] || 0.8;

        // Pitcher skill factor
        const pitchingSkill = pitcher.stats?.pitching || 5;
        velocity *= (0.8 + pitchingSkill * 0.04);

        // Difficulty factor
        velocity *= (0.9 + difficulty.accuracyMultiplier * 0.1);

        return velocity;
    }

    /**
     * Calculate pitch movement
     */
    calculatePitchMovement(pitchType, pitcher) {
        const movements = {
            fastball: { x: 0, y: -0.05 },
            curveball: { x: 0.15, y: -0.3 },
            slider: { x: 0.2, y: -0.1 },
            changeup: { x: 0, y: -0.15 },
            knuckleball: { x: (Math.random() - 0.5) * 0.4, y: (Math.random() - 0.5) * 0.3 }
        };

        return movements[pitchType] || { x: 0, y: 0 };
    }

    /**
     * Evaluate pitch quality (how hittable)
     */
    evaluatePitchQuality(pitch, batter) {
        // Check if pitch is in strike zone
        const inStrikeZone = (
            pitch.location.x > -0.4 && pitch.location.x < 0.4 &&
            pitch.location.y > 0.3 && pitch.location.y < 1.3
        );

        if (!inStrikeZone) {
            return 0.2; // Ball - low quality
        }

        // Center of zone is most hittable
        const distanceFromCenter = Math.sqrt(
            Math.pow(pitch.location.x, 2) +
            Math.pow(pitch.location.y - 0.8, 2)
        );

        let quality = 1.0 - (distanceFromCenter * 1.5);

        // Adjust for pitch type
        if (pitch.type === 'fastball') {
            quality += 0.1; // Easier to hit
        } else if (pitch.type === 'curveball' || pitch.type === 'slider') {
            quality -= 0.15; // Harder to hit
        }

        // Batter skill
        const battingSkill = batter.stats?.batting || 5;
        quality *= (0.7 + battingSkill * 0.06);

        return Math.max(0.1, Math.min(1.0, quality));
    }

    /**
     * Get situational swing adjustment
     */
    getSituationalSwingAdjustment(gameState) {
        let adjustment = 1.0;

        const outs = gameState.outs || 0;
        const runners = gameState.runners || [];

        // Runner on third, less than 2 outs - be more selective
        if (runners.includes(2) && outs < 2) {
            adjustment *= 0.85;
        }

        // Behind late in game - be more aggressive
        if (gameState.inning >= 7) {
            const scoreDiff = gameState.awayScore - gameState.homeScore;
            if (scoreDiff > 0) {
                adjustment *= 1.15;
            }
        }

        return adjustment;
    }

    /**
     * Calculate swing timing
     */
    calculateSwingTiming(pitch, batter, difficulty) {
        const perfectTiming = 0.5; // Mid-point
        const battingSkill = batter.stats?.batting || 5;

        // Better batters have better timing
        const timingWindow = 0.3 - (battingSkill * 0.02);

        // AI timing based on difficulty
        const aiTiming = perfectTiming + (Math.random() - 0.5) * timingWindow * (1.2 - difficulty.accuracyMultiplier);

        return Math.max(0.2, Math.min(0.8, aiTiming));
    }

    /**
     * Calculate swing power
     */
    calculateSwingPower(batter, pitch, gameState) {
        const basePower = batter.stats?.power || 5;
        const timing = pitch.timing || 0.5;

        // Perfect timing = max power
        const timingFactor = 1.0 - Math.abs(timing - 0.5) * 2;

        return (basePower / 10) * timingFactor * (0.8 + Math.random() * 0.4);
    }

    /**
     * Find best fielder for the ball
     */
    findBestFielder(ball, fielders, difficulty) {
        if (!fielders || fielders.length === 0) {
            return null;
        }

        let bestFielder = null;
        let bestScore = -Infinity;

        fielders.forEach(fielder => {
            const distance = this.calculateDistance(ball.position, fielder.position);
            const fieldingSkill = fielder.stats?.fielding || 5;
            const speed = fielder.stats?.speed || 5;

            // Score = how likely to reach ball
            const reachTime = distance / (speed * 0.1);
            const score = fieldingSkill - reachTime;

            if (score > bestScore) {
                bestScore = score;
                bestFielder = fielder;
            }
        });

        return bestFielder;
    }

    /**
     * Calculate catch probability
     */
    calculateCatchProbability(ball, fielder, difficulty) {
        const distance = this.calculateDistance(ball.position, fielder.position);
        const fieldingSkill = fielder.stats?.fielding || 5;

        let probability = 0.9 - (distance * 0.01);
        probability *= (fieldingSkill / 10);
        probability *= difficulty.fieldingSpeed;

        // Difficult catches (diving, wall)
        if (ball.position.y > 3) {
            probability *= 0.7; // High fly ball
        }
        if (distance > 30) {
            probability *= 0.8; // Far away
        }

        return Math.max(0.1, Math.min(0.98, probability));
    }

    /**
     * Decide throw target after catch
     */
    decideThrowTarget(ballPosition, runners, difficulty) {
        // Check for lead runner
        const targets = [];

        runners.forEach((runner, base) => {
            if (runner) {
                const throwDistance = this.calculateThrowDistance(ballPosition, base);
                const runnerSpeed = runner.stats?.speed || 5;

                // Can we get them out?
                const outProbability = (10 - runnerSpeed) / 10 * difficulty.baseballIQ / throwDistance * 20;

                targets.push({
                    base: base + 1,
                    probability: outProbability,
                    priority: 3 - base // Prioritize lead runner
                });
            }
        });

        if (targets.length === 0) {
            return 0; // Throw to first
        }

        // Sort by priority and probability
        targets.sort((a, b) => {
            return (b.probability * b.priority) - (a.probability * a.priority);
        });

        return targets[0].base;
    }

    /**
     * Calculate distance between two positions
     */
    calculateDistance(pos1, pos2) {
        return Math.sqrt(
            Math.pow(pos1.x - pos2.x, 2) +
            Math.pow(pos1.y - pos2.y, 2) +
            Math.pow(pos1.z - pos2.z, 2)
        );
    }

    /**
     * Calculate throw distance to base
     */
    calculateThrowDistance(position, base) {
        const basePositions = [
            { x: 20, z: -20 },  // First
            { x: 0, z: -40 },   // Second
            { x: -20, z: -20 }, // Third
            { x: 0, z: 0 }      // Home
        ];

        const targetBase = basePositions[base] || basePositions[0];
        return Math.sqrt(
            Math.pow(position.x - targetBase.x, 2) +
            Math.pow(position.z - targetBase.z, 2)
        );
    }

    /**
     * Weighted random selection
     */
    weightedRandomSelection(options) {
        const total = Object.values(options).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * total;

        for (const [key, weight] of Object.entries(options)) {
            random -= weight;
            if (random <= 0) {
                return key;
            }
        }

        return Object.keys(options)[0];
    }

    /**
     * Update situational awareness
     */
    updateSituationalAwareness(gameState) {
        this.situationalAwareness = {
            inning: gameState.inning || 1,
            outs: gameState.outs || 0,
            runnersOnBase: gameState.runners || [],
            score: {
                home: gameState.homeScore || 0,
                away: gameState.awayScore || 0
            }
        };
    }
}

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedAISystem;
}
