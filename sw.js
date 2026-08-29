// Lápide do service worker da versão anterior (jogo em canvas). Quem já
// visitou o site tem aquele worker instalado e continuaria recebendo o jogo
// antigo do cache. Este toma o lugar dele, limpa tudo e se desregistra.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (evento) => {
  evento.waitUntil((async () => {
    for (const nome of await caches.keys()) {
      await caches.delete(nome);
    }
    await self.registration.unregister();
    for (const cliente of await self.clients.matchAll({ type: 'window' })) {
      cliente.navigate(cliente.url);
    }
  })());
});
