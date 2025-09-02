const CACHE_NAME = 'blaze-og-remaster-championship-v3.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/main.js',
  '/css/brand.css',
  '/manifest.json',
  '/championship-manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
