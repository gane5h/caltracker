// Offline support: serve from cache, refresh the cache in the background
// (stale-while-revalidate), so a new version shows up on the next launch.
const CACHE = 'chain-v3';
const SHELL = [
  './',
  'index.html',
  'css/app.css',
  'js/app.js',
  'js/data.js',
  'js/dates.js',
  'js/store.js',
  'js/streaks.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'fonts/LilitaOne-Regular.ttf',
  'fonts/Nunito-ExtraBold.ttf',
  'fonts/Nunito-Black.ttf',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(event.request, { ignoreSearch: true });
      const network = fetch(event.request)
        .then((res) => {
          if (res.ok) cache.put(event.request, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
