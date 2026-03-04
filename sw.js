// Empire Essence - Service Worker
// Provides offline caching and performance optimization

const CACHE_NAME = 'empire-essence-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/img/frasco-30ml-blanco.jpg',
  '/img/frasco-30ml-esmerilado.jpg',
  '/img/frasco-50ml-cilindrico-negro.jpg',
  '/img/frasco-50ml-cilindrico-plateado.jpg',
  '/img/frasco-50ml-dorado-artdeco.jpg',
  '/img/frasco-50ml-rojo-laberinto.jpg',
  '/img/frasco-50ml-rojo-llama.jpg',
  '/img/frasco-100ml-cilindrico-ambar.jpg',
  '/img/frasco-100ml-esferico-verde.jpg',
  '/img/frasco-100ml-cuadrado-verde.jpg',
  '/img/frasco-100ml-cristal-mono.jpg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((err) => {
        console.error('[SW] Cache failed:', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Return cached version if available
      if (cached) {
        // Fetch new version in background (stale-while-revalidate)
        fetch(event.request)
          .then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, response);
              });
            }
          })
          .catch(() => {});
        return cached;
      }

      // Otherwise fetch from network
      return fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response.ok && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return offline fallback for HTML requests
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503 });
        });
    })
  );
});

// Background sync for cart recovery
self.addEventListener('sync', (event) => {
  if (event.tag === 'cart-sync') {
    event.waitUntil(syncCart());
  }
});

async function syncCart() {
  // This would sync cart data with server if needed
  console.log('[SW] Syncing cart data');
}

// Push notifications support (for abandoned cart)
self.addEventListener('push', (event) => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/img/icon-192.png',
      badge: '/img/badge-72.png',
      tag: data.tag,
      requireInteraction: true,
      actions: [
        { action: 'view-cart', title: 'Ver carrito' },
        { action: 'dismiss', title: 'Cerrar' }
      ]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view-cart') {
    event.waitUntil(
      clients.openWindow('/?view=cart')
    );
  }
});
