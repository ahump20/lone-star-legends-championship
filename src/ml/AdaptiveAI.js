/**
 * Phase 31: Machine Learning Adaptive AI System
 * AI that learns from player patterns and adapts strategies in real-time
 */
export class AdaptiveAI {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.isActive = false;
        
        // Neural network configuration
        this.networkConfig = {
            inputNodes: 24,  // Game state features
            hiddenLayers: [64, 32, 16],  // 3 hidden layers
            outputNodes: 9,  // Action predictions
            learningRate: 0.01,
            momentum: 0.9,
            batchSize: 32
        };
        
        // Player behavior tracking
        this.playerProfile = {
            id: null,
            totalPitches: 0,
            totalSwings: 0,
            patterns: new Map(),
            tendencies: {
                // Batting tendencies
                swingRate: 0.5,
                chaseRate: 0.3,
                pullRate: 0.4,
                powerSwingRate: 0.2,
                
                // Pitching tendencies
                fastballRate: 0.6,
                breakingBallRate: 0.3,
                changeupRate: 0.1,
                strikeZoneRate: 0.65,
                
                // Situational tendencies
                firstPitchSwing: 0.3,
                twoStrikeApproach: 0.2,
                runnersOnBase: 0.4,
                clutchPerformance: 0.5
            },
            strengths: [],
            weaknesses: [],
            adaptationLevel: 0  // 0-1, how much AI has learned
        };
        
        // Pattern recognition system
        this.patternRecognition = {
            sequences: [],  // Store sequence patterns
            maxSequenceLength: 10,
            minPatternOccurrence: 3,  // Min times to consider a pattern
            patternConfidence: new Map(),
            recentActions: []
        };
        
        // Prediction model
        this.predictionModel = {
            weights: null,
            biases: null,
            trained: false,
            accuracy: 0,
            predictions: [],
            trainingData: []
        };
        
        // Real-time learning
        this.realTimeLearning = {
            enabled: true,
            updateFrequency: 10,  // Update every N actions
            experienceReplay: [],
            replayBufferSize: 1000,
            explorationRate: 0.1,  // Epsilon for exploration
            minExplorationRate: 0.01,
            explorationDecay: 0.995
        };
        
        // Strategy adaptation
        this.strategyAdaptation = {
            currentStrategy: 'balanced',
            strategies: {
                aggressive: {
                    swingThreshold: 0.4,
                    powerFactor: 1.2,
                    riskTolerance: 0.7
                },
                conservative: {
                    swingThreshold: 0.6,
                    powerFactor: 0.8,
                    riskTolerance: 0.3
                },
                balanced: {
                    swingThreshold: 0.5,
                    powerFactor: 1.0,
                    riskTolerance: 0.5
                },
                adaptive: {
                    swingThreshold: null,  // Dynamically calculated
                    powerFactor: null,
                    riskTolerance: null
                }
            }
        };
        
        // Performance metrics
        this.metrics = {
            totalPredictions: 0,
            correctPredictions: 0,
            predictionAccuracy: 0,
            adaptationScore: 0,
            learningCurve: [],
            performanceHistory: []
        };
        
