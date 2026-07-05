// Smart Hub Ultra - Service Worker
// Placed in public/ so Vite copies it to dist/ at /sw.js
// Uses a network-first strategy for HTML navigation and cache-first for assets.
// Cache-busting is handled by Vite's hashed filenames; we cache by URL match.

const CACHE_NAME = 'smarthubultra-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install: pre-cache only the shell (index.html + manifest)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Pre-cache failed', err))
  );
});

// Activate: clear old caches and claim clients immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - Navigation requests (HTML): network-first, fallback to cache
// - Same-origin assets (JS/CSS with hash): cache-first, then network
// - External requests (Firebase, CDN): network only, no caching
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and non-http(s) requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;

  // Skip cross-origin requests (Firebase APIs, CDNs, analytics)
  if (url.origin !== self.location.origin) return;

  // Navigation: network-first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match('/index.html') || caches.match('/'))
    );
    return;
  }

  // Hashed Vite assets (JS/CSS in /assets/): cache-first
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (!response || response.status !== 200) return response;
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        });
      })
    );
    return;
  }

  // All other same-origin requests: network-first
  event.respondWith(
    fetch(request)
      .then(response => {
        if (!response || response.status !== 200) return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
