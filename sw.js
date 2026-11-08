'use strict';
const CACHE_NAME = 'trust-healthtech-mls-prep-v2';
const CACHE_PREFIX = 'trust-healthtech-';
const OFFLINE_FALLBACK = '/';

function safeToCache(request, response) {
  if (!response || response.status !== 200 || response.type !== 'basic' || response.redirected) return false;
  if (request.method !== 'GET' || request.headers.has('authorization')) return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.search) return false;
  if (/^\/(api|auth|upload)(\/|$)/i.test(url.pathname)) return false;
  if (response.headers.has('set-cookie')) return false;
  const cc = response.headers.get('cache-control') || '';
  if (/private|no-store/i.test(cc)) return false;
  return ['document','script','style','image','font'].includes(request.destination);
}

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(names => Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name))))
    .then(() => self.clients.claim()));
});

self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let data = {};
    try { data = event.data ? event.data.json() : {}; }
    catch { data = { body: event.data ? event.data.text() : 'You have a new THT update.' }; }
    const title = String(data.title || 'TRUST HEALTH TECH | MLS PREP').slice(0, 90);
    const body = String(data.body || 'There is a new update in THT MLS Prep.').slice(0, 220);
    const target = typeof data.url === 'string' && data.url.startsWith('/') && !data.url.startsWith('//') ? data.url : '/';
    await self.registration.showNotification(title, {
      body, icon: '/icon-192.png', badge: '/icon-192.png',
      tag: String(data.tag || 'tht-update').slice(0, 80), renotify: false, data: { url: target }
    });
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification.data && event.notification.data.url;
  const url = new URL(typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') ? target : '/', self.location.origin).href;
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

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (safeToCache(request, response)) {
      const copy = response.clone();
      await caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const fallback = await caches.match(OFFLINE_FALLBACK);
      if (fallback) return fallback;
    }
    return new Response('You are offline and this page or resource is not available in the saved cache. Reconnect and try again.', {
      status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || request.method !== 'GET') return;
  if (/^\/(api|auth|upload)(\/|$)/i.test(url.pathname) || request.headers.has('authorization')) return;
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }
  if (!['script','style','image','font'].includes(request.destination)) return;
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    return networkFirst(request);
  })());
});
