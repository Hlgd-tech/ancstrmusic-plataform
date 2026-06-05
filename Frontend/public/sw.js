const CACHE_NAME = 'ancstr-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/icon.svg',
  '/manifest.json'
];

// Instalar el Service Worker y almacenar en caché los recursos estáticos esenciales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activar el Service Worker y limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia de Cache First cayendo de vuelta a Network para la dApp de música
self.addEventListener('fetch', (event) => {
  // Solo interceptar peticiones del mismo origen o peticiones HTTP/S básicas
  if (!event.request.url.startsWith(self.location.origin) && !event.request.url.startsWith('http')) {
    return;
  }

  // Evitar interceptar llamadas a APIs dinámicas de Solana o analíticas
  if (event.request.url.includes('/api/') || event.request.url.includes('analytics') || event.request.url.includes('rpc')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Almacenar en caché dinámicamente recursos estáticos nuevos del mismo origen
        if (response.status === 200 && event.request.url.startsWith(self.location.origin)) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        // Retornar la página de inicio si falla la red (offline fallback)
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
