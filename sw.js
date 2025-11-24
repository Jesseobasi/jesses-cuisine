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
  '/images/background.mp4',
  '/images/pic.jpg',
  '/images/mealofweek.jpg'
];

// INSTALL
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting(); // ✅ Forces new SW to activate immediately

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(urlsToCache);
    })
  );
});

// ACTIVATE
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    Promise.all([
      // ✅ Take control of all pages immediately
      self.clients.claim(),

      // ✅ Remove old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheWhitelist.includes(cacheName)) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// FETCH - Network first (prevents stale content)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
      .catch(() => caches.match(event.request))
  );
});
