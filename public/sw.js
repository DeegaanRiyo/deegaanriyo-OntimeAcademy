// Ontime Academy — Service Worker
// Provides offline fallback and caches static assets for PWA

const CACHE_NAME = "ontime-v2";

// Only cache static/public assets — NOT Next.js HTML pages (they have Cache-Control: no-store)
const PRECACHE_ASSETS = [
  "/favicon.ico",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/site.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip cross-origin requests, API routes, and auth routes
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/dashboard/") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/signup")
  ) {
    return;
  }

  // Cache-first for static assets (images, icons, manifest)
  const isStatic =
    url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff2?|css|js)$/) ||
    url.pathname === "/site.webmanifest";

  if (isStatic) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (!response.ok) return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Network-first for HTML pages — fall back to cache, never fail silently
  if (event.request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() =>
          caches.match(event.request).then((cached) => cached || fetch(event.request))
        )
    );
  }
});
