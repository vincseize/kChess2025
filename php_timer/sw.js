// sw.js - Requis pour l'icône sur écran d'accueil
self.addEventListener('fetch', (event) => {
    // On laisse passer toutes les requêtes normalement
    event.respondWith(fetch(event.request));
});