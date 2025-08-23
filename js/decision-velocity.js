/**
 * Decision Velocity Meter
 * Real-time decision speed tracking and advantage calculation
 */

class DecisionVelocityMeter {
  constructor(containerId = 'decision-velocity-container') {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      this.createContainer();
    }
    
    this.data = {
      reactionTime: 0.23,
      marketLag: 1.4,
      advantage: 1.17,
      history: []
    };
    
    this.maxHistory = 50;
    this.chart = null;
    
    this.init();
  }

  createContainer() {
    // Create container if it doesn't exist
    const container = document.createElement('div');
    container.id = 'decision-velocity-container';
    container.className = 'decision-velocity-meter blaze-card';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 320px;
      padding: 16px;
      z-index: 100;
      background: linear-gradient(135deg, rgba(22,24,28,.95), rgba(22,24,28,.85));
      border: 1px solid var(--blaze-orange);
      border-radius: 16px;
      backdrop-filter: blur(10px);
    `;
    
    document.body.appendChild(container);
    this.container = container;
  }

  init() {
    this.render();
    this.createCanvas();
    this.startAnimation();
  }

  render() {
    this.container.innerHTML = `
      <div class="velocity-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <h3 style="margin: 0; font-size: 14px; font-weight: 700; color: var(--blaze-orange);">
          ⚡ Decision Velocity
        </h3>
        <div class="velocity-status" style="display: flex; align-items: center; gap: 6px;">
          <span class="status-dot" style="width: 8px; height: 8px; background: #4CAF50; border-radius: 50%; animation: pulse 2s infinite;"></span>
          <span style="font-size: 11px; color: var(--blaze-muted);">LIVE</span>
        </div>
      </div>
      
      <canvas id="velocity-graph" width="288" height="80" style="margin-bottom: 12px;"></canvas>
      
      <div class="metrics" style="display: grid; gap: 8px;">
        <div class="metric-row" style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,107,53,0.05); border-radius: 8px;">
          <span style="color: var(--blaze-muted); font-size: 12px;">Reaction Time</span>
          <span class="reaction-time" style="font-weight: 700; color: #4CAF50; font-family: monospace;">${this.data.reactionTime.toFixed(3)}s</span>
        </div>
        <div class="metric-row" style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,107,53,0.05); border-radius: 8px;">
          <span style="color: var(--blaze-muted); font-size: 12px;">Market Lag</span>
          <span class="market-lag" style="font-weight: 700; color: #FF9800; font-family: monospace;">${this.data.marketLag.toFixed(3)}s</span>
        </div>
        <div class="metric-row" style="display: flex; justify-content: space-between; padding: 8px; background: linear-gradient(90deg, rgba(255,107,53,0.1), rgba(255,107,53,0.05)); border-radius: 8px; border: 1px solid var(--blaze-orange);">
          <span style="color: var(--blaze-text); font-size: 12px; font-weight: 600;">Advantage</span>
          <span class="advantage" style="font-weight: 700; color: var(--blaze-orange); font-family: monospace; font-size: 14px;">+${this.data.advantage.toFixed(3)}s</span>
        </div>
      </div>
      
      <div class="velocity-footer" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 10px; color: var(--blaze-muted);">Pattern Recognition: 73%</span>
          <span style="font-size: 10px; color: var(--blaze-muted);">Confidence: High</span>
        </div>
      </div>
    `;
  }

  createCanvas() {
    const canvas = document.getElementById('velocity-graph');
    if (!canvas) return;
    
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Set up canvas scaling for retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 288 * dpr;
    canvas.height = 80 * dpr;
    this.ctx.scale(dpr, dpr);
    canvas.style.width = '288px';
    canvas.style.height = '80px';
  }

  update(data) {
    if (!data) return;
    
    // Update data
    this.data.reactionTime = data.reactionTime || this.data.reactionTime;
    this.data.marketLag = data.marketLag || this.data.marketLag;
    this.data.advantage = data.advantage || this.data.marketLag - this.data.reactionTime;
    
    // Add to history
    this.data.history.push({
      timestamp: Date.now(),
      reaction: this.data.reactionTime,
      lag: this.data.marketLag,
      advantage: this.data.advantage
    });
    
    // Limit history
    if (this.data.history.length > this.maxHistory) {
      this.data.history.shift();
    }
    
    // Update display
    this.updateDisplay();
    this.drawGraph();
  }

  updateDisplay() {
    const reactionEl = this.container.querySelector('.reaction-time');
    const lagEl = this.container.querySelector('.market-lag');
    const advantageEl = this.container.querySelector('.advantage');
    
    if (reactionEl) {
      reactionEl.textContent = `${this.data.reactionTime.toFixed(3)}s`;
      this.animateValue(reactionEl);
    }
    
    if (lagEl) {
      lagEl.textContent = `${this.data.marketLag.toFixed(3)}s`;
      this.animateValue(lagEl);
    }
    
    if (advantageEl) {
      const advantage = this.data.advantage;
      advantageEl.textContent = `${advantage >= 0 ? '+' : ''}${advantage.toFixed(3)}s`;
      advantageEl.style.color = advantage >= 1 ? 'var(--blaze-orange)' : 
                                advantage >= 0.5 ? '#FFD700' : '#FF9800';
      this.animateValue(advantageEl);
    }
  }

  animateValue(element) {
    element.style.transform = 'scale(1.1)';
    element.style.transition = 'transform 0.2s ease';
    setTimeout(() => {
      element.style.transform = 'scale(1)';
    }, 200);
  }

  drawGraph() {
    if (!this.ctx || this.data.history.length < 2) return;
    
    const ctx = this.ctx;
    const width = 288;
    const height = 80;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 5; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Prepare data
    const history = this.data.history;
    const xStep = width / (this.maxHistory - 1);
    
    // Draw reaction time line
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    history.forEach((point, i) => {
      const x = i * xStep;
      const y = height - (point.reaction * 100); // Scale to fit
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw market lag line
    ctx.strokeStyle = '#FF9800';
    ctx.beginPath();
    
    history.forEach((point, i) => {
      const x = i * xStep;
      const y = height - (point.lag * 30); // Different scale
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw advantage area
    ctx.fillStyle = 'rgba(255, 107, 53, 0.2)';
    ctx.beginPath();
    
    history.forEach((point, i) => {
      const x = i * xStep;
      const y = height - (point.advantage * 40);
      
      if (i === 0) {
        ctx.moveTo(x, height);
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.lineTo((history.length - 1) * xStep, height);
    ctx.closePath();
    ctx.fill();
  }

  startAnimation() {
    // Simulate real-time updates
    setInterval(() => {
      const mockData = {
        reactionTime: 0.23 + (Math.random() - 0.5) * 0.05,
        marketLag: 1.4 + (Math.random() - 0.5) * 0.2
      };
      mockData.advantage = mockData.marketLag - mockData.reactionTime;
      
      this.update(mockData);
    }, 1000);
  }
}

// Initialize Decision Velocity Meter
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.DecisionVelocityMeter = new DecisionVelocityMeter();
  });
} else {
  window.DecisionVelocityMeter = new DecisionVelocityMeter();
}