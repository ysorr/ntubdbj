const CACHE_NAME = 'DBJ學術APP';
// 需要被快取的檔案列表
const URLS_TO_CACHE = [
  '/',
  'index.html', // 假設您的主頁是 index.html
  'school.html',
  'teacher.html',
  'content/main.css',
  'content/teacher.js',
  'content/keyboard.js',
  'icons/icon-512x512.png' // Logo 圖片
  // 您也可以將上面那張 Logo 下載到本地，例如 'images/logo.jpg'，然後在這裡引用
];

// 1. 安裝 Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// 2. 攔截網路請求 (快取優先)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果快取中有對應的資源，就直接回傳
        if (response) {
          return response;
        }
        // 否則，就發出網路請求
        return fetch(event.request);
      }
    )
  );
});

// 3. 清除舊的快取
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});