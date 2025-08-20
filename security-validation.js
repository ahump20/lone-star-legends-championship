/**
 * Blaze Intelligence - Security Validation & Monitoring System
 * Implements comprehensive security measures for sports analytics platform
 */

class BlazeSecurityValidator {
    constructor() {
        this.securityConfig = {
            // Content Security Policy
            csp: {
                'default-src': ["'self'"],
                'script-src': ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
                'style-src': ["'self'", "'unsafe-inline'"],
                'img-src': ["'self'", "data:", "https:"],
                'connect-src': ["'self'", "wss:", "https:"],
                'font-src': ["'self'", "fonts.googleapis.com", "fonts.gstatic.com"],
                'frame-src': ["'none'"],
                'object-src': ["'none'"],
                'base-uri': ["'self'"],
                'form-action': ["'self'"]
            },
            
            // Rate limiting
            rateLimits: {
                api: 100, // requests per minute
                websocket: 50, // connections per minute
                data_fetch: 200 // data requests per minute
            },
            
            // Input validation patterns
            validation: {
                teamId: /^[a-z]{3}_[a-z]+$/,
                playerId: /^[a-z0-9_]{3,20}$/,
                gameId: /^game_[0-9]{13}_[a-z0-9]{8}$/,
                timestamp: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
            },
            
            // Allowed data sources
            trustedSources: [
                'localhost',
                'ahump20.github.io',
                'blaze-intelligence.vercel.app',
                'api.sports-data.com',
                'api.weather.com'
            ]
        };
        
        this.securityLogs = [];
        this.threats = [];
        this.init();
    }
    
    init() {
        console.log('🔒 Initializing Blaze Intelligence Security Validator...');
        this.setupCSP();
        this.setupInputValidation();
        this.setupRateLimiting();
        this.setupThreatDetection();
        this.startSecurityMonitoring();
    }
    
    // === CONTENT SECURITY POLICY ===
    
    setupCSP() {
        const cspString = Object.entries(this.securityConfig.csp)
            .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
            .join('; ');
            
        // Set CSP header (would be done server-side in production)
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = cspString;
        document.head.appendChild(meta);
        
        this.logSecurity('CSP_ENABLED', 'Content Security Policy configured', 'info');
    }
    
    // === INPUT VALIDATION ===
    
    setupInputValidation() {
        // Override fetch to validate requests
        const originalFetch = window.fetch;
        window.fetch = (...args) => {
            const [url, options] = args;
            
            if (!this.validateRequest(url, options)) {
                this.logSecurity('BLOCKED_REQUEST', `Blocked suspicious request to ${url}`, 'warning');
                return Promise.reject(new Error('Request blocked by security policy'));
            }
            
            return originalFetch.apply(this, args);
        };
        
        // Validate WebSocket connections
        const originalWebSocket = window.WebSocket;
        window.WebSocket = function(url, protocols) {
            if (!this.validateWebSocketConnection(url)) {
                throw new Error('WebSocket connection blocked by security policy');
            }
            return new originalWebSocket(url, protocols);
        }.bind(this);
    }
    
    validateRequest(url, options = {}) {
        // Check if URL is from trusted source
        try {
            const urlObj = new URL(url, window.location.origin);
            const hostname = urlObj.hostname;
            
            if (!this.securityConfig.trustedSources.some(source => 
                hostname === source || hostname.endsWith('.' + source))) {
                return false;
            }
            
            // Validate request headers
            if (options.headers) {
                for (const [key, value] of Object.entries(options.headers)) {
                    if (this.containsSuspiciousContent(key) || this.containsSuspiciousContent(value)) {
                        return false;
                    }
                }
            }
            
            // Validate request body
            if (options.body && this.containsSuspiciousContent(options.body)) {
                return false;
            }
            
            return true;
        } catch (error) {
            return false;
        }
    }
    
    validateWebSocketConnection(url) {
        try {
            const urlObj = new URL(url);
            return this.securityConfig.trustedSources.some(source => 
                urlObj.hostname === source || urlObj.hostname.endsWith('.' + source));
        } catch (error) {
            return false;
        }
    }
    
    validateTeamData(data) {
        const required = ['team_id', 'sport', 'current_stats'];
        
        for (const field of required) {
            if (!data.hasOwnProperty(field)) {
                this.logSecurity('INVALID_TEAM_DATA', `Missing required field: ${field}`, 'error');
                return false;
            }
        }
        
        if (!this.securityConfig.validation.teamId.test(data.team_id)) {
            this.logSecurity('INVALID_TEAM_ID', `Invalid team ID format: ${data.team_id}`, 'error');
            return false;
        }
        
        return true;
    }
    
    validateGameData(data) {
        if (!data.game_id || !this.securityConfig.validation.gameId.test(data.game_id)) {
            return false;
        }
        
        if (!data.timestamp || !this.securityConfig.validation.timestamp.test(data.timestamp)) {
            return false;
        }
        
        return true;
    }
    
    // === RATE LIMITING ===
    
    setupRateLimiting() {
        this.requestCounts = {
            api: new Map(),
            websocket: new Map(),
            data_fetch: new Map()
        };
        
        // Reset counters every minute
        setInterval(() => {
            this.requestCounts.api.clear();
            this.requestCounts.websocket.clear();
            this.requestCounts.data_fetch.clear();
        }, 60000);
    }
    
    checkRateLimit(type, identifier = 'default') {
        const now = Date.now();
        const key = `${identifier}_${Math.floor(now / 60000)}`; // Per minute window
        
        const count = this.requestCounts[type].get(key) || 0;
        const limit = this.securityConfig.rateLimits[type];
        
        if (count >= limit) {
            this.logSecurity('RATE_LIMIT_EXCEEDED', `Rate limit exceeded for ${type}: ${identifier}`, 'warning');
            return false;
        }
        
        this.requestCounts[type].set(key, count + 1);
        return true;
    }
    
