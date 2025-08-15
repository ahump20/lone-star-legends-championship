/**
 * Advanced AI Player System with Machine Learning Patterns
 * Implements Champion Enigma Engine behavioral modeling
 */

class AdvancedAIPlayer {
    constructor(name, position, skillLevel = 0.7) {
        this.name = name;
        this.position = position;
        this.skillLevel = skillLevel;
        
        // Champion Enigma Engine Attributes
        this.mentalToughness = this.generateTrait(0.4, 0.9);
        this.killerInstinct = this.generateTrait(0.3, 0.85);
        this.neuralEfficiency = this.generateTrait(0.5, 0.95);
        this.focusIntensity = this.generateTrait(0.6, 1.0);
        this.pressureResponse = this.generateTrait(0.2, 0.8);
        
        // Performance Patterns
        this.battingPatterns = {
            fastballTendency: Math.random() * 0.6 + 0.4,
            offspeedTendency: Math.random() * 0.4 + 0.3,
            pressurePerformance: this.mentalToughness * 0.8 + Math.random() * 0.2,
            clutchFactor: this.killerInstinct * 0.7 + this.mentalToughness * 0.3
        };
        
        // Learning System
        this.experienceHistory = [];
        this.adaptationRate = 0.1;
        this.memoryDepth = 50;
        
        // Biometric Simulation
        this.biometrics = {
            baseHeartRate: Math.random() * 20 + 60,
            stressResponse: 1.0 - this.pressureResponse,
            recoveryRate: this.mentalToughness * 0.8 + 0.2,
            focusDecay: 0.05 - (this.focusIntensity * 0.03)
        };
        
        // Performance State
        this.currentForm = 0.8 + Math.random() * 0.2;
        this.confidence = 0.7;
        this.fatigue = 0.0;
        this.momentum = 0.5;
        
        this.initializePersonality();
    }
    
    generateTrait(min, max) {
        // Generate trait with slight clustering toward extremes (champion effect)
        const raw = Math.random();
        const curved = raw < 0.5 ? 
            Math.pow(raw * 2, 1.5) / 2 : 
            1 - Math.pow((1 - raw) * 2, 1.5) / 2;
        return min + curved * (max - min);
    }
    
    initializePersonality() {
        // Define personality archetypes based on Champion Enigma traits
        const archetypes = [
            {
                name: "Ice Cold Clutch",
                condition: this.mentalToughness > 0.8 && this.pressureResponse < 0.3,
                traits: { clutchBonus: 0.3, pressurePenalty: -0.1 }
            },
            {
                name: "Aggressive Power",
                condition: this.killerInstinct > 0.8 && this.focusIntensity > 0.7,
                traits: { powerBonus: 0.2, contactPenalty: -0.1 }
            },
            {
                name: "Analytical Precision",
                condition: this.neuralEfficiency > 0.85,
                traits: { plateVision: 0.25, adaptationSpeed: 2.0 }
            },
            {
                name: "Pressure Sensitive",
                condition: this.pressureResponse > 0.7,
                traits: { clutchPenalty: -0.2, practiceBonus: 0.15 }
            },
            {
                name: "Steady Performer",
                condition: this.mentalToughness > 0.6 && this.pressureResponse < 0.5,
                traits: { consistency: 0.2, streakResistance: 0.3 }
            }
        ];
        
        this.personality = archetypes.find(arch => arch.condition) || {
            name: "Developing Talent",
            traits: { growthPotential: 0.3 }
        };
    }
    
    makeDecision(gameContext) {
        const {
            count,
            inning,
            score,
            runnersOnBase,
            pitcherType,
            expectedPitch,
            pressureLevel
        } = gameContext;
        
        // Calculate situational factors
        const situationalPressure = this.calculatePressure(gameContext);
        const pitchPrediction = this.predictPitch(gameContext);
        const swingDecision = this.shouldSwing(pitchPrediction, situationalPressure);
        
        // Apply Champion Enigma modifiers
        const enigmaModifiers = this.getEnigmaModifiers(situationalPressure);
        
        const decision = {
            action: swingDecision ? "swing" : "take",
            confidence: this.calculateConfidence(gameContext),
            expectedContact: this.calculateContactProbability(pitchPrediction, enigmaModifiers),
            swingType: this.selectSwingType(gameContext, enigmaModifiers),
            mentalState: this.getCurrentMentalState(situationalPressure),
            biometricResponse: this.simulateBiometrics(situationalPressure)
        };
        
        // Learn from decision
        this.recordExperience(gameContext, decision);
        
        return decision;
    }
    
