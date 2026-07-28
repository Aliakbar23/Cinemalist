// ============================================================
// CineVault — Service Worker for PWA
// Offline caching + TMDB image CDN cache + notification handling
// ============================================================

const CACHE_NAME = "cinevault-v1";
const STATIC_ASSETS = [
  "/",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.json",
];

// Install — cache app shell
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate — cleanup old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  e.waitUntil(self.clients.claim());
});

// Fetch — stale-while-revalidate for navigation, cache-first for images
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Cache-first strategy for TMDB images
  if (url.hostname === "image.tmdb.org") {
    e.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(e.request).then((cached) => {
          if (cached) return cached;
          return fetch(e.request).then((response) => {
            if (response.ok) {
              cache.put(e.request, response.clone());
            }
            return response;
          }).catch(() => {
            return new Response("", { status: 404, statusText: "Offline" });
          });
        });
      })
    );
    return;
  }

  // Network-first for API calls and navigation
  if (e.request.mode === "navigate" || url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          if (e.request.mode === "navigate" && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          if (e.request.mode === "navigate") {
            return caches.match(e.request).then((cached) => {
              return cached || caches.match("/");
            });
          }
          return new Response("{}", {
            status: 503,
            statusText: "Offline",
            headers: { "Content-Type": "application/json" },
          });
        })
    );
    return;
  }
});

// Handle clicking on the release notifications
self.addEventListener("notificationclick", (e) => {
  e.notification.close();

  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return self.clients.openWindow("/");
    })
  );
});
