// Bump VERSION whenever app files change so tablets pick up the new copy.
const VERSION = "gwr-christmas-v6";
const CORE = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "../progress.js",
  "content.js",
  "candies.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "assets/christmas/winter_edges.svg",
  "assets/christmas/snowman_normal.png",
  "assets/christmas/snowman_happy.png",
  "assets/christmas/snowman_wobble.png",
  "assets/christmas/sack.png",
  "assets/christmas/sack_full.png",
  "assets/christmas/gift_0.svg",
  "assets/christmas/gift_1.svg",
  "assets/christmas/gift_2.svg",
  "assets/christmas/gift_3.svg",
  "assets/christmas/gift_4.svg",
  "assets/christmas/gift_5.svg",
  "assets/christmas/gift_6.svg",
  "assets/christmas/heart.svg",
  "assets/christmas/cottage_0.png",
  "assets/christmas/cottage_1.png",
  "assets/christmas/cottage_2.png",
  "assets/christmas/outfit_elf.png",
  "assets/christmas/outfit_winter.png",
  "assets/christmas/outfit_reindeer.png",
  "assets/christmas/outfit_crown.png",
  "assets/christmas/outfit_scarf.png",
  "assets/christmas/outfit_star.png",
  "assets/christmas/outfit_top.png",
  "assets/christmas/outfit_earmuffs.png",
  "sleigh-bells-waltz.mp3"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
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
      fetch(req)
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
