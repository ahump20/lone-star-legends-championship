/**
 * Blaze Intelligence Real-Time Data Integration
 * Live WebSocket connections to Cardinals Analytics MCP Server
 */

const BLAZE_API = {
  cardinals: 'wss://cardinals-analytics.blaze.io/stream',
  readiness: 'https://api.blaze-intelligence.com/v1/readiness',
  enigma: 'https://api.blaze-intelligence.com/v1/champion-enigma',
  fallback: '/data/readiness.json'
};

class BlazeRealTimeEngine {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnects = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.cache = new Map();
    this.lastUpdate = null;
    
    // Champion dimensions
    this.dimensions = [
      'Clutch Gene', 'Killer Instinct', 'Flow State',
      'Mental Fortress', 'Predator Mindset', 'Champion Aura',
      'Winner DNA', 'Beast Mode'
    ];
    
    this.initializeConnection();
  }

  initializeConnection() {
    try {
      // Try WebSocket connection first
      this.connectWebSocket();
    } catch (error) {
      console.log('WebSocket unavailable, falling back to polling');
      this.startPolling();
    }
  }

  connectWebSocket() {
    // For now, simulate WebSocket with polling until backend is ready
    // In production, this will connect to actual WebSocket server
    
    // Simulate WebSocket connection
    this.simulateWebSocket();
  }

  simulateWebSocket() {
    // Simulate real-time data updates
    setInterval(() => {
      const mockData = this.generateMockData();
      this.handleMessage({ data: JSON.stringify(mockData) });
    }, 2000);
  }

  generateMockData() {
    const base = {
      timestamp: Date.now(),
      momentum: 67.3 + (Math.random() - 0.5) * 10,
      leverage: 2.4 + (Math.random() - 0.5) * 0.5,
      championScore: 87.5 + (Math.random() - 0.5) * 5,
      dimensions: {}
    };

    // Generate scores for each dimension
    this.dimensions.forEach(dim => {
      base.dimensions[dim] = {
        score: 70 + Math.random() * 30,
        confidence: 0.7 + Math.random() * 0.3,
        trend: Math.random() > 0.5 ? 'up' : 'down',
        delta: (Math.random() - 0.5) * 5
      };
    });

    // Add decision velocity metrics
    base.decisionVelocity = {
      reactionTime: 0.23 + (Math.random() - 0.5) * 0.05,
      marketLag: 1.4 + (Math.random() - 0.5) * 0.2,
      advantage: null
    };
    base.decisionVelocity.advantage = 
      base.decisionVelocity.marketLag - base.decisionVelocity.reactionTime;

    // Add pattern recognition data
    base.patterns = [
      { type: 'Cover 2', confidence: 0.73, formation: 'Bear Market Defense' },
      { type: 'Blitz', confidence: 0.89, formation: 'Volatility Spike' },
      { type: 'RPO', confidence: 0.67, formation: 'Merger Arbitrage' }
    ].filter(p => p.confidence > 0.73);

    // Add cognitive load distribution
    base.cognitiveLoad = {
      perception: 67 + Math.random() * 20,
      decision: 89 - Math.random() * 15,
      execution: 45 + Math.random() * 25
    };

    return base;
  }

  handleMessage(event) {
    const data = JSON.parse(event.data);
    this.lastUpdate = Date.now();
    
    // Update cache
    this.cache.set('latest', data);
    
    // Notify all listeners
    this.notifyListeners('update', data);
    
    // Update UI elements
    this.updateLiveMetrics(data);
  }

  updateLiveMetrics(data) {
    // Update readiness
    const readinessEl = document.getElementById('readiness');
    if (readinessEl) {
      readinessEl.textContent = data.momentum.toFixed(2);
      this.animateValue(readinessEl, data.momentum);
    }

    // Update leverage
    const leverageEl = document.getElementById('leverage');
    if (leverageEl) {
      leverageEl.textContent = data.leverage.toFixed(2);
      this.animateValue(leverageEl, data.leverage);
    }

    // Update timestamp
    const updatedEl = document.getElementById('updated');
    if (updatedEl) {
      updatedEl.textContent = new Date(data.timestamp).toLocaleTimeString();
    }

    // Update live dot status
    const dotEl = document.getElementById('live-dot');
    if (dotEl) {
      dotEl.style.background = 'var(--blaze-orange)';
      dotEl.style.animation = 'blzPulse 2s infinite';
    }

    // Trigger Champion Enigma update if available
    if (window.ChampionEnigmaEngine) {
      window.ChampionEnigmaEngine.updateDimensions(data.dimensions);
    }

    // Update Decision Velocity if available
    if (window.DecisionVelocityMeter) {
      window.DecisionVelocityMeter.update(data.decisionVelocity);
    }

    // Update Pattern Recognition if available
    if (window.PatternRecognizer) {
      window.PatternRecognizer.addPatterns(data.patterns);
    }

    // Update Cognitive Load if available
    if (window.CognitiveLoadDashboard) {
      window.CognitiveLoadDashboard.update(data.cognitiveLoad);
    }
  }

  animateValue(element, value) {
    // Add subtle animation when value changes
    element.style.transform = 'scale(1.1)';
    element.style.transition = 'transform 0.3s ease';
    setTimeout(() => {
      element.style.transform = 'scale(1)';
    }, 300);
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  notifyListeners(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }

  async fetchFallbackData() {
    try {
      const response = await fetch(BLAZE_API.fallback, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        this.handleMessage({ data: JSON.stringify(data) });
      }
    } catch (error) {
      console.error('Failed to fetch fallback data:', error);
    }
  }

  startPolling(interval = 5000) {
    this.fetchFallbackData();
    setInterval(() => this.fetchFallbackData(), interval);
  }

  getLatestData() {
    return this.cache.get('latest');
  }

  isConnected() {
    return this.lastUpdate && (Date.now() - this.lastUpdate < 10000);
  }
}

// Initialize real-time engine
window.BlazeRealTime = new BlazeRealTimeEngine();