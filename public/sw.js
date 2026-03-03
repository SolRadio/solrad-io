/* SOLRAD Push Service Worker */
/* eslint-disable no-restricted-globals */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "SOLRAD", body: event.data.text() };
  }

  const { title = "SOLRAD ALERT", body, tag, data, icon } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag: tag || "solrad-alert",
      icon: icon || "/brand/icon-512.png",
      badge: "/brand/favicon.png",
      data: data || {},
      vibrate: [100, 50, 100],
      requireInteraction: false,
      actions: [{ action: "open", title: "View" }],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("solrad") && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
