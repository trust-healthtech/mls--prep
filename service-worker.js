const CACHE_NAME = 'trust-healthtech-blue-v1';

// Install Event: Forces immediate system activation
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate Event: Automatically clears outdated web caches on deployment update
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-First Strategy with Automated Background Storage Caching
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // When online, dynamically update the background cache storage array
        if (networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // When offline, immediately execute files directly out of mobile device storage
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response('Offline system node data unavailable.', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});
