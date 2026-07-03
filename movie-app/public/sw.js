// ============================================================
// CineVault — Service Worker for PWA
// ============================================================

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

// Handle clicking on the release notifications
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  
  // Try to find an open window of the app and focus it, otherwise open new window
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
