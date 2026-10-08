const CACHE_NAME = 'tripaway-shell-v11';
const APP_FILES = [
    './',
    './index.html',
    './style.css',
    './reviews.css',
    './community.css',
    './place-images.css',
    './data.css',
    './app.js',
    './supabase-config.js',
    './i18n.js',
    './data.js',
    './place-images.js'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )));
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== self.location.origin) return;

    if (request.mode === 'navigate') {
        event.respondWith(fetch(request).then(response => {
            if (response.ok && !url.searchParams.has('trip')) caches.open(CACHE_NAME).then(cache => cache.put('./index.html', response.clone()));
            return response;
        }).catch(() => caches.match('./index.html')));
        return;
    }

    if (url.searchParams.has('trip')) return;
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
        if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
        return response;
    })));
});
