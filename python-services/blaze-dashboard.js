/**
 * Blaze Analytics Dashboard for Lone Star Legends
 * Advanced real-time analytics and visualization dashboard
 * Inspired by Blaze Intelligence UI components
 */

import BlazeMomentumAnalyzer from './blaze-momentum-analyzer.js';
import BlazeCriticalPlayAnalyzer from './blaze-critical-plays.js';
import BaseballDataViz from './d3-visualizations.js';

export class BlazeDashboard {
  constructor(container) {
    this.container = container || document.body;
    this.momentumAnalyzer = new BlazeMomentumAnalyzer();
    this.criticalPlayAnalyzer = new BlazeCriticalPlayAnalyzer();
    this.dataViz = new BaseballDataViz(this.container);
    
    this.dashboardElement = null;
    this.updateInterval = null;
    this.isVisible = false;
    
    this.colors = {
      primary: '#2E8B57',
      secondary: '#8B4513',
      accent: '#FFD700',
      danger: '#DC143C',
      success: '#228B22',
      dark: '#1a1a2e',
      light: '#f5f5f5'
    };
    
    this.init();
  }

  /**
   * Initialize the dashboard
   */
  init() {
    this.createDashboardHTML();
    this.attachEventListeners();
    this.startRealTimeUpdates();
  }

  /**
   * Create dashboard HTML structure
   */
  createDashboardHTML() {
    this.dashboardElement = document.createElement('div');
    this.dashboardElement.className = 'blaze-dashboard';
    this.dashboardElement.innerHTML = `
      <div class="blaze-dashboard-container">
        <div class="blaze-header">
          <h2 class="blaze-title">
            <span class="blaze-icon">🔥</span>
            Blaze Intelligence Dashboard
          </h2>
          <button class="blaze-close-btn" id="blaze-close">×</button>
        </div>
        
        <div class="blaze-tabs">
          <button class="blaze-tab active" data-tab="momentum">Momentum</button>
          <button class="blaze-tab" data-tab="critical">Critical Plays</button>
          <button class="blaze-tab" data-tab="predictions">Predictions</button>
          <button class="blaze-tab" data-tab="statistics">Statistics</button>
        </div>
        
        <div class="blaze-content">
          <!-- Momentum Tab -->
          <div class="blaze-tab-content active" id="tab-momentum">
            <div class="momentum-meters">
              <div class="momentum-meter home">
                <h3>Home Team</h3>
                <div class="momentum-bar">
                  <div class="momentum-fill" id="home-momentum-fill" style="width: 50%"></div>
                </div>
                <span class="momentum-value" id="home-momentum-value">50%</span>
              </div>
              <div class="momentum-meter away">
                <h3>Away Team</h3>
                <div class="momentum-bar">
                  <div class="momentum-fill" id="away-momentum-fill" style="width: 50%"></div>
                </div>
                <span class="momentum-value" id="away-momentum-value">50%</span>
              </div>
            </div>
            
            <div class="momentum-chart" id="momentum-chart"></div>
            
            <div class="momentum-insights">
              <h4>Momentum Insights</h4>
              <div id="momentum-insights-content">
                <p>Game momentum is currently neutral.</p>
              </div>
            </div>
          </div>
          
          <!-- Critical Plays Tab -->
          <div class="blaze-tab-content" id="tab-critical">
            <div class="critical-plays-list">
              <h3>Game-Changing Moments</h3>
              <div id="critical-plays-content">
                <p class="empty-state">No critical plays yet...</p>
              </div>
            </div>
            
            <div class="impact-timeline">
              <h4>Impact Timeline</h4>
              <div id="impact-timeline-chart"></div>
            </div>
          </div>
          
          <!-- Predictions Tab -->
          <div class="blaze-tab-content" id="tab-predictions">
            <div class="predictions-grid">
              <div class="prediction-card">
                <h4>Win Probability</h4>
                <div class="win-prob-bars">
                  <div class="prob-bar home">
                    <span class="team-label">Home</span>
                    <div class="prob-fill" id="home-win-prob" style="width: 50%">50%</div>
                  </div>
                  <div class="prob-bar away">
                    <span class="team-label">Away</span>
                    <div class="prob-fill" id="away-win-prob" style="width: 50%">50%</div>
                  </div>
                </div>
              </div>
              
              <div class="prediction-card">
                <h4>Next Critical Play</h4>
                <div class="critical-likelihood">
                  <div class="likelihood-meter">
                    <div class="likelihood-fill" id="critical-likelihood" style="width: 10%"></div>
                  </div>
                  <span id="critical-likelihood-text">10% chance</span>
                </div>
              </div>
              
              <div class="prediction-card">
                <h4>Momentum Trend</h4>
                <div class="trend-indicator" id="momentum-trend">
                  <span class="trend-icon">↔️</span>
                  <span class="trend-text">Neutral</span>
                </div>
              </div>
              
              <div class="prediction-card">
                <h4>Game Flow</h4>
                <div id="game-narrative">
                  <p>The game is just beginning...</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Statistics Tab -->
          <div class="blaze-tab-content" id="tab-statistics">
            <div class="stats-grid">
              <div class="stat-card">
                <h4>Strike Zone Heat Map</h4>
                <div id="strike-zone-chart"></div>
              </div>
              
              <div class="stat-card">
                <h4>Spray Chart</h4>
                <div id="spray-chart"></div>
              </div>
              
              <div class="stat-card">
                <h4>Pitch Velocity</h4>
                <div id="pitch-velocity-chart"></div>
              </div>
              
              <div class="stat-card">
                <h4>Key Metrics</h4>
                <div class="metrics-list" id="key-metrics">
                  <div class="metric">
                    <span class="metric-label">Total Pitches:</span>
                    <span class="metric-value">0</span>
                  </div>
                  <div class="metric">
                    <span class="metric-label">Avg Exit Velocity:</span>
                    <span class="metric-value">0 mph</span>
                  </div>
                  <div class="metric">
                    <span class="metric-label">Hard Hit %:</span>
                    <span class="metric-value">0%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="blaze-footer">
          <div class="confidence-indicator">
            <span>Analysis Confidence:</span>
            <div class="confidence-bar">
              <div class="confidence-fill" id="confidence-level" style="width: 50%"></div>
            </div>
            <span id="confidence-text">50%</span>
          </div>
        </div>
      </div>
    `;
    
    // Add styles
    this.addStyles();
    
    // Add to container but keep hidden initially
    this.dashboardElement.style.display = 'none';
    this.container.appendChild(this.dashboardElement);
  }

