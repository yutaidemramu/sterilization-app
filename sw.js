const CACHE_NAME = 'op-sterilization-v3'; // v3に変更して古い記憶をリセット
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js',
    'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js' // Excelのセル色を読み取る部品を追加！
];

// インストール時にキャッシュを保存（どれか1つ失敗しても他を道連れにしない強力な設定）
self.addEventListener('install', event => {
    self.skipWaiting(); // すぐに新しいバージョンを起動
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return Promise.all(
                urlsToCache.map(url => {
                    return fetch(url).then(response => {
                        if (!response.ok) throw new Error('Network error');
                        return cache.put(url, response);
                    }).catch(error => {
                        console.warn('ファイルの保存にスキップしました:', url, error);
                    });
                })
            );
        })
    );
});

// 古いキャッシュ（v1やv2）のお掃除
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

// オフラインの時は、保存してあるファイルを返す
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            // キャッシュにあればそれを返す、無ければ通信を試みる
            return response || fetch(event.request).catch(() => {
                // 通信もダメ（完全オフライン）で、画面を開こうとした場合は index.html を強制表示
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
