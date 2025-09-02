/**
 * Blaze Intelligence OG Remaster - Service Worker
 * Championship Baseball PWA
 * Pattern Recognition Weaponized ⚾
 */

const CACHE_NAME = 'blaze-og-remaster-v1.0.0';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './championship-manifest.json',
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('🏆 Blaze Intelligence SW: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching championship resources');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Championship cache loaded');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('⚾ Blaze Intelligence SW: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('🚀 Championship PWA ready!');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache first
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('📂 Serving from cache:', event.request.url);
          return response;
        }
        
        console.log('🌐 Fetching from network:', event.request.url);
        return fetch(event.request).then((response) => {
          // Don't cache non-success responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone response for caching
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});

// Message event for communication
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⚡ Force activating new SW version');
    self.skipWaiting();
  }
});

console.log('⚾ Blaze Intelligence OG Remaster SW loaded - Pattern Recognition Weaponized!');
