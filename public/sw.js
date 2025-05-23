const CACHE_NAME = 'v1.2.1.235';
const ASSETS = [
  '/',
  '/index.html',
  '/sidebar.html',
  '/404.html',
  '/games/minesweeper.html',
  '/tools/Longer-Appearance-Srt.html',
  '/tools/qrcode.html',
  '/tools/Manhwa-Tracker.html',
  '/auth.css',
  '/styles.css',
  '/login.html',
  '/tools/manhwa.css',
  '/signup.html',
  '/scripts/auth.js',
  '/scripts/firebase-auth.js'
  // Add other essential assets here
];

// ... other code ...

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('Service Worker: Caching app shell');
        const assetsToCache = [];
        const problematicAsset = '/games/minesweeper.html'; // The one that redirects

        for (const asset of ASSETS) {
          if (asset === problematicAsset) {
            // For the redirecting asset, create a Request object allowing follow
            try {
              await cache.add(new Request(asset, { redirect: 'follow' }));
              console.log(`Successfully cached (with follow): ${asset}`);
            } catch (err) {
              console.error(`Failed to cache (with follow) ${asset}:`, err);
              throw err; // Re-throw to fail the install if critical
            }
          } else {
            // For other assets, add normally (though addAll is more efficient for bulk)
            // This part could still use cache.addAll for the non-problematic ones
            // For simplicity here, we'll add one by one, but it's less optimal.
            assetsToCache.push(asset);
          }
        }
        // Cache remaining assets that don't need special redirect handling
        if (assetsToCache.length > 0) {
          await cache.addAll(assetsToCache.filter(a => a !== problematicAsset));
        }
        // A more robust way if there are many non-problematic assets:
        // const nonProblematicAssets = ASSETS.filter(a => a !== problematicAsset);
        // await cache.addAll(nonProblematicAssets);
        // await cache.add(new Request(problematicAsset, { redirect: 'follow' }));

        // Or even better:
        // const addPromises = ASSETS.map(assetPath => {
        //   if (assetPath === problematicAsset) {
        //     return cache.add(new Request(assetPath, { redirect: 'follow' }));
        //   }
        //   // For regular assets, cache.add is implicitly used by cache.addAll
        //   // but if doing it individually:
        //   return cache.add(assetPath);
        // });
        // await Promise.all(addPromises);


      })
      .then(() => {
        console.log('Service Worker: App shell cached successfully');
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache app shell:', error);
      })
  );
});

// ... rest of your SW ...

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});