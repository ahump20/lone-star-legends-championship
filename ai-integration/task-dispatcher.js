/**
 * Blaze Intelligence Task Dispatcher
 * Intelligent routing and execution of tasks across AI models
 */

class BlazeTaskDispatcher {
  constructor() {
    this.activeConnections = new Map();
    this.taskHistory = [];
    this.performanceMetrics = new Map();
    this.retryQueue = [];
    
    this.initializeDispatcher();
  }

  initializeDispatcher() {
    // Set up performance tracking
    this.trackPerformance();
    
    // Initialize connection pools
    this.setupConnectionPools();
    
    // Start health monitoring
    this.startHealthMonitoring();
  }

  setupConnectionPools() {
    this.connectionPools = {
      claude: {
        maxConnections: 5,
        currentConnections: 0,
        queue: [],
        endpoint: 'https://api.anthropic.com/v1/messages'
      },
      chatgpt: {
        maxConnections: 10,
        currentConnections: 0,
        queue: [],
        endpoint: 'https://api.openai.com/v1/chat/completions'
      },
      gemini: {
        maxConnections: 15,
        currentConnections: 0,
        queue: [],
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
      }
    };
  }

  async dispatchTask(task) {
    const startTime = performance.now();
    
    try {
      // Validate task
      this.validateTask(task);
      
      // Determine optimal model
      const selectedModel = this.selectOptimalModel(task);
      
      // Check rate limits
      await this.checkRateLimits(selectedModel);
      
      // Execute task
      const result = await this.executeTask(task, selectedModel);
      
      // Record success metrics
      const endTime = performance.now();
      this.recordTaskMetrics(task, selectedModel, endTime - startTime, 'success');
      
      return {
        success: true,
        result: result,
        model: selectedModel,
        executionTime: endTime - startTime,
        taskId: task.id
      };
      
    } catch (error) {
      // Handle failure
      const endTime = performance.now();
      this.recordTaskMetrics(task, task.preferredModel, endTime - startTime, 'failure');
      
      // Add to retry queue if appropriate
      if (this.shouldRetry(task, error)) {
        this.addToRetryQueue(task, error);
      }
      
      return {
        success: false,
        error: error.message,
        taskId: task.id,
        retryScheduled: this.shouldRetry(task, error)
      };
    }
  }

  validateTask(task) {
    const requiredFields = ['id', 'type', 'payload'];
    
    for (const field of requiredFields) {
      if (!task[field]) {
        throw new Error(`Task missing required field: ${field}`);
      }
    }
    
    if (!this.isValidTaskType(task.type)) {
      throw new Error(`Invalid task type: ${task.type}`);
    }
  }

  isValidTaskType(type) {
    const validTypes = [
      'research', 'analysis', 'content_creation', 'data_processing',
      'integration', 'reasoning', 'web_scraping', 'pattern_recognition',
      'client_onboarding', 'competitive_analysis', 'report_generation'
    ];
    
    return validTypes.includes(type);
  }

  selectOptimalModel(task) {
    // Get current performance metrics
    const metrics = this.getModelMetrics();
    
    // Calculate scores for each model
    const scores = {
      claude: this.calculateModelScore('claude', task, metrics),
      chatgpt: this.calculateModelScore('chatgpt', task, metrics),
      gemini: this.calculateModelScore('gemini', task, metrics)
    };
    
    // Return model with highest score
    return Object.entries(scores).reduce((best, [model, score]) => 
      score > scores[best] ? model : best
    );
  }

  calculateModelScore(model, task, metrics) {
    let score = 0;
    
    // Base capability scores
    const capabilities = {
      claude: {
        reasoning: 0.95, analysis: 0.90, integration: 0.95,
        research: 0.70, content_creation: 0.85, data_processing: 0.75
      },
      chatgpt: {
        research: 0.95, content_creation: 0.90, web_scraping: 0.95,
        reasoning: 0.80, analysis: 0.75, integration: 0.70
      },
      gemini: {
        data_processing: 0.95, pattern_recognition: 0.90, analysis: 0.85,
        content_creation: 0.80, reasoning: 0.75, research: 0.70
      }
    };
    
    // Get base score for task type
    score = capabilities[model][task.type] || 0.5;
    
    // Adjust for current performance
    const modelMetrics = metrics[model];
    if (modelMetrics) {
      score *= modelMetrics.successRate;
      score *= (1 - modelMetrics.averageLatency / 10000); // Penalize high latency
    }
    
    // Adjust for current load
    const pool = this.connectionPools[model];
    const loadFactor = 1 - (pool.currentConnections / pool.maxConnections);
    score *= loadFactor;
    
    // Priority boost for preferred model
    if (task.preferredModel === model) {
      score *= 1.2;
    }
    
    return score;
  }

