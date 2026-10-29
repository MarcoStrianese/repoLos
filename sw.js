/* LOS · service worker
   Rende l'app installabile e la fa aprire anche con rete lenta.
   Strategia: rete prima, cache come riserva (così ogni pubblicazione su GitHub Pages arriva subito).
   I dati (Supabase) non passano mai da qui. Cambia VERSION a ogni rilascio. */
const VERSION = 'los-1.0.0';
const SHELL = ['./','index.html','css/app.css','manifest.webmanifest',
  'js/config.js','js/core.js','js/db.js','js/engines.js','js/parsers.js','js/v-today.js','js/v-work.js','js/v-fin.js','js/v-sport.js','js/v-diet.js','js/v-misc.js','js/main.js',
  'vendor/supabase.js','icons/icon-192.png','icons/icon-512.png','icons/favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
