// Network first for pages so the latest brief always shows when online;
// falls back to the last copy seen when offline. Audio is not cached.
// Pages skip the browser's HTTP cache too, so a new edition is never hidden behind a stale copy.
const CACHE = 'cyber-brief-v8';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/', '/manifest.webmanifest', '/icons/icon-192-v3.png'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin || req.url.endsWith('.mp3')) return;
  const isPage = req.mode === 'navigate' || req.url.endsWith('.html') || req.url.endsWith('/');
  const net = isPage ? fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(req);
  e.respondWith(net.then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req).then(r => r || caches.match('/'))));
});
