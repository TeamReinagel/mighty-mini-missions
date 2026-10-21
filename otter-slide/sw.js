// Bump VERSION whenever app files change so tablets pick up the new copy.
const VERSION = "otter-v4";
const WORDS = [
  "cat", "cap", "bat", "map", "hat", "fan", "van", "rat", "bag", "jam", "can",
  "dog", "log", "fox", "box", "mop", "pot", "top",
  "pig", "wig", "fin", "six", "bib", "lip", "zip",
  "sun", "bug", "rug", "cup", "bus", "nut", "jug",
  "bed", "hen", "pen", "ten", "net", "jet", "web"
];
const LETTERS = "abcdefghijlmnoprstuvwxz".split("");
const ART = [
  "pip_sit", "pip_slide", "pip_cheer", "lilypad",
  "friend_frog", "friend_duck", "friend_turtle", "friend_dragonfly",
  "icon_chest", "icon_speaker", "icon_play", "icon_gear", "icon_star", "icon_heart",
  ...WORDS
].map((n) => `art/${n}.png`);
const AUDIO = [...LETTERS.map((l) => `audio/s_${l}.wav`), ...WORDS.map((w) => `audio/w_${w}.wav`)];
const CORE = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "../progress.js",
  "manifest.webmanifest",
  "fonts/andika-bold-latin.woff2",
  "art/bg_pond.jpg",
  "art/splash.jpg",
  ...ART,
  ...AUDIO,
  "icons/icon-192.png",
  "icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION)
    .then((c) => c.addAll(CORE.map((u) => new Request(u, { cache: "reload" }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("otter-") && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
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
