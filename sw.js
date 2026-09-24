const CACHE='fluency-os-v2.7.0';
const FILES=['./','index.html','styles.css','app.js','enhancements.js','cloud.js','config.js','fluency-v23.js','fluency-v23.css','saved-reviews.js','progress.js','workflow.js','secure-storage.js','manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(xs=>Promise.all(xs.filter(x=>x.startsWith('fluency-os-')&&x!==CACHE).map(x=>caches.delete(x))))));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)))}return r}).catch(()=>caches.match(e.request)))});
