const CACHE_NAME = 'op-sterilization-v12'; // v12にアップデート
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './icon.png',
    'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css',
    'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js',
    'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return Promise.allSettled(
                urlsToCache.map(url => fetch(url).then(response => {
                    if (response.ok) return cache.put(url, response);
                }).catch(err => console.log('保存スキップ:', url)))
            );
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
            );
        })
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {
            if (cachedResponse) {
                fetch(event.request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
                    }
                }).catch(() => {});
                return cachedResponse;
            }
            return fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
                }
                return networkResponse;
            }).catch(() => {
                if (event.request.mode === 'navigate' || event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('./index.html', { ignoreSearch: true });
                }
            });
        })
    );
});
