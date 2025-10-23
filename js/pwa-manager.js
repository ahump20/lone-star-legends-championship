/**
 * PWA Manager
 * Handles service worker registration, updates, and installation
 */

class PWAManager {
    constructor(options = {}) {
        this.serviceWorkerUrl = options.serviceWorkerUrl || '/service-worker.js';
        this.checkUpdateInterval = options.checkUpdateInterval || 60000; // 1 minute
        this.updateCheckTimer = null;
        this.registration = null;
        this.deferredPrompt = null;
        this.installed = false;

        // Callbacks
        this.onUpdate = options.onUpdate || null;
        this.onInstalled = options.onInstalled || null;
        this.onOffline = options.onOffline || null;
        this.onOnline = options.onOnline || null;

        this.init();
    }

    async init() {
        // Check if service workers are supported
        if (!('serviceWorker' in navigator)) {
            console.warn('Service Workers not supported');
            return;
        }

        // Check if already installed as PWA
        this.checkIfInstalled();

        // Register service worker
        await this.register();

        // Setup event listeners
        this.setupEventListeners();

        // Start checking for updates
        this.startUpdateChecks();

        console.log('✅ PWA Manager initialized');
    }

    /**
     * Register service worker
     */
    async register() {
        try {
            this.registration = await navigator.serviceWorker.register(this.serviceWorkerUrl);

            console.log('Service Worker registered:', this.registration.scope);

            // Check for updates on registration
            this.registration.addEventListener('updatefound', () => {
                this.handleUpdateFound();
            });

            // Check for updates now
            await this.registration.update();

            return this.registration;

        } catch (error) {
            console.error('Service Worker registration failed:', error);
            throw error;
        }
    }

