// Basit önbellek: uygulama kabuğu çevrimdışı açılsın.
const CACHE = 'tavla-v1';
self.addEventListener('install', (e) => {
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
  ));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(e.request);
      const network = fetch(e.request).then((res) => {
        if (res && res.status === 200 && e.request.url.startsWith(self.location.origin)) {
          cache.put(e.request, res.clone());
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
