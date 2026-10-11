/* 정석사전 — 서비스워커
   HTML(index.html)은 network-first: 온라인이면 항상 최신 자동 반영, 오프라인이면 캐시.
   정적 파일(아이콘 등)은 cache-first. 정석 데이터는 index.html에 내장. */
const CACHE = 'joseki-v10';
const ASSETS = ['.', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const req = e.request, url = new URL(req.url);
  const isHTML = req.mode === 'navigate' || req.destination === 'document'
    || url.pathname === '/' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
  if (isHTML) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.status === 200) { const c = res.clone(); caches.open(CACHE).then((x) => x.put(req, c)); }
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res && res.status === 200 && res.type === 'basic') { const c = res.clone(); caches.open(CACHE).then((x) => x.put(req, c)); }
      return res;
    }).catch(() => caches.match('index.html')))
  );
});