  async checkRateLimits(model) {
    const rateLimits = {
      claude: { requestsPerMinute: 50, tokensPerMinute: 40000 },
      chatgpt: { requestsPerMinute: 500, tokensPerMinute: 80000 },
      gemini: { requestsPerMinute: 1000, tokensPerMinute: 120000 }
    };
    
    // Check current usage (simplified - would use actual rate limiting in production)
    const currentUsage = this.getCurrentUsage(model);
    const limits = rateLimits[model];
    
    if (currentUsage.requests >= limits.requestsPerMinute * 0.9) {
      // Wait if approaching rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async executeTask(task, model) {
    const pool = this.connectionPools[model];
    
    // Acquire connection
    if (pool.currentConnections >= pool.maxConnections) {
      await this.waitForConnection(model);
    }
    
    pool.currentConnections++;
    
    try {
      // Execute based on model
      switch (model) {
        case 'claude':
          return await this.executeClaudeTask(task);
        case 'chatgpt':
          return await this.executeChatGPTTask(task);
        case 'gemini':
          return await this.executeGeminiTask(task);
        default:
          throw new Error(`Unknown model: ${model}`);
      }
    } finally {
      // Release connection
      pool.currentConnections--;
    }
  }

  async executeClaudeTask(task) {
    // Simulate Claude API call
    const prompt = this.buildClaudePrompt(task);
    
    // In production, this would be an actual API call
    const mockResponse = {
      type: 'claude_response',
      content: `Claude analysis of ${task.type}: ${JSON.stringify(task.payload)}`,
      reasoning: 'Advanced reasoning applied',
      confidence: 0.95,
      model: 'claude-opus-4.1'
    };
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    return mockResponse;
  }

  async executeChatGPTTask(task) {
    // Simulate ChatGPT API call
    const messages = this.buildChatGPTMessages(task);
    
    // In production, this would be an actual API call
    const mockResponse = {
      type: 'chatgpt_response',
      content: `ChatGPT research on ${task.type}: ${JSON.stringify(task.payload)}`,
      sources: ['source1.com', 'source2.com', 'source3.com'],
      confidence: 0.90,
      model: 'gpt-5-pro'
    };
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 5000));
    
