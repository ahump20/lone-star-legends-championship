/**
 * Blaze Intelligence - Service Worker
 * Progressive Web App functionality for offline play
 */

const CACHE_NAME = 'blaze-legends-v1.0.0';
const STATIC_CACHE = 'blaze-static-v1.0.0';
const DYNAMIC_CACHE = 'blaze-dynamic-v1.0.0';

// Files to cache for offline play
const staticAssets = [
  '/',
  '/blaze-branded-game.html',
  '/index.html',
  '/lone-star-legends-game.html',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.socket.io/4.5.4/socket.io.min.js'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(staticAssets);
      })
      .catch(err => console.error('[Service Worker] Cache install failed:', err))
  );
  
  // Force immediate activation
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip WebSocket requests
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }
  
  // Network-first strategy for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone and cache the response
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then(cache => cache.put(request, responseClone));
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }
  
  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Update cache in background
          fetchAndCache(request);
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(request).then(response => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(request, responseClone));
          }
          return response;
        });
      })
      .catch(() => {
        // Offline fallback page
        if (request.headers.get('accept').includes('text/html')) {
          return caches.match('/offline.html');
        }
      })
  );
});

// Background sync for score updates
self.addEventListener('sync', event => {
  if (event.tag === 'sync-scores') {
    event.waitUntil(syncScores());
  }
});

// Push notifications for game invites
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New game invite!',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'accept',
        title: 'Join Game',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'decline',
        title: 'Decline',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Blaze Legends', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'accept') {
    // Open game in multiplayer mode
    event.waitUntil(
      clients.openWindow('/blaze-branded-game.html?mode=multiplayer')
    );
  }
});

// Helper function to fetch and cache
async function fetchAndCache(request) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);
  }
}

// Sync scores with server
async function syncScores() {
  try {
    // Get cached scores from IndexedDB
    const scores = await getLocalScores();
    
    // Send to server
    const response = await fetch('/api/sync-scores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(scores)
    });
    
    if (response.ok) {
      console.log('[Service Worker] Scores synced successfully');
      await clearLocalScores();
    }
  } catch (error) {
    console.error('[Service Worker] Score sync failed:', error);
  }
}

// Message handler for client communication
self.addEventListener('message', event => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_GAME_DATA') {
    cacheGameData(event.data.data);
  }
});

// Cache game data for offline play
async function cacheGameData(data) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put('/game-data', response);
    console.log('[Service Worker] Game data cached');
  } catch (error) {
    console.error('[Service Worker] Failed to cache game data:', error);
  }
}

// Placeholder functions for IndexedDB operations
async function getLocalScores() {
  // Implementation would retrieve scores from IndexedDB
  return [];
}

async function clearLocalScores() {
  // Implementation would clear scores from IndexedDB
  return true;
}