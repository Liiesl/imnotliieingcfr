const CACHE_NAME = 'v1';
const ASSETS = [
  '/',
  '/index.html',
  '/sidebar.html',
  '/404.html',
  '/games/minesweeper.html',
  '/tools/Longer-Appearance.html',
  '/tools/qrcode.html',
  '/tools/Manhwa-Tracker.html',
  '/auth.css',
  '/styles.css',
  '/login.html',
  '/manhwa.css',
  '/signup.html',
  '/scripts/auth.js',
  'scripts/firebase-auth.js'
  // Add other essential assets here
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});