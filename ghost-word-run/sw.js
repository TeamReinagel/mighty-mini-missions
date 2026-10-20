// Bump VERSION whenever app files change so tablets pick up the new copy.
const VERSION = "gwr-v15";
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
  "assets/ghost_normal.png",
  "assets/ghost_happy.png",
  "assets/ghost_wobble.png",
  "assets/pumpkin_bucket.png",
  "assets/pumpkin_bucket_overflow.png",
  "assets/candy_swirl_pop.png",
  "assets/candy_corn.png",
  "assets/candy_twist_pink.png",
  "assets/candy_gummy_bear.png",
  "assets/candy_chocolate_truffle.png",
  "assets/candy_twist_citrus.png",
  "assets/candy_pumpkin_drop.png",
  "assets/candy_heart_restore.png",
  "assets/house_purple.png",
  "assets/house_orange.png",
  "assets/house_green.png",
  "assets/boo_pumpkin_cap.png",
  "assets/boo_witch.png",
  "assets/boo_cat.png",
  "assets/boo_king.png",
  "assets/boo_pirate.png",
  "assets/boo_wizard.png",
  "assets/boo_top_hat.png",
  "assets/boo_bat.png",
  "trick-or-treat-fun.m4a"
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
