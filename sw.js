/* SUMMA - Service Worker v23.1 
 * Diseñado por Ing. John A. Skinner S.
 */

const CACHE_NAME = 'summa-v23.1.0';
const APP_VERSION = '23.1.0';
const CACHE_ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/script.js',
    './js/db.js',
    './js/wakelock.js',
    './js/statemachine.js',
    './icon.png',
    './manifest.json'
];

// ===========================
// INSTALACIÓN
// ===========================
self.addEventListener('install', (event) => {
    console.log('[SW] 📦 Instalando Service Worker v22.0...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] ✅ Cache abierto');
                return cache.addAll(CACHE_ASSETS);
            })
            .then(() => {
                console.log('[SW] ✅ Todos los archivos cacheados');
                return self.skipWaiting(); // Activar inmediatamente
            })
            .catch((err) => {
                console.error('[SW] ❌ Error cacheando archivos:', err);
            })
    );
});

// ===========================
// ACTIVACIÓN
// ===========================
self.addEventListener('activate', (event) => {
    console.log('[SW] 🔄 Activando Service Worker v22.0...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cache) => {
                        if (cache !== CACHE_NAME) {
                            console.log('[SW] 🗑️ Eliminando cache antiguo:', cache);
                            return caches.delete(cache);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] ✅ Service Worker activado');
                return self.clients.claim(); // Tomar control inmediato
            })
    );
});

// ===========================
// FETCH - ESTRATEGIA CACHE-FIRST CON NETWORK FALLBACK
// ===========================
self.addEventListener('fetch', (event) => {
    // Ignorar requests que no sean GET
    if (event.request.method !== 'GET') return;
    
    // Ignorar requests a dominios externos (CDN, APIs)
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // console.log('[SW] 📦 Sirviendo desde cache:', event.request.url);
                    return cachedResponse;
                }
                
                // Si no está en cache, hacer fetch a la red
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Cachear la respuesta para futuras requests
                        if (networkResponse && networkResponse.status === 200) {
                            return caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, networkResponse.clone());
                                    return networkResponse;
                                });
                        }
                        return networkResponse;
                    })
                    .catch((err) => {
                        console.error('[SW] ❌ Error en fetch:', err);
                        // Aquí podrías retornar una página offline personalizada
                        return new Response('Offline - No se pudo cargar el recurso', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// ===========================
// MENSAJES DESDE LA APP
// ===========================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[SW] ⏭️ Skip waiting solicitado');
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        console.log('[SW] 🗑️ Limpiando cache...');
        event.waitUntil(
            caches.delete(CACHE_NAME).then(() => {
                console.log('[SW] ✅ Cache limpiado');
            })
        );
    }
});

console.log('[SW] ✅ Service Worker cargado');
