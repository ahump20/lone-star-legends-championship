/* Flow State Widget Implementation - Blaze Intelligence */

import { flowAPI } from './flow-state-api.js';

export class FlowMeterWidget {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId) || document.body;
        this.options = {
            autoStart: true,
            updateInterval: 1000,
            showMSPE: true,
            enableBreathing: true,
            ...options
        };
        
        this.isVisible = false;
        this.updateTimer = null;
        this.challengeLevel = 5;
        this.currentMSPE = null;
        
        this.mspePrompts = [
            "Notice your breathing. Are you holding tension anywhere?",
            "Feel your feet on the ground. You are exactly where you need to be.",
            "This moment is your opportunity. Trust your preparation.",
            "Scan your body from head to toe. Release what doesn't serve you.",
            "Your focus is your superpower. Where is it right now?",
            "What would peak performance feel like in this exact moment?"
        ];
        
        if (this.options.autoStart) {
            this.init();
        }
    }
    
    init() {
        this.createWidget();
        this.bindEvents();
        if (this.options.autoStart) {
            this.show();
            this.startTracking();
        }
    }
    
    createWidget() {
        this.widget = document.createElement('div');
        this.widget.className = 'flow-meter';
        this.widget.innerHTML = this.getWidgetHTML();
        this.container.appendChild(this.widget);
        
        // Add to head if not already present
        if (!document.getElementById('flow-state-styles')) {
            const link = document.createElement('link');
            link.id = 'flow-state-styles';
            link.rel = 'stylesheet';
            link.href = '/flow-styles.css';
            document.head.appendChild(link);
        }
    }
    
    getWidgetHTML() {
        return `
            <div class="flow-meter-header">
                <div class="flow-meter-title">Flow State</div>
                <div class="flow-badge" id="flow-badge">Initializing</div>
            </div>
            
            <div class="flow-tiles">
                <div class="flow-tile">
                    <div class="flow-tile-label">Focus</div>
                    <div class="flow-tile-value" id="focus-value">--</div>
                </div>
                <div class="flow-tile">
                    <div class="flow-tile-label">Challenge</div>
                    <div class="flow-tile-value" id="challenge-value">${this.challengeLevel}</div>
                </div>
                <div class="flow-tile">
                    <div class="flow-tile-label">Flow</div>
                    <div class="flow-tile-value" id="flow-score">--</div>
                </div>
            </div>
            
            <div class="challenge-slider-section">
                <div class="challenge-label">
                    <span>Challenge Level</span>
                    <span class="challenge-value" id="challenge-display">${this.challengeLevel}</span>
                </div>
                <input type="range" min="1" max="10" value="${this.challengeLevel}" 
                       class="challenge-slider" id="challenge-slider">
            </div>
            
            ${this.options.showMSPE ? `
            <div class="mspe-section" id="mspe-section" style="display: none;">
                <div class="mspe-label">Mindful Moment</div>
                <div class="mspe-prompt" id="mspe-prompt"></div>
            </div>
            ` : ''}
            
            <div class="flow-actions">
                <button class="flow-btn" id="breathing-btn">Breathe</button>
                <button class="flow-btn primary" id="optimize-btn">Optimize</button>
            </div>
        `;
    }
    
    bindEvents() {
        // Challenge slider
        const slider = this.widget.querySelector('#challenge-slider');
        slider?.addEventListener('input', (e) => {
            this.challengeLevel = parseInt(e.target.value);
            this.updateChallengeDisplay();
            this.onChallengeChange(this.challengeLevel);
        });
        
        // Breathing button
        const breathingBtn = this.widget.querySelector('#breathing-btn');
        breathingBtn?.addEventListener('click', () => this.startBreathingSession());
        
        // Optimize button
        const optimizeBtn = this.widget.querySelector('#optimize-btn');
        optimizeBtn?.addEventListener('click', () => this.triggerOptimization());
        
        // MSPE prompt interaction
        const mspeSection = this.widget.querySelector('#mspe-section');
        mspeSection?.addEventListener('click', () => this.acknowledgeMSPE());
    }
    
    startTracking() {
        const sessionId = flowAPI.startSession({
            page: window.location.pathname,
            userAgent: navigator.userAgent,
            timestamp: Date.now()
        });
        
        // Start update loop
        this.updateTimer = setInterval(() => {
            this.updateMetrics();
        }, this.options.updateInterval);
        
        // Trigger first MSPE after 30 seconds
        setTimeout(() => {
            if (this.options.showMSPE) {
                this.showMSPEPrompt();
            }
        }, 30000);
    }
    
    updateMetrics() {
        // Simulate flow metrics based on current context
        // In production, these would come from actual performance analytics
        const metrics = this.generateFlowMetrics();
        
        flowAPI.updateMetrics(metrics);
        this.updateDisplay(metrics);
    }
    
    generateFlowMetrics() {
        // Simple heuristic - in production integrate with actual analytics
        const baseChallenge = this.challengeLevel * 10;
        const timeOnPage = (Date.now() - flowAPI.sessionStart) / 1000;
        
        // Simulate focus based on interaction and time
        const focus = Math.min(100, 50 + Math.random() * 30 + (timeOnPage > 60 ? 10 : 0));
        
        // Challenge-skill balance (optimal around 7-8)
        const challengeBalance = Math.max(0, 100 - Math.abs(this.challengeLevel - 7) * 10);
        
        // Engagement increases with time but has natural decay
        const engagement = Math.min(100, 40 + (timeOnPage / 60) * 20 - (timeOnPage / 300) * 5);
        
        return {
            challenge: baseChallenge,
            skill: 75, // Could be derived from user performance history
            focus: Math.round(focus),
            engagement: Math.round(engagement),
            challengeBalance: Math.round(challengeBalance)
        };
    }
    
    updateDisplay(metrics) {
        // Update tiles
        const focusEl = this.widget.querySelector('#focus-value');
        const challengeEl = this.widget.querySelector('#challenge-value');
        const flowScoreEl = this.widget.querySelector('#flow-score');
        const badgeEl = this.widget.querySelector('#flow-badge');
        
        if (focusEl) focusEl.textContent = metrics.focus || '--';
        if (challengeEl) challengeEl.textContent = this.challengeLevel;
        if (flowScoreEl) flowScoreEl.textContent = Math.round(metrics.flowScore || 0);
        
        // Update badge based on flow score
        if (badgeEl && metrics.flowScore !== undefined) {
            const score = metrics.flowScore;
            if (score >= 80) {
                badgeEl.textContent = 'Peak Flow';
                badgeEl.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
            } else if (score >= 60) {
                badgeEl.textContent = 'In Flow';
                badgeEl.style.background = 'linear-gradient(135deg, #FF6B35, #CC5500)';
            } else if (score >= 40) {
                badgeEl.textContent = 'Building';
                badgeEl.style.background = 'linear-gradient(135deg, #FFC107, #FF8F00)';
            } else {
                badgeEl.textContent = 'Getting Started';
                badgeEl.style.background = 'linear-gradient(135deg, #757575, #424242)';
            }
        }
    }
    
    updateChallengeDisplay() {
        const display = this.widget.querySelector('#challenge-display');
        if (display) {
            display.textContent = this.challengeLevel;
        }
    }
    
    onChallengeChange(level) {
        // Emit event for game integration
        const event = new CustomEvent('flowChallengeChange', {
            detail: { level, timestamp: Date.now() }
        });
        window.dispatchEvent(event);
        
        flowAPI.trackEvent('challenge_manual_adjust', {
            newLevel: level,
            source: 'user_slider'
        });
    }
    
    startBreathingSession() {
        // Create breathing overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); display: flex; align-items: center;
            justify-content: center; z-index: 10000;
        `;
        
        const breathingContainer = document.createElement('div');
        breathingContainer.style.cssText = `
            background: linear-gradient(135deg, rgba(10, 14, 39, 0.95), rgba(26, 31, 58, 0.95));
            border: 1px solid rgba(255, 107, 53, 0.3);
            border-radius: 20px; padding: 40px; text-align: center;
            color: white; font-family: 'Inter', sans-serif;
        `;
        
        breathingContainer.innerHTML = `
            <div style="font-size: 24px; font-weight: 700; margin-bottom: 20px;">Tactical Breathing</div>
            <div style="font-size: 18px; margin-bottom: 30px;">4-4-4-4 Box Breathing</div>
            <div id="breathing-circle" style="
                width: 150px; height: 150px; border: 3px solid #FF6B35;
                border-radius: 50%; margin: 0 auto 30px; position: relative;
                transition: transform 4s ease-in-out;
            "></div>
            <div id="breathing-instruction" style="font-size: 20px; margin-bottom: 20px;">Get Ready</div>
            <button id="start-breathing" style="
                background: #FF6B35; color: white; border: none; padding: 12px 24px;
                border-radius: 8px; font-size: 16px; cursor: pointer; margin-right: 10px;
            ">Start</button>
            <button id="close-breathing" style="
                background: transparent; color: #FF6B35; border: 1px solid #FF6B35;
                padding: 12px 24px; border-radius: 8px; font-size: 16px; cursor: pointer;
            ">Close</button>
        `;
        
        overlay.appendChild(breathingContainer);
        document.body.appendChild(overlay);
        
        // Breathing session logic
        let sessionActive = false;
        let cycle = 0;
        const phases = ['Breathe In', 'Hold', 'Breathe Out', 'Hold'];
        
        const circle = breathingContainer.querySelector('#breathing-circle');
        const instruction = breathingContainer.querySelector('#breathing-instruction');
        const startBtn = breathingContainer.querySelector('#start-breathing');
        const closeBtn = breathingContainer.querySelector('#close-breathing');
        
        const runBreathingCycle = () => {
            if (!sessionActive) return;
            
            const phase = cycle % 4;
            instruction.textContent = phases[phase];
            
            // Animate circle
            if (phase === 0) { // Breathe in
                circle.style.transform = 'scale(1.3)';
            } else if (phase === 2) { // Breathe out
                circle.style.transform = 'scale(1.0)';
            }
            
            cycle++;
            if (cycle < 24) { // 6 complete cycles
                setTimeout(runBreathingCycle, 4000);
            } else {
                // Session complete
                sessionActive = false;
                instruction.textContent = 'Session Complete!';
                flowAPI.trackBreathingSession('4-4-4-4', 96000, true);
                setTimeout(() => overlay.remove(), 3000);
            }
        };
        
        startBtn.addEventListener('click', () => {
            sessionActive = true;
            cycle = 0;
            startBtn.style.display = 'none';
            flowAPI.trackEvent('breathing_session_start', { pattern: '4-4-4-4' });
            runBreathingCycle();
        });
        
        closeBtn.addEventListener('click', () => {
            sessionActive = false;
            overlay.remove();
        });
    }
    
    showMSPEPrompt() {
        const section = this.widget.querySelector('#mspe-section');
        const prompt = this.widget.querySelector('#mspe-prompt');
        
        if (section && prompt) {
            const randomPrompt = this.mspePrompts[Math.floor(Math.random() * this.mspePrompts.length)];
            prompt.textContent = randomPrompt;
            section.style.display = 'block';
            
            this.currentMSPE = {
                prompt: randomPrompt,
                shown: Date.now()
            };
            
            flowAPI.trackEvent('mspe_prompt_shown', this.currentMSPE);
            
            // Auto-hide after 15 seconds
            setTimeout(() => {
                if (section.style.display !== 'none') {
                    this.acknowledgeMSPE(true);
                }
            }, 15000);
        }
    }
    
    acknowledgeMSPE(auto = false) {
        const section = this.widget.querySelector('#mspe-section');
        if (section) {
            section.style.display = 'none';
            
            if (this.currentMSPE) {
                flowAPI.trackMindfulnessMoment(
                    this.currentMSPE.prompt,
                    auto ? 'auto_dismissed' : 'acknowledged'
                );
                this.currentMSPE = null;
            }
            
            // Schedule next MSPE in 2-5 minutes
            const nextDelay = (2 + Math.random() * 3) * 60000;
            setTimeout(() => this.showMSPEPrompt(), nextDelay);
        }
    }
    
    triggerOptimization() {
        const currentMetrics = flowAPI.getCurrentState();
        
        // Show optimization suggestions
        const suggestions = this.generateOptimizationSuggestions(currentMetrics);
        this.showOptimizationDialog(suggestions);
        
        flowAPI.trackEvent('optimization_triggered', {
            currentState: currentMetrics,
            suggestions
        });
    }
    
    generateOptimizationSuggestions(metrics) {
        const suggestions = [];
        const flowScore = metrics.currentMetrics.flowScore || 0;
        
        if (flowScore < 40) {
            suggestions.push("Try adjusting the challenge level to better match your skill");
            suggestions.push("Take a moment for tactical breathing to center yourself");
        } else if (flowScore < 70) {
            suggestions.push("You're building momentum! Stay focused on the current task");
            if (this.challengeLevel < 6) {
                suggestions.push("Consider increasing the challenge slightly for deeper engagement");
            }
        } else {
            suggestions.push("Excellent flow state! Maintain this rhythm");
            suggestions.push("Trust your instincts and let your training guide you");
        }
        
        return suggestions;
    }
    
    showOptimizationDialog(suggestions) {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(10, 14, 39, 0.95), rgba(26, 31, 58, 0.95));
            border: 1px solid rgba(255, 107, 53, 0.3); border-radius: 12px;
            padding: 24px; color: white; font-family: 'Inter', sans-serif;
            max-width: 400px; z-index: 9999; box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        `;
        
        dialog.innerHTML = `
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #FF6B35;">
                Flow Optimization
            </div>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
                ${suggestions.map(s => `<li>${s}</li>`).join('')}
            </ul>
            <button id="close-optimization" style="
                background: #FF6B35; color: white; border: none; padding: 10px 20px;
                border-radius: 8px; margin-top: 20px; cursor: pointer; width: 100%;
            ">Got It</button>
        `;
        
        document.body.appendChild(dialog);
        
        dialog.querySelector('#close-optimization').addEventListener('click', () => {
            dialog.remove();
        });
        
        setTimeout(() => {
            if (document.body.contains(dialog)) {
                dialog.remove();
            }
        }, 10000);
    }
    
    show() {
        if (this.widget) {
            this.widget.style.display = 'block';
            this.isVisible = true;
        }
    }
    
    hide() {
        if (this.widget) {
            this.widget.style.display = 'none';
            this.isVisible = false;
        }
    }
    
    destroy() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        
        if (this.widget) {
            this.widget.remove();
        }
        
        flowAPI.endSession();
    }
}

// Export for global use
if (typeof window !== 'undefined') {
    window.FlowMeterWidget = FlowMeterWidget;
}