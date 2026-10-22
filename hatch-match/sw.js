// Bump VERSION whenever app files change so tablets pick up the new copy.
const VERSION = "hatch-v5";
const ART = [
  "mama_blue", "mama_pink", "mama_yellow", "mama_green",
  "egg_blue", "egg_pink", "egg_yellow", "egg_mint",
  "baby_blue", "baby_pink", "baby_yellow", "baby_green", "baby_owl", "baby_penguin", "baby_rainbow",
  "shell_top", "nest_empty", "icon_tree", "icon_speaker", "icon_play", "icon_gear", "icon_star", "icon_heart"
].map((n) => `art/${n}.png`);
const CORE = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "../progress.js",
  "../voice-pick.js",
  "manifest.webmanifest",
  "fonts/andika-bold-latin.woff2",
  "art/bg_meadow.jpg",
  "art/bg_tree.jpg",
  "art/splash.jpg",
  ...ART,
  "icons/icon-192.png",
  "icons/icon-512.png",
  "tts/index.html",
  "tts/tts.css",
  "tts/tts.js",
  "tts/voice.js",
  "tts/worker.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION)
    .then((c) => c.addAll(CORE.map((u) => new Request(u, { cache: "reload" }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("hatch-") && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // Kokoro runtime, model, and voice files live in the kokoro-hatch cache.
  // Leave them out of this app-shell cache so a game update does not duplicate
  // or evict them, and so Reset can delete only the speech assets.
  if (url.pathname.includes("/tts/vendor/")) return;
  // When the device is offline, don't wait for the network attempt to time out.
  if (!navigator.onLine) {
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("index.html"))
    );
    return;
  }
  // Network first so updates show up; cache keeps it working offline.
  event.respondWith(
    fetch(req, { cache: "no-cache" })
      .then((res) => {
        if (res.status === 200) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("index.html")))
  );
});
