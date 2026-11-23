// Kulis service worker: sayfa her zaman ağdan taze gelir, internet yoksa son kopya açılır.
// Ayrıca telefona/tarayıcıya gelen anlık bildirimleri (Firebase Cloud Messaging) gösterir.
const CACHE = "kulis-v25";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  if (/\/beta\//.test(r.url)) return; // test sürümüne karışma
  const url = new URL(r.url);
  if (r.mode === "navigate") {
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", cp)); return res; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  if (url.origin === location.origin || url.host.endsWith("fonts.gstatic.com") || url.host.endsWith("fonts.googleapis.com")) {
    e.respondWith(caches.match(r).then(hit => {
      const net = fetch(r).then(res => { if (res.ok || res.type === "opaque") { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; });
      return hit || net;
    }));
  }
});

// ---- Anlık bildirim ----
self.addEventListener("push", e => {
  let p = {};
  try { p = e.data ? e.data.json() : {}; } catch (err) { p = { data: { body: e.data && e.data.text() } }; }
  const d = p.data || p.notification || {};
  e.waitUntil((async () => {
    // site açık ve ekrandaysa bildirim gösterme (site kendi içinde gösteriyor)
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    if (wins.some(w => w.visibilityState === "visible")) return;
    await self.registration.showNotification(d.title || "Kulis", {
      body: d.body || "", icon: "icons/icon-192.png", badge: "icons/icon-192.png",
      tag: d.tag || "kulis", renotify: true, data: { link: d.link || "./" },
      ...(d.tag === "call" ? { requireInteraction: true, vibrate: [500, 300, 500, 300, 500, 300, 500] } : {})
    });
  })());
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const link = (e.notification.data && e.notification.data.link) || "./";
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of wins) { if ("focus" in w) { await w.focus(); return; } }
    await self.clients.openWindow(link);
  })());
});
