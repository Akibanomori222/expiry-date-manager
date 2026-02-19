// Service Worker for PWA
const CACHE_NAME = 'expiry-manager-v1';
const urlsToCache = [
    '/expiry-date-manager/',
    '/expiry-date-manager/index.html',
    '/expiry-date-manager/css/main.css',
    '/expiry-date-manager/css/gantt.css',
    '/expiry-date-manager/css/responsive.css',
    '/expiry-date-manager/js/dataModel.js',
    '/expiry-date-manager/js/ganttChart.js',
    '/expiry-date-manager/js/ingredientForm.js',
    '/expiry-date-manager/js/search.js',
    '/expiry-date-manager/js/app.js',
    '/expiry-date-manager/js/firebase.js',
    '/expiry-date-manager/js/storage.js'
];

// Install - cache core files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
    self.skipWaiting();
});

// Activate - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(names =>
            Promise.all(
                names.filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            )
        )
    );
    self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Cache successful responses
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
