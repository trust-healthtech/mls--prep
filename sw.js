const CACHE_NAME = 'trust-healthtech-blue-v1';

self.addEventListener('install', (event) => {
  // Activate the updated service worker as soon as installation completes.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Only handle requests from this website's own origin.
  if (requestUrl.origin !== self.location.origin) return;

  // Leave non-GET requests to the browser/network.
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful, complete HTTP responses for later offline use.
        if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
          const responseToCache = networkResponse.clone();
          event.waitUntil(
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(event.request, responseToCache))
              .catch((error) => console.warn('Service worker cache update failed:', error))
          );
        }
        return networkResponse;
      })
      .catch(() =>
        caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          // Return a clear offline response when this resource has never been cached.
          return new Response(
            'You are offline and this page or resource is not available in the saved cache. Reconnect to the internet and try again.',
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            }
          );
        })
      )
  );
});
