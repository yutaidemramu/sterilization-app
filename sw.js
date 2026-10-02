const CACHE_NAME = 'op-sterilization-v1';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './icon.png',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js',
    'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
];

// 初回アクセス時にファイルをすべてキャッシュ（保存）する
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

// オフライン時は保存したキャッシュからデータを返す
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});