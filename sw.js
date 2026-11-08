const CACHE_NAME = 'trust-healthtech-blue-v2';

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

// Background Web Push: persistent notifications work after the page is closed.
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let data = {};
    try { data = event.data ? event.data.json() : {}; }
    catch { data = { body: event.data ? event.data.text() : 'You have a new THT update.' }; }

    const title = String(data.title || 'TRUST HEALTH TECH | MLS PREP').slice(0, 90);
    const body = String(data.body || 'There is a new update in THT MLS Prep.').slice(0, 220);
    const target = typeof data.url === 'string' && data.url.startsWith('/') && !data.url.startsWith('//')
      ? data.url : '/';

    await self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: String(data.tag || 'tht-update').slice(0, 80),
      renotify: false,
      data: { url: target }
    });
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification.data && event.notification.data.url;
  const url = new URL(typeof target === 'string' && target.startsWith('/') ? target : '/', self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if ('focus' in client) {
        await client.focus();
        if ('navigate' in client) await client.navigate(url);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin || event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
          const copy = networkResponse.clone();
          event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {}));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request).then(cached => cached || new Response(
        'You are offline and this page or resource is not available in the saved cache. Reconnect and try again.',
        { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      )))
  );
});
