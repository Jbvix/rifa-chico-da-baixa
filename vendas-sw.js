/* Rifa Chico da Baixa · vendas-sw.js · Autor: Jossian Brito · v3.7.0 · 2026-11-16
 * Service Worker mínimo: no Android, notificações de página só podem ser
 * exibidas por um Service Worker (registration.showNotification). Não
 * intercepta requisições nem guarda cache. Toque na notificação → abre o painel. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((cs) => (cs[0] ? cs[0].focus() : null)));
});