    calculatePressure(context) {
        const {
            inning,
            score,
            runnersOnBase,
            count
        } = context;
        
        let pressure = 0;
        
        // Late inning pressure
        if (inning >= 8) pressure += 0.3;
        if (inning >= 9) pressure += 0.2;
        
        // Score differential pressure
        const scoreDiff = Math.abs(score.home - score.away);
        if (scoreDiff <= 1) pressure += 0.3;
        if (scoreDiff <= 3) pressure += 0.1;
        
        // Runners in scoring position
        if (runnersOnBase.includes('second') || runnersOnBase.includes('third')) {
            pressure += 0.2;
        }
        
        // Count pressure
        if (count.strikes === 2) pressure += 0.2;
        if (count.balls === 3) pressure += 0.1;
        
        return Math.min(pressure, 1.0);
    }
    
    predictPitch(context) {
        const {
            count,
            pitcherType,
            expectedPitch,
            atBatHistory
        } = context;
        
        // Use neural efficiency to predict pitcher patterns
        const predictionAccuracy = this.neuralEfficiency * 0.7 + 0.3;
        
        // Analyze pitcher tendencies from history
        let pitchProbabilities = {
            fastball: 0.6,
            changeup: 0.15,
            curveball: 0.15,
            slider: 0.1
        };
        
        // Adjust based on count
        if (count.balls > count.strikes) {
            pitchProbabilities.fastball += 0.2;
        } else if (count.strikes === 2) {
            pitchProbabilities.curveball += 0.2;
            pitchProbabilities.slider += 0.15;
        }
        
        // Apply prediction accuracy
        const randomFactor = (1 - predictionAccuracy) * 0.5;
        Object.keys(pitchProbabilities).forEach(pitch => {
            pitchProbabilities[pitch] *= (predictionAccuracy + Math.random() * randomFactor);
        });
        
        return {
            mostLikely: this.getMaxProbabilityPitch(pitchProbabilities),
            probabilities: pitchProbabilities,
            confidence: predictionAccuracy
        };
    }
    
    shouldSwing(pitchPrediction, pressure) {
        // Base swing tendency from batting patterns
        const baseTendency = this.battingPatterns.fastballTendency;
        
        // Adjust for pressure
        const pressureModifier = this.pressureResponse > 0.5 ? 
            -pressure * 0.3 : 
            pressure * this.battingPatterns.clutchFactor * 0.2;
        
        // Adjust for pitch type confidence
        const pitchConfidenceModifier = pitchPrediction.confidence * 0.2;
        
        // Apply killer instinct in key moments
        const killerInstinctBonus = pressure > 0.6 ? 
            this.killerInstinct * 0.25 : 0;
        
        const finalTendency = baseTendency + pressureModifier + 
                             pitchConfidenceModifier + killerInstinctBonus;
        
        return Math.random() < Math.max(0.1, Math.min(0.9, finalTendency));
    }
    
    getEnigmaModifiers(pressure) {
        return {
            mentalToughnessMod: this.mentalToughness - pressure * (1 - this.mentalToughness),
            killerInstinctMod: pressure > 0.6 ? this.killerInstinct * 1.2 : this.killerInstinct,
            neuralEfficiencyMod: this.neuralEfficiency * (1 - this.fatigue * 0.3),
            focusMod: this.focusIntensity * Math.exp(-pressure * this.biometrics.focusDecay)
        };
    }
    
    calculateContactProbability(pitchPrediction, enigmaModifiers) {
        const baseContact = this.skillLevel * 0.7;
        const predictionBonus = pitchPrediction.confidence * 0.2;
        const enigmaBonus = (enigmaModifiers.neuralEfficiencyMod + 
                           enigmaModifiers.focusMod) * 0.15;
        const formModifier = (this.currentForm - 0.5) * 0.2;
        
        return Math.max(0.1, Math.min(0.95, 
            baseContact + predictionBonus + enigmaBonus + formModifier));
    }
    
    selectSwingType(context, enigmaModifiers) {
        const pressure = this.calculatePressure(context);
        
        const swingTypes = {
            normal: 0.6,
            aggressive: this.killerInstinct * 0.4 + (pressure > 0.7 ? 0.2 : 0),
            contact: enigmaModifiers.focusMod * 0.3 + (pressure < 0.3 ? 0.2 : 0),
            defensive: this.pressureResponse * 0.3 + (pressure > 0.8 ? 0.3 : 0)
        };
        
        return this.selectWeightedOption(swingTypes);
    }
    
