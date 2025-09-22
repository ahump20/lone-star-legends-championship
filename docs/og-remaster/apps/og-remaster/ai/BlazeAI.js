/**
 * Blaze Intelligence AI System
 * Championship-level opponent AI with pattern recognition
 */
export class BlazeAI {
    constructor(personality, gameState) {
        this.pitchHistory = [];
        this.swingHistory = [];
        this.patternMemory = new Map();
        this.performanceMetrics = {
            battingAverage: 0.250,
            onBasePercentage: 0.320,
            sluggingPercentage: 0.400,
            strikeoutRate: 0.200,
            walkRate: 0.080
        };
        this.personality = personality;
        this.gameState = gameState;
        this.initializePatternRecognition();
    }
    initializePatternRecognition() {
        // Initialize pattern weights for different scenarios
        this.patternMemory.set('fastball_count_0-0', 0.65);
        this.patternMemory.set('breaking_count_0-2', 0.75);
        this.patternMemory.set('changeup_count_3-2', 0.45);
        this.patternMemory.set('high_heat_2_strikes', 0.55);
        this.patternMemory.set('low_away_ahead', 0.60);
    }
    // PITCHING AI
    decidePitch() {
        const context = this.getGameContext();
        const batterTendencies = this.analyzeBatterTendencies();
        // Select pitch type based on context and AI intelligence
        const pitchType = this.selectPitchType(context, batterTendencies);
        // Determine location based on count and strategy
        const location = this.selectPitchLocation(context, pitchType);
        // Calculate velocity based on situation
        const velocity = this.calculatePitchVelocity(context, pitchType);
        // AI confidence in this pitch
        const confidence = this.calculatePitchConfidence(pitchType, location, context);
        const decision = {
            type: pitchType,
            location,
            velocity,
            confidence
        };
        // Learn from this decision
        this.pitchHistory.push(decision);
        this.updatePatternMemory(`pitch_${pitchType}_${context.count.balls}-${context.count.strikes}`, confidence);
        return decision;
    }
    selectPitchType(context, batterTendencies) {
        const intelligence = this.personality.intelligence;
        // Higher intelligence = more strategic pitch selection
        if (Math.random() > intelligence) {
            // Random selection for lower intelligence
            const types = ['fastball', 'curveball', 'slider', 'changeup'];
            return types[Math.floor(Math.random() * types.length)];
        }
        // Strategic selection based on count and situation
        const { balls, strikes } = context.count;
        // Fastball counts
        if (balls === 3 && strikes < 2) {
            return 'fastball'; // Need a strike
        }
        // Strikeout counts
        if (strikes === 2) {
            // Try to get batter to chase
            if (batterTendencies.get('chases_breaking') || 0 > 0.5) {
                return Math.random() > 0.5 ? 'slider' : 'curveball';
            }
            return 'fastball'; // Blow it by them
        }
        // Behind in count
        if (balls > strikes) {
            return 'fastball'; // Get back in the count
        }
        // Ahead in count
        if (strikes > balls) {
            // Can afford to throw breaking balls
            const breakingBalls = ['curveball', 'slider', 'changeup'];
            return breakingBalls[Math.floor(Math.random() * breakingBalls.length)];
        }
        // Even count - mix it up
        const recentPitch = this.pitchHistory[this.pitchHistory.length - 1];
        if (recentPitch) {
            // Don't repeat the same pitch too often
            if (recentPitch.type === 'fastball') {
                return Math.random() > 0.3 ? 'changeup' : 'slider';
            }
        }
        return 'fastball';
    }
    selectPitchLocation(context, pitchType) {
        const aggression = this.personality.aggression;
        const { balls, strikes } = context.count;
        // Strike zone is -1 to 1 on both axes
        let x = 0;
        let y = 0;
        // Behind in count - aim for center
        if (balls === 3) {
            x = (Math.random() - 0.5) * 0.4; // Stay near center
            y = (Math.random() - 0.5) * 0.4;
        }
        // Ahead in count - work the edges
        else if (strikes > balls) {
            x = (Math.random() - 0.5) * 1.8; // Can be outside zone
            y = (Math.random() - 0.5) * 1.8;
            // Specific locations for breaking balls
            if (pitchType === 'curveball') {
                y = -0.7 - Math.random() * 0.5; // Low
            }
            else if (pitchType === 'slider') {
                x = 0.7 + Math.random() * 0.5; // Away
                y = -0.3;
            }
        }
        // Even count - mix locations
        else {
            x = (Math.random() - 0.5) * 1.2;
            y = (Math.random() - 0.5) * 1.2;
        }
        // Aggressive pitchers challenge more
        if (Math.random() < aggression) {
            x *= 0.7; // Bring it closer to center
            y *= 0.7;
        }
        return { x, y };
    }
    calculatePitchVelocity(context, pitchType) {
        let baseVelocity = 0.5;
        switch (pitchType) {
            case 'fastball':
                baseVelocity = 0.85 + Math.random() * 0.15;
                break;
            case 'slider':
                baseVelocity = 0.75 + Math.random() * 0.1;
                break;
            case 'curveball':
                baseVelocity = 0.60 + Math.random() * 0.1;
                break;
            case 'changeup':
                baseVelocity = 0.65 + Math.random() * 0.1;
                break;
            case 'knuckleball':
                baseVelocity = 0.50 + Math.random() * 0.1;
                break;
        }
        // Clutch situations
        if (context.gamePhase === 'clutch') {
            baseVelocity *= (0.95 + this.personality.clutchFactor * 0.1);
        }
        return Math.min(1, baseVelocity);
    }
    calculatePitchConfidence(pitchType, location, context) {
        let confidence = 0.5;
        // Base confidence on AI intelligence
        confidence += this.personality.intelligence * 0.2;
        // Adjust for count
        if (context.count.strikes > context.count.balls) {
            confidence += 0.15;
        }
        else if (context.count.balls > context.count.strikes) {
            confidence -= 0.15;
        }
        // Adjust for location (strike zone is -1 to 1)
        const inStrikeZone = Math.abs(location.x) < 1 && Math.abs(location.y) < 1;
        if (inStrikeZone) {
            confidence += 0.1;
        }
        // Check pattern success
        const patternKey = `pitch_${pitchType}_${context.count.balls}-${context.count.strikes}`;
        const patternSuccess = this.patternMemory.get(patternKey) || 0.5;
        confidence = confidence * 0.7 + patternSuccess * 0.3;
        // Clutch factor
        if (context.gamePhase === 'clutch') {
            confidence *= (0.8 + this.personality.clutchFactor * 0.4);
        }
        return Math.max(0.1, Math.min(1, confidence));
    }
    // BATTING AI
    decideSwing(pitch) {
        const context = this.getGameContext();
        const pitchQuality = this.evaluatePitch(pitch);
        // Decide whether to swing
        const shouldSwing = this.shouldSwingAtPitch(pitch, pitchQuality, context);
        // If swinging, determine timing and power
        let timing = 'perfect';
        let power = 0.5;
        if (shouldSwing) {
            timing = this.calculateSwingTiming(pitch);
            power = this.calculateSwingPower(pitch, context);
        }
        // Calculate confidence
        const confidence = this.calculateSwingConfidence(shouldSwing, pitchQuality, context);
        const decision = {
            shouldSwing,
            timing,
            power,
            confidence
        };
        // Learn from this decision
        this.swingHistory.push(decision);
        return decision;
    }
    evaluatePitch(pitch) {
        // Evaluate pitch quality (0-1, where 1 is perfect to hit)
        let quality = 0.5;
        // Location evaluation (center is best)
        const distFromCenter = Math.sqrt(pitch.location.x ** 2 + pitch.location.y ** 2);
        quality += (1 - Math.min(1, distFromCenter)) * 0.3;
        // Velocity evaluation (moderate is best for hitting)
        const idealVelocity = 0.75;
        const velocityDiff = Math.abs(pitch.velocity - idealVelocity);
        quality += (1 - velocityDiff) * 0.2;
        // Pitch type evaluation based on AI's specialties
        if (this.personality.specialties.includes('power') && pitch.type === 'fastball') {
            quality += 0.15;
        }
        if (this.personality.specialties.includes('contact') && pitch.type === 'changeup') {
            quality += 0.1;
        }
        // Adjust for pattern recognition
        const patternKey = `seen_${pitch.type}_${Math.round(pitch.location.x)}_${Math.round(pitch.location.y)}`;
        if (this.patternMemory.has(patternKey)) {
            quality += 0.1; // Familiar with this pitch
        }
        return Math.max(0, Math.min(1, quality));
    }
    shouldSwingAtPitch(pitch, pitchQuality, context) {
        const patience = this.personality.patience;
        const aggression = this.personality.aggression;
        // Base swing threshold
        let swingThreshold = 0.5;
        // Adjust for count
        const { balls, strikes } = context.count;
        // 3-0 count: very patient
        if (balls === 3 && strikes === 0) {
            swingThreshold = 0.85;
        }
        // 2 strikes: protect the plate
        else if (strikes === 2) {
            swingThreshold = 0.3;
        }
        // Ahead in count: be selective
        else if (balls > strikes) {
            swingThreshold = 0.6 + patience * 0.2;
        }
        // Behind in count: protect
        else if (strikes > balls) {
            swingThreshold = 0.4 - aggression * 0.1;
        }
        // Check if pitch is in strike zone
        const inZone = Math.abs(pitch.location.x) <= 1 && Math.abs(pitch.location.y) <= 1;
        // With 2 strikes, swing at anything close
        if (strikes === 2 && inZone) {
            swingThreshold *= 0.7;
        }
        // Clutch situations
        if (context.gamePhase === 'clutch') {
            const clutchAdjustment = this.personality.clutchFactor;
            swingThreshold = swingThreshold * (1 - clutchAdjustment * 0.2);
        }
        // Make decision
        const shouldSwing = pitchQuality > swingThreshold;
        // Learn from this pattern
        this.updatePatternMemory(`swing_decision_${pitch.type}_${context.count.balls}-${context.count.strikes}`, shouldSwing ? pitchQuality : 1 - pitchQuality);
        return shouldSwing;
    }
    calculateSwingTiming(pitch) {
        const intelligence = this.personality.intelligence;
        // Perfect timing probability based on intelligence
        const perfectChance = 0.3 + intelligence * 0.5;
        const random = Math.random();
        if (random < perfectChance) {
            return 'perfect';
        }
        else if (random < perfectChance + 0.35) {
            return 'early';
        }
        else {
            return 'late';
        }
    }
    calculateSwingPower(pitch, context) {
        let power = 0.5;
        // Base power on specialties
        if (this.personality.specialties.includes('power')) {
            power = 0.7;
        }
        else if (this.personality.specialties.includes('contact')) {
            power = 0.3;
        }
        // Adjust for pitch type
        if (pitch.type === 'fastball') {
            power += 0.1;
        }
        else if (pitch.type === 'changeup') {
            power -= 0.1;
        }
        // Situational adjustments
        if (context.runners.third && context.outs < 2) {
            // Sacrifice fly opportunity
            power += 0.2;
        }
        // Clutch situations
        if (context.gamePhase === 'clutch') {
            power *= (0.9 + this.personality.clutchFactor * 0.2);
        }
        return Math.max(0.1, Math.min(1, power));
    }
    calculateSwingConfidence(shouldSwing, pitchQuality, context) {
        let confidence = this.personality.intelligence * 0.5 + 0.3;
        if (shouldSwing) {
            confidence += pitchQuality * 0.3;
        }
        else {
            confidence += (1 - pitchQuality) * 0.3;
        }
        // Clutch factor
        if (context.gamePhase === 'clutch') {
            confidence *= this.personality.clutchFactor;
        }
        return Math.max(0.1, Math.min(1, confidence));
    }
    // BASERUNNING AI
    decideBaserunning() {
        const context = this.getGameContext();
        const speed = this.personality.specialties.includes('speed');
        // Stealing decision
        const stealChance = speed ? 0.3 : 0.1;
        const shouldSteal = Math.random() < stealChance &&
            context.runners.first &&
            !context.runners.second &&
            context.outs < 2;
        // Advancement aggression
        let advance = 'normal';
        if (this.personality.aggression > 0.7) {
            advance = 'aggressive';
        }
        else if (this.personality.aggression < 0.3) {
            advance = 'conservative';
        }
        // Tag up decision
        const tagUp = context.outs < 2 && Math.random() < this.personality.intelligence;
        return { steal: shouldSteal, advance, tagUp };
    }
    // PATTERN RECOGNITION
    analyzeBatterTendencies() {
        const tendencies = new Map();
        // Analyze swing history
        const recentSwings = this.swingHistory.slice(-20);
        const totalSwings = recentSwings.length;
        if (totalSwings > 0) {
            const strikes = recentSwings.filter(s => !s.shouldSwing).length;
            const chases = recentSwings.filter(s => s.shouldSwing && s.confidence < 0.5).length;
            tendencies.set('swing_rate', recentSwings.filter(s => s.shouldSwing).length / totalSwings);
            tendencies.set('chase_rate', chases / totalSwings);
            tendencies.set('strike_rate', strikes / totalSwings);
        }
        return tendencies;
    }
    updatePatternMemory(key, value) {
        const current = this.patternMemory.get(key) || 0.5;
        // Weighted average with more weight on recent
        this.patternMemory.set(key, current * 0.7 + value * 0.3);
        // Limit memory size
        if (this.patternMemory.size > 100) {
            const firstKey = this.patternMemory.keys().next().value;
            this.patternMemory.delete(firstKey);
        }
    }
    // GAME CONTEXT
    getGameContext() {
        const inning = this.gameState.inning;
        const score = {
            home: this.gameState.homeScore,
            away: this.gameState.awayScore
        };
        const runners = this.gameState.basesOccupied;
        const outs = this.gameState.outs;
        const count = {
            balls: this.gameState.balls,
            strikes: this.gameState.strikes
        };
        // Determine game phase
        let gamePhase = 'early';
        if (inning <= 3) {
            gamePhase = 'early';
        }
        else if (inning <= 6) {
            gamePhase = 'middle';
        }
        else if (inning <= 9) {
            gamePhase = 'late';
        }
        // Check for clutch situations
        const scoreDiff = Math.abs(score.home - score.away);
        const runnersInScoring = runners.second || runners.third;
        if (inning >= 7 && scoreDiff <= 2 && runnersInScoring) {
            gamePhase = 'clutch';
        }
        return { inning, score, runners, outs, count, gamePhase };
    }
    // ADAPTIVE DIFFICULTY
    adjustDifficulty(playerPerformance) {
        const winRate = playerPerformance.wins / (playerPerformance.wins + playerPerformance.losses);
        // If player is struggling, make AI easier
        if (winRate < 0.3) {
            this.personality.intelligence *= 0.9;
            this.personality.aggression *= 0.9;
        }
        // If player is dominating, make AI harder
        else if (winRate > 0.7) {
            this.personality.intelligence = Math.min(1, this.personality.intelligence * 1.1);
            this.personality.aggression = Math.min(1, this.personality.aggression * 1.1);
        }
    }
    // PUBLIC GETTERS
    getPersonality() {
        return this.personality;
    }
    getPerformanceMetrics() {
        return this.performanceMetrics;
    }
    getPatternMemory() {
        return new Map(this.patternMemory);
    }
}
// AI Difficulty Levels
BlazeAI.DIFFICULTIES = {
    ROOKIE: {
        name: 'Rookie',
        aggression: 0.3,
        patience: 0.2,
        intelligence: 0.2,
        clutchFactor: 0.3,
        specialties: ['contact']
    },
    AMATEUR: {
        name: 'Amateur',
        aggression: 0.5,
        patience: 0.4,
        intelligence: 0.4,
        clutchFactor: 0.5,
        specialties: ['contact', 'speed']
    },
    PRO: {
        name: 'Pro',
        aggression: 0.6,
        patience: 0.6,
        intelligence: 0.7,
        clutchFactor: 0.7,
        specialties: ['power', 'contact']
    },
    ALLSTAR: {
        name: 'All-Star',
        aggression: 0.7,
        patience: 0.8,
        intelligence: 0.85,
        clutchFactor: 0.8,
        specialties: ['power', 'contact', 'defense']
    },
    LEGEND: {
        name: 'Legend',
        aggression: 0.8,
        patience: 0.9,
        intelligence: 0.95,
        clutchFactor: 0.95,
        specialties: ['power', 'contact', 'speed', 'defense']
    }
};
