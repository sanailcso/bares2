/* Tiki Taka PWA service worker */
var CACHE = "tikitaka-v48";
var SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png", "./img/bg-default.png", "./img/bg-halloween.png", "./img/bg-navidad.png", "./img/brand-login.png", "./img/logo.png", "./img/sym-filler-1.webp", "./img/sym-filler-2.webp", "./img/sym-filler-3.webp", "./img/sym-filler-4.webp", "./img/sym-filler-5.webp", "./img/sym-jackpot.webp", "./img/sym-prize.webp"];
self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL).catch(function(){}); }));
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.map(function(k){ if(k!==CACHE) return caches.delete(k); })); }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  var url = new URL(req.url);
  // Solo gestionamos peticiones del propio origen (la app). Supabase y demas van directas a la red.
  if(url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(function(res){
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put(req, copy); });
      return res;
    }).catch(function(){
      return caches.match(req).then(function(hit){ return hit || caches.match("./index.html"); });
    })
  );
});
