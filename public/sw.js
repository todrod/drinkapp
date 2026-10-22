/**
 * Service worker for the installed web app.
 *
 * Postbuild supplies this release's bundle and assets. Precache them before
 * activation so the first installed launch can work offline. Personal bar data
 * stays in its own device storage and is never part of these caches.
 */

const CACHE = 'shaker-v4-install';
const BUILD_ASSETS = /* pwa:precache */ [];
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png', '/icons/apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // Keep the previous worker if this release cannot be cached completely.
      .then((cache) => cache.addAll([...SHELL, ...BUILD_ASSETS].map((url) => new Request(url, { cache: 'no-store' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: always go to the network so a redeploy is picked up, falling
  // back to the cached shell only when offline.
  //
  // `cache: 'no-store'` matters. A plain fetch() still consults the HTTP cache,
  // which served a stale index.html — and therefore the previous bundle — after
  // a deploy, leaving installed copies of the app showing the old version.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            event.waitUntil(caches.open(CACHE).then((c) => c.put('/index.html', copy)));
          }
          return res;
        })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
    );
    return;
  }

  // Hashed assets: cache-first, then populate.
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            event.waitUntil(caches.open(CACHE).then((c) => c.put(request, copy)));
          }
          return res;
        })
    )
  );
});
