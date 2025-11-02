const StyleStorage = (() => {
    const script = document.currentScript;
    const scriptUrl = script ? new URL(script.src) : new URL(window.location.href);
    const basePath = scriptUrl.pathname.replace(/files\/js\/style-storage\.js(?:\?.*)?$/, '');
    const scopeHref = `${scriptUrl.origin}${basePath}`;
    const swUrl = new URL('style-sw.js', scopeHref).href;

    const CACHE_NAME = 'style-designer-cache-v1';
    let registrationPromise;

    const MIME_TYPES = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.xml': 'application/xml',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.zip': 'application/zip',
        '.webm': 'video/webm',
        '.ogg': 'audio/ogg',
        '.wav': 'audio/wav',
        '.m4a': 'audio/mp4',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.otf': 'font/otf',
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4',
        '.webp': 'image/webp'
    };

    function getExtension(path) {
        const match = path.match(/\.[^.]+$/);
        return match ? match[0].toLowerCase() : '';
    }

    function inferMime(path, fallback = 'application/octet-stream') {
        const ext = getExtension(path);
        return MIME_TYPES[ext] || fallback;
    }

    async function ensureRegistration() {
        if (!('serviceWorker' in navigator)) {
            throw new Error('Service workers are required.');
        }

        const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
        if (!window.isSecureContext && !isLocalhost) {
            throw new Error('A secure context (https or localhost) is required to use StyleStorage.');
        }

        if (!registrationPromise) {
            const scopeOption = basePath || '/';
            registrationPromise = navigator.serviceWorker.register(swUrl, {
                scope: scopeOption
            }).catch((err) => {
                console.error('StyleStorage: service worker registration failed', err);
                throw err;
            }).then(() => navigator.serviceWorker.ready.catch((err) => {
                console.error('StyleStorage: waiting for service worker readiness failed', err);
                throw err;
            }));
        }

        return registrationPromise;
    }

    async function getCache() {
        await ensureRegistration();
        return caches.open(CACHE_NAME);
    }

    function toAbsoluteURL(path) {
        const normalized = path.replace(/^\//, '');
        return `${scopeHref}${normalized}`;
    }

    async function clear() {
        await ensureRegistration();

        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'STYLE_CACHE_CLEAR' });
        }

        await caches.delete(CACHE_NAME);
    }

    async function save(path, body, options = {}) {
        const url = toAbsoluteURL(path);
        const cache = await getCache();

        const headers = new Headers();
        const mime = options.contentType || inferMime(path, options.defaultType);

        if (mime) {
            const isTextType = /^text\/|\/json$|\/javascript$|\/xml$/.test(mime);
            headers.set('Content-Type', mime + (isTextType && !/charset=/i.test(mime) ? '; charset=utf-8' : ''));
        }

        const request = new Request(url);
        const response = new Response(body, {
            status: 200,
            headers
        });

        await cache.put(request, response);
    }

    async function saveText(path, content) {
        await save(path, content, { defaultType: 'text/plain' });
    }

    async function saveBinary(path, data, contentType) {
        let body = data;
        if (data instanceof ArrayBuffer) {
            body = data;
        } else if (ArrayBuffer.isView(data)) {
            body = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        } else if (!(data instanceof Blob)) {
            body = new Blob([data], { type: contentType || inferMime(path) });
        }

        await save(path, body, { contentType: contentType || inferMime(path) });
    }

    async function list(prefix = '') {
        const cache = await getCache();
        const requests = await cache.keys();
        const result = new Set();
        const prefixNormalized = prefix.replace(/^\//, '');

        for (const request of requests) {
            const url = new URL(request.url);
            let relativePath = url.pathname;

            if (relativePath.startsWith(basePath)) {
                relativePath = relativePath.slice(basePath.length);
            }

            if (!relativePath) continue;
            if (relativePath.startsWith(prefixNormalized)) {
                result.add(relativePath);
            }
        }

        return Array.from(result);
    }

    async function readText(path) {
        const cache = await getCache();
        const url = toAbsoluteURL(path);
        const response = await cache.match(url) || await cache.match(url.split('?')[0]);
        if (!response) return null;
        return response.text();
    }

    async function readBinary(path) {
        const cache = await getCache();
        const url = toAbsoluteURL(path);
        const response = await cache.match(url) || await cache.match(url.split('?')[0]);
        if (!response) return null;
        return response.arrayBuffer();
    }

    return {
        init: ensureRegistration,
        clear,
        saveText,
        saveBinary,
        list,
        readText,
        readBinary,
        get scope() {
            return `${basePath}`;
        }
    };
})();

window.StyleStorage = StyleStorage;
