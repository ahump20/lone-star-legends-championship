/**
 * Service Worker for OG Remaster PWA
 * Enables offline play and asset caching
 */

const CACHE_NAME = 'blaze-og-remaster-v1.0.0';
const STATIC_CACHE = 'blaze-og-static-v1';

// Assets to cache for offline play
const CORE_ASSETS = [
  './',
  './index.html',
  './main.ts',
  './style.css',
  './brand.css',
  './typography.css',
  './og.config.ts',
  './theme.ts'
];

const OG_ASSETS = [
  './assets/sprites/manifest.json',
  './assets/audio/manifest.json',
  './content/og/characters.json',
  './renderer/CanvasRenderer.ts',
  './ui/HUD.ts',
  './input.ts',
  './audio/AudioEngine.ts',
  './modes/QuickPlay.ts',
  './modes/SandlotMode.ts',
  './modes/SeasonLite.ts'
];

// Audio assets (placeholder paths)
const AUDIO_ASSETS = [
  './assets/audio/sfx/bat_ping.wav',
  './assets/audio/sfx/glove_thump.wav',
  './assets/audio/sfx/crowd_cheer.wav',
  './assets/audio/sfx/whistle_play.wav',
  './assets/audio/commentary/nice_hit_01.ogg',
  './assets/audio/commentary/big_rip_01.ogg',
  './assets/audio/music/backyard_dreams.ogg'
];

const ALL_CACHE_ASSETS = [...CORE_ASSETS, ...OG_ASSETS, ...AUDIO_ASSETS];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('🏗️ Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              console.log('🧹 Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip external requests (focus on same-origin)
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('📦 Service Worker: Serving from cache', event.request.url);
          return cachedResponse;
        }

        // Not in cache, try network
        return fetch(event.request)
          .then((networkResponse) => {
            // Don't cache if not a successful response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response (can only be consumed once)
            const responseClone = networkResponse.clone();
            
            // Cache successful responses
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseClone);
              });

            return networkResponse;
          })
          .catch((error) => {
            console.log('🔌 Service Worker: Network failed, serving offline fallback', error);
            
            // Serve fallbacks for key files
            if (event.request.url.includes('.html')) {
              return caches.match('./index.html');
            }
            
            // For other assets, return a generic error response
            return new Response('Offline - Asset not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_ASSETS') {
    console.log('📦 Service Worker: Caching additional assets');
    
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(event.data.assets || []);
      })
      .then(() => {
        event.ports[0].postMessage({ success: true });
      })
      .catch((error) => {
        console.error('❌ Service Worker: Failed to cache assets', error);
        event.ports[0].postMessage({ success: false, error: error.message });
      });
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    caches.keys().then((cacheNames) => {
      const status = {
        caches: cacheNames,
        coreAssets: CORE_ASSETS.length,
        totalAssets: ALL_CACHE_ASSETS.length
      };
      event.ports[0].postMessage(status);
    });
  }
});

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Service Worker: Background sync triggered');
    
    event.waitUntil(
      // Pre-cache remaining assets when online
      caches.open(STATIC_CACHE)
        .then((cache) => {
          return cache.addAll(OG_ASSETS.concat(AUDIO_ASSETS));
        })
        .then(() => {
          console.log('✅ Service Worker: Background sync complete');
          
          // Notify main thread
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: 'BACKGROUND_SYNC_COMPLETE',
                timestamp: Date.now()
              });
            });
          });
        })
        .catch((error) => {
          console.error('❌ Service Worker: Background sync failed', error);
        })
    );
  }
});

// Periodic background sync for cache updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cache-update') {
    event.waitUntil(
      // Update cache with fresh assets
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.addAll(CORE_ASSETS);
        })
    );
  }
});

// Handle push notifications (for future features)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.body || 'New game available!',
    icon: './icons/icon-192x192.png',
    badge: './icons/badge-72x72.png',
    tag: 'blaze-og-notification',
    data: {
      url: data.url || './'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Blaze Intelligence', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || './';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then((clients) => {
        // Check if app is already open
        for (const client of clients) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if not already open
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

console.log('🏆 Blaze Intelligence OG Remaster Service Worker loaded!');