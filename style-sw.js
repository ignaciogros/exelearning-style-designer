const CACHE_NAME = 'style-designer-cache-v1';

function shouldHandle(event) {
    const requestUrl = new URL(event.request.url);
    const scopeUrl = new URL(self.registration.scope);

    if (requestUrl.origin !== scopeUrl.origin) return false;
    if (!requestUrl.pathname.startsWith(scopeUrl.pathname)) return false;

    const relativePath = requestUrl.pathname.slice(scopeUrl.pathname.length);
    return relativePath.startsWith('contents/') || relativePath.startsWith('theme/');
}

function normalizeRequest(request) {
    const url = new URL(request.url);
    url.hash = '';
    url.search = '';
    return new Request(url.toString(), {
        method: request.method,
        headers: request.headers
    });
}

self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    if (!shouldHandle(event)) return;

    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        let response = await cache.match(event.request);
        if (response) return response;

        const normalized = normalizeRequest(event.request);
        response = await cache.match(normalized);
        if (response) return response;

        return new Response('Not found', { status: 404 });
    })());
});

self.addEventListener('message', (event) => {
    const { type } = event.data || {};

    if (type === 'STYLE_CACHE_CLEAR') {
        event.waitUntil(caches.delete(CACHE_NAME));
    }
});
