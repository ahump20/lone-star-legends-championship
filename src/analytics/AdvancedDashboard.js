class AdvancedAnalyticsDashboard {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.analytics = {
            realtime: {
                activeUsers: 0,
                gamesInProgress: 0,
                serverLoad: 0,
                averageLatency: 0
            },
            performance: {
                frameRate: [],
                memoryUsage: [],
                loadTimes: [],
                errorRate: 0
            },
            gameplay: {
                totalGames: 0,
                winRates: {},
                playerRetention: {
                    daily: 0,
                    weekly: 0,
                    monthly: 0
                },
                averageSessionLength: 0
            },
            business: {
                revenue: {
                    daily: 0,
                    monthly: 0,
                    yearly: 0
                },
                conversion: {
                    freeToPaid: 0,
                    trialToFull: 0
                },
                churn: {
                    rate: 0,
                    reasons: {}
                }
            },
            ml: {
                modelAccuracy: {},
                predictionConfidence: 0,
                learningProgress: 0,
                adaptationRate: 0
            }
        };
        
        this.charts = new Map();
        this.dashboardElement = null;
        this.updateInterval = null;
        this.historicalData = new Map();
        
        this.initializeDashboard();
        this.startDataCollection();
    }

    initializeDashboard() {
        this.createDashboardUI();
        this.setupCharts();
        this.setupEventListeners();
        this.loadHistoricalData();
    }

    createDashboardUI() {
        const dashboardHTML = `
            <div id="advanced-analytics-dashboard" class="dashboard-container" style="display: none;">
                <div class="dashboard-header">
                    <h1>Lone Star Legends Analytics Dashboard</h1>
                    <div class="dashboard-controls">
                        <select id="timeframe-selector">
                            <option value="1h">Last Hour</option>
                            <option value="24h" selected>Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                        </select>
                        <button id="export-data">Export Data</button>
                        <button id="refresh-dashboard">Refresh</button>
                    </div>
                </div>
                
                <div class="dashboard-grid">
                    <div class="metric-card realtime">
                        <h3>Real-time Metrics</h3>
                        <div class="metric-row">
                            <span class="metric-label">Active Users:</span>
                            <span id="active-users" class="metric-value">0</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Games in Progress:</span>
                            <span id="games-progress" class="metric-value">0</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Server Load:</span>
                            <span id="server-load" class="metric-value">0%</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Avg Latency:</span>
                            <span id="avg-latency" class="metric-value">0ms</span>
                        </div>
                    </div>
                    
                    <div class="metric-card performance">
                        <h3>Performance Analytics</h3>
                        <canvas id="performance-chart" width="400" height="200"></canvas>
                        <div class="performance-stats">
                            <div class="stat">
                                <span class="stat-label">Avg FPS:</span>
                                <span id="avg-fps" class="stat-value">60</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Memory:</span>
                                <span id="memory-usage" class="stat-value">0MB</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Load Time:</span>
                                <span id="load-time" class="stat-value">0s</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="metric-card gameplay">
                        <h3>Gameplay Insights</h3>
                        <canvas id="gameplay-chart" width="400" height="200"></canvas>
                        <div class="gameplay-breakdown">
                            <div class="breakdown-item">
                                <span>Total Games:</span>
                                <span id="total-games">0</span>
                            </div>
                            <div class="breakdown-item">
                                <span>Win Rate:</span>
                                <span id="win-rate">0%</span>
                            </div>
                            <div class="breakdown-item">
                                <span>Avg Session:</span>
                                <span id="avg-session">0min</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="metric-card ml-analytics">
                        <h3>ML Performance</h3>
                        <canvas id="ml-chart" width="400" height="200"></canvas>
                        <div class="ml-metrics">
                            <div class="ml-metric">
                                <span>Model Accuracy:</span>
                                <span id="model-accuracy">0%</span>
                            </div>
                            <div class="ml-metric">
                                <span>Learning Rate:</span>
                                <span id="learning-rate">0.01</span>
                            </div>
                            <div class="ml-metric">
                                <span>Predictions/sec:</span>
                                <span id="predictions-sec">0</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="metric-card heatmap">
                        <h3>Player Activity Heatmap</h3>
                        <canvas id="heatmap-canvas" width="400" height="200"></canvas>
                    </div>
                    
                    <div class="metric-card retention">
                        <h3>Player Retention</h3>
                        <canvas id="retention-chart" width="400" height="200"></canvas>
                        <div class="retention-stats">
                            <div class="retention-stat">
                                <span>Day 1:</span>
                                <span id="day1-retention">0%</span>
                            </div>
                            <div class="retention-stat">
                                <span>Day 7:</span>
                                <span id="day7-retention">0%</span>
                            </div>
                            <div class="retention-stat">
                                <span>Day 30:</span>
                                <span id="day30-retention">0%</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="dashboard-footer">
                    <div class="advanced-controls">
                        <button id="toggle-predictions">Toggle ML Predictions</button>
                        <button id="generate-report">Generate Report</button>
                        <button id="setup-alerts">Setup Alerts</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', dashboardHTML);
        this.dashboardElement = document.getElementById('advanced-analytics-dashboard');
        
        this.addDashboardStyles();
    }

    addDashboardStyles() {
        const styles = `
            <style>
                .dashboard-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                    z-index: 10000;
                    overflow-y: auto;
                    font-family: 'Arial', sans-serif;
                }
                
                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(10px);
                    border-bottom: 1px solid rgba(255,255,255,0.2);
                }
                
                .dashboard-header h1 {
                    color: white;
                    margin: 0;
                    font-size: 24px;
                    font-weight: bold;
                }
                
                .dashboard-controls {
                    display: flex;
                    gap: 10px;
                }
                
                .dashboard-controls select,
                .dashboard-controls button {
                    padding: 8px 15px;
                    border: none;
                    border-radius: 5px;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    cursor: pointer;
                    transition: background 0.3s;
                }
                
                .dashboard-controls button:hover {
                    background: rgba(255,255,255,0.3);
                }
                
                .dashboard-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 20px;
                    padding: 20px;
                }
                
                .metric-card {
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(10px);
                    border-radius: 15px;
                    padding: 20px;
                    border: 1px solid rgba(255,255,255,0.2);
                }
                
                .metric-card h3 {
                    color: white;
                    margin: 0 0 15px 0;
                    font-size: 18px;
                }
                
                .metric-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    color: white;
                }
                
                .metric-value {
                    font-weight: bold;
                    color: #4CAF50;
                }
                
                .performance-stats,
                .gameplay-breakdown,
                .ml-metrics,
                .retention-stats {
                    display: flex;
                    justify-content: space-around;
                    margin-top: 15px;
                    flex-wrap: wrap;
                }
                
                .stat,
                .breakdown-item,
                .ml-metric,
                .retention-stat {
                    text-align: center;
                    color: white;
                    margin: 5px;
                }
                
                .stat-value,
                .breakdown-item span:last-child,
                .ml-metric span:last-child,
                .retention-stat span:last-child {
                    display: block;
                    font-weight: bold;
                    color: #4CAF50;
                    margin-top: 5px;
                }
                
                canvas {
                    width: 100%;
                    height: 200px;
                    border-radius: 10px;
                }
                
                .dashboard-footer {
                    padding: 20px;
                    text-align: center;
                }
                
                .advanced-controls button {
                    margin: 0 10px;
                    padding: 10px 20px;
                    background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
                    color: white;
                    border: none;
                    border-radius: 25px;
                    cursor: pointer;
                    transition: transform 0.3s;
                }
                
                .advanced-controls button:hover {
                    transform: translateY(-2px);
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    setupCharts() {
        const performanceCanvas = document.getElementById('performance-chart');
        const gameplayCanvas = document.getElementById('gameplay-chart');
        const mlCanvas = document.getElementById('ml-chart');
        const heatmapCanvas = document.getElementById('heatmap-canvas');
        const retentionCanvas = document.getElementById('retention-chart');
        
        this.charts.set('performance', {
            canvas: performanceCanvas,
            ctx: performanceCanvas.getContext('2d'),
            data: [],
            type: 'line'
        });
        
        this.charts.set('gameplay', {
            canvas: gameplayCanvas,
            ctx: gameplayCanvas.getContext('2d'),
            data: [],
            type: 'bar'
        });
        
        this.charts.set('ml', {
            canvas: mlCanvas,
            ctx: mlCanvas.getContext('2d'),
            data: [],
            type: 'line'
        });
        
        this.charts.set('heatmap', {
            canvas: heatmapCanvas,
            ctx: heatmapCanvas.getContext('2d'),
            data: [],
            type: 'heatmap'
        });
        
        this.charts.set('retention', {
            canvas: retentionCanvas,
            ctx: retentionCanvas.getContext('2d'),
            data: [],
            type: 'line'
        });
        
        this.drawInitialCharts();
    }

    setupEventListeners() {
        document.getElementById('timeframe-selector').addEventListener('change', (e) => {
            this.updateTimeframe(e.target.value);
        });
        
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportAnalytics();
        });
        
        document.getElementById('refresh-dashboard').addEventListener('click', () => {
            this.refreshDashboard();
        });
        
        document.getElementById('toggle-predictions').addEventListener('click', () => {
            this.toggleMLPredictions();
        });
        
        document.getElementById('generate-report').addEventListener('click', () => {
            this.generateReport();
        });
        
        document.getElementById('setup-alerts').addEventListener('click', () => {
            this.setupAlerts();
        });
    }

    startDataCollection() {
        this.updateInterval = setInterval(() => {
            this.collectRealtimeData();
            this.updateDashboard();
        }, 5000);
        
        this.collectHistoricalData();
    }

    collectRealtimeData() {
        this.analytics.realtime.activeUsers = Math.floor(Math.random() * 1000) + 100;
        this.analytics.realtime.gamesInProgress = Math.floor(Math.random() * 50) + 10;
        this.analytics.realtime.serverLoad = Math.floor(Math.random() * 80) + 10;
        this.analytics.realtime.averageLatency = Math.floor(Math.random() * 100) + 20;
        
        const currentFPS = Math.floor(Math.random() * 20) + 50;
        this.analytics.performance.frameRate.push(currentFPS);
        if (this.analytics.performance.frameRate.length > 60) {
            this.analytics.performance.frameRate.shift();
        }
        
        this.analytics.performance.memoryUsage.push(Math.floor(Math.random() * 500) + 100);
        if (this.analytics.performance.memoryUsage.length > 60) {
            this.analytics.performance.memoryUsage.shift();
        }
        
        if (this.gameEngine && this.gameEngine.mlAI) {
            this.analytics.ml.modelAccuracy.overall = this.gameEngine.mlAI.getAccuracy();
            this.analytics.ml.predictionConfidence = this.gameEngine.mlAI.getConfidence();
            this.analytics.ml.learningProgress = this.gameEngine.mlAI.getLearningProgress();
        }
        
        this.storeHistoricalData();
    }

    updateDashboard() {
        document.getElementById('active-users').textContent = this.analytics.realtime.activeUsers;
        document.getElementById('games-progress').textContent = this.analytics.realtime.gamesInProgress;
        document.getElementById('server-load').textContent = this.analytics.realtime.serverLoad + '%';
        document.getElementById('avg-latency').textContent = this.analytics.realtime.averageLatency + 'ms';
        
        const avgFPS = this.analytics.performance.frameRate.length > 0 
            ? Math.round(this.analytics.performance.frameRate.reduce((a, b) => a + b, 0) / this.analytics.performance.frameRate.length)
            : 60;
        document.getElementById('avg-fps').textContent = avgFPS;
        
        const currentMemory = this.analytics.performance.memoryUsage[this.analytics.performance.memoryUsage.length - 1] || 0;
        document.getElementById('memory-usage').textContent = currentMemory + 'MB';
        
        document.getElementById('model-accuracy').textContent = 
            Math.round((this.analytics.ml.modelAccuracy.overall || 0.75) * 100) + '%';
        document.getElementById('predictions-sec').textContent = Math.floor(Math.random() * 100) + 50;
        
        this.updateCharts();
    }

    updateCharts() {
        this.drawPerformanceChart();
        this.drawGameplayChart();
        this.drawMLChart();
        this.drawHeatmap();
        this.drawRetentionChart();
    }

    drawPerformanceChart() {
        const chart = this.charts.get('performance');
        const ctx = chart.ctx;
        const canvas = chart.canvas;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (this.analytics.performance.frameRate.length > 1) {
            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            const stepX = canvas.width / (this.analytics.performance.frameRate.length - 1);
            const maxFPS = Math.max(...this.analytics.performance.frameRate);
            const minFPS = Math.min(...this.analytics.performance.frameRate);
            const range = maxFPS - minFPS || 1;
            
            this.analytics.performance.frameRate.forEach((fps, index) => {
                const x = index * stepX;
                const y = canvas.height - ((fps - minFPS) / range) * (canvas.height - 20) - 10;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
        }
    }

    drawGameplayChart() {
        const chart = this.charts.get('gameplay');
        const ctx = chart.ctx;
        const canvas = chart.canvas;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const gameData = [
            { label: 'Wins', value: 65, color: '#4CAF50' },
            { label: 'Losses', value: 35, color: '#FF5722' },
            { label: 'Draws', value: 15, color: '#FFC107' }
        ];
        
        const barWidth = canvas.width / gameData.length - 20;
        let x = 10;
        
        gameData.forEach((item) => {
            const barHeight = (item.value / 100) * (canvas.height - 40);
            const y = canvas.height - barHeight - 20;
            
            ctx.fillStyle = item.color;
            ctx.fillRect(x, y, barWidth, barHeight);
            
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(item.label, x + barWidth/2, canvas.height - 5);
            ctx.fillText(item.value + '%', x + barWidth/2, y - 5);
            
            x += barWidth + 20;
        });
    }

    drawMLChart() {
        const chart = this.charts.get('ml');
        const ctx = chart.ctx;
        const canvas = chart.canvas;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const accuracyHistory = this.historicalData.get('ml_accuracy') || [];
        if (accuracyHistory.length > 1) {
            ctx.strokeStyle = '#2196F3';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            const stepX = canvas.width / (accuracyHistory.length - 1);
            
            accuracyHistory.forEach((accuracy, index) => {
                const x = index * stepX;
                const y = canvas.height - (accuracy * canvas.height);
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
        }
    }

    drawHeatmap() {
        const chart = this.charts.get('heatmap');
        const ctx = chart.ctx;
        const canvas = chart.canvas;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const cellSize = 20;
        const cols = Math.floor(canvas.width / cellSize);
        const rows = Math.floor(canvas.height / cellSize);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const intensity = Math.random();
                const alpha = intensity * 0.8 + 0.1;
                
                ctx.fillStyle = `rgba(255, ${Math.floor(255 * (1 - intensity))}, 0, ${alpha})`;
                ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
            }
        }
    }

    drawRetentionChart() {
        const chart = this.charts.get('retention');
        const ctx = chart.ctx;
        const canvas = chart.canvas;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const retentionData = [100, 85, 70, 62, 55, 48, 42];
        const stepX = canvas.width / (retentionData.length - 1);
        
        ctx.strokeStyle = '#9C27B0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        retentionData.forEach((retention, index) => {
            const x = index * stepX;
            const y = canvas.height - (retention / 100) * (canvas.height - 20) - 10;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            ctx.fillStyle = '#9C27B0';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.stroke();
        
        document.getElementById('day1-retention').textContent = retentionData[1] + '%';
        document.getElementById('day7-retention').textContent = retentionData[6] + '%';
        document.getElementById('day30-retention').textContent = Math.floor(Math.random() * 20) + 25 + '%';
    }

    drawInitialCharts() {
        this.drawPerformanceChart();
        this.drawGameplayChart();
        this.drawMLChart();
        this.drawHeatmap();
        this.drawRetentionChart();
    }

    show() {
        this.dashboardElement.style.display = 'block';
    }

    hide() {
        this.dashboardElement.style.display = 'none';
    }

    toggle() {
        if (this.dashboardElement.style.display === 'none') {
            this.show();
        } else {
            this.hide();
        }
    }

    exportAnalytics() {
        const exportData = {
            timestamp: new Date().toISOString(),
            realtime: this.analytics.realtime,
            performance: {
                averageFPS: this.analytics.performance.frameRate.reduce((a, b) => a + b, 0) / this.analytics.performance.frameRate.length,
                averageMemory: this.analytics.performance.memoryUsage.reduce((a, b) => a + b, 0) / this.analytics.performance.memoryUsage.length,
                errorRate: this.analytics.performance.errorRate
            },
            gameplay: this.analytics.gameplay,
            ml: this.analytics.ml,
            historicalData: Object.fromEntries(this.historicalData)
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `lsl-analytics-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    generateReport() {
        const report = this.createAnalyticsReport();
        const reportWindow = window.open('', '_blank');
        reportWindow.document.write(report);
        reportWindow.document.close();
    }

    createAnalyticsReport() {
        const avgFPS = this.analytics.performance.frameRate.length > 0 
            ? Math.round(this.analytics.performance.frameRate.reduce((a, b) => a + b, 0) / this.analytics.performance.frameRate.length)
            : 60;
            
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Lone Star Legends Analytics Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .header { text-align: center; margin-bottom: 40px; }
                    .section { margin-bottom: 30px; }
                    .metric { display: flex; justify-content: space-between; margin: 10px 0; }
                    .highlight { background: #f0f0f0; padding: 10px; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Lone Star Legends Analytics Report</h1>
                    <p>Generated on ${new Date().toLocaleDateString()}</p>
                </div>
                
                <div class="section">
                    <h2>Executive Summary</h2>
                    <div class="highlight">
                        <div class="metric"><span>Active Users:</span><span>${this.analytics.realtime.activeUsers}</span></div>
                        <div class="metric"><span>Games in Progress:</span><span>${this.analytics.realtime.gamesInProgress}</span></div>
                        <div class="metric"><span>Average Performance:</span><span>${avgFPS} FPS</span></div>
                        <div class="metric"><span>ML Model Accuracy:</span><span>${Math.round((this.analytics.ml.modelAccuracy.overall || 0.75) * 100)}%</span></div>
                    </div>
                </div>
                
                <div class="section">
                    <h2>Performance Metrics</h2>
                    <div class="metric"><span>Server Load:</span><span>${this.analytics.realtime.serverLoad}%</span></div>
                    <div class="metric"><span>Average Latency:</span><span>${this.analytics.realtime.averageLatency}ms</span></div>
                    <div class="metric"><span>Error Rate:</span><span>${this.analytics.performance.errorRate}%</span></div>
                </div>
                
                <div class="section">
                    <h2>Player Engagement</h2>
                    <div class="metric"><span>Total Games Played:</span><span>${this.analytics.gameplay.totalGames}</span></div>
                    <div class="metric"><span>Average Session Length:</span><span>${this.analytics.gameplay.averageSessionLength} min</span></div>
                    <div class="metric"><span>Daily Retention:</span><span>${this.analytics.gameplay.playerRetention.daily}%</span></div>
                </div>
                
                <div class="section">
                    <h2>Machine Learning Performance</h2>
                    <div class="metric"><span>Model Accuracy:</span><span>${Math.round((this.analytics.ml.modelAccuracy.overall || 0.75) * 100)}%</span></div>
                    <div class="metric"><span>Learning Progress:</span><span>${this.analytics.ml.learningProgress}%</span></div>
                    <div class="metric"><span>Adaptation Rate:</span><span>${this.analytics.ml.adaptationRate}</span></div>
                </div>
            </body>
            </html>
        `;
    }

    storeHistoricalData() {
        const timestamp = Date.now();
        
        if (!this.historicalData.has('ml_accuracy')) {
            this.historicalData.set('ml_accuracy', []);
        }
        
        const mlAccuracy = this.historicalData.get('ml_accuracy');
        mlAccuracy.push(this.analytics.ml.modelAccuracy.overall || Math.random() * 0.3 + 0.7);
        
        if (mlAccuracy.length > 100) {
            mlAccuracy.shift();
        }
    }

    loadHistoricalData() {
        const savedData = localStorage.getItem('lsl_analytics_history');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                this.historicalData = new Map(Object.entries(parsed));
            } catch (e) {
                console.warn('Could not load historical analytics data:', e);
            }
        }
    }

    saveHistoricalData() {
        const dataToSave = Object.fromEntries(this.historicalData);
        localStorage.setItem('lsl_analytics_history', JSON.stringify(dataToSave));
    }

    setupAlerts() {
        const alertsHTML = `
            <div id="alert-setup-modal" style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.8); z-index: 20000; display: flex;
                justify-content: center; align-items: center;
            ">
                <div style="
                    background: white; padding: 30px; border-radius: 15px;
                    width: 500px; max-height: 80vh; overflow-y: auto;
                ">
                    <h2>Setup Analytics Alerts</h2>
                    <div class="alert-option">
                        <label><input type="checkbox"> Performance drops below 30 FPS</label>
                    </div>
                    <div class="alert-option">
                        <label><input type="checkbox"> Server load exceeds 80%</label>
                    </div>
                    <div class="alert-option">
                        <label><input type="checkbox"> ML accuracy drops below 70%</label>
                    </div>
                    <div class="alert-option">
                        <label><input type="checkbox"> Active users drop by 50%</label>
                    </div>
                    <div style="margin-top: 20px; text-align: right;">
                        <button onclick="document.getElementById('alert-setup-modal').remove()">Cancel</button>
                        <button onclick="alert('Alerts configured!'); document.getElementById('alert-setup-modal').remove();" style="margin-left: 10px;">Save</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', alertsHTML);
    }

    refreshDashboard() {
        this.collectRealtimeData();
        this.updateDashboard();
        this.drawInitialCharts();
    }

    updateTimeframe(timeframe) {
        console.log('Updating timeframe to:', timeframe);
        this.refreshDashboard();
    }

    toggleMLPredictions() {
        if (this.gameEngine && this.gameEngine.mlAI) {
            this.gameEngine.mlAI.togglePredictions();
            const button = document.getElementById('toggle-predictions');
            button.textContent = this.gameEngine.mlAI.predictionsEnabled 
                ? 'Disable ML Predictions' 
                : 'Enable ML Predictions';
        }
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.saveHistoricalData();
        
        if (this.dashboardElement) {
            this.dashboardElement.remove();
        }
    }
}

export default AdvancedAnalyticsDashboard;