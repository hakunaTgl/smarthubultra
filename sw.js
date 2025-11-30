const CACHE_NAME = 'smarthubultra-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/manifest.json',
  '/js/main.js',
  '/js/auth.js',
  '/bots.html',
  '/dashboard.html',
  '/js/inspiration.js',
  '/js/builder.js',
  '/js/workshop.js',
  '/js/editor.js',
  '/js/playground.js',
  '/js/creators.js',
  '/js/collab.js',
  '/js/voice.js',
  '/js/analytics.js',
  '/js/account.js',
  '/js/manual.js',
  '/js/boss.js',
  '/js/holoGuide.js',
  '/js/arControl.js',
  '/js/behavioralDNA.js',
  '/js/predictiveTasks.js',
  '/js/notifications.js',
  '/js/utils.js',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return networkResponse;
        });
      })
  );
});
