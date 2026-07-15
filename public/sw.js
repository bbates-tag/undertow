// UNDERTOW service worker — cache-first for same-origin assets so the game
// keeps working fully offline after the first load. Bump VERSION on deploys.
const VERSION = 'undertow-v23';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(e.request);
      if (cached) {
        // refresh html in the background so updates eventually land
        if (e.request.mode === 'navigate') {
          fetch(e.request).then((res) => res.ok && cache.put(e.request, res)).catch(() => {});
        }
        return cached;
      }
      try {
        const res = await fetch(e.request);
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      } catch (err) {
        if (e.request.mode === 'navigate') {
          const fallback = await cache.match('./index.html');
          if (fallback) return fallback;
        }
        throw err;
      }
    }),
  );
});
