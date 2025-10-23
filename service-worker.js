/**
 * Service Worker for Sandlot Superstars PWA
 * Handles offline caching, asset management, and background sync
 */

const CACHE_VERSION = 'v2.0.1';
const CACHE_NAME = `sandlot-superstars-${CACHE_VERSION}`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/games/baseball/index.html',

    // Core JavaScript
    '/js/game-state-manager.js',
    '/js/achievement-system.js',
    '/js/character-manager.js',
    '/js/character-creator.js',
    '/js/audio-manager.js',
    '/js/full-game-engine.js',
    '/js/season-manager.js',
    '/js/tutorial-manager.js',
    '/js/visual-effects-manager.js',
    '/js/game-modes.js',
    '/js/analytics-manager.js',
    '/js/ui-manager.js',
    '/js/ui-screens.js',
    '/js/ui-game-modes.js',
    '/js/ui-character-creator.js',

    // CSS
    '/css/ui-manager.css',
    '/css/ui-game-modes.css',
    '/css/character-creator.css',

    // Data files
    '/data/backyard-roster.json',

    // Examples (for demo)
    '/examples/ui-integration.html',
    '/examples/character-creator-demo.html'
];

// Dynamic content patterns to cache
const CACHE_PATTERNS = {
    images: /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i,
    fonts: /\.(woff|woff2|ttf|eot)$/i,
    data: /\.(json)$/i,
    scripts: /\.js$/i,
    styles: /\.css$/i
};

// Cache strategies
const STRATEGIES = {
    CACHE_FIRST: 'cache-first',
    NETWORK_FIRST: 'network-first',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
    NETWORK_ONLY: 'network-only',
    CACHE_ONLY: 'cache-only'
};

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...', CACHE_VERSION);

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
            })
            .then(() => {
                console.log('[Service Worker] Static assets cached');
                return self.skipWaiting(); // Activate immediately
            })
            .catch((error) => {
                console.error('[Service Worker] Installation failed:', error);
            })
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...', CACHE_VERSION);

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName.startsWith('sandlot-superstars-')) {
                            console.log('[Service Worker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] Activated');
                return self.clients.claim(); // Take control of all pages
            })
    );
});

/**
 * Fetch event - intercept network requests
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-HTTP requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Skip cross-origin requests (CDNs, etc.)
    if (url.origin !== self.location.origin) {
        return;
    }

    // Determine strategy based on request type
    const strategy = getStrategyForRequest(request);

    event.respondWith(
        handleRequest(request, strategy)
            .catch((error) => {
                console.error('[Service Worker] Fetch failed:', error);
                return createOfflineFallback(request);
            })
    );
});

/**
 * Get caching strategy for a request
 */
function getStrategyForRequest(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // HTML pages - Network first (fresh content)
    if (pathname.endsWith('.html') || pathname === '/') {
        return STRATEGIES.NETWORK_FIRST;
    }

    // JavaScript - Stale while revalidate (balance freshness and speed)
    if (CACHE_PATTERNS.scripts.test(pathname)) {
        return STRATEGIES.STALE_WHILE_REVALIDATE;
    }

    // CSS - Stale while revalidate
    if (CACHE_PATTERNS.styles.test(pathname)) {
        return STRATEGIES.STALE_WHILE_REVALIDATE;
    }

    // Images - Cache first (rarely change)
    if (CACHE_PATTERNS.images.test(pathname)) {
        return STRATEGIES.CACHE_FIRST;
    }

    // Fonts - Cache first
    if (CACHE_PATTERNS.fonts.test(pathname)) {
        return STRATEGIES.CACHE_FIRST;
    }

    // JSON data - Network first
    if (CACHE_PATTERNS.data.test(pathname)) {
        return STRATEGIES.NETWORK_FIRST;
    }

    // Default to network first
    return STRATEGIES.NETWORK_FIRST;
}

/**
 * Handle request with specified strategy
 */
async function handleRequest(request, strategy) {
    switch (strategy) {
        case STRATEGIES.CACHE_FIRST:
            return cacheFirst(request);

        case STRATEGIES.NETWORK_FIRST:
            return networkFirst(request);

        case STRATEGIES.STALE_WHILE_REVALIDATE:
            return staleWhileRevalidate(request);

        case STRATEGIES.NETWORK_ONLY:
            return fetch(request);

        case STRATEGIES.CACHE_ONLY:
            return caches.match(request);

        default:
            return networkFirst(request);
    }
}

/**
 * Cache First Strategy
 * Try cache first, fallback to network
 */
async function cacheFirst(request) {
    const cached = await caches.match(request);

    if (cached) {
        return cached;
    }

    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
    }

    return response;
}

/**
 * Network First Strategy
 * Try network first, fallback to cache
 */
async function networkFirst(request) {
    try {
        const response = await fetch(request);

        // Cache successful responses
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }

        return response;

    } catch (error) {
        // Network failed, try cache
        const cached = await caches.match(request);

        if (cached) {
            return cached;
        }

        throw error;
    }
}

/**
 * Stale While Revalidate Strategy
 * Return cached version immediately, update cache in background
 */
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    // Fetch fresh version in background
    const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(() => {
        // Network failed, ignore
    });

    // Return cached version immediately if available
    return cached || fetchPromise;
}