    return mockResponse;
  }

  async executeGeminiTask(task) {
    // Simulate Gemini API call
    const prompt = this.buildGeminiPrompt(task);
    
    // In production, this would be an actual API call
    const mockResponse = {
      type: 'gemini_response',
      content: `Gemini processing of ${task.type}: ${JSON.stringify(task.payload)}`,
      processingStats: {
        dataPoints: 1000000,
        processingTime: '2.3s',
        memoryUsed: '1.2GB'
      },
      confidence: 0.88,
      model: 'gemini-2.5-pro'
    };
    
    // Simulate processing time (faster for Gemini)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    return mockResponse;
  }

  buildClaudePrompt(task) {
    return {
      model: 'claude-opus-4.1',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `Task: ${task.type}\nPayload: ${JSON.stringify(task.payload)}\n\nPlease provide detailed analysis with reasoning.`
      }]
    };
  }

  buildChatGPTMessages(task) {
    return [
      {
        role: 'system',
        content: 'You are an expert researcher and analyst. Provide comprehensive insights with sources.'
      },
      {
        role: 'user',
        content: `Task: ${task.type}\nPayload: ${JSON.stringify(task.payload)}\n\nPlease research and analyze this thoroughly.`
      }
    ];
  }

  buildGeminiPrompt(task) {
    return {
      contents: [{
        parts: [{
          text: `Task: ${task.type}\nPayload: ${JSON.stringify(task.payload)}\n\nProcess this data efficiently and provide insights.`
        }]
      }]
    };
  }

  recordTaskMetrics(task, model, executionTime, status) {
    const metric = {
      taskId: task.id,
      model: model,
      type: task.type,
      executionTime: executionTime,
      status: status,
      timestamp: new Date().toISOString()
    };
    
    this.taskHistory.push(metric);
    
    // Update performance metrics
    if (!this.performanceMetrics.has(model)) {
      this.performanceMetrics.set(model, {
        totalTasks: 0,
        successfulTasks: 0,
        totalTime: 0,
        errors: []
      });
    }
    
    const modelMetrics = this.performanceMetrics.get(model);
    modelMetrics.totalTasks++;
    modelMetrics.totalTime += executionTime;
    
    if (status === 'success') {
      modelMetrics.successfulTasks++;
    } else {
      modelMetrics.errors.push(metric);
    }
  }

  getModelMetrics() {
    const metrics = {};
    
    this.performanceMetrics.forEach((data, model) => {
      metrics[model] = {
        successRate: data.successfulTasks / data.totalTasks,
        averageLatency: data.totalTime / data.totalTasks,
        totalTasks: data.totalTasks,
        errorRate: data.errors.length / data.totalTasks
      };
    });
    
    return metrics;
  }

  shouldRetry(task, error) {
    const retryableErrors = ['timeout', 'rate_limit', 'temporary_failure'];
    const maxRetries = 3;
    
    return (task.retryCount || 0) < maxRetries && 
           retryableErrors.some(errType => error.message.includes(errType));
  }

  addToRetryQueue(task, error) {
    const retryTask = {
      ...task,
      retryCount: (task.retryCount || 0) + 1,
      lastError: error.message,
      retryAt: Date.now() + (Math.pow(2, task.retryCount || 0) * 1000) // Exponential backoff
    };
    
    this.retryQueue.push(retryTask);
  }

  async waitForConnection(model) {
    return new Promise((resolve) => {
      const checkConnection = () => {
        const pool = this.connectionPools[model];
        if (pool.currentConnections < pool.maxConnections) {
          resolve();
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
    });
  }

  getCurrentUsage(model) {
    // Simplified usage tracking - would be more sophisticated in production
    const recentTasks = this.taskHistory
      .filter(task => task.model === model && 
                     Date.now() - new Date(task.timestamp).getTime() < 60000)
      .length;
    
    return {
      requests: recentTasks,
      tokens: recentTasks * 1000 // Estimate
    };
  }

  trackPerformance() {
    setInterval(() => {
      this.processRetryQueue();
      this.cleanupOldMetrics();
    }, 5000);
  }

  processRetryQueue() {
    const now = Date.now();
    const readyTasks = this.retryQueue.filter(task => task.retryAt <= now);
    
    readyTasks.forEach(task => {
      this.dispatchTask(task);
      this.retryQueue = this.retryQueue.filter(t => t.id !== task.id);
    });
  }

  cleanupOldMetrics() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    this.taskHistory = this.taskHistory.filter(
      task => new Date(task.timestamp).getTime() > cutoff
    );
  }

  startHealthMonitoring() {
    setInterval(() => {
      this.checkSystemHealth();
    }, 30000); // Every 30 seconds
  }

  checkSystemHealth() {
    const metrics = this.getModelMetrics();
    const health = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      models: {},
      recommendations: []
    };
    
    Object.entries(metrics).forEach(([model, data]) => {
      const modelHealth = data.successRate > 0.95 ? 'healthy' : 
                         data.successRate > 0.80 ? 'degraded' : 'unhealthy';
      
      health.models[model] = {
        status: modelHealth,
        successRate: data.successRate,
        averageLatency: data.averageLatency,
        totalTasks: data.totalTasks
      };
      
      if (modelHealth !== 'healthy') {
        health.overall = 'degraded';
        health.recommendations.push(`${model} model needs attention`);
      }
    });
    
    console.log('🏥 Blaze AI Health Check:', health);
    return health;
  }

  getSystemStatus() {
    return {
      connectionPools: this.connectionPools,
      performanceMetrics: this.getModelMetrics(),
      queueSizes: {
        retry: this.retryQueue.length,
        totalHistory: this.taskHistory.length
      },
      uptime: process.uptime ? process.uptime() : 'unknown'
    };
  }
}

// Initialize task dispatcher for Blaze Intelligence
if (typeof window !== 'undefined') {
  window.BlazeTaskDispatcher = BlazeTaskDispatcher;
  window.blazeDispatcher = new BlazeTaskDispatcher();
  
  console.log('📡 Blaze Task Dispatcher initialized');
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BlazeTaskDispatcher;
}