    getCurrentMentalState(pressure) {
        const heartRate = this.biometrics.baseHeartRate + 
                         pressure * this.biometrics.stressResponse * 40;
        
        const focusLevel = Math.max(0.2, this.focusIntensity - 
                          pressure * (1 - this.mentalToughness) * 0.4);
        
        const confidenceLevel = this.confidence * (1 - pressure * 0.3) + 
                               this.mentalToughness * pressure * 0.2;
        
        return {
            heartRate: Math.round(heartRate),
            focusLevel: Math.round(focusLevel * 100),
            confidence: Math.round(confidenceLevel * 100),
            stressLevel: Math.round(pressure * this.biometrics.stressResponse * 100),
            mentalEfficiency: Math.round(this.getOverallMentalEfficiency() * 100)
        };
    }
    
    simulateBiometrics(pressure) {
        const hrv = Math.max(20, 80 - pressure * this.biometrics.stressResponse * 40);
        const skinConductance = pressure * this.biometrics.stressResponse * 100;
        const eyeTracking = {
            fixationStability: this.focusIntensity * (1 - pressure * 0.3),
            blinkRate: 12 + pressure * 8,
            pupilDilation: 3 + pressure * 2
        };
        
        return {
            hrv: Math.round(hrv),
            skinConductance: Math.round(skinConductance),
            cortisolProxy: Math.round(pressure * this.biometrics.stressResponse * 10) / 10,
            eyeTracking: eyeTracking
        };
    }
    
    recordExperience(context, decision) {
        const experience = {
            context: context,
            decision: decision,
            timestamp: Date.now(),
            outcome: null // Will be updated when result is known
        };
        
        this.experienceHistory.push(experience);
        
        // Keep only recent experiences
        if (this.experienceHistory.length > this.memoryDepth) {
            this.experienceHistory.shift();
        }
    }
    
    updateFromOutcome(outcome) {
        // Find the most recent experience without an outcome
        const lastExperience = this.experienceHistory
            .reverse()
            .find(exp => exp.outcome === null);
        
        if (lastExperience) {
            lastExperience.outcome = outcome;
            this.adapt(lastExperience);
        }
    }
    
    adapt(experience) {
        const { outcome, decision, context } = experience;
        
        // Adapt batting patterns based on success/failure
        if (outcome.result === 'hit') {
            // Reinforce successful patterns
            const pitchType = outcome.pitchType;
            if (pitchType === 'fastball') {
                this.battingPatterns.fastballTendency += this.adaptationRate * 0.1;
            }
            
            this.confidence += 0.05;
            this.currentForm += 0.02;
        } else if (outcome.result === 'out') {
            // Learn from failures
            this.confidence -= 0.02;
            this.currentForm -= 0.01;
        }
        
        // Adapt to pressure situations
        const pressure = this.calculatePressure(context);
        if (pressure > 0.7) {
            if (outcome.result === 'hit') {
                this.battingPatterns.clutchFactor += this.adaptationRate * 0.05;
            } else {
                this.battingPatterns.pressurePerformance -= this.adaptationRate * 0.03;
            }
        }
        
        // Clamp values
        this.confidence = Math.max(0.2, Math.min(1.0, this.confidence));
        this.currentForm = Math.max(0.3, Math.min(1.2, this.currentForm));
    }
    
    getOverallMentalEfficiency() {
        return (this.mentalToughness * 0.3 + 
                this.killerInstinct * 0.2 + 
                this.neuralEfficiency * 0.3 + 
                this.focusIntensity * 0.2) * this.currentForm;
    }
    
    getMaxProbabilityPitch(probabilities) {
        return Object.keys(probabilities)
            .reduce((a, b) => probabilities[a] > probabilities[b] ? a : b);
    }
    
    selectWeightedOption(options) {
        const total = Object.values(options).reduce((a, b) => a + b, 0);
        let random = Math.random() * total;
        
        for (const [option, weight] of Object.entries(options)) {
            random -= weight;
            if (random <= 0) return option;
        }
        
        return Object.keys(options)[0]; // fallback
    }
    
    // Public API for game integration
    getChampionQuotient() {
        return Math.round(this.getOverallMentalEfficiency() * 100);
    }
    
