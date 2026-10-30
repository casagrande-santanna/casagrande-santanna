const CACHE = 'casagrande-v4';

const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  // Um arquivo que falhe não impede a instalação (nem o push)
  event.waitUntil(
    caches.open(CACHE).then(cache => Promise.all(
      ASSETS.map(url => cache.add(url).catch(() => {}))
    ))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Sempre busca a versão mais nova; o cache só é usado sem internet
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.match(event.request);
    })
  );
});

// Notificação push (chega mesmo com o app fechado)
self.addEventListener('push', event => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { texto: event.data ? event.data.text() : '' }; }
  event.waitUntil(
    self.registration.showNotification(d.titulo || "Casa Grande de Sant'Anna", {
      body: d.texto || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: d.tag || undefined,
      renotify: !!d.tag,
      data: { tela: d.tela || '', ref: d.ref || '' }
    })
  );
});

// Toque na notificação: abre o app na tela certa
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const dados = event.notification.data || {};
  const url = '/?tela=' + encodeURIComponent(dados.tela || '') + '&ref=' + encodeURIComponent(dados.ref || '');
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(lista => {
      for (const c of lista) {
        if ('focus' in c) {
          c.postMessage({ tipo: 'abrir-tela', tela: dados.tela, ref: dados.ref });
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
