const CACHE_NAME = "playlist-shell-v1";
const APP_SHELL = [
    "./",
    "./index.html",
    "./manifest.json",
    "./assets/css/main.css",
    "./assets/css/dialog.css",
    "./assets/js/db.js",
    "./assets/js/main.js",
    "./assets/js/load.js",
    "./assets/images/loader_white.svg",
    "./assets/images/loader.svg",
    "./assets/images/play.png",
    "./assets/images/icon-192.png",
    "./assets/images/icon-512.png"
];

self.addEventListener("install", (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (e) => {
    const url = new URL(e.request.url);

    if (e.request.method !== "GET") return;

    if (url.origin !== self.location.origin) {
        return;
    }

    e.respondWith(
        caches.match(e.request).then((cached) => cached || fetch(e.request))
    );
});
