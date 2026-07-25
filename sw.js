const CACHE='foco-os-v2';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',function(e){ self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS).catch(function(){});})); });
self.addEventListener('activate',function(e){ e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.map(function(k){if(k!==CACHE)return caches.delete(k);}));})); self.clients.claim(); });
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET') return;
  var u;
  try{ u=new URL(e.request.url); }catch(err){ return; }
  if(u.origin!==location.origin) return;  // CDNs/APIs (Firebase, OSRM, Nominatim) seguem direto pela rede
  var isDoc = e.request.mode==='navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('index.html');
  if(isDoc){
    // network-first: sempre a versão mais nova quando online; offline usa cache
    e.respondWith(fetch(e.request).then(function(resp){ var cp=resp.clone(); caches.open(CACHE).then(function(c){c.put(e.request,cp);}); return resp; }).catch(function(){ return caches.match(e.request).then(function(r){ return r||caches.match('./index.html'); }); }));
  } else {
    // cache-first para ícones/manifest/config
    e.respondWith(caches.match(e.request).then(function(r){ return r||fetch(e.request).then(function(resp){ var cp=resp.clone(); caches.open(CACHE).then(function(c){c.put(e.request,cp);}); return resp; }); }));
  }
});
