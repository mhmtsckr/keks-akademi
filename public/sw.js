const CACHE='keks-static-v1';
const STATIC_PATHS=['/icon.svg'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC_PATHS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname.startsWith('/api/'))return;
  const isStatic=url.pathname.startsWith('/_next/static/')||STATIC_PATHS.includes(url.pathname);
  if(!isStatic)return;
  event.respondWith(
    caches.match(request).then(hit=>hit||fetch(request).then(response=>{
      if(!response||response.status!==200)return response;
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(request,copy));
      return response;
    }))
  );
});
