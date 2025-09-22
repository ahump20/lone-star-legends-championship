/* Flow State Analytics API - Client Stub for Blaze Intelligence */

export class FlowStateAPI {
    constructor(config = {}) {
        this.config = {
            telemetryEndpoint: '/api/flow-telemetry',
            sessionId: this.generateSessionId(),
            userId: config.userId || 'anonymous',
            ...config
        };
        
        this.sessionStart = Date.now();
        this.flowMetrics = {
            challenge: 0,
            skill: 0,
            focus: 0,
            engagement: 0,
            flowScore: 0
        };
        
        this.events = [];
        this.isTracking = false;
    }
    
    generateSessionId() {
        return `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Start flow tracking session
    startSession(context = {}) {
        this.isTracking = true;
        this.sessionStart = Date.now();
        this.context = context;
        
        this.trackEvent('flow_session_start', {
            sessionId: this.config.sessionId,
            context,
            timestamp: this.sessionStart
        });
        
        return this.config.sessionId;
    }
    
    // Update flow metrics in real-time
    updateMetrics(metrics) {
        Object.assign(this.flowMetrics, metrics);
        
        // Calculate composite flow score
        this.flowMetrics.flowScore = this.calculateFlowScore();
        
        this.trackEvent('flow_metrics_update', {
            metrics: { ...this.flowMetrics },
            timestamp: Date.now()
        });
        
        return this.flowMetrics;
    }
    
    // Calculate flow score from multiple indicators
    calculateFlowScore() {
        const weights = {
            challenge: 0.25,
            skill: 0.20,
            focus: 0.25,
            engagement: 0.30
        };
        
        let score = 0;
        for (const [metric, value] of Object.entries(this.flowMetrics)) {
            if (weights[metric]) {
                score += value * weights[metric];
            }
        }
        
        return Math.min(100, Math.max(0, score));
    }
    
    // Track specific flow events
    trackEvent(eventType, data = {}) {
        const event = {
            type: eventType,
            sessionId: this.config.sessionId,
            timestamp: Date.now(),
            sessionDuration: Date.now() - this.sessionStart,
            ...data
        };
        
        this.events.push(event);
        
        // Send to telemetry endpoint
        if (this.config.telemetryEndpoint) {
            this.sendTelemetry(event);
        }
        
        return event;
    }
    
    // Send telemetry data (implement based on your analytics setup)
    async sendTelemetry(event) {
        try {
            // For now, just log to console - replace with actual endpoint
            if (window.gtag) {
                window.gtag('event', event.type, {
                    flow_score: this.flowMetrics.flowScore,
                    session_id: this.config.sessionId,
                    custom_parameter: event.data
                });
            }
            
            // Could also send to your analytics endpoint:
            // await fetch(this.config.telemetryEndpoint, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(event)
            // });
            
        } catch (error) {
            console.warn('Flow telemetry failed:', error);
        }
    }
    
    // End flow session and generate summary
    endSession(subjective = {}) {
        this.isTracking = false;
        const duration = Date.now() - this.sessionStart;
        
        const summary = {
            sessionId: this.config.sessionId,
            duration,
            totalEvents: this.events.length,
            averageFlowScore: this.calculateAverageFlow(),
            peakFlowScore: Math.max(...this.events
                .filter(e => e.type === 'flow_metrics_update')
                .map(e => e.metrics?.flowScore || 0)),
            subjective,
            context: this.context
        };
        
        this.trackEvent('flow_session_end', summary);
        
        return summary;
    }
    
    calculateAverageFlow() {
        const flowEvents = this.events.filter(e => e.type === 'flow_metrics_update');
        if (flowEvents.length === 0) return 0;
        
        const scores = flowEvents.map(e => e.metrics?.flowScore || 0);
        return scores.reduce((a, b) => a + b, 0) / scores.length;
    }
    
    // Get current flow state assessment
    getCurrentState() {
        return {
            isTracking: this.isTracking,
            sessionDuration: this.isTracking ? Date.now() - this.sessionStart : 0,
            currentMetrics: { ...this.flowMetrics },
            eventCount: this.events.length
        };
    }
    
    // Challenge adjustment based on 4% rule
    adjustChallenge(currentPerformance, baseline) {
        const targetChallenge = baseline * 1.04; // 4% increase
        const adjustment = targetChallenge - currentPerformance;
        
        this.trackEvent('challenge_adjustment', {
            baseline,
            currentPerformance,
            targetChallenge,
            adjustment
        });
        
        return {
            suggested: targetChallenge,
            adjustment,
            rationale: 'Kotler 4% Challenge Rule'
        };
    }
    
    // Breathing session tracking
    trackBreathingSession(pattern, duration, completion) {
        this.trackEvent('breathing_session', {
            pattern,
            duration,
            completion,
            flowScoreBefore: this.flowMetrics.flowScore,
            timestamp: Date.now()
        });
    }
    
    // MSPE mindfulness moment
    trackMindfulnessMoment(prompt, response) {
        this.trackEvent('mindfulness_moment', {
            prompt,
            response,
            flowContext: this.flowMetrics,
            timestamp: Date.now()
        });
    }
}

// Export singleton instance
export const flowAPI = new FlowStateAPI();

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
    window.FlowStateAPI = FlowStateAPI;
    window.flowAPI = flowAPI;
}