        console.log('🧠 Adaptive AI System initialized');
        this.initialize();
    }
    
    /**
     * Initialize the ML system
     */
    async initialize() {
        // Initialize neural network weights
        this.initializeNetwork();
        
        // Load any saved models
        await this.loadModel();
        
        // Start pattern recognition
        this.startPatternRecognition();
        
        // Create visualization UI
        this.createMLDashboard();
        
        this.isActive = true;
        console.log('🤖 Machine Learning AI ready');
    }
    
    /**
     * Initialize neural network with random weights
     */
    initializeNetwork() {
        const config = this.networkConfig;
        this.predictionModel.weights = [];
        this.predictionModel.biases = [];
        
        // Initialize weights for each layer
        let prevNodes = config.inputNodes;
        
        for (const nodes of config.hiddenLayers) {
            // Xavier initialization
            const scale = Math.sqrt(2.0 / prevNodes);
            const weights = this.createMatrix(prevNodes, nodes, scale);
            const biases = new Array(nodes).fill(0).map(() => Math.random() * 0.1);
            
            this.predictionModel.weights.push(weights);
            this.predictionModel.biases.push(biases);
            prevNodes = nodes;
        }
        
        // Output layer
        const outputScale = Math.sqrt(2.0 / prevNodes);
        const outputWeights = this.createMatrix(prevNodes, config.outputNodes, outputScale);
        const outputBiases = new Array(config.outputNodes).fill(0).map(() => Math.random() * 0.1);
        
        this.predictionModel.weights.push(outputWeights);
        this.predictionModel.biases.push(outputBiases);
        
        console.log('🔧 Neural network initialized with', 
            config.hiddenLayers.length + 1, 'layers');
    }
    
    /**
     * Create weight matrix with initialization
     */
    createMatrix(rows, cols, scale = 1.0) {
        const matrix = [];
        for (let i = 0; i < rows; i++) {
            matrix[i] = [];
            for (let j = 0; j < cols; j++) {
                // Random Gaussian with scaling
                matrix[i][j] = (Math.random() - 0.5) * 2 * scale;
            }
        }
        return matrix;
    }
    
    /**
     * Record player action for learning
     */
    recordAction(action, gameState, outcome) {
        // Extract features from game state
        const features = this.extractFeatures(gameState);
        
        // Store in training data
        this.predictionModel.trainingData.push({
            features,
            action,
            outcome,
            timestamp: Date.now()
        });
        
        // Update player tendencies
        this.updateTendencies(action, gameState);
        
        // Add to pattern recognition
        this.patternRecognition.recentActions.push({
            action,
            state: this.simplifyState(gameState),
            outcome
        });
        
        // Maintain recent action buffer
        if (this.patternRecognition.recentActions.length > 
            this.patternRecognition.maxSequenceLength) {
            this.patternRecognition.recentActions.shift();
        }
        
        // Detect patterns
        this.detectPatterns();
        
        // Add to experience replay buffer
        if (this.realTimeLearning.enabled) {
            this.realTimeLearning.experienceReplay.push({
                state: features,
                action,
                reward: this.calculateReward(outcome),
                nextState: null,  // Will be filled on next action
                done: false
            });
            
            // Maintain buffer size
            if (this.realTimeLearning.experienceReplay.length > 
                this.realTimeLearning.replayBufferSize) {
                this.realTimeLearning.experienceReplay.shift();
            }
            
            // Trigger learning update
            if (this.predictionModel.trainingData.length % 
                this.realTimeLearning.updateFrequency === 0) {
                this.performLearningUpdate();
            }
        }
        
        // Update adaptation level
        this.playerProfile.adaptationLevel = Math.min(1, 
            this.playerProfile.adaptationLevel + 0.001);
        
        console.log(`📊 Recorded action: ${action}, Adaptation: ${
            (this.playerProfile.adaptationLevel * 100).toFixed(1)}%`);
    }
    
    /**
     * Extract features from game state
     */
    extractFeatures(gameState) {
        const features = [];
        
        // Game situation features (9)
        features.push(gameState.inning / 9);
        features.push(gameState.isBottomInning ? 1 : 0);
        features.push(gameState.outs / 3);
        features.push(gameState.count.balls / 3);
        features.push(gameState.count.strikes / 2);
        features.push((gameState.score.home - gameState.score.away) / 10);
        features.push(gameState.runners.length / 3);
        features.push(gameState.runners.includes(2) ? 1 : 0);  // RISP
        features.push(gameState.runners.includes(3) ? 1 : 0);  // Runner on 3rd
        
        // Player tendency features (8)
        features.push(this.playerProfile.tendencies.swingRate);
        features.push(this.playerProfile.tendencies.chaseRate);
        features.push(this.playerProfile.tendencies.pullRate);
        features.push(this.playerProfile.tendencies.fastballRate);
        features.push(this.playerProfile.tendencies.strikeZoneRate);
        features.push(this.playerProfile.tendencies.firstPitchSwing);
        features.push(this.playerProfile.tendencies.clutchPerformance);
        features.push(this.playerProfile.adaptationLevel);
        
        // Recent history features (7)
        const recentActions = this.patternRecognition.recentActions.slice(-3);
        for (let i = 0; i < 3; i++) {
            if (recentActions[i]) {
                features.push(this.encodeAction(recentActions[i].action));
                features.push(recentActions[i].outcome === 'success' ? 1 : 0);
            } else {
                features.push(0);
                features.push(0.5);
            }
        }
        features.push(this.metrics.predictionAccuracy);
        
        // Ensure we have exactly 24 features
        while (features.length < this.networkConfig.inputNodes) {
            features.push(0);
        }
        
        return features.slice(0, this.networkConfig.inputNodes);
    }
    
    /**
     * Predict next player action
     */
    predictNextAction(gameState) {
        if (!this.predictionModel.trained && 
            this.predictionModel.trainingData.length < 10) {
            // Not enough data for prediction
            return this.getDefaultPrediction(gameState);
        }
        
        const features = this.extractFeatures(gameState);
        const output = this.forwardPass(features);
        
        // Apply exploration vs exploitation
        if (Math.random() < this.realTimeLearning.explorationRate) {
            // Exploration: random action
            const randomIndex = Math.floor(Math.random() * output.length);
            console.log('🎲 Exploring new strategy');
            return this.decodeAction(randomIndex);
        }
        
        // Exploitation: use best predicted action
        const bestActionIndex = output.indexOf(Math.max(...output));
        const confidence = output[bestActionIndex];
        
        // Check for patterns
        const patternPrediction = this.predictFromPatterns(gameState);
        if (patternPrediction && patternPrediction.confidence > confidence) {
            console.log(`🔮 Pattern prediction: ${patternPrediction.action} (${
                (patternPrediction.confidence * 100).toFixed(1)}% confidence)`);
            return patternPrediction.action;
        }
        
        const prediction = this.decodeAction(bestActionIndex);
        
        // Store prediction for accuracy tracking
        this.metrics.totalPredictions++;
        this.predictionModel.predictions.push({
            predicted: prediction,
            confidence,
            gameState: this.simplifyState(gameState),
            timestamp: Date.now()
        });
        
        console.log(`🎯 AI Prediction: ${prediction} (${
            (confidence * 100).toFixed(1)}% confidence)`);
        
        return prediction;
    }
    
    /**
     * Forward pass through neural network
     */
    forwardPass(input) {
        let activation = input;
        
        for (let i = 0; i < this.predictionModel.weights.length; i++) {
            const weights = this.predictionModel.weights[i];
            const biases = this.predictionModel.biases[i];
            
            // Linear transformation
            const z = this.matrixMultiply([activation], weights)[0];
            
            // Add biases
            for (let j = 0; j < z.length; j++) {
                z[j] += biases[j];
            }
            
            // Apply activation function (ReLU for hidden, softmax for output)
            if (i < this.predictionModel.weights.length - 1) {
                activation = z.map(x => Math.max(0, x));  // ReLU
            } else {
                activation = this.softmax(z);  // Softmax for output
            }
        }
        
        return activation;
    }
    
    /**
     * Perform learning update using experience replay
     */
    performLearningUpdate() {
        if (this.realTimeLearning.experienceReplay.length < 
            this.networkConfig.batchSize) {
            return;
        }
        
        // Sample random batch from replay buffer
        const batch = this.sampleBatch(
            this.realTimeLearning.experienceReplay,
            this.networkConfig.batchSize
        );
        
        // Perform gradient descent on batch
        const gradients = this.calculateGradients(batch);
        this.updateWeights(gradients);
        
        // Update exploration rate
        this.realTimeLearning.explorationRate = Math.max(
            this.realTimeLearning.minExplorationRate,
            this.realTimeLearning.explorationRate * 
            this.realTimeLearning.explorationDecay
        );
        
        // Update metrics
        this.updateMetrics();
        
        // Mark as trained after sufficient updates
        if (this.predictionModel.trainingData.length > 100) {
            this.predictionModel.trained = true;
        }
        
        console.log(`🔄 Learning update completed, Accuracy: ${
            (this.metrics.predictionAccuracy * 100).toFixed(1)}%`);
    }
    
    /**
     * Detect patterns in player behavior
     */
    detectPatterns() {
        const recentActions = this.patternRecognition.recentActions;
        if (recentActions.length < 3) return;
        
        // Look for sequences of 2-5 actions
        for (let length = 2; length <= 5 && length <= recentActions.length; length++) {
            const sequence = recentActions.slice(-length)
                .map(a => `${a.action}_${a.state}`).join('|');
            
            // Update pattern confidence
            const currentConf = this.patternRecognition.patternConfidence.get(sequence) || 0;
            this.patternRecognition.patternConfidence.set(sequence, currentConf + 1);
            
            // Check if pattern is significant
            if (currentConf + 1 >= this.patternRecognition.minPatternOccurrence) {
                // Calculate next likely action
                const nextActions = new Map();
                
                // Find historical occurrences
                for (let i = 0; i < this.predictionModel.trainingData.length - length; i++) {
                    const historicalSeq = this.predictionModel.trainingData
                        .slice(i, i + length)
                        .map(d => `${d.action}_${this.simplifyState(d.features)}`)
                        .join('|');
                    
                    if (historicalSeq === sequence && 
                        this.predictionModel.trainingData[i + length]) {
                        const nextAction = this.predictionModel.trainingData[i + length].action;
                        nextActions.set(nextAction, (nextActions.get(nextAction) || 0) + 1);
                    }
                }
                
                // Store pattern if predictive
                if (nextActions.size > 0) {
                    this.patternRecognition.sequences.push({
                        pattern: sequence,
                        predictions: nextActions,
                        confidence: currentConf + 1
                    });
                }
            }
        }
    }
    
    /**
     * Predict from detected patterns
     */
    predictFromPatterns(gameState) {
        const recentSeq = this.patternRecognition.recentActions
            .map(a => `${a.action}_${a.state}`).join('|');
        
        let bestPrediction = null;
        let highestConfidence = 0;
        
        for (const pattern of this.patternRecognition.sequences) {
            if (recentSeq.endsWith(pattern.pattern)) {
                // Find most likely next action
                let maxCount = 0;
                let predictedAction = null;
                
                pattern.predictions.forEach((count, action) => {
                    if (count > maxCount) {
                        maxCount = count;
                        predictedAction = action;
                    }
                });
                
                const confidence = maxCount / Array.from(pattern.predictions.values())
                    .reduce((a, b) => a + b, 0);
                
                if (confidence > highestConfidence) {
                    highestConfidence = confidence;
                    bestPrediction = {
                        action: predictedAction,
                        confidence,
                        pattern: pattern.pattern
                    };
                }
            }
        }
        
        return bestPrediction;
    }
    
    /**
     * Update player tendencies based on action
     */
    updateTendencies(action, gameState) {
        const alpha = 0.1;  // Learning rate for tendency updates
        
        switch (action) {
            case 'swing':
                this.playerProfile.totalSwings++;
                this.playerProfile.tendencies.swingRate = 
                    (1 - alpha) * this.playerProfile.tendencies.swingRate + alpha;
                
                if (gameState.count.strikes === 0 && gameState.count.balls === 0) {
                    this.playerProfile.tendencies.firstPitchSwing = 
                        (1 - alpha) * this.playerProfile.tendencies.firstPitchSwing + alpha;
                }
                break;
                
            case 'take':
                this.playerProfile.tendencies.swingRate = 
                    (1 - alpha) * this.playerProfile.tendencies.swingRate;
                break;
                
            case 'fastball':
                this.playerProfile.totalPitches++;
                this.playerProfile.tendencies.fastballRate = 
                    (1 - alpha) * this.playerProfile.tendencies.fastballRate + alpha;
                break;
                
            case 'breaking':
                this.playerProfile.totalPitches++;
                this.playerProfile.tendencies.breakingBallRate = 
                    (1 - alpha) * this.playerProfile.tendencies.breakingBallRate + alpha;
                break;
        }
        
        // Identify strengths and weaknesses
        this.analyzeStrengthsWeaknesses();
    }
    
    /**
     * Analyze player strengths and weaknesses
     */
    analyzeStrengthsWeaknesses() {
        this.playerProfile.strengths = [];
        this.playerProfile.weaknesses = [];
        
        // Batting analysis
        if (this.playerProfile.tendencies.swingRate > 0.6) {
            this.playerProfile.weaknesses.push('aggressive_swinger');
        } else if (this.playerProfile.tendencies.swingRate < 0.3) {
            this.playerProfile.weaknesses.push('passive_approach');
        }
        
        if (this.playerProfile.tendencies.chaseRate > 0.35) {
            this.playerProfile.weaknesses.push('chases_outside_zone');
        }
        
        if (this.playerProfile.tendencies.clutchPerformance > 0.6) {
            this.playerProfile.strengths.push('clutch_hitter');
        }
        
        // Pitching analysis
        if (this.playerProfile.tendencies.fastballRate > 0.7) {
            this.playerProfile.weaknesses.push('predictable_fastball');
        }
        
        if (this.playerProfile.tendencies.strikeZoneRate < 0.55) {
            this.playerProfile.weaknesses.push('control_issues');
        }
    }
    
    /**
     * Adapt strategy based on learning
     */
    adaptStrategy() {
        const profile = this.playerProfile;
        const adaptation = this.strategyAdaptation;
        
        // Calculate adaptive strategy parameters
        if (profile.adaptationLevel > 0.3) {
            adaptation.strategies.adaptive.swingThreshold = 
                0.5 - (profile.tendencies.swingRate - 0.5) * 0.3;
            
            adaptation.strategies.adaptive.powerFactor = 
                1.0 + (profile.tendencies.pullRate - 0.4) * 0.5;
            
            adaptation.strategies.adaptive.riskTolerance = 
                0.5 + (profile.tendencies.clutchPerformance - 0.5) * 0.4;
            
            // Switch to adaptive strategy when sufficient learning
            if (profile.adaptationLevel > 0.5) {
                adaptation.currentStrategy = 'adaptive';
                console.log('🎯 Switched to adaptive strategy');
            }
        }
        
        return adaptation.strategies[adaptation.currentStrategy];
    }
    
    /**
     * Get recommendation based on ML predictions
     */
    getMLRecommendation(gameState) {
        const prediction = this.predictNextAction(gameState);
        const strategy = this.adaptStrategy();
        
        // Combine prediction with strategy
        const recommendation = {
            action: prediction,
            confidence: this.metrics.predictionAccuracy,
            strategy: this.strategyAdaptation.currentStrategy,
            reasoning: this.explainPrediction(prediction, gameState),
            alternativeActions: this.getAlternativeActions(gameState),
            playerWeaknesses: this.playerProfile.weaknesses,
            exploitOpportunities: this.identifyExploits()
        };
        
        return recommendation;
    }
    
    /**
     * Explain why AI made a prediction
     */
    explainPrediction(prediction, gameState) {
        const reasons = [];
        
        // Check patterns
        const pattern = this.predictFromPatterns(gameState);
        if (pattern && pattern.action === prediction) {
            reasons.push(`Pattern detected: ${pattern.pattern.split('|').length}-move sequence`);
        }
        
        // Check tendencies
        if (prediction === 'swing' && this.playerProfile.tendencies.swingRate > 0.6) {
            reasons.push('Player shows aggressive swinging tendency');
        }
        
        // Check situation
        if (gameState.count.strikes === 2 && prediction === 'breaking') {
            reasons.push('Two-strike count favors breaking ball');
        }
        
        // Check adaptation
        if (this.playerProfile.adaptationLevel > 0.5) {
            reasons.push(`AI has ${(this.playerProfile.adaptationLevel * 100).toFixed(0)}% adaptation to player style`);
        }
        
        return reasons;
    }
    
    /**
     * Identify exploitation opportunities
     */
    identifyExploits() {
        const exploits = [];
        
        for (const weakness of this.playerProfile.weaknesses) {
            switch (weakness) {
                case 'aggressive_swinger':
                    exploits.push({
                        type: 'pitch_selection',
                        strategy: 'Throw more balls outside zone',
                        confidence: 0.7
                    });
                    break;
                case 'chases_outside_zone':
                    exploits.push({
                        type: 'location',
                        strategy: 'Expand zone with breaking balls',
                        confidence: 0.8
                    });
                    break;
                case 'predictable_fastball':
                    exploits.push({
                        type: 'timing',
                        strategy: 'Sit on fastball in counts',
                        confidence: 0.75
                    });
                    break;
            }
        }
        
        return exploits;
    }
    
    /**
     * Get alternative actions with probabilities
     */
    getAlternativeActions(gameState) {
        const features = this.extractFeatures(gameState);
        const output = this.forwardPass(features);
        
        const actions = [];
        for (let i = 0; i < output.length; i++) {
            actions.push({
                action: this.decodeAction(i),
                probability: output[i]
            });
        }
        
        return actions.sort((a, b) => b.probability - a.probability).slice(0, 3);
    }
    
    /**
     * Calculate reward for reinforcement learning
     */
    calculateReward(outcome) {
        switch (outcome) {
            case 'home_run': return 1.0;
            case 'hit': return 0.7;
            case 'walk': return 0.4;
            case 'strikeout': return -0.5;
            case 'out': return -0.3;
            case 'strike': return 0.2;
            case 'ball': return -0.1;
            default: return 0;
        }
    }
    
    /**
     * Update metrics
     */
    updateMetrics() {
        // Calculate prediction accuracy
        let correct = 0;
        const recent = this.predictionModel.predictions.slice(-20);
        
        for (const pred of recent) {
            // Check if prediction matched actual action
            const actualAction = this.findActualAction(pred.timestamp);
            if (actualAction === pred.predicted) {
                correct++;
            }
        }
        
        if (recent.length > 0) {
            this.metrics.predictionAccuracy = correct / recent.length;
        }
        
        // Update learning curve
        this.metrics.learningCurve.push({
            timestamp: Date.now(),
            accuracy: this.metrics.predictionAccuracy,
            adaptationLevel: this.playerProfile.adaptationLevel
        });
        
        // Keep only last 100 points
        if (this.metrics.learningCurve.length > 100) {
            this.metrics.learningCurve.shift();
        }
    }
    
    /**
     * Find actual action taken after prediction
     */
    findActualAction(predictionTime) {
        for (const data of this.predictionModel.trainingData) {
            if (data.timestamp > predictionTime && 
                data.timestamp < predictionTime + 10000) {
                return data.action;
            }
        }
        return null;
    }
    
    /**
     * Matrix multiplication helper
     */
    matrixMultiply(a, b) {
        const result = [];
        for (let i = 0; i < a.length; i++) {
            result[i] = [];
            for (let j = 0; j < b[0].length; j++) {
                let sum = 0;
                for (let k = 0; k < b.length; k++) {
                    sum += a[i][k] * b[k][j];
                }
                result[i][j] = sum;
            }
        }
        return result;
    }
    
    /**
     * Softmax activation function
     */
    softmax(x) {
        const max = Math.max(...x);
        const exp = x.map(v => Math.exp(v - max));
        const sum = exp.reduce((a, b) => a + b, 0);
        return exp.map(v => v / sum);
    }
    
    /**
     * Sample random batch from buffer
     */
    sampleBatch(buffer, size) {
        const batch = [];
        const indices = new Set();
        
        while (indices.size < Math.min(size, buffer.length)) {
            indices.add(Math.floor(Math.random() * buffer.length));
        }
        
        indices.forEach(i => batch.push(buffer[i]));
        return batch;
    }
    
    /**
     * Calculate gradients for backpropagation
     */
    calculateGradients(batch) {
        // Simplified gradient calculation
        // In production, would use proper backpropagation
        const gradients = {
            weights: [],
            biases: []
        };
        
        // Initialize gradient structures
        for (let i = 0; i < this.predictionModel.weights.length; i++) {
            gradients.weights[i] = this.predictionModel.weights[i].map(row => 
                row.map(() => 0)
            );
            gradients.biases[i] = this.predictionModel.biases[i].map(() => 0);
        }
        
        // Accumulate gradients over batch
        for (const sample of batch) {
            // Forward pass to get predictions
            const output = this.forwardPass(sample.state);
            
            // Calculate error
            const target = new Array(this.networkConfig.outputNodes).fill(0);
            target[this.encodeAction(sample.action)] = sample.reward;
            
            // Simplified gradient update (would use proper backprop)
            for (let i = 0; i < output.length; i++) {
                const error = target[i] - output[i];
                // Update output layer gradients
                const lastLayer = gradients.weights.length - 1;
                for (let j = 0; j < gradients.weights[lastLayer].length; j++) {
                    for (let k = 0; k < gradients.weights[lastLayer][j].length; k++) {
                        gradients.weights[lastLayer][j][k] += error * 0.01;
                    }
                }
            }
        }
        
        return gradients;
    }
    
    /**
     * Update weights using gradients
     */
    updateWeights(gradients) {
        const lr = this.networkConfig.learningRate;
        const momentum = this.networkConfig.momentum;
        
        for (let i = 0; i < this.predictionModel.weights.length; i++) {
            for (let j = 0; j < this.predictionModel.weights[i].length; j++) {
                for (let k = 0; k < this.predictionModel.weights[i][j].length; k++) {
                    this.predictionModel.weights[i][j][k] += 
                        lr * gradients.weights[i][j][k];
                }
            }
            
            for (let j = 0; j < this.predictionModel.biases[i].length; j++) {
                this.predictionModel.biases[i][j] += 
                    lr * gradients.biases[i][j];
            }
        }
    }
    
    /**
     * Encode action to numeric value
     */
    encodeAction(action) {
        const actions = ['swing', 'take', 'bunt', 'steal', 
                        'fastball', 'breaking', 'changeup', 'inside', 'outside'];
        return actions.indexOf(action) || 0;
    }
    
    /**
     * Decode numeric value to action
     */
    decodeAction(index) {
        const actions = ['swing', 'take', 'bunt', 'steal', 
                        'fastball', 'breaking', 'changeup', 'inside', 'outside'];
        return actions[index] || 'swing';
    }
    
    /**
     * Simplify game state for pattern matching
     */
    simplifyState(state) {
        if (Array.isArray(state)) {
            // Features array
            return `${Math.round(state[2] * 3)}_${Math.round(state[3] * 4)}_${Math.round(state[4] * 3)}`;
        } else {
            // Game state object
            return `${state.outs}_${state.count.balls}_${state.count.strikes}`;
        }
    }
    
    /**
     * Get default prediction when not enough data
     */
    getDefaultPrediction(gameState) {
        // Simple heuristic-based prediction
        if (gameState.count.strikes === 2) {
            return 'breaking';
        } else if (gameState.count.balls === 3) {
            return 'fastball';
        } else {
            return Math.random() > 0.5 ? 'fastball' : 'swing';
        }
    }
    
    /**
     * Save model to storage
     */
    async saveModel() {
        try {
            const modelData = {
                weights: this.predictionModel.weights,
                biases: this.predictionModel.biases,
                profile: this.playerProfile,
                patterns: Array.from(this.patternRecognition.patternConfidence.entries()),
                metrics: this.metrics,
                timestamp: Date.now()
            };
            
            localStorage.setItem('ml_model', JSON.stringify(modelData));
            console.log('💾 ML model saved');
        } catch (error) {
            console.error('Failed to save model:', error);
        }
    }
    
    /**
     * Load model from storage
     */
    async loadModel() {
        try {
            const saved = localStorage.getItem('ml_model');
            if (saved) {
                const modelData = JSON.parse(saved);
                
                this.predictionModel.weights = modelData.weights;
                this.predictionModel.biases = modelData.biases;
                this.playerProfile = modelData.profile;
                this.patternRecognition.patternConfidence = new Map(modelData.patterns);
                this.metrics = modelData.metrics;
                this.predictionModel.trained = true;
                
                console.log('📂 ML model loaded');
            }
        } catch (error) {
            console.error('Failed to load model:', error);
        }
    }
    
    /**
     * Start pattern recognition system
     */
    startPatternRecognition() {
        // Pattern analysis runs periodically
        setInterval(() => {
            if (this.isActive) {
                this.detectPatterns();
                this.adaptStrategy();
            }
        }, 5000);
    }
    
    /**
     * Create ML dashboard UI
     */
    createMLDashboard() {
        const dashboard = document.createElement('div');
        dashboard.id = 'ml-dashboard';
        dashboard.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 300px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px;
            border-radius: 10px;
            font-family: monospace;
            font-size: 12px;
            display: none;
            z-index: 10000;
        `;
        
        dashboard.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #00ff88;">🧠 ML Adaptive AI</h3>
            <div id="ml-stats"></div>
        `;
        
        document.body.appendChild(dashboard);
        
        // Update dashboard periodically
        setInterval(() => this.updateDashboard(), 1000);
    }
    
    /**
     * Update ML dashboard
     */
    updateDashboard() {
        const stats = document.getElementById('ml-stats');
        if (!stats) return;
        
        stats.innerHTML = `
            <div>Adaptation: ${(this.playerProfile.adaptationLevel * 100).toFixed(1)}%</div>
            <div>Accuracy: ${(this.metrics.predictionAccuracy * 100).toFixed(1)}%</div>
            <div>Strategy: ${this.strategyAdaptation.currentStrategy}</div>
            <div>Patterns: ${this.patternRecognition.sequences.length}</div>
            <div>Training Data: ${this.predictionModel.trainingData.length}</div>
            <div>Exploration: ${(this.realTimeLearning.explorationRate * 100).toFixed(1)}%</div>
            <hr style="border-color: #444;">
            <div style="color: #3498db;">Tendencies:</div>
            <div>• Swing Rate: ${(this.playerProfile.tendencies.swingRate * 100).toFixed(0)}%</div>
            <div>• Chase Rate: ${(this.playerProfile.tendencies.chaseRate * 100).toFixed(0)}%</div>
            <div>• Clutch: ${(this.playerProfile.tendencies.clutchPerformance * 100).toFixed(0)}%</div>
            ${this.playerProfile.weaknesses.length > 0 ? 
                `<hr style="border-color: #444;"><div style="color: #e74c3c;">Weaknesses:</div>
                ${this.playerProfile.weaknesses.map(w => `<div>• ${w.replace(/_/g, ' ')}</div>`).join('')}` : ''}
        `;
    }
    
    /**
     * Toggle ML dashboard visibility
     */
    toggleDashboard() {
        const dashboard = document.getElementById('ml-dashboard');
        if (dashboard) {
            dashboard.style.display = dashboard.style.display === 'none' ? 'block' : 'none';
        }
    }
    
    /**
     * Get current ML status
     */
    getStatus() {
        return {
            active: this.isActive,
            trained: this.predictionModel.trained,
            adaptationLevel: this.playerProfile.adaptationLevel,
            accuracy: this.metrics.predictionAccuracy,
            dataPoints: this.predictionModel.trainingData.length,
            patterns: this.patternRecognition.sequences.length
        };
    }
    
    /**
     * Reset ML model
     */
    reset() {
        this.initializeNetwork();
        this.playerProfile.adaptationLevel = 0;
        this.predictionModel.trainingData = [];
        this.predictionModel.trained = false;
        this.patternRecognition.sequences = [];
        this.patternRecognition.patternConfidence.clear();
        this.metrics.predictionAccuracy = 0;
        this.realTimeLearning.explorationRate = 0.1;
        
        console.log('🔄 ML model reset');
    }
    
    /**
     * Dispose ML system
     */
    dispose() {
        this.saveModel();
        this.isActive = false;
        
        const dashboard = document.getElementById('ml-dashboard');
        if (dashboard) dashboard.remove();
        
        console.log('🧠 Adaptive AI disposed');
    }
}