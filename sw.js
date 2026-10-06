const CACHE_NAME = 'op-sterilization-v7'; // v7にアップデート
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
            return Promise.all(
                urlsToCache.map(url => {
                    return fetch(url).then(response => {
                        if (response.ok) {
                            return cache.put(url, response);
                        }
                    }).catch(error => {
                        console.log('キャッシュ失敗:', url);
                    });
                })
            );
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
            );
        })
    );
});

self.addEventListener('fetch', event => {
    // 💡 医療現場のオフライン運用に特化した「キャッシュ優先（完全オフライン）」戦略
    event.respondWith(
        // ignoreSearch: true で、URLの後ろにつく余計なシステム記号を無視して確実にヒットさせる
        caches.match(event.request, { ignoreSearch: true }).then(response => {
            // キャッシュにあれば、ネットに繋がっていてもいなくても即座にそれを返す
            if (response) {
                return response;
            }
            
            // 画面の要求であれば、強制的に index.html を返す
            if (event.request.mode === 'navigate' || event.request.url.endsWith('/')) {
                return caches.match('./index.html', { ignoreSearch: true }).then(htmlRes => {
                    return htmlRes || fetch(event.request);
                });
            }

            // それ以外（未知の通信）はネットワークに頼る
            return fetch(event.request);
        }).catch(() => {
            // ネットワークも落ちている場合（完全オフライン）の最終手段
            if (event.request.mode === 'navigate' || event.request.url.endsWith('/')) {
                return caches.match('./index.html', { ignoreSearch: true });
            }
        })
    );
});