/**
 * Create offline fallback response
 */
function createOfflineFallback(request) {
    const url = new URL(request.url);

    // HTML pages - show offline page
    if (request.headers.get('Accept').includes('text/html')) {
        return new Response(
            createOfflineHTML(),
            {
                status: 200,
                statusText: 'OK',
                headers: { 'Content-Type': 'text/html' }
            }
        );
    }

    // Images - return placeholder
    if (CACHE_PATTERNS.images.test(url.pathname)) {
        return new Response(
            createOfflineSVG(),
            {
                status: 200,
                statusText: 'OK',
                headers: { 'Content-Type': 'image/svg+xml' }
            }
        );
    }

    // Default offline response
    return new Response(
        JSON.stringify({ offline: true, message: 'No internet connection' }),
        {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
        }
    );
}

/**
 * Create offline HTML page
 */
function createOfflineHTML() {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Offline - Sandlot Superstars</title>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #0A0E27 0%, #1a1f3a 100%);
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    text-align: center;
                }
                .offline-container {
                    max-width: 500px;
                    padding: 40px 20px;
                }
                .offline-icon {
                    font-size: 80px;
                    margin-bottom: 20px;
                }
                h1 {
                    font-size: 32px;
                    margin-bottom: 15px;
                    color: #FF6B35;
                }
                p {
                    font-size: 16px;
                    line-height: 1.6;
                    color: rgba(255, 255, 255, 0.8);
                    margin-bottom: 30px;
                }
                .retry-btn {
                    display: inline-block;
                    padding: 12px 30px;
                    background: #FF6B35;
                    color: #fff;
                    border: none;
                    border-radius: 5px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    text-decoration: none;
                    transition: background 0.3s ease;
                }
                .retry-btn:hover {
                    background: #ff8055;
                }
            </style>
        </head>
        <body>
            <div class="offline-container">
                <div class="offline-icon">⚾</div>
                <h1>You're Offline</h1>
                <p>
                    It looks like you've lost your internet connection.
                    Don't worry, you can still play cached games!
                </p>
                <button class="retry-btn" onclick="window.location.reload()">
                    Try Again
                </button>
            </div>
        </body>
        </html>
    `;
}

/**
 * Create offline SVG placeholder
 */
function createOfflineSVG() {
    return `
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" fill="#0A0E27"/>
            <text x="100" y="100" font-family="Arial" font-size="60" fill="#FF6B35" text-anchor="middle" dominant-baseline="middle">⚾</text>
            <text x="100" y="150" font-family="Arial" font-size="12" fill="#fff" text-anchor="middle" dominant-baseline="middle">Offline</text>
        </svg>
    `;
}

/**
 * Message handler for communication with app
 */
self.addEventListener('message', (event) => {
    const { type, payload } = event.data;

    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;

        case 'CACHE_URLS':
            cacheUrls(payload.urls);
            break;

        case 'CLEAR_CACHE':
            clearCache();
            break;

        case 'GET_CACHE_SIZE':
            getCacheSize().then((size) => {
                event.ports[0].postMessage({ size });
            });
            break;

        default:
            console.log('[Service Worker] Unknown message type:', type);
    }
});

/**
 * Cache additional URLs
 */
async function cacheUrls(urls) {
    const cache = await caches.open(CACHE_NAME);

    for (const url of urls) {
        try {
            await cache.add(url);
            console.log('[Service Worker] Cached:', url);
        } catch (error) {
            console.error('[Service Worker] Failed to cache:', url, error);
        }
    }
}

/**
 * Clear all caches
 */
async function clearCache() {
    const cacheNames = await caches.keys();

    await Promise.all(
        cacheNames.map((cacheName) => {
            console.log('[Service Worker] Deleting cache:', cacheName);
            return caches.delete(cacheName);
        })
    );

    console.log('[Service Worker] All caches cleared');
}

/**
 * Get total cache size
 */
async function getCacheSize() {
    if (!('storage' in navigator && 'estimate' in navigator.storage)) {
        return null;
    }

    const estimate = await navigator.storage.estimate();
    return {
        usage: estimate.usage,
        quota: estimate.quota,
        percentage: (estimate.usage / estimate.quota * 100).toFixed(2)
    };
}

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync:', event.tag);

    if (event.tag === 'sync-game-data') {
        event.waitUntil(syncGameData());
    }
});

/**
 * Sync game data when back online
 */
async function syncGameData() {
    // Get pending actions from IndexedDB or localStorage
    // This would integrate with your game state manager
    console.log('[Service Worker] Syncing game data...');

    try {
        // Example: sync character data
        // In real implementation, you'd get this from your storage
        const pendingData = {
            characters: [],
            achievements: [],
            statistics: []
        };

        // Send to server (if you have backend)
        // await fetch('/api/sync', {
        //     method: 'POST',
        //     body: JSON.stringify(pendingData)
        // });

        console.log('[Service Worker] Game data synced');

    } catch (error) {
        console.error('[Service Worker] Sync failed:', error);
        throw error; // Retry sync later
    }
}

/**
 * Push notification handler (for future features)
 */
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body || 'You have a new notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: data.data || {},
        actions: data.actions || []
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Sandlot Superstars', options)
    );
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});

console.log('[Service Worker] Script loaded', CACHE_VERSION);
