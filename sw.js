
const CACHE_NAME = 'familylink-cache-v7';

// キャッシュするリソースのリスト
// GitHub Pagesでは ./ を使うことでリポジトリ名配下のルートを指す
const urlsToCache = [
  './',
  'index.html',
  'index.css',
  'manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // 1つでも失敗してもインストールが止まらないよう、個別にキャッシュを試みる
      return Promise.allSettled(
        urlsToCache.map(url => cache.add(url).catch(err => console.warn('Failed to cache:', url, err)))
      );
    })
  );
});

self.addEventListener('activate', event => {
  // 古いキャッシュを削除
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) {
          console.log('Deleting old cache:', key);
          return caches.delete(key);
        }
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // 外部API（Google API, Firebase, esm.sh）はキャッシュせずネットワーク優先
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      // キャッシュがあれば返す。なければネットワーク。
      return response || fetch(event.request).catch(() => {
        // オフラインかつキャッシュがない場合のフォールバック（任意）
      });
    })
  );
});
