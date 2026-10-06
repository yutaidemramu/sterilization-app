const CACHE_NAME = 'op-sterilization-v6'; // v6で古い記憶を強制リセット
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
    self.skipWaiting(); // インストール後、すぐに最新版に切り替える
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            // エラーが起きても無視して、取得できるものだけ確実に保存する
            return Promise.allSettled(
                urlsToCache.map(url => cache.add(url).catch(err => console.log('保存スキップ:', url)))
            );
        })
    );
});

self.addEventListener('activate', event => {
    self.clients.claim();
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
            );
        })
    );
});

// ネットワークファースト（通信できれば最新を、ダメなら保存したものを返す）
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // ネットに繋がっていれば最新のデータを保存しつつ返す
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            })
            .catch(() => {
                // 完全にオフラインの場合は、保存しておいたデータを返す
                return caches.match(event.request).then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // もし画面そのものを開こうとした場合は強制的に index.html を返す
                    if (event.request.mode === 'navigate' || event.request.headers.get('accept').includes('text/html')) {
                        return caches.match('./index.html') || caches.match('./');
                    }
                });
            })
    );
});
