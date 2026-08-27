/* Abissal — cache para jogar offline depois da primeira visita. */
const VERSAO = 'abissal-v1';
const ESSENCIAIS = [
  './', './index.html', './manifest.webmanifest',
  './icones/icone-192.png', './icones/icone-512.png',
  './icones/icone-maskable-512.png', './icones/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSAO)
      .then(c => Promise.allSettled(ESSENCIAIS.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Navegação: rede primeiro, para uma versão nova chegar assim que houver;
  // cai para o cache quando não há conexão.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(r => {
          const copia = r.clone();
          caches.open(VERSAO).then(c => c.put('./index.html', copia)).catch(() => {});
          return r;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // Demais recursos (ícones, fontes): serve do cache e revalida em segundo plano.
  e.respondWith(
    caches.match(req).then(guardado => {
      const daRede = fetch(req).then(r => {
        if (r && (r.ok || r.type === 'opaque')) {
          const copia = r.clone();
          caches.open(VERSAO).then(c => c.put(req, copia)).catch(() => {});
        }
        return r;
      }).catch(() => guardado);
      return guardado || daRede;
    })
  );
});
