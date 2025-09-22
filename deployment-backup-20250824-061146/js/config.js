/**
 * Blaze Intelligence Configuration
 * Centralized API endpoints and configuration
 */

// Detect if we're on production domain
const isProduction = window.location.hostname === 'blaze-intelligence.com' || 
                     window.location.hostname === 'www.blaze-intelligence.com';
const isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';

const BlazeConfig = {
    // Service URLs
    PAGES_URL: isProduction ? 'https://blaze-intelligence.com' : 'https://blaze-intelligence.pages.dev',
    WORKER_URL: 'https://blaze-intelligence-worker.humphrey-austin20.workers.dev',
    
    // Environment
    environment: isProduction ? 'production' : (isDevelopment ? 'development' : 'preview'),
    
    // API Endpoints
    api: {
        // Worker endpoints (D1, KV, DO)
        health: 'https://blaze-intelligence-worker.humphrey-austin20.workers.dev/api/health',
        stats: 'https://blaze-intelligence-worker.humphrey-austin20.workers.dev/api/stats',
        analytics: 'https://blaze-intelligence-worker.humphrey-austin20.workers.dev/api/analytics',
        session: 'https://blaze-intelligence-worker.humphrey-austin20.workers.dev/api/session',
        rooms: 'https://blaze-intelligence-worker.humphrey-austin20.workers.dev/api/rooms',
        
        // Pages Functions endpoints
        onboarding: '/api/onboarding',
        cms: '/api/cms',
        generatePlay: '/api/generate-play',
        playerAnalysis: '/api/player-analysis',
        playerNarrative: '/api/player-narrative',
        generateCommentary: '/api/generate-commentary'
    },
    
    // WebSocket endpoint
    websocket: {
        url: 'wss://blaze-intelligence-worker.humphrey-austin20.workers.dev/ws',
        defaultRoom: 'default'
    },
    
    // Helper function to get full URL
    getApiUrl(endpoint) {
        if (this.api[endpoint]) {
            return this.api[endpoint];
        }
        return `${this.WORKER_URL}/api/${endpoint}`;
    },
    
    // Helper for WebSocket connection
    getWebSocketUrl(room = 'default', playerId = null) {
        const id = playerId || `player_${Math.random().toString(36).substr(2, 9)}`;
        return `${this.websocket.url}?room=${room}&player=${id}`;
    }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeConfig;
}