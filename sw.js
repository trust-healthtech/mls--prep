'use strict';

/*
 * TRUST HEALTH TECH — MLS PREP
 * Service Worker
 *
 * Purpose:
 * - Safe PWA caching
 * - Offline navigation fallback
 * - Versioned cache management
 * - Avoid caching API, AI, upload and sensitive responses
 *
 * IMPORTANT:
 * This service worker does not implement PDF uploads.
 * AI upload processing will be handled separately.
 */

const SW_VERSION = 'v2';
const CACHE_PREFIX = 'trust-healthtech-';
const CACHE_NAME = `${CACHE_PREFIX}mls-prep-${SW_VERSION}`;
const OFFLINE_FALLBACK = '/';

/*
 * Only cache safe same-origin GET requests.
 */
function isCacheableRequest(request, url) {
  if (request.method !== 'GET') return false;
  if (url.origin !== self.location.origin) return false;

  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/upload/')
  ) {
    return false;
  }

  // Avoid caching URLs with query parameters.
  if (url.search) return false;

  // Avoid caching requests with authorization credentials.
  if (request.headers.has('authorization')) return false;

  const allowedDestinations = [
    'document',
    'script',
    'style',
    'image',
    'font'
  ];

  return allowedDestinations.includes(request.destination);
}

/*
 * Avoid caching responses marked private or no-store.
 */
function isSafeResponse(response) {
  if (!response) return false;
  if (response.status !== 200) return false;
  if (response.type !== 'basic') return false;
  if (response.redirected) return false;
  if (response.headers.has('set-cookie')) return false;

  const cacheControl =
    response.headers.get('cache-control') || '';

  const directives = cacheControl
    .toLowerCase()
    .split(',')
    .map(value => value.trim());

  if (
    directives.some(value =>
      value === 'no-store' ||
      value === 'private'
    )
  ) {
    return false;
  }

  return true;
}

/*
 * INSTALL
 */
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

/*
 * ACTIVATE
 *
 * Delete only older caches belonging to this app prefix.
 */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(name =>
              name.startsWith(CACHE_PREFIX) &&
              name !== CACHE_NAME
            )
            .map(name => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

/*
 * NETWORK-FIRST NAVIGATION
 */
async function handleNavigation(request) {
  try {
    const response = await fetch(request);

    if (isSafeResponse(response)) {
      const cache = await caches.open(CACHE_NAME);

      await cache.put(request, response.clone())
        .catch(error => {
          console.warn(
            'Navigation cache update failed:',
            error
          );
        });
    }

    return response;
  } catch (error) {
    const cachedPage = await caches.match(request);

    if (cachedPage) {
      return cachedPage;
    }

    const offlinePage = await caches.match(OFFLINE_FALLBACK);

    if (offlinePage) {
      return offlinePage;
    }

    return new Response(
      'You are offline. Reconnect to the internet and try again.',
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        }
      }
    );
  }
}

/*
 * CACHE-FIRST STATIC ASSETS
 */
async function handleStaticAsset(request) {
  const cached = await caches.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);

  if (isSafeResponse(response)) {
    const cache = await caches.open(CACHE_NAME);

    await cache.put(request, response.clone())
      .catch(error => {
        console.warn(
          'Static asset cache update failed:',
          error
        );
      });
  }

  return response;
}

/*
 * FETCH
 */
self.addEventListener('fetch', event => {
  const request = event.request;
  let url;

  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Ignore other origins.
  if (url.origin !== self.location.origin) {
    return;
  }

  // Never intercept non-GET requests.
  if (request.method !== 'GET') {
    return;
  }

  // Do not cache API, AI, authentication or upload endpoints.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/upload/')
  ) {
    return;
  }

  // Navigation requests.
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Approved static resource types only.
  if (!isCacheableRequest(request, url)) {
    return;
  }

  event.respondWith(
    handleStaticAsset(request)
      .catch(() =>
        new Response(
          'This resource is unavailable offline. Reconnect and try again.',
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: {
              'Content-Type': 'text/plain; charset=utf-8'
            }
          }
        )
      )
  );
});
