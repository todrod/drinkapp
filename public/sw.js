/**
 * Service worker for the installed web app.
 *
 * The app is already offline-capable — everything lives in localStorage and the
 * bundle — so the only job here is making sure the bundle itself is available
 * without a network. Asset filenames are content-hashed, which is what makes
 * cache-first safe: a new build produces new URLs rather than stale hits.
 */

const CACHE = 'shaker-v2';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .catch(() => {
        /* a missing shell entry must not block activation */
      })
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
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/index.html', copy));
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
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
    )
  );
});
