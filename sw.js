// Service Worker — Verbo Diário
// Cache-first para recursos estáticos e reflexões; Network-first com fallback para API litúrgica

const CACHE_VERSION = 'verbo-diario-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './favicon.svg',
  './favicon.ico',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './data/reflexoes/01.json',
  './data/reflexoes/02.json',
  './data/reflexoes/03.json',
  './data/reflexoes/04.json',
  './data/reflexoes/05.json',
  './data/reflexoes/06.json',
  './data/reflexoes/07.json',
  './data/reflexoes/08.json',
  './data/reflexoes/09.json',
  './data/reflexoes/10.json',
  './data/reflexoes/11.json',
  './data/reflexoes/12.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== RUNTIME_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Não intercepta requisições não-GET
  if (request.method !== 'GET') return;

  // Requisições à API litúrgica: Network-first com cache de fallback
  if (url.hostname === 'liturgia.up.railway.app') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return new Response(JSON.stringify({ error: 'offline' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            });
          });
        })
    );
    return;
  }

  // Requisições de navegação (HTML com ou sem query params como ?data=...)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match('./index.html') || caches.match('./');
        })
    );
    return;
  }

  // Recursos estáticos e fontes: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
