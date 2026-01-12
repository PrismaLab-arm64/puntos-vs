/* SUMMA - Service Worker v23.1.2
 * Diseñado por Ing. John A. Skinner S.
 * VERSIÓN SIMPLIFICADA - FUERZA ACTUALIZACIÓN
 */

const CACHE_NAME = 'summa-v23.1.2';
const APP_VERSION = '23.1.2';

// Forzar actualización inmediata
self.addEventListener('install', (event) => {
    console.log('[SW] 🚀 Instalando SUMMA Service Worker v23.1.2');
    self.skipWaiting(); // Activar inmediatamente sin esperar
});

self.addEventListener('activate', (event) => {
    console.log('[SW] ✅ Activando SUMMA Service Worker v23.1.2');
    event.waitUntil(
        // Eliminar TODOS los caches antiguos
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    console.log('[SW] 🗑️ Eliminando cache antiguo:', key);
                    return caches.delete(key);
                })
            );
        }).then(() => {
            console.log('[SW] ✅ Caches antiguos eliminados');
            // Tomar control inmediato de todas las páginas
            return self.clients.claim();
        })
    );
});

// Siempre ir a la red (sin cache por ahora)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Clonar la respuesta
                const responseClone = response.clone();
                
                // Cachear solo si es exitoso
                if (response.status === 200) {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                
                return response;
            })
            .catch(() => {
                // Si falla la red, intentar cache
                return caches.match(event.request);
            })
    );
});

console.log('[SW] ✅ SUMMA Service Worker v23.1.2 cargado');
