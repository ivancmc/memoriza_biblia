/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare let self: ServiceWorkerGlobalScope;

// Skip waiting and claim clients immediately
self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('push', (event) => {
    const data = event.data?.json() ?? {};
    const title = data.title || 'MemorizaBíblia 🧠';
    const options = {
        body: data.body || 'Hora de praticar! Um versículo por dia mantém a memória afiada.',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: 'memoriza-biblia-reminder',
        data: data.url || '/'
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});
