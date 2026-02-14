// Service Worker para PWA - Inspección 1131
// Versión 1.0.0

const CACHE_NAME = 'inspeccion-1131-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/firebase-config.js',
  '/manifest.json'
];

// Instalación
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Caché abierto');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('❌ Error al cachear:', error);
      })
  );
  self.skipWaiting();
});

// Activación
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch - Estrategia Network First con Fallback a Cache
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones que no sean HTTP/HTTPS
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Ignorar peticiones a Firebase y APIs externas
  if (event.request.url.includes('firebaseapp.com') ||
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('gstatic.com') ||
      event.request.url.includes('cdnjs.cloudflare.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, actualizar el caché
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar obtener del caché
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Si no está en caché, retornar página offline
            return caches.match('/index.html');
          });
      })
  );
});

// Sincronización en background
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-registros') {
    event.waitUntil(syncRegistros());
  }
});

async function syncRegistros() {
  console.log('🔄 Sincronizando registros...');
  // Aquí se implementaría la lógica de sincronización
  // Firebase Firestore ya maneja esto automáticamente
}

// Notificaciones Push (opcional)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Inspección 1131';
  const options = {
    body: data.body || 'Nueva actualización disponible',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