    getDetailedAnalysis() {
        return {
            name: this.name,
            position: this.position,
            championQuotient: this.getChampionQuotient(),
            traits: {
                mentalToughness: Math.round(this.mentalToughness * 100),
                killerInstinct: Math.round(this.killerInstinct * 100),
                neuralEfficiency: Math.round(this.neuralEfficiency * 100),
                focusIntensity: Math.round(this.focusIntensity * 100),
                pressureResponse: Math.round(this.pressureResponse * 100)
            },
            personality: this.personality.name,
            currentState: {
                form: Math.round(this.currentForm * 100),
                confidence: Math.round(this.confidence * 100),
                fatigue: Math.round(this.fatigue * 100)
            },
            battingPatterns: {
                fastballTendency: Math.round(this.battingPatterns.fastballTendency * 100),
                clutchFactor: Math.round(this.battingPatterns.clutchFactor * 100),
                pressurePerformance: Math.round(this.battingPatterns.pressurePerformance * 100)
            }
        };
    }
    
    simulateAtBat(gameContext) {
        const decision = this.makeDecision(gameContext);
        
        if (decision.action === "swing") {
            const contactMade = Math.random() < decision.expectedContact;
            
            if (contactMade) {
                const hitQuality = this.calculateHitQuality(decision, gameContext);
                return this.generateHitOutcome(hitQuality, decision);
            } else {
                return {
                    outcome: "miss",
                    description: `${this.name} swings and misses`,
                    mentalState: decision.mentalState,
                    biometrics: decision.biometricResponse
                };
            }
        } else {
            return {
                outcome: "take",
                description: `${this.name} takes the pitch`,
                mentalState: decision.mentalState,
                biometrics: decision.biometricResponse
            };
        }
    }
    
    calculateHitQuality(decision, context) {
        const baseQuality = decision.expectedContact;
        const swingTypeModifier = {
            normal: 0,
            aggressive: 0.2,
            contact: -0.1,
            defensive: -0.15
        }[decision.swingType] || 0;
        
        const pressureModifier = this.battingPatterns.clutchFactor * 
                                this.calculatePressure(context) * 0.1;
        
        return Math.max(0.1, Math.min(0.95, 
            baseQuality + swingTypeModifier + pressureModifier));
    }
    
    generateHitOutcome(quality, decision) {
        const outcomes = [
            { type: "single", threshold: 0.3, power: 0.2 },
            { type: "double", threshold: 0.6, power: 0.4 },
            { type: "triple", threshold: 0.8, power: 0.6 },
            { type: "homerun", threshold: 0.9, power: 0.8 }
        ];
        
        const powerFactor = decision.swingType === "aggressive" ? 1.3 : 1.0;
        const adjustedQuality = quality * powerFactor;
        
        for (const outcome of outcomes.reverse()) {
            if (adjustedQuality >= outcome.threshold) {
                const exitVelocity = 80 + (adjustedQuality * outcome.power * 35);
                const launchAngle = 5 + Math.random() * 35;
                
                return {
                    outcome: outcome.type,
                    exitVelocity: Math.round(exitVelocity),
                    launchAngle: Math.round(launchAngle),
                    description: `${this.name} makes solid contact - ${outcome.type}!`,
                    mentalState: decision.mentalState,
                    biometrics: decision.biometricResponse
                };
            }
        }
        
        return {
            outcome: "groundout",
            description: `${this.name} grounds out`,
            mentalState: decision.mentalState,
            biometrics: decision.biometricResponse
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedAIPlayer;
}

// Example usage and testing
function createDemoTeam() {
    const team = [
        new AdvancedAIPlayer("Rodriguez", "C", 0.85),
        new AdvancedAIPlayer("Martinez", "1B", 0.78),
        new AdvancedAIPlayer("Johnson", "2B", 0.72),
        new AdvancedAIPlayer("Williams", "3B", 0.81),
        new AdvancedAIPlayer("Davis", "SS", 0.76),
        new AdvancedAIPlayer("Garcia", "LF", 0.74),
        new AdvancedAIPlayer("Wilson", "CF", 0.83),
        new AdvancedAIPlayer("Anderson", "RF", 0.79),
        new AdvancedAIPlayer("Taylor", "DH", 0.86)
    ];
    
    console.log("🔥 Lone Star Legends Roster Analysis:");
    console.log("=====================================");
    
    team.forEach(player => {
        const analysis = player.getDetailedAnalysis();
        console.log(`\n${analysis.name} (${analysis.position})`);
        console.log(`Champion Quotient: ${analysis.championQuotient}/100`);
        console.log(`Personality: ${analysis.personality}`);
        console.log(`Mental Toughness: ${analysis.traits.mentalToughness}%`);
        console.log(`Killer Instinct: ${analysis.traits.killerInstinct}%`);
    });
    
    return team;
}

// Run demo if in browser environment
if (typeof window !== 'undefined') {
    window.AdvancedAIPlayer = AdvancedAIPlayer;
    window.createDemoTeam = createDemoTeam;
}