  /**
   * Add dashboard styles
   */
  addStyles() {
    if (document.getElementById('blaze-dashboard-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'blaze-dashboard-styles';
    style.textContent = `
      .blaze-dashboard {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .blaze-dashboard-container {
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border-radius: 20px;
        width: 90%;
        max-width: 1200px;
        height: 85vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 2px solid ${this.colors.accent};
      }
      
      .blaze-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        background: linear-gradient(90deg, ${this.colors.primary}, ${this.colors.secondary});
        border-radius: 18px 18px 0 0;
      }
      
      .blaze-title {
        color: white;
        font-size: 1.8rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
      }
      
      .blaze-icon {
        animation: flicker 2s infinite;
      }
      
      @keyframes flicker {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      
      .blaze-close-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 2rem;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .blaze-close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: rotate(90deg);
      }
      
      .blaze-tabs {
        display: flex;
        gap: 0.5rem;
        padding: 1rem;
        background: rgba(0, 0, 0, 0.3);
      }
      
      .blaze-tab {
        padding: 0.75rem 1.5rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: bold;
      }
      
      .blaze-tab:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .blaze-tab.active {
        background: ${this.colors.accent};
        color: ${this.colors.dark};
        border-color: ${this.colors.accent};
      }
      
      .blaze-content {
        flex: 1;
        overflow-y: auto;
        padding: 1.5rem;
      }
      
      .blaze-tab-content {
        display: none;
        animation: slideIn 0.3s ease;
      }
      
      .blaze-tab-content.active {
        display: block;
      }
      
      @keyframes slideIn {
        from { 
          opacity: 0;
          transform: translateY(20px);
        }
        to { 
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      /* Momentum Styles */
      .momentum-meters {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-bottom: 2rem;
      }
      
      .momentum-meter h3 {
        color: white;
        margin-bottom: 0.5rem;
      }
      
      .momentum-bar {
        height: 30px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        overflow: hidden;
        position: relative;
      }
      
      .momentum-fill {
        height: 100%;
        background: linear-gradient(90deg, ${this.colors.primary}, ${this.colors.success});
        transition: width 0.5s ease;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding-right: 10px;
        color: white;
        font-weight: bold;
      }
      
      .momentum-value {
        color: white;
        font-size: 1.2rem;
        margin-top: 0.5rem;
        display: block;
      }
      
      .momentum-insights {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 1rem;
        margin-top: 1rem;
      }
      
      .momentum-insights h4 {
        color: ${this.colors.accent};
        margin-bottom: 0.5rem;
      }
      
      .momentum-insights p {
        color: white;
        line-height: 1.6;
      }
      
      /* Critical Plays Styles */
      .critical-plays-list {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 1rem;
        margin-bottom: 1rem;
      }
      
      .critical-plays-list h3 {
        color: ${this.colors.accent};
        margin-bottom: 1rem;
      }
      
      .critical-play-item {
        background: rgba(255, 255, 255, 0.1);
        border-left: 4px solid ${this.colors.danger};
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        border-radius: 5px;
        color: white;
      }
      
      .critical-play-item.high-impact {
        border-left-color: ${this.colors.accent};
        background: rgba(255, 215, 0, 0.1);
      }
      
      .empty-state {
        color: rgba(255, 255, 255, 0.5);
        font-style: italic;
      }
      
      /* Predictions Styles */
      .predictions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
      }
      
      .prediction-card {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .prediction-card h4 {
        color: ${this.colors.accent};
        margin-bottom: 1rem;
      }
      
      .prob-bar {
        margin-bottom: 0.5rem;
      }
      
      .prob-fill {
        background: linear-gradient(90deg, ${this.colors.primary}, ${this.colors.success});
        color: white;
        padding: 0.5rem;
        border-radius: 5px;
        transition: width 0.5s ease;
        text-align: right;
        font-weight: bold;
      }
      
      .likelihood-meter {
        height: 20px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 0.5rem;
      }
      
      .likelihood-fill {
        height: 100%;
        background: linear-gradient(90deg, ${this.colors.danger}, ${this.colors.accent});
        transition: width 0.5s ease;
      }
      
      /* Statistics Styles */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1rem;
      }
      
      .stat-card {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .stat-card h4 {
        color: ${this.colors.accent};
        margin-bottom: 1rem;
      }
      
      .metrics-list {
        color: white;
      }
      
      .metric {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .metric-label {
        color: rgba(255, 255, 255, 0.7);
      }
      
      .metric-value {
        font-weight: bold;
        color: ${this.colors.accent};
      }
      
      /* Footer Styles */
      .blaze-footer {
        padding: 1rem;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 0 0 18px 18px;
      }
      
      .confidence-indicator {
        display: flex;
        align-items: center;
        gap: 1rem;
        color: white;
      }
      
      .confidence-bar {
        flex: 1;
        height: 10px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 5px;
        overflow: hidden;
      }
      
      .confidence-fill {
        height: 100%;
        background: linear-gradient(90deg, ${this.colors.danger}, ${this.colors.success});
        transition: width 0.5s ease;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    this.dashboardElement.querySelector('#blaze-close').addEventListener('click', () => {
      this.hide();
    });
    
    // Tab switching
    this.dashboardElement.querySelectorAll('.blaze-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.switchTab(tabName);
      });
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  /**
   * Switch active tab
   */
  switchTab(tabName) {
    // Update tab buttons
    this.dashboardElement.querySelectorAll('.blaze-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Update tab content
    this.dashboardElement.querySelectorAll('.blaze-tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tabName}`);
    });
  }

  /**
   * Show dashboard
   */
  show() {
    this.dashboardElement.style.display = 'flex';
    this.isVisible = true;
    this.startRealTimeUpdates();
  }

  /**
   * Hide dashboard
   */
  hide() {
    this.dashboardElement.style.display = 'none';
    this.isVisible = false;
    this.stopRealTimeUpdates();
  }

  /**
   * Toggle dashboard visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Start real-time updates
   */
  startRealTimeUpdates() {
    if (this.updateInterval) return;
    
    this.updateInterval = setInterval(() => {
      if (this.isVisible) {
        this.updateDashboard();
      }
    }, 1000);
  }

  /**
   * Stop real-time updates
   */
  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Update dashboard with latest data
   */
  updateDashboard() {
    // Update momentum displays
    const momentumData = this.momentumAnalyzer.getVisualizationData();
    this.updateMomentumDisplay(momentumData);
    
    // Update critical plays
    const criticalData = this.criticalPlayAnalyzer.getVisualizationData();
    this.updateCriticalPlaysDisplay(criticalData);
    
    // Update predictions
    this.updatePredictions();
  }

  /**
   * Update momentum display
   */
  updateMomentumDisplay(data) {
    // Update momentum bars
    const homeMomentum = data.current.home;
    const awayMomentum = data.current.away;
    
    document.getElementById('home-momentum-fill').style.width = `${homeMomentum}%`;
    document.getElementById('home-momentum-value').textContent = `${homeMomentum.toFixed(0)}%`;
    
    document.getElementById('away-momentum-fill').style.width = `${awayMomentum}%`;
    document.getElementById('away-momentum-value').textContent = `${awayMomentum.toFixed(0)}%`;
    
    // Update insights
    const insights = document.getElementById('momentum-insights-content');
    const trend = data.trend;
    let insightText = '';
    
    if (trend === 'home_rising') {
      insightText = '📈 Home team is building momentum! They\'re taking control of the game.';
    } else if (trend === 'away_rising') {
      insightText = '📈 Away team is surging! The momentum has shifted in their favor.';
    } else {
      insightText = '⚖️ The game momentum is balanced. Both teams are fighting for control.';
    }
    
    if (data.critical.length > 0) {
      insightText += `<br><br>🔥 ${data.critical.length} critical moment${data.critical.length > 1 ? 's' : ''} so far!`;
    }
    
    insights.innerHTML = `<p>${insightText}</p>`;
  }

  /**
   * Update critical plays display
   */
  updateCriticalPlaysDisplay(data) {
    const content = document.getElementById('critical-plays-content');
    
    if (data.criticalPlays.length === 0) {
      content.innerHTML = '<p class="empty-state">No critical plays yet...</p>';
      return;
    }
    
    const playsHTML = data.criticalPlays.map(play => {
      const impactClass = play.impact > 0.5 ? 'high-impact' : '';
      return `
        <div class="critical-play-item ${impactClass}">
          <strong>Inning ${play.inning}:</strong> ${play.description}
          <br>
          <small>Impact: ${(play.impact * 100).toFixed(0)}% | ${play.category}</small>
        </div>
      `;
    }).join('');
    
    content.innerHTML = playsHTML;
  }

  /**
   * Update predictions
   */
  updatePredictions() {
    const predictions = this.momentumAnalyzer.getPredictions();
    
    // Update win probability
    const homeWinProb = predictions.homeWinProbability * 100;
    const awayWinProb = predictions.awayWinProbability * 100;
    
    document.getElementById('home-win-prob').style.width = `${homeWinProb}%`;
    document.getElementById('home-win-prob').textContent = `${homeWinProb.toFixed(0)}%`;
    
    document.getElementById('away-win-prob').style.width = `${awayWinProb}%`;
    document.getElementById('away-win-prob').textContent = `${awayWinProb.toFixed(0)}%`;
    
    // Update confidence
    const confidence = predictions.confidence * 100;
    document.getElementById('confidence-level').style.width = `${confidence}%`;
    document.getElementById('confidence-text').textContent = `${confidence.toFixed(0)}%`;
    
    // Update trend indicator
    const trendElement = document.getElementById('momentum-trend');
    let trendIcon = '↔️';
    let trendText = 'Neutral';
    
    if (predictions.trend === 'home_rising') {
      trendIcon = '↗️';
      trendText = 'Home Rising';
    } else if (predictions.trend === 'away_rising') {
      trendIcon = '↙️';
      trendText = 'Away Rising';
    }
    
    trendElement.innerHTML = `
      <span class="trend-icon">${trendIcon}</span>
      <span class="trend-text">${trendText}</span>
    `;
    
    // Update game narrative
    const narrative = this.criticalPlayAnalyzer.getGameNarrative();
    document.getElementById('game-narrative').innerHTML = `<p>${narrative.replace(/\n/g, '<br>')}</p>`;
  }

  /**
   * Process game event
   */
  processGameEvent(event) {
    // Process through analyzers
    const momentumResult = this.momentumAnalyzer.processEvent(event);
    const criticalResult = this.criticalPlayAnalyzer.analyzePlay(event.play, event.context);
    
    // Update dashboard if visible
    if (this.isVisible) {
      this.updateDashboard();
    }
    
    return {
      momentum: momentumResult,
      critical: criticalResult
    };
  }

  /**
   * Reset for new game
   */
  reset() {
    this.momentumAnalyzer.reset();
    this.criticalPlayAnalyzer.reset();
    this.updateDashboard();
  }
}

export default BlazeDashboard;