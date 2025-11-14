// service-worker.js — basic cache for shell + offline fallback
const CACHE_NAME = "ukss-shell-v1";
const ASSETS = [
  "/", // index root
  "/index.html",
  "/style.css",
  // add other important assets you want cached, e.g. voting.html, registration.html, images, offline-queue.js, etc
  "/offline-queue.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(()=>{/* ignore missing files */});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (e) => {
  // network-first for API calls (firebase) by default; static assets respond cache-first
  const req = e.request;
  const url = new URL(req.url);

  // simple heuristic: if request is navigation or html -> network first fallback cache
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(req).catch(()=> caches.match('/index.html'))
    );
    return;
  }

  // for other GETs: respond cache-first
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      // optionally cache fetched asset
      return caches.open(CACHE_NAME).then(cache => {
        cache.put(req, res.clone());
        return res;
      });
    }).catch(()=> cached))
  );
});
