const CACHE_NAME = 'gatsi-comms-v4';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

function isStaticAsset(url) {
  return (
    /\.(js|css|png|jpe?g|gif|svg|webp|woff2?|ttf|ico)(\?.*)?$/i.test(url.pathname) ||
    url.pathname === '/manifest.json' ||
    url.pathname.startsWith('/icons/')
  );
}

// Network first: try the network, cache successful responses, fall back to cache when offline.
function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      if (response && response.ok && response.type === 'basic') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return response;
    })
    .catch(() => caches.match(request).then((cached) => cached || null));
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  // Never cache the service worker itself so updates always reach clients.
  if (url.pathname === '/sw.js') {
    event.respondWith(fetch(request));
    return;
  }

  // Writes are handled by the app (offline queue + /api/sync). Never intercept them.
  if (request.method !== 'GET') {
    event.respondWith(fetch(request).catch(() => new Response('Offline', { status: 503 })));
    return;
  }

  // Navigations: network first, fall back to the exact cached page, then to the cached home page.
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request).then(
        (response) =>
          response ||
          caches.match('/').then((home) => home || new Response('Offline', { status: 503 }))
      )
    );
    return;
  }

  // API reads (e.g. /api/branches): network first with cache fallback.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirst(request).then(
        (response) => response || new Response(JSON.stringify({ data: null, error: 'Offline' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // Static assets: cache first, then network, cache successes.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (response && response.ok && response.type === 'basic') {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => new Response('Offline', { status: 503 }));
      })
    );
    return;
  }

  // RSC payloads and anything else: network first with cache fallback for offline navigation.
  event.respondWith(
    networkFirst(request).then(
      (response) => response || new Response('', { status: 200, headers: { 'RSC': '1' } })
    )
  );
});
