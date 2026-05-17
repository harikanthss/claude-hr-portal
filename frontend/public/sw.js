const CACHE = 'grevya-v1';
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/','./index.html']))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.url.includes('/api/')) return;
  e.respondWith(caches.match(e.request).then(cached => { if(cached) return cached; return fetch(e.request).then(res => { if(res.status===200&&e.request.method==='GET'){const c=res.clone();caches.open(CACHE).then(ch=>ch.put(e.request,c));} return res; }).catch(()=>caches.match('/index.html')); }));
});
