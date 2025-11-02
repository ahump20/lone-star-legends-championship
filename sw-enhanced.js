/**
 * Enhanced Service Worker for Blaze Intelligence
 * Features: Cache versioning, activation cleanup, network-first for APIs
 *
 * To use: Rename this to sw.js or update sw.js with this code
 */

const CACHE_VERSION = 'v2';
const CACHE_NAME = `blaze-intelligence-${CACHE_VERSION}`;
const PRECACHE_URLS = [
  '/',
  '/css/blaze.css',
  '/apps/og-remaster/index.html',
  '/games/index.html',
  '/games/bbp-web/index.html',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700;800&display=swap'
];

const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;
const GAME_ASSETS_CACHE = `game-assets-${CACHE_VERSION}`;

// Cache strategies
const CACHE_STRATEGIES = {
  cacheFirst: 'cache-first',
  networkFirst: 'network-first',
  cacheOnly: 'cache-only',
  networkOnly: 'network-only',
  staleWhileRevalidate: 'stale-while-revalidate'
};

// Route matching patterns
const ROUTE_PATTERNS = {
  api: /\/api\//,
  images: /\.(png|jpg|jpeg|svg|gif|webp|avif)$/,
  gameAssets: /\/(assets|sprites|audio)\//,
  fonts: /\.(woff|woff2|ttf|otf)$/,
  scripts: /\.(js|ts)$/,
  styles: /\.css$/
};

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching critical assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        // Force activation immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Precaching failed:', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old versions
            if (cacheName !== CACHE_NAME &&
                cacheName !== RUNTIME_CACHE &&
                cacheName !== IMAGE_CACHE &&
                cacheName !== GAME_ASSETS_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - smart caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (except fonts and CDN assets)
  if (url.origin !== location.origin && !isCDNAsset(url)) {
    return;
  }

  // Apply strategy based on request type
  let strategy = getStrategy(request);

  event.respondWith(
    handleRequest(request, strategy)
      .catch((error) => {
        console.error('[SW] Fetch failed:', error);

        // Return offline fallback if available
        if (request.destination === 'document') {
          return caches.match('/offline.html');
        }

        // Generic error response
        return new Response('Network error', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      })
  );
});

// Determine caching strategy for request
function getStrategy(request) {
  const url = new URL(request.url);

  // API requests: Network-first (fresh data priority)
  if (ROUTE_PATTERNS.api.test(url.pathname)) {
    return CACHE_STRATEGIES.networkFirst;
  }

  // Images: Cache-first (static assets)
  if (ROUTE_PATTERNS.images.test(url.pathname)) {
    return CACHE_STRATEGIES.cacheFirst;
  }

  // Game assets: Cache-first
  if (ROUTE_PATTERNS.gameAssets.test(url.pathname)) {
    return CACHE_STRATEGIES.cacheFirst;
  }

  // Fonts: Cache-first (rarely change)
  if (ROUTE_PATTERNS.fonts.test(url.pathname)) {
    return CACHE_STRATEGIES.cacheFirst;
  }

  // Scripts/CSS: Stale-while-revalidate (balance freshness and speed)
  if (ROUTE_PATTERNS.scripts.test(url.pathname) ||
      ROUTE_PATTERNS.styles.test(url.pathname)) {
    return CACHE_STRATEGIES.staleWhileRevalidate;
  }

  // Default: Network-first
  return CACHE_STRATEGIES.networkFirst;
}

// Handle request with specified strategy
async function handleRequest(request, strategy) {
  const cacheName = getCacheName(request);

  switch (strategy) {
    case CACHE_STRATEGIES.cacheFirst:
      return cacheFirst(request, cacheName);

    case CACHE_STRATEGIES.networkFirst:
      return networkFirst(request, cacheName);

    case CACHE_STRATEGIES.staleWhileRevalidate:
      return staleWhileRevalidate(request, cacheName);

    case CACHE_STRATEGIES.cacheOnly:
      return caches.match(request);

    case CACHE_STRATEGIES.networkOnly:
      return fetch(request);

    default:
      return networkFirst(request, cacheName);
  }
}

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);

  // Cache successful responses
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }

  return response;
}

// Network-first strategy
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(cacheName);
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

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Fetch in background to update cache
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });

  // Return cached version immediately, or wait for network
  return cached || fetchPromise;
}

// Determine appropriate cache name for request
function getCacheName(request) {
  const url = new URL(request.url);

  if (ROUTE_PATTERNS.images.test(url.pathname)) {
    return IMAGE_CACHE;
  }

  if (ROUTE_PATTERNS.gameAssets.test(url.pathname)) {
    return GAME_ASSETS_CACHE;
  }

  return RUNTIME_CACHE;
}

// Check if URL is from a trusted CDN
function isCDNAsset(url) {
  const trustedCDNs = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdn.jsdelivr.net',
    'cdnjs.cloudflare.com'
  ];

  return trustedCDNs.some(cdn => url.hostname.includes(cdn));
}

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_CLEAR') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('[SW] Service Worker script loaded');
