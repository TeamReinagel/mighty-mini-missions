// Bump VERSION whenever app files change so tablets pick up the new copy.
const VERSION = "crr-v27";
const CORE = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "../progress.js",
  "coins.js",
  "jars.js",
  "store.js",
  "path3d.js",
  "vendor/three.min.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "assets/ball.png",
  "assets/audio/coin.m4a",
  "assets/level_map.jpg",
  "assets/icon_store.png",
  "assets/icon_bank.png",
  "assets/icon_records.png",
  "assets/icon_room.png",
  "assets/badge_champion.png",
  "assets/scene_run.jpg",
  "assets/audio/music.m4a",
  "assets/bill_100.png",
  "assets/bill_500.png",
  "assets/cactus.png",
  "assets/car.png",
  "assets/castle.png",
  "assets/chest.png",
  "assets/church.png",
  "assets/coin_1.png",
  "assets/coin_10.png",
  "assets/coin_25.png",
  "assets/coin_5.png",
  "assets/crown.png",
  "assets/dragon.png",
  "assets/duck.png",
  "assets/families.png",
  "assets/fire.png",
  "assets/food.png",
  "assets/giver1.png",
  "assets/giver10.png",
  "assets/giver5.png",
  "assets/guitar.png",
  "assets/invest100.png",
  "assets/invest500.png",
  "assets/jar_invest.png",
  "assets/jar_save.png",
  "assets/jar_spend.png",
  "assets/jar_tithe.png",
  "assets/kite.png",
  "assets/missions.png",
  "assets/owl.png",
  "assets/puppy.png",
  "assets/racecar.png",
  "assets/rainbow.png",
  "assets/rock.png",
  "assets/rocket.png",
  "assets/runner_astronaut.png",
  "assets/runner_default.png",
  "assets/runner_dino.png",
  "assets/runner_hero.png",
  "assets/runner_ninja.png",
  "assets/runner_robot.png",
  "assets/runner_wizard.png",
  "assets/save100.png",
  "assets/save1000.png",
  "assets/save500.png",
  "assets/sparkle.png",
  "assets/stars.png",
  "assets/telescope.png",
  "assets/treehouse.png",
  "assets/ufo.png"
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