    // === THREAT DETECTION ===
    
    setupThreatDetection() {
        // Monitor for suspicious activity
        document.addEventListener('click', (event) => {
            this.analyzeUserAction('click', event);
        });
        
        document.addEventListener('keypress', (event) => {
            this.analyzeUserAction('keypress', event);
        });
        
        // Monitor for XSS attempts
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.scanForXSS(node);
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    analyzeUserAction(type, event) {
        // Look for suspicious patterns
        const target = event.target;
        
        if (target && target.outerHTML && this.containsSuspiciousContent(target.outerHTML)) {
            this.logSecurity('SUSPICIOUS_ELEMENT', `Suspicious ${type} on element`, 'warning');
        }
    }
    
    scanForXSS(element) {
        // Check for script injection attempts
        const scripts = element.querySelectorAll('script');
        scripts.forEach((script) => {
            if (script.src && !this.validateRequest(script.src)) {
                this.logSecurity('XSS_ATTEMPT', `Blocked suspicious script: ${script.src}`, 'critical');
                script.remove();
            }
        });
        
        // Check for event handlers
        const suspiciousAttrs = ['onload', 'onerror', 'onclick', 'onmouseover'];
        suspiciousAttrs.forEach((attr) => {
            if (element.hasAttribute(attr)) {
                this.logSecurity('SUSPICIOUS_HANDLER', `Found suspicious event handler: ${attr}`, 'warning');
            }
        });
    }
    
    containsSuspiciousContent(content) {
        const suspiciousPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /vbscript:/gi,
            /data:text\/html/gi,
            /eval\s*\(/gi,
            /document\.write/gi,
            /innerHTML\s*=/gi,
            /\.call\s*\(/gi,
            /\.apply\s*\(/gi
        ];
        
        return suspiciousPatterns.some(pattern => pattern.test(content));
    }
    
    // === SECURITY MONITORING ===
    
    startSecurityMonitoring() {
        // Monitor console for errors
        const originalError = console.error;
        console.error = (...args) => {
            this.logSecurity('CONSOLE_ERROR', args.join(' '), 'error');
            originalError.apply(console, args);
        };
        
        // Monitor for page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.logSecurity('PAGE_HIDDEN', 'Page became hidden', 'info');
            } else {
                this.logSecurity('PAGE_VISIBLE', 'Page became visible', 'info');
            }
        });
        
        // Monitor for focus changes
        window.addEventListener('focus', () => {
            this.logSecurity('WINDOW_FOCUS', 'Window gained focus', 'info');
        });
        
        window.addEventListener('blur', () => {
            this.logSecurity('WINDOW_BLUR', 'Window lost focus', 'info');
        });
    }
    
    logSecurity(type, message, level = 'info') {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: type,
            message: message,
            level: level,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        this.securityLogs.push(logEntry);
        
        // Keep only last 1000 logs
        if (this.securityLogs.length > 1000) {
            this.securityLogs.shift();
        }
        
        // Log to console with appropriate level
        const consoleMethod = level === 'critical' ? 'error' : 
                            level === 'error' ? 'error' : 
                            level === 'warning' ? 'warn' : 'log';
        console[consoleMethod](`🔒 [${level.toUpperCase()}] ${type}: ${message}`);
        
        // Send critical events to monitoring service (in production)
        if (level === 'critical') {
            this.sendToMonitoring(logEntry);
        }
    }
    
    sendToMonitoring(logEntry) {
        // In production, this would send to Sentry or similar service
        console.error('🚨 CRITICAL SECURITY EVENT:', logEntry);
    }
    
    // === INTEGRITY CHECKS ===
    
    validateDataIntegrity(data) {
        // Check for required Blaze Intelligence metadata
        if (!data.metadata || !data.metadata.source) {
            this.logSecurity('INVALID_DATA', 'Missing data source metadata', 'warning');
            return false;
        }
        
        // Validate accuracy scores
        if (data.metadata.accuracy && (data.metadata.accuracy < 0 || data.metadata.accuracy > 100)) {
            this.logSecurity('INVALID_ACCURACY', `Invalid accuracy score: ${data.metadata.accuracy}`, 'error');
            return false;
        }
        
        // Validate timestamps
        if (data.metadata.last_updated && !this.securityConfig.validation.timestamp.test(data.metadata.last_updated)) {
            this.logSecurity('INVALID_TIMESTAMP', 'Invalid timestamp format', 'error');
            return false;
        }
        
        return true;
    }
    
    // === PUBLIC API ===
    
    getSecurityStatus() {
        return {
            status: 'active',
            logsCount: this.securityLogs.length,
            threatsDetected: this.threats.length,
            lastCheck: new Date().toISOString(),
            rateLimitsActive: true,
            cspEnabled: true
        };
    }
    
    getSecurityLogs(level = null, limit = 50) {
        let logs = this.securityLogs;
        
        if (level) {
            logs = logs.filter(log => log.level === level);
        }
        
        return logs.slice(-limit);
    }
    
    exportSecurityReport() {
        return {
            summary: this.getSecurityStatus(),
            recentLogs: this.getSecurityLogs(null, 100),
            configuration: {
                csp: this.securityConfig.csp,
                rateLimits: this.securityConfig.rateLimits,
                trustedSources: this.securityConfig.trustedSources
            },
            generatedAt: new Date().toISOString()
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeSecurityValidator;
} else {
    window.BlazeSecurityValidator = BlazeSecurityValidator;
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        window.blazeSecurity = new BlazeSecurityValidator();
        console.log('🔒 Blaze Intelligence Security Validator initialized');
    });
}