    /**
     * Handle update found
     */
    handleUpdateFound() {
        const newWorker = this.registration.installing;

        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                    // New version available
                    console.log('New version available');
                    this.showUpdateNotification();

                    if (this.onUpdate) {
                        this.onUpdate(newWorker);
                    }
                } else {
                    // First install
                    console.log('Service Worker installed');

                    if (this.onInstalled) {
                        this.onInstalled();
                    }
                }
            }
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            console.log('Install prompt available');
            this.showInstallBanner();
        });

        // Listen for app installed
        window.addEventListener('appinstalled', () => {
            console.log('PWA installed');
            this.installed = true;
            this.hideInstallBanner();

            if (this.onInstalled) {
                this.onInstalled();
            }
        });

        // Listen for network status
        window.addEventListener('online', () => {
            console.log('App is online');
            this.hideOfflineIndicator();

            if (this.onOnline) {
                this.onOnline();
            }
        });

        window.addEventListener('offline', () => {
            console.log('App is offline');
            this.showOfflineIndicator();

            if (this.onOffline) {
                this.onOffline();
            }
        });

        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
            this.handleServiceWorkerMessage(event);
        });
    }

    /**
     * Handle messages from service worker
     */
    handleServiceWorkerMessage(event) {
        const { type, payload } = event.data;

        switch (type) {
            case 'UPDATE_AVAILABLE':
                this.showUpdateNotification();
                break;

            case 'OFFLINE_READY':
                console.log('App ready for offline use');
                break;

            case 'CACHE_UPDATED':
                console.log('Cache updated:', payload);
                break;

            default:
                console.log('Unknown message from SW:', type);
        }
    }

    /**
     * Check for updates
     */
    async checkForUpdates() {
        if (!this.registration) return;

        try {
            await this.registration.update();
            console.log('Checked for updates');
        } catch (error) {
            console.error('Update check failed:', error);
        }
    }

    /**
     * Start periodic update checks
     */
    startUpdateChecks() {
        this.updateCheckTimer = setInterval(() => {
            this.checkForUpdates();
        }, this.checkUpdateInterval);
    }

    /**
     * Stop update checks
     */
    stopUpdateChecks() {
        if (this.updateCheckTimer) {
            clearInterval(this.updateCheckTimer);
            this.updateCheckTimer = null;
        }
    }

    /**
     * Apply update (reload page)
     */
    async applyUpdate() {
        if (!this.registration || !this.registration.waiting) {
            return;
        }

        // Tell service worker to skip waiting
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Reload page when service worker is activated
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
    }

    /**
     * Show install prompt
     */
    async showInstallPrompt() {
        if (!this.deferredPrompt) {
            console.log('Install prompt not available');
            return false;
        }

        // Show prompt
        this.deferredPrompt.prompt();

        // Wait for user response
        const { outcome } = await this.deferredPrompt.userChoice;
        console.log('Install prompt outcome:', outcome);

        // Clear prompt
        this.deferredPrompt = null;

        return outcome === 'accepted';
    }

    /**
     * Check if app is installed as PWA
     */
    checkIfInstalled() {
        // Check display mode
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
        const isMinimalUi = window.matchMedia('(display-mode: minimal-ui)').matches;

        // Check iOS standalone
        const isIOSStandalone = ('standalone' in window.navigator) && window.navigator.standalone;

        this.installed = isStandalone || isFullscreen || isMinimalUi || isIOSStandalone;

        if (this.installed) {
            console.log('App is installed as PWA');
            document.body.classList.add('pwa-installed');
        }

        return this.installed;
    }

    /**
     * Show install banner
     */
    showInstallBanner() {
        // Don't show if already installed or dismissed
        if (this.installed || localStorage.getItem('installBannerDismissed')) {
            return;
        }

        let banner = document.getElementById('install-banner');

        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'install-banner';
            banner.className = 'install-banner';
            banner.innerHTML = `
                <div class="install-banner-content">
                    <div class="install-banner-icon">⚾</div>
                    <div class="install-banner-text">
                        <div class="install-banner-title">Install Sandlot Superstars</div>
                        <div class="install-banner-desc">Play offline and get a better experience!</div>
                    </div>
                </div>
                <button class="install-banner-button" id="install-button">Install</button>
                <button class="install-banner-close" id="install-close">×</button>
            `;

            document.body.appendChild(banner);

            // Add event listeners
            document.getElementById('install-button').addEventListener('click', () => {
                this.showInstallPrompt();
                this.hideInstallBanner();
            });

            document.getElementById('install-close').addEventListener('click', () => {
                this.hideInstallBanner();
                localStorage.setItem('installBannerDismissed', 'true');
            });
        }

        // Show banner with animation
        setTimeout(() => banner.classList.add('show'), 100);
    }

    /**
     * Hide install banner
     */
    hideInstallBanner() {
        const banner = document.getElementById('install-banner');
        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => banner.remove(), 300);
        }
    }

    /**
     * Show update notification
     */
    showUpdateNotification() {
        let notification = document.getElementById('update-notification');

        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'update-notification';
            notification.className = 'update-notification';
            notification.innerHTML = `
                <div class="update-content">
                    <div class="update-icon">🔄</div>
                    <div class="update-text">
                        <div class="update-title">Update Available</div>
                        <div class="update-desc">A new version is ready</div>
                    </div>
                </div>
                <button class="update-button" id="update-button">Update Now</button>
                <button class="update-close" id="update-close">×</button>
            `;

            // Apply styles
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #FF6B35, #ff8055);
                color: #fff;
                padding: 15px;
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                z-index: 10001;
                display: flex;
                align-items: center;
                gap: 15px;
                max-width: 400px;
                transform: translateX(150%);
                transition: transform 0.3s ease;
            `;

            document.body.appendChild(notification);

            // Add event listeners
            document.getElementById('update-button').addEventListener('click', () => {
                this.applyUpdate();
            });

            document.getElementById('update-close').addEventListener('click', () => {
                this.hideUpdateNotification();
            });
        }

        // Show notification
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
    }

    /**
     * Hide update notification
     */
    hideUpdateNotification() {
        const notification = document.getElementById('update-notification');
        if (notification) {
            notification.style.transform = 'translateX(150%)';
            setTimeout(() => notification.remove(), 300);
        }
    }

    /**
     * Show offline indicator
     */
    showOfflineIndicator() {
        let indicator = document.getElementById('offline-indicator');

        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'offline-indicator';
            indicator.className = 'offline-indicator';
            indicator.textContent = '📵 You are offline';
            document.body.appendChild(indicator);
        }

        indicator.classList.remove('online');
        indicator.classList.add('show');
    }

    /**
     * Hide offline indicator
     */
    hideOfflineIndicator() {
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            indicator.textContent = '✅ Back online';
            indicator.classList.add('online');

            setTimeout(() => {
                indicator.classList.remove('show');
            }, 2000);
        }
    }

    /**
     * Get cache size
     */
    async getCacheSize() {
        if (!this.registration) return null;

        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();

            messageChannel.port1.onmessage = (event) => {
                resolve(event.data.size);
            };

            this.registration.active.postMessage(
                { type: 'GET_CACHE_SIZE' },
                [messageChannel.port2]
            );
        });
    }

    /**
     * Clear cache
     */
    async clearCache() {
        if (!this.registration) return;

        this.registration.active.postMessage({ type: 'CLEAR_CACHE' });
        console.log('Cache cleared');
    }

    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.warn('Notifications not supported');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    /**
     * Show notification
     */
    async showNotification(title, options = {}) {
        if (!this.registration) return;

        const hasPermission = await this.requestNotificationPermission();
        if (!hasPermission) return;

        return this.registration.showNotification(title, {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            ...options
        });
    }

    /**
     * Share content (Web Share API)
     */
    async share(data) {
        if (!('share' in navigator)) {
            console.warn('Web Share API not supported');
            return false;
        }

        try {
            await navigator.share(data);
            return true;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Share failed:', error);
            }
            return false;
        }
    }

    /**
     * Check if device is online
     */
    isOnline() {
        return navigator.onLine;
    }

    /**
     * Get connection info
     */
    getConnectionInfo() {
        if (!('connection' in navigator)) {
            return null;
        }

        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

        return {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData
        };
    }

    /**
     * Unregister service worker
     */
    async unregister() {
        if (!this.registration) return;

        await this.registration.unregister();
        console.log('Service Worker unregistered');
        this.registration = null;
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopUpdateChecks();
        this.hideInstallBanner();
        this.hideUpdateNotification();
        this.hideOfflineIndicator();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAManager;
}
