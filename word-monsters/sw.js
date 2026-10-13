// Bump VERSION whenever app files change so tablets pick up the new copy.
const VERSION = "wm-v32";
const PLACES = ["meadow", "woods", "cave", "castle", "garden", "reef", "lagoon"];
const SPRITES = [];
for (let s = 1; s <= 10; s++) for (let st = 1; st <= 3; st++) SPRITES.push(`images/monsters/m${s}-${st}b.webp`, `images/monsters/m${s}-${st}f.webp`);
const CORE = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "../progress.js",
  "words.js",
  "monsters.js",
  "map.js",
  "fx.js",
  "manifest.webmanifest",
  "images/world-1.jpg",
  "images/world-2.jpg",
  "images/logo.webp",
  "images/net.webp",
  ...PLACES.map((p) => `images/bg-${p}.webp`),
  ...SPRITES,
  "icons/icon-192.png",
  "icons/icon-512.png",
  "audio/bouncy-monster-loop.m4a"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION)
    .then((c) => c.addAll(CORE.map((u) => new Request(u, { cache: "reload" }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);

  if (url.origin === location.origin) {
    // Network first so updates show up; cache keeps it working offline.
    event.respondWith(
      fetch(req, { cache: "no-cache" })
        .then((res) => {
          // Audio is fetched in partial (206) chunks, which the cache can't store.
          if (res.status === 200) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("index.html")))
    );
  } else if (isFont) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      }))
    );
  }
});
