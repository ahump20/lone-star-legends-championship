/**
 * Analytics Manager
 * Tracks user engagement, performance metrics, and telemetry
 */

class AnalyticsManager {
    constructor(options = {}) {
        this.enabled = options.enabled !== false;
        this.debug = options.debug || false;
        this.sessionId = this.generateSessionId();
        this.sessionStart = Date.now();
        this.events = [];
        this.metrics = this.initializeMetrics();
    }

    /**
     * Initialize metrics
     */
    initializeMetrics() {
        return {
            session: {
                id: this.sessionId,
                start: this.sessionStart,
                duration: 0,
                events: 0,
            },
            gameplay: {
                gamesStarted: 0,
                gamesCompleted: 0,
                totalPlayTime: 0,
                averageGameTime: 0,
            },
            engagement: {
                clicks: 0,
                swings: 0,
                pitches: 0,
                hits: 0,
                homeRuns: 0,
            },
            performance: {
                fps: 0,
                loadTime: 0,
                errors: 0,
            },
            features: {
                modesPlayed: {},
                charactersUsed: {},
                stadiumsPlayed: {},
                abilitiesUsed: {},
            },
        };
    }

    /**
     * Track event
     */
    trackEvent(eventName, properties = {}) {
        if (!this.enabled) {
            return;
        }

        const event = {
            name: eventName,
            properties: properties,
            timestamp: Date.now(),
            sessionId: this.sessionId,
        };

        this.events.push(event);
        this.metrics.session.events++;

        if (this.debug) {
            console.info('📊 Event:', eventName, properties);
        }

        // Update specific metrics
        this.updateMetricsFromEvent(event);

        // Persist events periodically
        if (this.events.length >= 10) {
            this.persistEvents();
        }
    }

    /**
     * Update metrics based on event
     */
    updateMetricsFromEvent(event) {
        const { name, properties } = event;

        switch (name) {
            case 'game_start':
                this.metrics.gameplay.gamesStarted++;
                if (properties.mode) {
                    this.metrics.features.modesPlayed[properties.mode] =
                        (this.metrics.features.modesPlayed[properties.mode] || 0) + 1;
                }
                break;

            case 'game_end':
                this.metrics.gameplay.gamesCompleted++;
                if (properties.duration) {
                    this.metrics.gameplay.totalPlayTime += properties.duration;
                    this.metrics.gameplay.averageGameTime =
                        this.metrics.gameplay.totalPlayTime / this.metrics.gameplay.gamesCompleted;
                }
                break;

            case 'swing':
                this.metrics.engagement.swings++;
                break;

            case 'pitch':
                this.metrics.engagement.pitches++;
                break;

            case 'hit':
                this.metrics.engagement.hits++;
                break;

            case 'home_run':
                this.metrics.engagement.homeRuns++;
                break;

            case 'ability_used':
                if (properties.abilityId) {
                    this.metrics.features.abilitiesUsed[properties.abilityId] =
                        (this.metrics.features.abilitiesUsed[properties.abilityId] || 0) + 1;
                }
                break;

            case 'character_selected':
                if (properties.characterId) {
                    this.metrics.features.charactersUsed[properties.characterId] =
                        (this.metrics.features.charactersUsed[properties.characterId] || 0) + 1;
                }
                break;

            case 'stadium_played':
                if (properties.stadiumId) {
                    this.metrics.features.stadiumsPlayed[properties.stadiumId] =
                        (this.metrics.features.stadiumsPlayed[properties.stadiumId] || 0) + 1;
                }
                break;

            case 'error':
                this.metrics.performance.errors++;
                break;
        }
    }

    /**
     * Track page view
     */
    trackPageView(pageName) {
        this.trackEvent('page_view', { page: pageName });
    }

    /**
     * Track performance metrics
     */
    trackPerformance(metrics) {
        this.metrics.performance = {
            ...this.metrics.performance,
            ...metrics,
        };

        this.trackEvent('performance', metrics);
    }

    /**
     * Track error
     */
    trackError(error, context = {}) {
        this.trackEvent('error', {
            message: error.message || error.toString(),
            stack: error.stack,
            ...context,
        });
    }

    /**
     * Get session duration
     */
    getSessionDuration() {
        return Date.now() - this.sessionStart;
    }

    /**
     * Get metrics summary
     */
    getMetrics() {
        this.metrics.session.duration = this.getSessionDuration();
        return { ...this.metrics };
    }

    /**
     * Generate session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Persist events to localStorage
     */
    persistEvents() {
        try {
            const stored = JSON.parse(localStorage.getItem('sandlot_analytics') || '[]');
            stored.push(...this.events);

            // Keep only last 1000 events
            if (stored.length > 1000) {
                stored.splice(0, stored.length - 1000);
            }

            localStorage.setItem('sandlot_analytics', JSON.stringify(stored));
            this.events = [];
        } catch (error) {
            console.error('Failed to persist analytics:', error);
        }
    }

    /**
     * Get stored events
     */
    getStoredEvents() {
        try {
            return JSON.parse(localStorage.getItem('sandlot_analytics') || '[]');
        } catch (error) {
            console.error('Failed to load analytics:', error);
            return [];
        }
    }

    /**
     * Export analytics data
     */
    exportData() {
        return {
            metrics: this.getMetrics(),
            events: [...this.events, ...this.getStoredEvents()],
            exportedAt: new Date().toISOString(),
        };
    }

    /**
     * Clear analytics data
     */
    clearData() {
        this.events = [];
        this.metrics = this.initializeMetrics();
        localStorage.removeItem('sandlot_analytics');
    }

    /**
     * Generate report
     */
    generateReport() {
        const metrics = this.getMetrics();

        return {
            summary: {
                sessionDuration: this.formatDuration(metrics.session.duration),
                totalEvents: metrics.session.events,
                gamesPlayed: metrics.gameplay.gamesCompleted,
                averageGameTime: this.formatDuration(metrics.gameplay.averageGameTime),
            },
            engagement: {
                totalSwings: metrics.engagement.swings,
                totalHits: metrics.engagement.hits,
                homeRuns: metrics.engagement.homeRuns,
                battingAverage: (metrics.engagement.hits / metrics.engagement.swings || 0).toFixed(3),
            },
            performance: {
                fps: metrics.performance.fps,
                loadTime: metrics.performance.loadTime,
                errors: metrics.performance.errors,
            },
            topFeatures: {
                favoriteMode: this.getMostUsed(metrics.features.modesPlayed),
                favoriteCharacter: this.getMostUsed(metrics.features.charactersUsed),
                favoriteStadium: this.getMostUsed(metrics.features.stadiumsPlayed),
            },
        };
    }

    /**
     * Get most used item from object
     */
    getMostUsed(obj) {
        const entries = Object.entries(obj);
        if (entries.length === 0) {
            return null;
        }
        return entries.reduce((max, [key, value]) => (value > max[1] ? [key, value] : max), ['', 0])[0];
    }

    /**
     * Format duration
     */
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        return `${seconds}s`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsManager;
}
