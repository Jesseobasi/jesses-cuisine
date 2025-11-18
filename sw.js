const CACHE_NAME = 'jesse-cuisines-v2';
const urlsToCache = [
  '/', 
  '/index.html',
  '/menu.html',
  '/cart.html',
  '/faq.html',
  '/catering.html',
  '/meal-of-week.html',
  '/style.css',
  '/cart.js',
  '/manifest.json',
  // You may want to manually list all image files here for best offline coverage.
  '/images/background.mp4', 
  '/images/pic.jpg',
  '/images/mealofweek.jpg'
];

self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Return cached data
        }
        return fetch(event.request); // Fetch from network
      })
  );
});

self.addEventListener('activate', event => {
  // Clean up old caches
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});