const CACHE = 'defatfit-v6-alimentacion';
const ASSETS = [
  '/',
  '/index.html',
  '/css/base.css',
  '/css/layout.css',
  '/css/components.css',
  '/js/supabase.js',
  '/js/utils.js',
  '/js/data.js',
  '/js/tips.js',
  '/js/router.js',
  '/js/auth.js',
  '/screens/onboarding.js',
  '/screens/inicio.js',
  '/screens/alimentacion.js',
  '/screens/rutina.js',
  '/screens/calendario.js',
  '/screens/perfil-fisico.js',
  '/screens/recomendar.js',
  '/screens/perfil-usuario.js',
  '/screens/admin.js',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('supabase.co') || e.request.url.includes('fonts.googleapis')) {
    return; // No cachear llamadas a Supabase ni fuentes
  }
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
