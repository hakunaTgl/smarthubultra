self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('smarthubultra-v1').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/js/main.js',
        '/js/auth.js',
        '/js/dashboard.js',
        '/js/bots.js',
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
        '/js/utils.js'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
