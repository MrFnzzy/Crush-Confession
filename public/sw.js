// Minimal service worker whose only job is receiving push notifications
// ("someone replied to your confession") and handling taps on them. It
// deliberately does NOT cache pages or API responses — the wall must
// always show fresh confessions/replies, never something served stale.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "unspoken", body: "Someone replied to your confession.", url: "/wall" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // Fall back to the default above if the payload isn't valid JSON.
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag,
      data: { url: data.url || "/wall" },
    })
  );
});

// Tapping the notification focuses an already-open tab on the wall if one
// exists, otherwise opens a new one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/wall";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of allClients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })()
  );
});
