(() => {
  "use strict";

  // Source stays plain ASCII: symbols are written as \u escapes.
  const STORE_KEY = "mightyMini.coinRecordRun.v1";
  const SOUND_KEY = "mightyMini.coinRecordRun.muted";
  const G = window.CRR_GAME;
  const COINS = window.CRR_COINS;
  const LEVELS = window.CRR_LEVELS;
  const J = window.CRR_JARS;
  const S = window.CRR_STORE;
  const DENOMS = [500, 100, 25, 10, 5, 1];
  const CENT = "\u00a2";
  const ICON = {
    sound: "\u{1F50A}", mute: "\u{1F507}", lock: "\u{1F512}", check: "\u2713", back: "\u232B",
    arrow: "\u279C", person: "\u{1F464}", down: "\u25BE", heart: "\u{1F49B}", dot: "\u00b7", times: "\u00d7", star: "\u2605", life: "\u2665"
  };

  const $ = (id) => document.getElementById(id);
  const screens = {
    home: $("homeScreen"),
    run: $("runScreen"),
    count: $("countScreen"),
    sort: $("sortScreen"),
    store: $("storeScreen")
  };

  // ---------- Money helpers ----------
  const emptyPurse = () => ({ 1: 0, 5: 0, 10: 0, 25: 0, 100: 0, 500: 0 });
  const purseTotal = (p) => DENOMS.reduce((s, d) => s + d * (p[d] || 0), 0);
  const purseCount = (p) => DENOMS.reduce((s, d) => s + (p[d] || 0), 0);
  const purseList = (p) => DENOMS.flatMap((d) => Array(p[d] || 0).fill(d));
  const clonePurse = (p) => Object.assign(emptyPurse(), p);
  const purseFrom = (list) => list.reduce((p, d) => { p[d] += 1; return p; }, emptyPurse());
  const hasAll = (p, need) => Object.keys(need).every((d) => (p[d] || 0) >= need[d]);
  function mergeInto(a, b) { DENOMS.forEach((d) => { a[d] = (a[d] || 0) + (b[d] || 0); }); }
  function removeFrom(a, b) { DENOMS.forEach((d) => { a[d] = (a[d] || 0) - (b[d] || 0); }); }
  function sumPurses(a, b) { const p = clonePurse(a); mergeInto(p, b); return p; }
  function makeChange(cents) {
    const p = emptyPurse();
    for (const d of [25, 10, 5, 1]) { p[d] = Math.floor(cents / d); cents -= p[d] * d; }
    return p;
  }
  function canMake(p, amount) {
    let reach = new Set([0]);
    for (const d of purseList(p)) {
      const next = new Set(reach);
      reach.forEach((r) => { if (r + d <= amount) next.add(r + d); });
      reach = next;
      if (reach.has(amount)) return true;
    }
    return reach.has(amount);
  }
  const fmt = (c) => `$${Math.floor(c / 100)}.${String(c % 100).padStart(2, "0")}`;
  function sayMoney(c) {
    if (c < 100) return `${c} ${c === 1 ? "cent" : "cents"}`;
    const d = Math.floor(c / 100);
    const r = c % 100;
    const dollars = `${d} ${d === 1 ? "dollar" : "dollars"}`;
    return r ? `${dollars} and ${r} ${r === 1 ? "cent" : "cents"}` : dollars;
  }
  const speakable = (t) => t
    .replace(new RegExp(`(\\d+)${CENT}`, "g"), (_, n) => sayMoney(Number(n)))
    .replace(/\$(\d+)\.(\d\d)/g, (_, d, c) => sayMoney(Number(d) * 100 + Number(c)));
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const art = (src, cls = "", alt = "") => `<img src="${src}" class="${cls}" alt="${alt}" draggable="false" />`;

  // ---------- Saved data ----------
  function newPlayer(name, startLevel) {
    return {
      name,
      unlocked: startLevel,
      level: startLevel,
      perfect: {},
      levelStreak: {},
      summit: false,
      champion: false,
      endlessBest: 0,
      streak: 0,
      bestStreak: 0,
      bestHaul: 0,
      runs: 0,
      investRuns: 0,
      investLots: [],
      jars: { tithe: emptyPurse(), invest: emptyPurse(), save: emptyPurse(), spend: emptyPurse() },
      given: 0,
      gifts: 0,
      badges: [],
      trophies: [],
      owned: [],
      equipped: { runner: null, trail: null },
      powers: [],
      saveGoal: null
    };
  }

  function load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { d = null; }
    if (!d || !d.players) d = { current: G.players[0].name, players: {} };
    G.players.forEach((cfg) => {
      d.players[cfg.name] = Object.assign(newPlayer(cfg.name, cfg.startLevel), d.players[cfg.name] || {});
    });
    Object.values(d.players).forEach((p) => {
      J.order.forEach((k) => { p.jars[k] = clonePurse(p.jars[k] || {}); });
    });
    if (!d.players[d.current]) d.current = G.players[0].name;
    return d;
  }
  let data = load();
  // Open on the child picked on the Mighty Mini Missions home screen when they have a player here.
  const hubKid = window.MightyProgress?.currentKid().name;
  if (hubKid && data.players[hubKid]) data.current = hubKid;
  const P = () => data.players[data.current];
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { /* storage full or blocked */ } }
  const level = () => LEVELS[P().level];
  function logMoney(skill, correct, extra) {
    window.MightyProgress?.log({ game: "coin-record-run", skill, item: level().name, correct, player: data.current, extra });
  }
  const SUMMIT = G.champion.level;
  const ENDLESS = LEVELS.findIndex((L) => L.endless);
  const goalFor = (L) => L.inARow || G.unlockPerfectCounts;
  const progressFor = (p, L) => (L.inARow ? p.levelStreak[L.id] : p.perfect[L.id]) || 0;
  const levelCleared = (p, L) => L.id < p.unlocked || (L.id === SUMMIT && p.summit);
  const jarTotal = (k) => purseTotal(P().jars[k]);
  const itemById = (id) => S.items.find((i) => i.id === id);

  // ---------- Sound and voice ----------
  let muted = localStorage.getItem(SOUND_KEY) === "1";

  const Voice = {
    voice: null,
    init() {
      if (!("speechSynthesis" in window)) return;
      const pick = () => {
        const vs = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
        this.voice = vs.find((v) => /Ava|Zoe|Samantha/i.test(v.name)) || vs.find((v) => /en-US/i.test(v.lang)) || vs[0] || null;
      };
      pick();
      speechSynthesis.onvoiceschanged = pick;
    },
    say(text) {
      if (muted || !("speechSynthesis" in window)) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(speakable(text));
      if (this.voice) u.voice = this.voice;
      u.rate = 0.95;
      u.pitch = 1.05;
      setTimeout(() => speechSynthesis.speak(u), 50);
    }
  };

  const Sfx = {
    ctx: null,
    get() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    },
    tone(freq, dur, { type = "sine", vol = 0.12, delay = 0, slide = 0 } = {}) {
      const c = this.get();
      if (!c || muted) return;
      const t = c.currentTime + delay;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    blip() { this.tone(988, 0.07, { type: "square", vol: 0.05 }); this.tone(1319, 0.12, { type: "square", vol: 0.05, delay: 0.06 }); },
    coinBuf: null,
    coinLoading: null,
    loadCoin() {
      const c = this.get();
      if (!c || this.coinLoading) return;
      this.coinLoading = fetch("assets/audio/coin.m4a")
        .then((r) => r.arrayBuffer())
        .then((b) => new Promise((res, rej) => c.decodeAudioData(b, res, rej)))
        .then((buf) => { this.coinBuf = buf; })
        .catch(() => { this.coinLoading = null; });
    },
    coin() {
      const c = this.get();
      if (!c || muted) return;
      if (!this.coinBuf) { this.loadCoin(); this.blip(); return; }
      const s = c.createBufferSource();
      const g = c.createGain();
      s.buffer = this.coinBuf;
      g.gain.value = 0.6;
      s.connect(g).connect(c.destination);
      s.start();
    },
    ching() { [1568, 2093, 2637].forEach((f, i) => this.tone(f, 0.28, { type: "triangle", vol: 0.12, delay: i * 0.07 })); },
    oops() { this.tone(330, 0.28, { vol: 0.12, slide: 0.6 }); },
    bonk() { this.tone(140, 0.2, { type: "square", vol: 0.07, slide: 0.5 }); },
    drop() { this.tone(760, 0.07, { type: "triangle", vol: 0.08 }); },
    fanfare() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, 0.24, { type: "square", vol: 0.06, delay: i * 0.13 })); }
  };

  // Background music. Each pass starts `overlap` seconds before the last one ends, crossfading over that time.
  const Music = {
    src: "assets/audio/music.m4a",
    vol: 0.3,
    overlap: 0.5,
    buffer: null,
    loading: null,
    out: null,
    nextAt: 0,
    timer: null,
    playing: false,
    sources: [],
    load() {
      if (!this.loading) {
        const c = Sfx.get();
        this.loading = fetch(this.src)
          .then((r) => r.arrayBuffer())
          .then((b) => new Promise((res, rej) => c.decodeAudioData(b, res, rej)))
          .then((buf) => { this.buffer = buf; return buf; });
        this.loading.catch(() => { this.loading = null; });
      }
      return this.loading;
    },
    async start() {
      if (muted || this.playing) return;
      const c = Sfx.get();
      if (!c) return;
      this.playing = true;
      try { await this.load(); } catch (e) { this.playing = false; return; }
      if (!this.playing) return;
      if (!this.out) {
        this.out = c.createGain();
        this.out.connect(c.destination);
      }
      const t = c.currentTime;
      this.out.gain.cancelScheduledValues(t);
      this.out.gain.setValueAtTime(0.0001, t);
      this.out.gain.exponentialRampToValueAtTime(this.vol, t + 1.5);
      this.nextAt = t + 0.05;
      this.first = true;
      this.schedule();
    },
    schedule() {
      if (!this.playing) return;
      const c = Sfx.ctx;
      const dur = this.buffer.duration;
      const x = Math.min(this.overlap, dur / 4);
      while (this.nextAt < c.currentTime + 3) {
        const t = this.nextAt;
        const s = c.createBufferSource();
        const g = c.createGain();
        s.buffer = this.buffer;
        if (this.first) g.gain.setValueAtTime(1, t);
        else {
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(1, t + x);
        }
        g.gain.setValueAtTime(1, t + dur - x);
        g.gain.linearRampToValueAtTime(0, t + dur);
        s.connect(g).connect(this.out);
        s.start(t);
        s.onended = () => { this.sources = this.sources.filter((o) => o !== s); };
        this.sources.push(s);
        this.first = false;
        this.nextAt = t + dur - x;
      }
      this.timer = setTimeout(() => this.schedule(), 1000);
    },
    stop() {
      this.playing = false;
      clearTimeout(this.timer);
      this.sources.forEach((s) => { try { s.stop(); } catch (e) { /* already stopped */ } });
      this.sources = [];
    }
  };
  // Browsers only allow audio after the first tap.
  window.addEventListener("pointerdown", () => { Sfx.loadCoin(); Music.start(); }, { once: true });
  document.addEventListener("visibilitychange", () => {
    const c = Sfx.ctx;
    if (!c) return;
    if (document.hidden) c.suspend();
    else c.resume();
  });

  // ---------- Shared UI ----------
  function show(name) {
    Object.entries(screens).forEach(([k, el]) => el.classList.toggle("hidden", k !== name));
    if (name !== "home") closeSheets();
    window.scrollTo(0, 0);
  }

  function openSheet(id) {
    closeSheets();
    $(id).classList.remove("hidden");
  }
  function closeSheets() {
    document.querySelectorAll(".sheet").forEach((s) => s.classList.add("hidden"));
  }
  document.querySelectorAll(".sheet").forEach((s) => s.addEventListener("click", (e) => {
    if (e.target === s || e.target.closest("[data-close-sheet]")) closeSheets();
  }));

  function coinHTML(d, { size = 1, label = true, cls = "", attrs = "" } = {}) {
    const c = COINS[d];
    if (c.bill) {
      const w = Math.round(120 * size);
      return `<span class="coin bill ${cls}" data-d="${d}" ${attrs} style="width:${w}px;height:${Math.round(w * 0.48)}px">${art(c.img, "", c.name)}</span>`;
    }
    const px = Math.round(c.mm * 2.6 * size);
    const tag = label ? `<b class="coin-label">${d}${CENT}</b>` : "";
    return `<span class="coin ${cls}" data-d="${d}" ${attrs} style="width:${px}px;height:${px}px">${art(c.img, "", c.name)}${tag}</span>`;
  }

  function makeNumpad(container, onKey) {
    container.innerHTML = "";
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "back", "0", "ok"].forEach((k) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `key ${k === "ok" ? "key-ok" : ""} ${k === "back" ? "key-back" : ""}`;
      b.textContent = k === "back" ? ICON.back : k === "ok" ? ICON.check : k;
      b.addEventListener("click", () => onKey(k));
      container.appendChild(b);
    });
  }

  function padInput(entry, k, max = 4) {
    if (k === "back") return entry.slice(0, -1);
    if (/^\d$/.test(k) && entry.length < max) return (entry + k).replace(/^0+(?=\d)/, "");
    return entry;
  }

  // Digits fill in like a cash register, so typing 4 7 shows $0.47 and 1 3 5 shows $1.35.
  function showDisplay(el, entry) {
    el.innerHTML = `<span class="entry ${entry ? "" : "dim"}">${fmt(entry ? parseInt(entry, 10) : 0)}</span>`;
  }

  function flash(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  // Generic modal
  let genericOnClose = null;
  function openGeneric(html, onClose) {
    $("genericBody").innerHTML = html;
    $("genericModal").classList.remove("hidden");
    genericOnClose = onClose || null;
  }
  function closeGeneric(runCallback = true) {
    $("genericModal").classList.add("hidden");
    const cb = genericOnClose;
    genericOnClose = null;
    if (cb && runCallback) cb();
  }
  $("genericClose").addEventListener("click", () => closeGeneric());

  // Celebration queue
  let celebrations = [];
  let afterCelebrations = null;
  function celebrate(items, done) {
    celebrations = celebrations.concat(items);
    if (done) afterCelebrations = done;
    if ($("celebrateModal").classList.contains("hidden")) nextCelebration();
  }
  function nextCelebration() {
    const item = celebrations.shift();
    if (!item) {
      $("celebrateModal").classList.add("hidden");
      const cb = afterCelebrations;
      afterCelebrations = null;
      if (cb) cb();
      return;
    }
    $("celebrateArt").innerHTML = item.img ? art(item.img) : "";
    $("celebrateTitle").textContent = item.title;
    $("celebrateText").textContent = item.text || "";
    $("celebrateNext").textContent = item.button || "Yay!";
    $("celebrateModal").classList.toggle("record", !!item.record);
    $("celebrateModal").classList.remove("hidden");
    if (item.record) {
      Sfx.fanfare();
      makeConfetti();
    } else {
      Sfx.ching();
      $("confetti").innerHTML = "";
    }
    Voice.say(item.say || `${item.title} ${item.text || ""}`);
  }
  $("celebrateNext").addEventListener("click", nextCelebration);

  function makeConfetti() {
    const colors = ["#ffd54a", "#ff7eb6", "#58a6ff", "#4cc38a", "#ffffff", "#ff9f43"];
    $("confetti").innerHTML = Array.from({ length: 60 }, () => {
      const left = Math.random() * 100;
      const delay = Math.random() * 0.8;
      const dur = 1.8 + Math.random() * 1.4;
      const color = colors[Math.floor(Math.random() * colors.length)];
      return `<i style="left:${left}%;background:${color};animation-delay:${delay}s;animation-duration:${dur}s"></i>`;
    }).join("");
  }

  // ---------- Home ----------
  // Where each level's pad sits on assets/level_map.jpg, as % of its width and height (level 0 at the bottom).
  // The Endless Castle label sits below the castle art, and the runner waits beside the castle there.
  const MAP_SPOTS = [[29.3, 87.2], [72.4, 71.8], [27.7, 57.9], [70.2, 44.6], [29.9, 32.1], [65.1, 21.4], [50.0, 16.2]];
  const CASTLE_RUNNER_SPOT = [34, 18];

  function runnerImg() {
    const item = P().equipped.runner && itemById(P().equipped.runner);
    return item ? item.img : G.runner;
  }

  function renderHome() {
    const p = P();
    document.title = G.name;
    $("gameTitle").textContent = G.name;
    $("playerChip").textContent = `${ICON.person} ${p.name} ${ICON.down}`;
    $("soundBtn").textContent = muted ? ICON.mute : ICON.sound;
    $("runBtnRunner").src = runnerImg();

    $("levelMap").innerHTML = `<img src="assets/level_map.jpg" class="map-img" alt="" draggable="false" />` + LEVELS.map((L) => {
      const [x, y] = MAP_SPOTS[L.id] || [50, 50];
      const locked = L.id > p.unlocked;
      const sel = L.id === p.level;
      const goal = goalFor(L);
      const earned = levelCleared(p, L) ? goal : Math.min(goal, progressFor(p, L));
      const stars = locked || L.endless ? "" : `<span class="node-stars">${Array.from({ length: goal }, (_, i) => `<i class="${i < earned ? "on" : ""}">${ICON.star}</i>`).join("")}</span>`;
      const sub = L.endless && !locked && p.endlessBest ? `Best: ${p.endlessBest} coins` : L.short;
      return `<button type="button" class="map-node level-btn ${sel ? "selected" : ""} ${locked ? "locked" : ""} ${L.endless ? "endless" : ""}" data-level="${L.id}" ${locked ? "disabled" : ""} style="left:${x}%;top:${y}%" aria-label="Level ${L.id}: ${L.name}">
        <span class="node-label">${locked ? `<i class="node-lock">${ICON.lock}</i>` : ""}${L.name}<small>${sub}</small></span>
        ${stars}
      </button>`;
    }).join("") + (() => {
      const atCastle = p.level === ENDLESS;
      const [x, y] = atCastle ? CASTLE_RUNNER_SPOT : MAP_SPOTS[p.level] || [50, 50];
      const next = MAP_SPOTS[p.level + 1];
      const prev = MAP_SPOTS[p.level - 1];
      const right = atCastle || (next ? next[0] > x : prev ? x > prev[0] : true);
      return `<img src="${runnerImg()}" class="map-runner" alt="" draggable="false" style="left:${x}%;top:${y}%;--flip:${right ? -1 : 1}" />`;
    })();
    requestAnimationFrame(() => {
      const box = $("levelMapScroll");
      const node = $("levelMap").querySelector(".map-node.selected");
      if (box && node && !box.dataset.scrolled) {
        box.scrollTop = node.offsetTop - box.clientHeight / 2;
        box.dataset.scrolled = "1";
      }
    });
    $("levelNote").textContent = `${level().note} ${ICON.dot} ${goalNote(p)}`;

    $("jarShelf").innerHTML = J.order.map((k) => jarHTML(k, jarTotal(k), extraJarLine(k))).join("");

    const all = J.order.reduce((s, k) => s + jarTotal(k), 0);
    $("recordsBoard").innerHTML = [
      ["assets/coin_25.png", "Biggest perfect haul", p.bestHaul ? fmt(p.bestHaul) : "-"],
      ["assets/stars.png", "Longest Perfect Count streak", p.bestStreak || "-"],
      ["assets/fire.png", "Current streak", p.streak || "-"],
      ["assets/chest.png", "All four jars", fmt(all)],
      ["assets/giver1.png", "Given to God", p.given ? fmt(p.given) : "-"],
      [G.runner, "Runs", p.runs],
      ...(p.unlocked >= ENDLESS ? [["assets/castle.png", "Endless Castle: most coins caught", p.endlessBest || "-"]] : [])
    ].map(([src, label, val]) => `<div class="record">${art(src, "record-art")}<span class="record-label">${label}</span><strong class="record-val">${val}</strong></div>`).join("");

    const items = p.owned.map(itemById).filter((i) => i && (i.cat === "room" || i.cat === "goal"));
    const shelf = [
      ...(p.champion ? [{ img: G.champion.img, name: G.champion.name, cls: "trophy" }] : []),
      ...J.trophies.filter((t) => p.trophies.includes(t.id)).map((t) => ({ img: t.img, name: t.name, cls: "trophy" })),
      ...J.giverBadges.filter((b) => p.badges.includes(b.id)).map((b) => ({ img: b.img, name: b.name, cls: "badge" })),
      ...items.map((i) => ({ img: i.img, name: i.name, cls: i.cat === "goal" ? "goal" : "" }))
    ];
    $("recordRoom").innerHTML = shelf.length
      ? shelf.map((s) => `<div class="shelf-item ${s.cls}">${art(s.img)}<small>${s.name}</small></div>`).join("")
      : `<p class="note">Trophies, badges, and things you buy show up here.</p>`;
  }

  function goalNote(p) {
    if (level().endless) return p.endlessBest ? `Your record: ${p.endlessBest} coins. Can you beat it?` : "How far can you go?";
    const L = LEVELS[Math.min(p.unlocked, SUMMIT)];
    const plural = (n) => `${n} more Perfect Count${n === 1 ? "" : "s"}`;
    if (p.unlocked < SUMMIT) {
      const need = Math.max(0, goalFor(L) - progressFor(p, L));
      return L.inARow
        ? `${plural(need)} in a row on Level ${L.id} unlocks the next level. A miss starts over.`
        : `${plural(need)} on Level ${L.id} unlocks the next level.`;
    }
    const streak = p.levelStreak[SUMMIT] || 0;
    if (!p.summit) return `${plural(Math.max(0, goalFor(L) - streak))} in a row on Dollar Summit unlocks Endless Castle. A miss starts over.`;
    if (!p.champion) return `${plural(Math.max(0, G.champion.inARow - streak))} in a row makes you ${G.champion.name}!`;
    return `You are the ${G.champion.name}!`;
  }

  function jarHTML(k, total, extra = "") {
    const j = J.jars[k];
    return `<button type="button" class="jar" data-jar="${k}" style="--jar:${j.color}">
      <span class="jar-art">${art(j.img)}<span class="jar-total">${fmt(total)}</span></span>
      <span class="jar-name">${j.name}</span>
      <span class="jar-sub">${extra || j.sub}</span>
    </button>`;
  }

  function extraJarLine(k) {
    const p = P();
    if (k === "invest") {
      const left = J.invest.everyRuns - (p.investRuns % J.invest.everyRuns);
      return `Grows in ${left} run${left === 1 ? "" : "s"}`;
    }
    if (k === "save" && p.saveGoal) {
      const g = itemById(p.saveGoal);
      if (g) return `Goal: ${g.name} ${fmt(g.price)}`;
    }
    return "";
  }

  $("levelMap").addEventListener("click", (e) => {
    const b = e.target.closest(".level-btn");
    if (!b || b.disabled) return;
    P().level = Number(b.dataset.level);
    save();
    renderHome();
    Voice.say(level().name);
  });

  $("jarShelf").addEventListener("click", (e) => {
    const b = e.target.closest(".jar");
    if (!b) return;
    const k = b.dataset.jar;
    if (k === "tithe") openGiving();
    else if (k === "invest") openInvest();
    else if (k === "save") openSave();
    else openStore();
  });

  $("runBtn").addEventListener("click", beginRun);
  $("storeBtn").addEventListener("click", openStore);
  $("bankBtn").addEventListener("click", () => openSheet("bankSheet"));
  $("recordsBtn").addEventListener("click", () => openSheet("recordsSheet"));
  $("roomBtn").addEventListener("click", () => openSheet("roomSheet"));
  $("soundBtn").addEventListener("click", () => {
    muted = !muted;
    localStorage.setItem(SOUND_KEY, muted ? "1" : "0");
    if (muted && "speechSynthesis" in window) speechSynthesis.cancel();
    if (muted) Music.stop();
    else Music.start();
    renderHome();
  });
  $("helpBtn").addEventListener("click", () => {
    openGeneric(`<h2>How to play</h2>
      <ol class="how">
        <li><b>Run!</b> Drag your runner side to side to grab coins. Dodge the rocks and cactus: bumping one makes you dizzy, and you can't grab coins until it wears off.</li>
        <li><b>Count.</b> Add up your coins and type the total.</li>
        <li><b>Give first.</b> 1 cent of every 10 goes in the Tithe jar for God.</li>
        <li><b>Split the rest.</b> Drag coins into Invest (it grows!), Save (for a big goal), and Spend (for the store).</li>
        <li><b>Shop.</b> Pay the exact price with your coins. Need different coins? Use the exchange counter.</li>
        <li><b>Powers!</b> Everything you buy has a special power. Before each run, pick ${S.powerSlots} powers to bring along.</li>
      </ol>
      <p class="note">Count right on the first try for a Perfect Count star. ${G.unlockPerfectCounts} Perfect Counts unlock the next level. On Mystery Mountain and Dollar Summit you need them in a row. Get ${G.champion.inARow} in a row on Dollar Summit to become ${G.champion.name}. Clearing Dollar Summit opens ${LEVELS[ENDLESS].name}: coins fall faster and faster until you miss ${LEVELS[ENDLESS].lives}. Beat your best for a world record!</p>
      <button type="button" class="primary-btn" data-close>Got it!</button>`);
  });

  $("playerChip").addEventListener("click", () => {
    const names = Object.keys(data.players);
    openGeneric(`<h2>Who's playing?</h2>
      <div class="player-list">${names.map((n) => `<button type="button" class="player-pick ${n === data.current ? "selected" : ""}" data-player="${n}">${ICON.person} ${n}<small>Level ${data.players[n].level}</small></button>`).join("")}</div>
      <button type="button" class="secondary-btn" data-add-player>+ Add player</button>
      <details class="grownups"><summary>Grown-ups</summary>
        <button type="button" class="text-btn" data-reset-player>Reset ${data.current}'s progress</button>
      </details>`);
  });

  // All buttons inside the generic modal.
  $("genericBody").addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("[data-close]")) return closeGeneric();

    const pick = t.closest("[data-player]");
    if (pick) {
      data.current = pick.dataset.player;
      save();
      closeGeneric(false);
      return renderHome();
    }
    if (t.closest("[data-add-player]")) {
      const name = (window.prompt("Player name?") || "").trim();
      if (name && !data.players[name]) {
        data.players[name] = newPlayer(name, 0);
        data.current = name;
        save();
      }
      closeGeneric(false);
      return renderHome();
    }
    if (t.closest("[data-reset-player]")) {
      if (window.confirm(`Erase all of ${data.current}'s coins, items, and records?`)) {
        const cfg = G.players.find((c) => c.name === data.current);
        data.players[data.current] = newPlayer(data.current, cfg ? cfg.startLevel : 0);
        save();
      }
      closeGeneric(false);
      return renderHome();
    }
    const pw = t.closest("[data-power]");
    if (pw) return togglePower(pw.dataset.power);
    if (t.closest("[data-power-go]")) {
      P().powers = powerPick.slice();
      powerPick.map(itemById).forEach((i) => {
        if (i.cat === "runner" || i.cat === "trail") P().equipped[i.cat] = i.id;
      });
      save();
      closeGeneric(false);
      return startRun();
    }
    const go = t.closest("[data-go]");
    if (go) {
      closeGeneric(false);
      if (go.dataset.go === "run") beginRun();
      else if (go.dataset.go === "store") openStore();
      else { show("home"); renderHome(); }
      return;
    }
    const cause = t.closest("[data-cause]");
    if (cause) return giveTo(cause.dataset.cause);
    if (t.closest("[data-wd-open]")) return openWithdraw();
    if (t.closest("[data-wd-cancel]")) { wd = null; return openInvest(); }
    if (t.closest("[data-wd-exchange]")) return withdrawExchange();
    const take = t.closest("[data-wd-take]");
    if (take) return withdrawPick(Number(take.dataset.wdTake), 1);
    const back = t.closest("[data-wd-back]");
    if (back) return withdrawPick(Number(back.dataset.wdBack), -1);
    const wto = t.closest("[data-wd-to]");
    if (wto && !wto.disabled) return withdrawTo(wto.dataset.wdTo);
  });

  // ---------- Powers ----------
  const STAR = "\u2605";
  const ownedPowerItems = () => P().owned.map(itemById).filter((i) => i && i.power && S.powers[i.power]);
  function powerVal(item) {
    const vals = S.powers[item.power].values;
    return vals[Math.min(item.lvl || 1, vals.length) - 1];
  }
  const powerName = (item) => `${S.powers[item.power].name} ${STAR.repeat(item.lvl || 1)}`;
  // On Endless Castle there is no clock or tray limit, so Time and Bag powers give extra misses instead.
  const extraLives = (item) => item.lvl || 1;
  function powerText(item) {
    const v = powerVal(item);
    const s = v === 1 ? "" : "s";
    switch (item.power) {
      case "magnet": return "Nearby coins fly to you.";
      case "shield": return `Bounce off ${v} rock${s} without tripping.`;
      case "time": return level().endless ? `${extraLives(item)} more miss${extraLives(item) === 1 ? "" : "es"} allowed.` : `${v} more seconds to run.`;
      case "bag":
        if (level().endless) return `${extraLives(item)} more miss${extraLives(item) === 1 ? "" : "es"} allowed.`;
        return level().maxCoins ? `Carry ${v} more coins.` : `${v} more seconds to run.`;
      case "slow": return "Coins fall slower.";
      case "rain": return `${v} coin shower${s} during the run.`;
      case "lucky": return "More big coins fall.";
      case "speed": return "Zoom side to side faster.";
      case "fire": return "Rocks and cactus burn up before they reach you.";
      default: return "";
    }
  }

  let powerPick = [];
  function beginRun() {
    const items = ownedPowerItems();
    if (!items.length) return startRun();
    const ids = items.map((i) => i.id);
    powerPick = (P().powers || []).filter((id) => ids.includes(id)).slice(0, S.powerSlots);
    renderPowerPicker();
    Voice.say(`Pick up to ${S.powerSlots} powers for your run!`);
  }

  function renderPowerPicker() {
    const items = ownedPowerItems();
    const picked = powerPick.map(itemById);
    openGeneric(`<img src="${runnerImg()}" class="picker-runner" alt="" draggable="false" />
      <h2>Pick your powers!</h2>
      <p class="note">Choose up to ${S.powerSlots}. Only one of each kind. Tap again to take it off.</p>
      <div class="power-grid">${items.map((i) => `<button type="button" class="power-card ${powerPick.includes(i.id) ? "on" : ""}" data-power="${i.id}">
        ${art(i.img, "power-art")}<b>${powerName(i)}</b><small>${powerText(i)}</small>
      </button>`).join("")}</div>
      <button type="button" class="primary-btn power-go" data-power-go>${picked.length ? `Go with ${picked.map((i) => S.powers[i.power].name).join(" + ")}!` : "Go with no powers"}</button>`);
  }

  function togglePower(id) {
    const item = itemById(id);
    if (powerPick.includes(id)) {
      powerPick = powerPick.filter((x) => x !== id);
    } else {
      powerPick = powerPick.filter((x) => itemById(x).power !== item.power);
      if (powerPick.length >= S.powerSlots) powerPick.shift();
      powerPick.push(id);
      if (item.cat === "runner" || item.cat === "trail") {
        P().equipped[item.cat] = item.id;
        save();
        $("runBtnRunner").src = runnerImg();
      }
      Voice.say(`${S.powers[item.power].name}! ${powerText(item)}`);
    }
    Sfx.drop();
    renderPowerPicker();
  }

  function luckyWeights(weights, lv) {
    if (!lv) return weights;
    const ds = Object.keys(weights).map(Number).sort((a, b) => a - b);
    const out = {};
    ds.forEach((d, i) => { out[d] = COINS[d].bill ? weights[d] : weights[d] * (1 + lv * 0.6 * i); });
    return out;
  }

  function renderPowerHud() {
    $("powerHud").innerHTML = Object.entries(run.pw).map(([k, p]) => {
      let badge = "";
      if (k === "shield") badge = run.shields;
      if (k === "rain") badge = run.showers.length;
      return `<span class="power-chip ${badge === 0 ? "used" : ""}" title="${S.powers[k].name}">${art(p.item.img)}${badge !== "" ? `<b>${badge}</b>` : ""}</span>`;
    }).join("");
    runnerEl.classList.toggle("shielded", run.shields > 0);
    runnerEl.classList.toggle("fiery", !!run.pw.fire);
  }

  // ---------- Run ----------
  const world = $("world");
  const entities = $("entities");
  const runnerEl = $("runner");
  const path3d = window.CRR_Path3D(world);
  let run = null;

  function startRun() {
    Sfx.get();
    const L = level();
    const p = P();
    const pw = {};
    (p.powers || []).map(itemById)
      .filter((i) => i && i.power && S.powers[i.power] && p.owned.includes(i.id))
      .slice(0, S.powerSlots)
      .forEach((i) => { pw[i.power] = { item: i, v: powerVal(i) }; });
    const endless = !!L.endless;
    const timed = !L.maxCoins && !endless;
    const dur = endless ? Infinity : (L.seconds || G.runSeconds) + (pw.time ? pw.time.v : 0) + (timed && pw.bag ? pw.bag.v : 0);
    const showers = !pw.rain ? [] : Array.from({ length: pw.rain.v }, (_, k) => (endless ? 25 * (k + 1) : (dur * (k + 1)) / (pw.rain.v + 1)));
    run = {
      L, t: 0, dur, items: [], haul: [], endless, misses: 0,
      lives: endless ? L.lives + (pw.time ? extraLives(pw.time.item) : 0) + (pw.bag ? extraLives(pw.bag.item) : 0) : 0,
      spawnT: 0.2, obsT: 3, trailT: 0, x: 0, targetX: 0, stumble: 0,
      last: 0, running: false, lastLane: -1, ended: false,
      pw,
      maxCoins: timed || endless ? Infinity : L.maxCoins + (pw.bag ? pw.bag.v : 0),
      weights: luckyWeights(L.weights, pw.lucky ? pw.lucky.v : 0),
      shields: pw.shield ? pw.shield.v : 0,
      slow: pw.slow ? pw.slow.v : 1,
      steer: pw.speed ? pw.speed.v : 9,
      showers
    };
    show("run");
    $("timerBar").classList.toggle("hidden", endless);
    $("lives").classList.toggle("hidden", !endless);
    renderPowerHud();
    entities.innerHTML = "";
    $("runnerImg").src = runnerImg();
    $("dragHint").style.display = "";
    measure();
    path3d.clear();
    run.x = run.targetX = run.W / 2;
    placeRunner();
    updateRunHud();
    countdown(["3", "2", "1", "Go!"], () => {
      run.running = true;
      run.last = performance.now();
      run.frame = requestAnimationFrame(tick);
    });
  }

  function measure() {
    const r = world.getBoundingClientRect();
    run.W = r.width;
    run.H = r.height;
    run.scale = Math.max(0.75, Math.min(1.3, r.width / 520));
    run.runnerY = r.height - 70 * run.scale;
    run.edge = Math.round(48 * run.scale);
    runnerEl.style.setProperty("--runner-h", `${Math.round(110 * run.scale)}px`);
    path3d.resize(run.W, run.H, run.runnerY);
    run.ppu = path3d.ppu();
  }
  const worldX = (px) => (px - run.W / 2) / run.ppu;

  function countdown(steps, done) {
    const b = $("runBanner");
    let i = 0;
    const step = () => {
      if (!run || run.ended) return;
      if (i >= steps.length) { b.classList.add("hidden"); done(); return; }
      b.textContent = steps[i];
      b.classList.remove("hidden");
      flash(b, "pop");
      Sfx.tone(i === steps.length - 1 ? 880 : 520, 0.15, { type: "square", vol: 0.05 });
      i += 1;
      setTimeout(step, 650);
    };
    step();
  }

  function placeRunner() {
    runnerEl.style.transform = `translate(${run.x}px, ${run.runnerY}px) translate(-50%, -50%)`;
  }

  function pickCoin(weights) {
    const entries = Object.entries(weights);
    let r = Math.random() * entries.reduce((s, [, w]) => s + w, 0);
    for (const [d, w] of entries) { r -= w; if (r <= 0) return Number(d); }
    return Number(entries[0][0]);
  }

  function spawn(kind, opts = {}) {
    const lanes = 5;
    let lane = opts.lane;
    if (lane == null) {
      lane = Math.floor(Math.random() * lanes);
      if (lane === run.lastLane) lane = (lane + 1 + Math.floor(Math.random() * (lanes - 1))) % lanes;
      run.lastLane = lane;
    }
    // Lanes cover the middle of the screen so coins stay on the painted road.
    const x = worldX(run.W * (0.5 + (lane - (lanes - 1) / 2) * 0.16));
    const z = opts.z == null ? -path3d.FAR : opts.z;
    const phase = Math.random() * 6;
    let item;
    if (kind === "coin") {
      const d = pickCoin(run.weights);
      const c = COINS[d];
      const size = run.scale * 1.15;
      let obj, r;
      if (c.bill) {
        const w = 120 * size;
        obj = path3d.bill(c.img, w, w * 0.48);
        r = w * 0.4;
      } else {
        r = (c.mm * 2.6 * size) / 2;
        obj = path3d.coin(c.img, r, d === 1, run.L.labels ? `${d}${CENT}` : "");
      }
      item = { kind, d, x, z, r, obj, phase, bonus: !!opts.bonus };
    } else {
      const src = G.obstacles[Math.floor(Math.random() * G.obstacles.length)];
      const px = Math.round(64 * run.scale);
      item = { kind, x, z, r: px * 0.38, obj: path3d.sprite(src, px), phase };
    }
    path3d.place(item.obj, item.x, item.z, run.t, phase);
    run.items.push(item);
  }

  function tick(now) {
    if (!run || !run.running) return;
    const dt = Math.min(0.05, (now - run.last) / 1000);
    run.last = now;
    run.t += dt;

    run.spawnT -= dt;
    if (run.spawnT <= 0) {
      spawn("coin");
      run.spawnT = run.endless
        ? Math.max(0.42, 1.15 / (1 + run.t / 60)) * (0.85 + Math.random() * 0.3)
        : 0.55 + Math.random() * 0.35;
    }
    if (run.L.obstacles) {
      run.obsT -= dt;
      if (run.obsT <= 0) {
        spawn("obstacle");
        run.obsT = 2.2 + Math.random() * 1.6;
      }
    }

    if (run.showers.length && run.t >= run.showers[0]) {
      run.showers.shift();
      coinShower();
    }

    run.x += (run.targetX - run.x) * Math.min(1, dt * run.steer);
    placeRunner();
    if (run.stumble > 0) {
      run.stumble -= dt;
      if (run.stumble <= 0) runnerEl.classList.remove("stumble");
    }

    const trail = P().equipped.trail && itemById(P().equipped.trail);
    if (trail) {
      run.trailT -= dt;
      if (run.trailT <= 0) {
        run.trailT = 0.1;
        const t = document.createElement("img");
        t.className = "trail";
        t.src = trail.img;
        t.alt = "";
        t.style.transform = `translate(${run.x + (Math.random() * 30 - 15)}px, ${run.runnerY + 40 * run.scale}px) translate(-50%, -50%)`;
        entities.appendChild(t);
        setTimeout(() => t.remove(), 600);
      }
    }

    const ramp = run.endless ? Math.min(3, 1 + run.t / 40) : 1 + (run.t / run.dur) * 0.25;
    // Path units per second: about 3 seconds from the horizon to the runner at a level's base speed.
    const speed = (path3d.FAR / 3) * (run.L.speed / 200) * run.slow * ramp;
    const ahead = (px) => (px / (run.H * 0.9)) * path3d.FAR;
    const reach = 30 * run.scale;
    const pull = run.pw.magnet ? run.pw.magnet.v * run.scale : 0;
    const rx = worldX(run.x);
    for (const it of run.items) {
      if (it.gone) continue;
      const before = it.z;
      it.z += speed * dt;
      const gap = Math.abs(it.x - rx) * run.ppu;
      if (pull && it.kind === "coin" && it.z < 0 && -it.z < ahead(pull * 1.6) && gap < pull) {
        it.x += (rx - it.x) * Math.min(1, dt * 6);
      }
      if (run.pw.fire && it.kind === "obstacle" && it.z < 0 && -it.z < ahead(170 * run.scale) && gap < it.r + reach + 30 * run.scale) {
        burnObstacle(it);
        continue;
      }
      path3d.place(it.obj, it.x, it.z, run.t, it.phase);
      if (before < 0 && it.z >= 0 && gap < it.r + reach) {
        if (it.kind === "coin" && run.stumble <= 0) collect(it);
        else if (it.kind === "coin" && !it.missed) { it.missed = true; path3d.fx(it.obj, "ghost"); }
        else if (it.kind === "obstacle") hitObstacle(it);
      } else if (it.z > 2.5) {
        it.gone = true;
        path3d.remove(it.obj);
        if (run.endless && it.kind === "coin" && !it.bonus) missCoin(it);
      }
    }
    run.items = run.items.filter((it) => !it.gone);
    path3d.update(dt);
    path3d.render();

    updateRunHud();
    if (run.endless && run.misses >= run.lives) return endRun(`${run.lives} misses!`);
    if (run.t >= run.dur) return endRun("Time!");
    if (run.haul.length >= run.maxCoins) return endRun("Tray full!");
    run.frame = requestAnimationFrame(tick);
  }

  function collect(it) {
    it.gone = true;
    path3d.fx(it.obj, "grab");
    run.haul.push(it.d);
    Sfx.coin();
    flash($("trayCount"), "pop");
  }

  function hitObstacle(it) {
    it.gone = true;
    if (run.shields > 0) {
      run.shields -= 1;
      path3d.fx(it.obj, "fling", { dir: it.x < worldX(run.x) ? -1 : 1 });
      Sfx.tone(660, 0.12, { type: "triangle", vol: 0.08 });
      flash(runnerEl, "shield-hit");
      renderPowerHud();
      return;
    }
    path3d.remove(it.obj);
    run.stumble = 1.2;
    runnerEl.classList.add("stumble");
    const pop = document.createElement("div");
    pop.className = "bonk-pop";
    pop.textContent = "Dizzy!";
    pop.style.transform = `translate(${run.x}px, ${run.runnerY - 70 * run.scale}px) translate(-50%, -50%)`;
    entities.appendChild(pop);
    setTimeout(() => pop.remove(), 1100);
    Sfx.bonk();
  }

  function missCoin(it) {
    run.misses += 1;
    const pop = document.createElement("div");
    pop.className = "miss-pop";
    pop.textContent = "Missed!";
    const x = Math.max(50, Math.min(run.W - 50, run.W / 2 + it.x * run.ppu));
    pop.style.transform = `translate(${x}px, ${run.H - 30 * run.scale}px) translate(-50%, -50%)`;
    entities.appendChild(pop);
    setTimeout(() => pop.remove(), 900);
    flash($("lives"), "lost");
    Sfx.tone(260, 0.18, { type: "triangle", vol: 0.08, slide: -80 });
  }

  function burnObstacle(it) {
    it.gone = true;
    path3d.fx(it.obj, "burn", { src: "assets/fire.png" });
    Sfx.tone(180, 0.2, { type: "sawtooth", vol: 0.05 });
  }

  function coinShower() {
    const b = $("runBanner");
    b.textContent = "Coin shower!";
    b.classList.remove("hidden");
    flash(b, "pop");
    setTimeout(() => { if (run && run.running) b.classList.add("hidden"); }, 1000);
    Sfx.fanfare();
    for (let i = 0; i < 7; i++) spawn("coin", { lane: i % 5, z: -path3d.FAR - i * 2.5, bonus: true });
    renderPowerHud();
  }

  function updateRunHud() {
    $("timerFill").style.width = `${Math.max(0, 100 - (run.t / run.dur) * 100)}%`;
    const n = run.haul.length;
    $("trayCount").textContent = run.maxCoins === Infinity ? `${n} coin${n === 1 ? "" : "s"}` : `${n} / ${run.maxCoins} coins`;
    if (run.endless) {
      const left = Math.max(0, run.lives - run.misses);
      const html = Array.from({ length: run.lives }, (_, i) => `<i class="${i < left ? "" : "gone"}">${ICON.life}</i>`).join("");
      if ($("lives").dataset.html !== html) { $("lives").innerHTML = html; $("lives").dataset.html = html; }
    }
  }

  function endRun(msg) {
    if (!run || run.ended) return;
    run.running = false;
    run.ended = true;
    cancelAnimationFrame(run.frame);
    path3d.clear();
    run.items = [];
    const b = $("runBanner");
    if (!run.haul.length) {
      b.textContent = "No coins this time!";
      b.classList.remove("hidden");
      Sfx.oops();
      setTimeout(() => { show("home"); renderHome(); }, 1600);
      return;
    }
    b.textContent = msg;
    b.classList.remove("hidden");
    flash(b, "pop");
    Sfx.ching();
    const p = P();
    const caught = run.haul.length;
    const record = run.endless && caught > p.endlessBest;
    const beat = record && p.endlessBest > 0;
    if (record) { p.endlessBest = caught; save(); }
    setTimeout(() => {
      b.classList.add("hidden");
      if (beat) celebrate([{ record: true, img: "assets/castle.png", title: G.fanfare, text: `Endless Castle: ${caught} coins caught!` }], startCount);
      else startCount();
    }, 1200);
  }

  function setTarget(clientX) {
    if (!run) return;
    const r = world.getBoundingClientRect();
    run.targetX = Math.max(run.edge, Math.min(r.width - run.edge, clientX - r.left));
    $("dragHint").style.display = "none";
  }
  let steering = false;
  world.addEventListener("pointerdown", (e) => { steering = true; world.setPointerCapture?.(e.pointerId); setTarget(e.clientX); });
  world.addEventListener("pointermove", (e) => { if (steering) setTarget(e.clientX); });
  world.addEventListener("pointerup", () => { steering = false; });
  world.addEventListener("pointercancel", () => { steering = false; });
  window.addEventListener("keydown", (e) => {
    if (!run || !run.running) return;
    if (e.key === "ArrowLeft") run.targetX = Math.max(run.edge, run.targetX - 60);
    if (e.key === "ArrowRight") run.targetX = Math.min(run.W - run.edge, run.targetX + 60);
  });
  window.addEventListener("resize", () => { if (run && run.running) measure(); });
  $("quitRunBtn").addEventListener("click", () => {
    if (run) { run.running = false; run.ended = true; cancelAnimationFrame(run.frame); path3d.clear(); }
    show("home");
    renderHome();
  });

  // ---------- Count ----------
  let count = null;
  makeNumpad($("countPad"), (k) => {
    if (!count || count.locked) return;
    if (k === "ok") return submitCount();
    count.entry = padInput(count.entry, k);
    showDisplay($("countDisplay"), count.entry);
  });

  function startCount() {
    const haul = shuffle(run.haul.slice());
    const total = haul.reduce((s, d) => s + d, 0);
    count = {
      haul, total, rots: haul.map(() => Math.round(Math.random() * 40 - 20)),
      attempts: 0, mode: haul.length > 20 ? "grouped" : "spread", entry: "", tapped: 0, running: 0, locked: false, newLevel: null
    };
    show("count");
    const prompt = "How much did you collect?";
    $("countPrompt").textContent = prompt;
    $("countHelp").textContent = "";
    showDisplay($("countDisplay"), "");
    renderCountTable();
    Voice.say(prompt);
  }

  function renderCountTable() {
    const L = level();
    const table = $("countTable");
    $("countTip").classList.toggle("hidden", count.mode !== "spread");
    if (count.mode === "spread") {
      table.className = "coin-table movable";
      table.innerHTML = count.haul.map((d, i) =>
        `<span class="spread" data-idx="${i}" style="transform:rotate(${count.rots[i]}deg)">${coinHTML(d, { size: 1.25, label: L.labels })}</span>`
      ).join("");
      return;
    }
    const sorted = count.haul.slice().sort((a, b) => b - a);
    // Big hauls start grouped by kind with no names, so counting stays the job but dragging 50 coins doesn't.
    const grouped = count.mode === "grouped";
    table.className = "coin-table rows";
    let i = 0;
    table.innerHTML = DENOMS.filter((d) => sorted.includes(d)).map((d) => {
      const n = sorted.filter((x) => x === d).length;
      const coins = Array.from({ length: n }, () => {
        const idx = i++;
        const cls = count.mode === "countup" ? (idx < count.tapped ? "tapped" : idx === count.tapped ? "next" : "") : "";
        return coinHTML(d, { size: 1.15, label: grouped ? L.labels : true, cls, attrs: `data-idx="${idx}"` });
      }).join("");
      const rowLabel = grouped ? `${ICON.times}${n}` : `${n} ${n === 1 ? COINS[d].name : COINS[d].plural}`;
      return `<div class="coin-row"><span class="row-label">${rowLabel}</span><div class="row-coins">${coins}</div></div>`;
    }).join("");
  }

  $("countTable").addEventListener("click", (e) => {
    if (!count || count.mode !== "countup") return;
    const c = e.target.closest(".coin");
    if (!c) return;
    const idx = Number(c.dataset.idx);
    if (idx !== count.tapped) return;
    const sorted = count.haul.slice().sort((a, b) => b - a);
    count.running += sorted[idx];
    count.tapped += 1;
    Sfx.drop();
    renderCountTable();
    $("countHelp").textContent = `Counting up: ${fmt(count.running)}`;
    if (count.tapped >= sorted.length) {
      count.locked = false;
      Voice.say(`${count.running >= 100 ? fmt(count.running) : count.running}. Now type the total.`);
      $("countHelp").textContent = `Counting up: ${fmt(count.running)}. Now type the total!`;
    } else {
      Voice.say(count.running >= 100 ? fmt(count.running) : String(count.running));
    }
  });

  // Drag coins around the counting table to put the same kinds together.
  let cdrag = null;
  function clearCountMarks() {
    document.querySelectorAll("#countTable .drop-before, #countTable .drop-after").forEach((el) => el.classList.remove("drop-before", "drop-after"));
  }
  function countDropAt(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el || !el.closest("#countTable")) return null;
    const sp = el.closest(".spread[data-idx]");
    if (!sp) return { el: null, at: count.haul.length };
    const r = sp.getBoundingClientRect();
    const after = x > r.left + r.width / 2;
    return { el: sp, after, at: Number(sp.dataset.idx) + (after ? 1 : 0) };
  }
  $("countTable").addEventListener("pointerdown", (e) => {
    if (!count || count.mode !== "spread" || count.locked || cdrag) return;
    const sp = e.target.closest(".spread[data-idx]");
    if (!sp) return;
    e.preventDefault();
    const idx = Number(sp.dataset.idx);
    const ghost = document.createElement("div");
    ghost.className = "drag-ghost";
    ghost.innerHTML = coinHTML(count.haul[idx], { size: 1.35, label: level().labels });
    document.body.appendChild(ghost);
    sp.classList.add("dragging");
    cdrag = { idx, ghost, el: sp };
    ghost.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    Sfx.get();
  });
  window.addEventListener("pointermove", (e) => {
    if (!cdrag) return;
    e.preventDefault();
    cdrag.ghost.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    clearCountMarks();
    const t = countDropAt(e.clientX, e.clientY);
    if (t && t.el && t.el !== cdrag.el) t.el.classList.add(t.after ? "drop-after" : "drop-before");
  }, { passive: false });
  function endCountDrag(e, drop) {
    if (!cdrag) return;
    const d = cdrag;
    cdrag = null;
    d.ghost.remove();
    d.el.classList.remove("dragging");
    clearCountMarks();
    const t = drop && countDropAt(e.clientX, e.clientY);
    if (!t || !count || count.mode !== "spread") return;
    let at = t.at;
    if (at === d.idx || at === d.idx + 1) return;
    const [coin] = count.haul.splice(d.idx, 1);
    const [rot] = count.rots.splice(d.idx, 1);
    if (at > d.idx) at -= 1;
    count.haul.splice(at, 0, coin);
    count.rots.splice(at, 0, rot);
    Sfx.drop();
    renderCountTable();
  }
  window.addEventListener("pointerup", (e) => endCountDrag(e, true));
  window.addEventListener("pointercancel", (e) => endCountDrag(e, false));

  $("countHear").addEventListener("click", () => Voice.say($("countPrompt").textContent));

  function submitCount() {
    const n = parseInt(count.entry, 10);
    if (Number.isNaN(n)) return;
    const p = P();
    if (n === count.total) {
      count.locked = true;
      const perfect = count.attempts === 0;
      logMoney("Counting money", perfect, { amount: fmt(count.total), tries: count.attempts + 1 });
      const pending = [];
      if (perfect) {
        p.perfect[p.level] = (p.perfect[p.level] || 0) + 1;
        p.levelStreak[p.level] = (p.levelStreak[p.level] || 0) + 1;
        p.streak += 1;
        if (p.streak > p.bestStreak) {
          if (p.bestStreak > 0) pending.push({ record: true, img: "assets/stars.png", title: G.fanfare, text: `Longest Perfect Count streak: ${p.streak}!` });
          p.bestStreak = p.streak;
        }
        if (count.total > p.bestHaul) {
          if (p.bestHaul > 0) pending.push({ record: true, img: "assets/save1000.png", title: G.fanfare, text: `Biggest perfect haul: ${fmt(count.total)}!` });
          p.bestHaul = count.total;
        }
        const L = level();
        const reached = progressFor(p, L) >= goalFor(L);
        if (p.level === p.unlocked && p.unlocked < SUMMIT && reached) {
          p.unlocked += 1;
          count.newLevel = p.unlocked;
          pending.push({ img: "assets/sparkle.png", title: `Level ${p.unlocked} unlocked!`, text: `${LEVELS[p.unlocked].name}: ${LEVELS[p.unlocked].note}` });
        }
        if (p.level === SUMMIT && reached && !p.summit) {
          p.summit = true;
          pending.push({ record: true, img: "assets/castle.png", title: "Dollar Summit cleared!", text: `${goalFor(L)} Perfect Counts in a row at the top. You beat ${G.name}! Get ${G.champion.inARow} in a row to become ${G.champion.name}.` });
        }
        if (p.summit && ENDLESS > 0 && p.unlocked < ENDLESS) {
          p.unlocked = ENDLESS;
          count.newLevel = ENDLESS;
          pending.push({ img: "assets/sparkle.png", title: `${LEVELS[ENDLESS].name} unlocked!`, text: LEVELS[ENDLESS].note });
        }
        if (p.level === G.champion.level && p.levelStreak[p.level] >= G.champion.inARow && !p.champion) {
          p.champion = true;
          pending.push({ record: true, img: G.champion.img, title: `${G.champion.name}!`, text: `${G.champion.inARow} Perfect Counts in a row on Dollar Summit. Your medal is in the Record Room!` });
        }
      } else {
        p.streak = 0;
        p.levelStreak[p.level] = 0;
      }
      save();
      sortPending = pending;
      Sfx.ching();
      flash($("countDisplay"), "right");
      $("countHelp").textContent = perfect ? `Perfect Count! ${fmt(count.total)}` : `Yes! ${fmt(count.total)}`;
      Voice.say(perfect ? `Perfect count! ${fmt(count.total)}!` : `Yes! ${fmt(count.total)}!`);
      setTimeout(startSort, 1700);
      return;
    }

    count.attempts += 1;
    count.entry = "";
    showDisplay($("countDisplay"), "");
    flash($("countDisplay"), "wrong");
    Sfx.oops();
    const help = (msg) => { $("countHelp").textContent = msg; Voice.say(msg); };
    if (count.attempts === 1) {
      help("Almost! Try again.");
    } else if (count.attempts === 2) {
      count.mode = "sorted";
      renderCountTable();
      help("Let's sort them. Biggest coins first. Try again!");
    } else if (count.attempts === 3) {
      count.mode = "countup";
      count.tapped = 0;
      count.running = 0;
      count.locked = true;
      renderCountTable();
      help("Let's count up together. Tap each coin, starting with the glowing one.");
    } else {
      count.locked = true;
      help(`It's ${fmt(count.total)}. We'll get it next time!`);
      P().streak = 0;
      P().levelStreak[P().level] = 0;
      save();
      sortPending = [];
      setTimeout(startSort, 2600);
    }
  }

  // ---------- Sort into jars (drag and drop) ----------
  let sort = null;
  let sortPending = [];

  makeNumpad($("askPad"), (k) => {
    if (!sort || sort.phase !== "ask") return;
    if (k === "ok") return submitAsk();
    sort.askEntry = padInput(sort.askEntry, k, 3);
    showDisplay($("askDisplay"), sort.askEntry);
  });

  function startSort() {
    const total = count.total;
    const tithe = Math.floor(total / J.titheEvery);
    sort = {
      tray: purseFrom(count.haul),
      total,
      tithe,
      phase: tithe > 0 ? (level().titheShown ? "tithe" : "ask") : "free",
      added: { tithe: emptyPurse(), invest: emptyPurse(), save: emptyPurse(), spend: emptyPurse() },
      titheAttempts: 0,
      askAttempts: 0,
      askEntry: "",
      toldSmaller: false
    };
    show("sort");
    $("sortHelp").textContent = "";
    showDisplay($("askDisplay"), "");
    renderSort();
    Voice.say(sortPromptText());
  }

  function sortPromptText() {
    if (sort.phase === "ask") return `You earned ${fmt(sort.total)}. For every 10 cents, 1 cent goes to God. How much goes to God?`;
    if (sort.phase === "tithe") return `God gets ${fmt(sort.tithe)} first. Drag ${fmt(sort.tithe)} into the Tithe jar.`;
    if (!purseCount(sort.tray)) return "All sorted! Tap Deposit.";
    if (sort.tithe === 0) return `You earned ${fmt(sort.total)}. That's under 10 cents, so giving is your choice! Drag your coins into the jars.`;
    return "Now drag the rest into Invest, Save, or Spend.";
  }

  const jarLocked = (k) => sort.phase !== "free" && k !== "tithe";

  function renderSort() {
    const L = level();
    $("sortPrompt").textContent = sortPromptText();
    $("titheAsk").classList.toggle("hidden", sort.phase !== "ask");

    $("sortJars").innerHTML = J.order.map((k) => {
      const j = J.jars[k];
      const locked = jarLocked(k) || sort.phase === "ask";
      const coins = purseList(sort.added[k]).map((d) => coinHTML(d, { size: 0.7, label: L.labels, attrs: `data-from="${k}"` })).join("");
      const showTotal = k === "tithe" && sort.phase === "tithe" && sort.titheAttempts >= 2;
      return `<div class="sort-jar ${locked ? "locked" : ""} ${k === "tithe" && sort.phase === "tithe" ? "target" : ""}" data-jar="${k}" style="--jar:${j.color}">
        <div class="sort-jar-head">${j.name}${locked ? ` ${ICON.lock}` : ""}</div>
        <div class="sort-jar-glass">
          ${art(j.img, "sort-jar-img")}
          <div class="sort-jar-coins">${coins}</div>
        </div>
        ${showTotal ? `<div class="sort-jar-total">${fmt(purseTotal(sort.added[k]))}</div>` : ""}
      </div>`;
    }).join("");

    $("sortTray").innerHTML = purseList(sort.tray).map((d) => coinHTML(d, { size: 1, label: L.labels, attrs: `data-from="tray"` })).join("") || `<p class="note">All coins sorted!</p>`;

    const inTithe = sort.phase === "tithe";
    const free = sort.phase === "free";
    $("titheDoneBtn").classList.toggle("hidden", !inTithe);
    $("finishSortBtn").classList.toggle("hidden", !free);
    $("finishSortBtn").disabled = purseCount(sort.tray) > 0;
    $("exchangeBtn").classList.toggle("hidden", sort.phase === "ask" || !purseCount(sort.tray));
    const needSmaller = inTithe && !canMake(sumPurses(sort.tray, sort.added.tithe), sort.tithe);
    $("exchangeBtn").classList.toggle("attention", needSmaller);
    if (needSmaller && !sort.toldSmaller) {
      sort.toldSmaller = true;
      $("sortHelp").textContent = "You need smaller coins! Open the exchange counter to break a coin.";
    }

    const rest = $("restBtns");
    const showRest = free && purseCount(sort.tray) > 0;
    rest.classList.toggle("hidden", !showRest);
    rest.innerHTML = showRest
      ? `<span>Or put the rest in:</span>${["invest", "save", "spend"].map((k) => `<button type="button" class="chip-btn" data-rest="${k}" style="--jar:${J.jars[k].color}">${J.jars[k].name}</button>`).join("")}`
      : "";
  }

  // Move one coin between the tray and the jars. Returns false if the move isn't allowed.
  function moveCoin(d, from, to) {
    if (from === to) return false;
    if (to !== "tray" && jarLocked(to)) {
      Sfx.oops();
      const msg = `God's part goes first! Drag ${fmt(sort.tithe)} into the Tithe jar.`;
      $("sortHelp").textContent = msg;
      Voice.say(msg);
      return false;
    }
    if (from === "tithe" && sort.phase === "free" && purseTotal(sort.added.tithe) - d < sort.tithe) {
      Sfx.oops();
      $("sortHelp").textContent = "That coin is God's part. It stays in the Tithe jar.";
      return false;
    }
    const src = from === "tray" ? sort.tray : sort.added[from];
    const dst = to === "tray" ? sort.tray : sort.added[to];
    if (!src[d]) return false;
    src[d] -= 1;
    dst[d] += 1;
    Sfx.drop();
    $("sortHelp").textContent = "";
    renderSort();
    if (sort.phase === "free" && !purseCount(sort.tray)) Voice.say(sortPromptText());
    return true;
  }

  // Pointer-based drag so it works the same with a finger or a mouse.
  let drag = null;

  function dropTargetAt(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const jar = el.closest(".sort-jar");
    if (jar) return jar.dataset.jar;
    if (el.closest("#sortTray")) return "tray";
    return null;
  }

  function onDragStart(e) {
    if (!sort || sort.phase === "ask" || drag) return;
    const coin = e.target.closest(".coin[data-from]");
    if (!coin) return;
    e.preventDefault();
    const d = Number(coin.dataset.d);
    const ghost = document.createElement("div");
    ghost.className = "drag-ghost";
    ghost.innerHTML = coinHTML(d, { size: 1.2, label: level().labels });
    document.body.appendChild(ghost);
    coin.classList.add("dragging");
    drag = { d, from: coin.dataset.from, ghost, coin, x0: e.clientX, y0: e.clientY, moved: false, over: null };
    moveGhost(e.clientX, e.clientY);
    Sfx.get();
  }

  function moveGhost(x, y) {
    drag.ghost.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
  }

  function onDragMove(e) {
    if (!drag) return;
    e.preventDefault();
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 8) drag.moved = true;
    moveGhost(e.clientX, e.clientY);
    const over = dropTargetAt(e.clientX, e.clientY);
    if (over !== drag.over) {
      document.querySelectorAll(".sort-jar.over, #sortTray.over").forEach((el) => el.classList.remove("over"));
      if (over === "tray") $("sortTray").classList.add("over");
      else if (over) document.querySelector(`.sort-jar[data-jar="${over}"]`)?.classList.add("over");
      drag.over = over;
    }
  }

  function onDragEnd(e) {
    if (!drag) return;
    const d = drag;
    drag = null;
    d.ghost.remove();
    d.coin.classList.remove("dragging");
    document.querySelectorAll(".sort-jar.over, #sortTray.over").forEach((el) => el.classList.remove("over"));
    if (!d.moved) {
      // A plain tap on a coin in a jar sends it back to the tray.
      if (d.from !== "tray") moveCoin(d.d, d.from, "tray");
      else $("sortHelp").textContent = "Drag the coin into a jar.";
      return;
    }
    const target = dropTargetAt(e.clientX, e.clientY);
    if (target) moveCoin(d.d, d.from, target);
  }

  $("sortScreen").addEventListener("pointerdown", onDragStart);
  window.addEventListener("pointermove", onDragMove, { passive: false });
  window.addEventListener("pointerup", onDragEnd);
  window.addEventListener("pointercancel", () => {
    if (!drag) return;
    drag.ghost.remove();
    drag.coin.classList.remove("dragging");
    drag = null;
  });

  $("restBtns").addEventListener("click", (e) => {
    const b = e.target.closest("[data-rest]");
    if (!b) return;
    mergeInto(sort.added[b.dataset.rest], sort.tray);
    sort.tray = emptyPurse();
    Sfx.ching();
    renderSort();
    Voice.say(sortPromptText());
  });

  function submitAsk() {
    const n = parseInt(sort.askEntry, 10);
    if (Number.isNaN(n)) return;
    if (n === sort.tithe) {
      logMoney("Finding the tithe (counting tens)", sort.askAttempts === 0, { amount: fmt(sort.tithe) });
      Sfx.ching();
      $("sortHelp").textContent = `Yes! ${fmt(sort.tithe)} goes to God.`;
      sort.phase = "tithe";
      renderSort();
      Voice.say(sortPromptText());
      return;
    }
    sort.askAttempts += 1;
    sort.askEntry = "";
    showDisplay($("askDisplay"), "");
    flash($("askDisplay"), "wrong");
    Sfx.oops();
    const tens = Array.from({ length: sort.tithe }, (_, i) => (i + 1) * 10).join(", ");
    if (sort.askAttempts === 1) {
      const msg = "Hint: count the tens. How many tens are in your money?";
      $("sortHelp").textContent = msg;
      Voice.say(msg);
    } else {
      const msg = `Count the tens: ${tens}. That's ${sort.tithe} tens, so God gets ${fmt(sort.tithe)}.`;
      $("sortHelp").textContent = msg;
      Voice.say(msg);
      sort.phase = "tithe";
      setTimeout(renderSort, 300);
    }
  }

  $("titheDoneBtn").addEventListener("click", () => {
    if (!sort || sort.phase !== "tithe") return;
    const put = purseTotal(sort.added.tithe);
    if (put === sort.tithe) {
      Sfx.ching();
      sort.phase = "free";
      $("sortHelp").textContent = `Thank you for giving to God first! ${ICON.heart}`;
      Voice.say("Thank you for giving to God first! Now drag the rest into Invest, Save, or Spend.");
      renderSort();
      return;
    }
    sort.titheAttempts += 1;
    Sfx.oops();
    const msg = put < sort.tithe ? "Not enough yet!" : "That's too much. Tap a coin in the Tithe jar to send it back.";
    $("sortHelp").textContent = sort.titheAttempts >= 2 ? `${msg} The jar now shows how much is inside.` : msg;
    Voice.say(msg);
    renderSort();
  });

  $("exchangeBtn").addEventListener("click", () => openExchange(sort.tray, renderSort));
  $("sortHear").addEventListener("click", () => Voice.say(sortPromptText()));

  $("finishSortBtn").addEventListener("click", () => {
    if (!sort || purseCount(sort.tray)) return;
    const p = P();
    const pending = sortPending.slice();
    J.order.forEach((k) => mergeInto(p.jars[k], sort.added[k]));
    const extraGiven = purseTotal(sort.added.tithe) - sort.tithe;
    p.runs += 1;
    p.investRuns += 1;
    if (count.newLevel != null) p.level = count.newLevel;
    const invested = purseTotal(sort.added.invest);
    if (invested) investLots().push({ cents: invested, run: p.runs });

    if (p.investRuns % J.invest.everyRuns === 0) {
      const bonus = Math.floor(jarTotal("invest") / 10) * J.invest.centsPer10;
      if (bonus > 0) {
        mergeInto(p.jars.invest, makeChange(bonus));
        pending.push({ img: "assets/invest100.png", title: "Your money grew!", text: `Your Invest jar earned ${fmt(bonus)}. It has ${fmt(jarTotal("invest"))} now.` });
      } else {
        pending.push({ img: J.jars.invest.img, title: "Grow time!", text: "Put at least 10 cents in Invest so it can grow next time.", button: "OK" });
      }
    }
    pending.push(...checkTrophies());
    save();

    const lines = J.order.map((k) => {
      const v = purseTotal(sort.added[k]);
      return v ? `<li style="--jar:${J.jars[k].color}"><span>${art(J.jars[k].img, "mini-jar")} ${J.jars[k].name}</span><b>+${fmt(v)}</b></li>` : "";
    }).join("");
    Sfx.ching();
    const giveNote = extraGiven > 0 ? `<p class="note">You gave ${fmt(extraGiven)} extra to God. What a generous heart! ${ICON.heart}</p>` : "";
    const finish = () => openGeneric(`<h2>Deposited!</h2>
      <ul class="deposit-list">${lines}</ul>${giveNote}
      <div class="row">
        <button type="button" class="secondary-btn" data-go="home">Home</button>
        <button type="button" class="secondary-btn" data-go="store">Store</button>
        <button type="button" class="primary-btn" data-go="run">Run again</button>
      </div>`, () => { show("home"); renderHome(); });
    if (pending.length) celebrate(pending, finish);
    else finish();
    Voice.say(extraGiven > 0 ? "Deposited! You gave extra to God. What a generous heart!" : "Deposited!");
  });

  function checkTrophies() {
    const p = P();
    const out = [];
    J.trophies.forEach((t) => {
      if (!p.trophies.includes(t.id) && jarTotal(t.jar) >= t.amount) {
        p.trophies.push(t.id);
        out.push({ img: t.img, title: `${t.name} trophy!`, text: `Your ${J.jars[t.jar].name} jar reached ${fmt(t.amount)}!` });
      }
    });
    return out;
  }

  // ---------- Exchange counter ----------
  let exchangePurse = null;
  let exchangeAfter = null;

  function openExchange(purse, after) {
    exchangePurse = purse;
    exchangeAfter = after;
    renderExchange();
    $("exchangeModal").classList.remove("hidden");
    Voice.say("Exchange counter. Trade coins for the same amount of money.");
  }

  function tradeHTML(side) {
    return Object.entries(side)
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([d, n]) => Array.from({ length: n }, () => coinHTML(Number(d), { size: 0.6, label: true })).join(""))
      .join("");
  }

  function renderExchange() {
    const maxLevel = P().unlocked;
    $("exchangeHave").innerHTML = purseList(exchangePurse).map((d) => coinHTML(d, { size: 0.75, label: true })).join("") || `<p class="note">No coins here.</p>`;
    const row = (t, i, kind) => {
      const ok = hasAll(exchangePurse, t.from);
      return `<button type="button" class="trade ${ok ? "" : "off"}" data-kind="${kind}" data-i="${i}" ${ok ? "" : "disabled"}>
        <span class="trade-side">${tradeHTML(t.from)}</span><span class="trade-arrow">${ICON.arrow}</span><span class="trade-side">${tradeHTML(t.to)}</span>
      </button>`;
    };
    $("exchangeDown").innerHTML = S.exchanges.breakDown.map((t, i) => (t.level <= maxLevel ? row(t, i, "breakDown") : "")).join("");
    $("exchangeUp").innerHTML = S.exchanges.tradeUp.map((t, i) => (t.level <= maxLevel ? row(t, i, "tradeUp") : "")).join("");
  }

  function onTrade(e) {
    const b = e.target.closest(".trade");
    if (!b || b.disabled) return;
    const t = S.exchanges[b.dataset.kind][Number(b.dataset.i)];
    if (!hasAll(exchangePurse, t.from)) return;
    removeFrom(exchangePurse, t.from);
    mergeInto(exchangePurse, t.to);
    Sfx.ching();
    Voice.say(`Same money: ${fmt(purseTotal(t.from))}.`);
    renderExchange();
    if (exchangeAfter) exchangeAfter();
  }
  $("exchangeDown").addEventListener("click", onTrade);
  $("exchangeUp").addEventListener("click", onTrade);
  const closeExchange = () => {
    $("exchangeModal").classList.add("hidden");
    if (exchangeAfter) exchangeAfter();
  };
  $("exchangeClose").addEventListener("click", closeExchange);
  $("exchangeDone").addEventListener("click", closeExchange);

  // ---------- Jar actions from home ----------
  function openGiving() {
    const total = jarTotal("tithe");
    if (!total) {
      openGeneric(`${art(J.jars.tithe.img, "modal-art")}<h2>Tithe Jar</h2><p>Your Tithe jar is empty right now.</p><p class="note">Every run, God gets 1 cent of every 10 cents you earn.</p><button type="button" class="primary-btn" data-close>OK</button>`);
      Voice.say("Your Tithe jar is empty right now. Every run, God gets 1 cent of every 10 cents you earn.");
      return;
    }
    openGeneric(`<h2>Give to God</h2>
      <p>Your Tithe jar has <b>${fmt(total)}</b>. Who would you like to give it to?</p>
      <div class="cause-grid">${J.causes.map((c) => `<button type="button" class="cause" data-cause="${c.id}">${art(c.img)}<span>${c.name}</span></button>`).join("")}</div>
      <p class="note">Or keep it in the jar and give later.</p>`);
    Voice.say(`Your Tithe jar has ${fmt(total)}. Who would you like to give it to?`);
  }

  function giveTo(causeId) {
    const cause = J.causes.find((c) => c.id === causeId);
    const p = P();
    const total = jarTotal("tithe");
    p.jars.tithe = emptyPurse();
    p.given += total;
    p.gifts += 1;
    const pending = [{ img: cause.img, title: "Thank you!", text: `${cause.thanks} "${J.verse}"`, button: "Amen!" }];
    J.giverBadges.forEach((badge) => {
      if (p.gifts >= badge.gifts && !p.badges.includes(badge.id)) {
        p.badges.push(badge.id);
        pending.push({ img: badge.img, title: `${badge.name} badge!`, text: "It's on your Record Room shelf." });
      }
    });
    save();
    closeGeneric(false);
    celebrate(pending, renderHome);
  }

  function openInvest() {
    const p = P();
    const total = jarTotal("invest");
    const left = J.invest.everyRuns - (p.investRuns % J.invest.everyRuns);
    const next = Math.floor(total / 10) * J.invest.centsPer10;
    const lots = investLots();
    const ready = investReady();
    openGeneric(`${art(J.jars.invest.img, "modal-art")}<h2>Invest Jar</h2>
      <p class="big-total">${fmt(total)}</p>
      <div class="grow-bar"><i style="width:${((J.invest.everyRuns - left) / J.invest.everyRuns) * 100}%"></i></div>
      <p>${left} more run${left === 1 ? "" : "s"} until your money grows!</p>
      <p class="note">Every ${J.invest.everyRuns} runs, your Invest jar earns 1 cent for every 10 cents inside. Right now it would earn ${fmt(next)}.</p>
      ${total ? `<div class="invest-split">
        <div class="invest-box ready"><small>Ready to take out</small><b>${fmt(ready)}</b></div>
        <div class="invest-box locked"><small>${ICON.lock} Still locked</small><b>${fmt(total - ready)}</b></div>
      </div>
      ${lots.length ? `<ul class="lot-list">${lots.map((l) => {
        const n = lockRuns() - (p.runs - l.run);
        return `<li><span>${fmt(l.cents)}</span><b>ready in ${n} run${n === 1 ? "" : "s"}</b></li>`;
      }).join("")}</ul>` : ""}
      <p class="note">Money you put in Invest stays for ${lockRuns()} runs. Money you take out stops growing.</p>` : ""}
      <div class="row">
        ${ready ? `<button type="button" class="secondary-btn" data-wd-open>Take some out</button>` : ""}
        <button type="button" class="primary-btn" data-close>Keep growing</button>
      </div>`);
    const lockedSay = total - ready ? ` ${fmt(total - ready)} is still locked.` : "";
    Voice.say(`Your Invest jar has ${fmt(total)}. ${left} more runs until your money grows!${lockedSay}`);
  }

  // Each deposit stays locked for lockRuns runs. Older deposits drop off the list once they're ready.
  const lockRuns = () => J.invest.lockRuns || 5;
  function investLots() {
    const p = P();
    p.investLots = (p.investLots || []).filter((l) => p.runs - l.run < lockRuns());
    return p.investLots;
  }
  const investReady = () => Math.max(0, jarTotal("invest") - investLots().reduce((s, l) => s + l.cents, 0));

  let wd = null;
  function openWithdraw() {
    wd = { pick: emptyPurse() };
    renderWithdraw();
    Voice.say(`You can take out up to ${fmt(investReady())}. Tap the coins you want to take.`);
  }

  function renderWithdraw(msg = "") {
    const p = P();
    const ready = investReady();
    const picked = purseTotal(wd.pick);
    const inJar = clonePurse(p.jars.invest);
    removeFrom(inJar, wd.pick);
    const coins = (purse, attr) => purseList(purse).map((d) => coinHTML(d, { size: 0.8, label: true, attrs: `${attr}="${d}"` })).join("");
    openGeneric(`<h2>Take money out</h2>
      <p>Ready to take out: <b>${fmt(ready)}</b></p>
      <p class="tray-label">In your Invest jar ${ICON.dot} tap the coins you want</p>
      <div class="coin-table compact wd-table">${coins(inJar, "data-wd-take") || `<p class="note">No coins left.</p>`}</div>
      <p class="tray-label">Taking out: <b>${fmt(picked)}</b> ${ICON.dot} tap a coin to put it back</p>
      <div class="coin-table compact wd-table wd-pick">${coins(wd.pick, "data-wd-back") || `<p class="note">Nothing yet.</p>`}</div>
      <p class="help-line">${msg}</p>
      <div class="row">
        <button type="button" class="secondary-btn" data-wd-exchange>Exchange coins</button>
        <button type="button" class="primary-btn" data-wd-to="save" ${picked ? "" : "disabled"}>Move ${fmt(picked)} to Save</button>
        <button type="button" class="primary-btn" data-wd-to="spend" ${picked ? "" : "disabled"}>Move ${fmt(picked)} to Spend</button>
      </div>
      <button type="button" class="text-btn" data-wd-cancel>Never mind</button>`);
  }

  function withdrawPick(d, dir) {
    if (!wd) return;
    if (dir > 0) {
      const inJar = (P().jars.invest[d] || 0) - wd.pick[d];
      if (inJar <= 0) return;
      const ready = investReady();
      if (purseTotal(wd.pick) + d > ready) {
        Sfx.oops();
        const msg = `That's too much! Only ${fmt(ready)} is ready. The rest is still growing.`;
        renderWithdraw(msg);
        Voice.say(msg);
        return;
      }
      wd.pick[d] += 1;
    } else {
      if (!wd.pick[d]) return;
      wd.pick[d] -= 1;
    }
    Sfx.drop();
    renderWithdraw();
    if (dir > 0) Voice.say(fmt(purseTotal(wd.pick)));
  }

  function withdrawExchange() {
    if (!wd) return;
    wd.pick = emptyPurse();
    closeGeneric(false);
    openExchange(P().jars.invest, () => {
      if (!$("exchangeModal").classList.contains("hidden")) return;
      save();
      renderWithdraw();
    });
  }

  function withdrawTo(to) {
    if (!wd) return;
    const p = P();
    const amount = purseTotal(wd.pick);
    if (!amount || amount > investReady()) return;
    removeFrom(p.jars.invest, wd.pick);
    mergeInto(p.jars[to], wd.pick);
    wd = null;
    const pending = checkTrophies();
    save();
    closeGeneric(false);
    Sfx.ching();
    Voice.say(`You moved ${fmt(amount)} to ${J.jars[to].name}.`);
    renderHome();
    if (pending.length) celebrate(pending, renderHome);
  }

  function openSave() {
    const p = P();
    const total = jarTotal("save");
    const goal = p.saveGoal && itemById(p.saveGoal);
    if (!goal) {
      openGeneric(`${art(J.jars.save.img, "modal-art")}<h2>Save Jar</h2><p class="big-total">${fmt(total)}</p><p>Pick a big goal in the store, then save up for it!</p>
        <div class="row"><button type="button" class="secondary-btn" data-close>Later</button><button type="button" class="primary-btn" data-go="store">Pick a goal</button></div>`);
      Voice.say(`Your Save jar has ${fmt(total)}. Pick a big goal in the store!`);
      return;
    }
    const pct = Math.min(100, Math.round((total / goal.price) * 100));
    const reached = total >= goal.price;
    openGeneric(`<h2>Save Jar</h2>
      <div class="goal-show">${art(goal.img)}<div><b>${goal.name}</b><br/>costs ${fmt(goal.price)}</div></div>
      <p class="big-total">${fmt(total)}</p>
      <div class="grow-bar save"><i style="width:${pct}%"></i></div>
      <p>${reached ? "You reached your goal! Go buy it in the store." : "Keep saving! You're getting closer."}</p>
      <div class="row"><button type="button" class="secondary-btn" data-close>OK</button><button type="button" class="primary-btn" data-go="store">${reached ? "Go buy it!" : "Store"}</button></div>`);
    Voice.say(reached ? `You reached your goal! Go buy the ${goal.name}!` : `You're saving for the ${goal.name}. Keep going!`);
  }

  // ---------- Store ----------
  let storeTab = S.tabs[0].id;

  function openStore() {
    show("store");
    $("shopkeeper").src = S.shopkeeper;
    $("storeName").textContent = S.name;
    $("shopTalk").textContent = S.greeting;
    renderStore();
    Voice.say(S.greeting);
  }

  function renderStore() {
    const p = P();
    $("storeWallet").innerHTML = ["spend", "save"].map((k) => `<span class="wallet-pill" style="--jar:${J.jars[k].color}">${art(J.jars[k].img, "mini-jar")} ${J.jars[k].name}: <b>${fmt(jarTotal(k))}</b></span>`).join("");
    $("storeTabs").innerHTML = S.tabs.map((t) => `<button type="button" class="tab ${t.id === storeTab ? "on" : ""}" data-tab="${t.id}">${t.name}</button>`).join("");
    $("storeGrid").innerHTML = S.items.filter((i) => i.cat === storeTab).map((i) => {
      const owned = p.owned.includes(i.id);
      const locked = i.level > p.unlocked;
      const equipped = p.equipped[i.cat] === i.id;
      let action;
      if (locked) action = `<span class="item-status">${ICON.lock} Level ${i.level}</span>`;
      else if (owned && (i.cat === "runner" || i.cat === "trail")) action = `<button type="button" class="item-btn ${equipped ? "on" : ""}" data-equip="${i.id}">${equipped ? `Using ${ICON.check}` : "Use"}</button>`;
      else if (owned) action = `<span class="item-status">Owned ${ICON.check}</span>`;
      else if (i.cat === "goal") {
        if (p.saveGoal === i.id) {
          action = jarTotal("save") >= i.price
            ? `<button type="button" class="item-btn buy" data-buy="${i.id}">Buy with Save jar</button>`
            : `<span class="item-status">Saving for this!</span>`;
        } else {
          action = `<button type="button" class="item-btn" data-goal="${i.id}">Make it my goal</button>`;
        }
      } else action = `<button type="button" class="item-btn buy" data-buy="${i.id}">Buy</button>`;
      return `<div class="item ${locked ? "locked" : ""} ${owned ? "owned" : ""}">
        ${art(i.img, "item-art")}
        <span class="item-name">${i.name}</span>
        ${i.power ? `<button type="button" class="item-power" data-power-info="${i.id}">${powerName(i)}<small>${powerText(i)}</small></button>` : ""}
        <button type="button" class="price-tag" data-price="${i.price}">${fmt(i.price)}</button>
        ${action}
      </div>`;
    }).join("");
  }

  $("storeTabs").addEventListener("click", (e) => {
    const t = e.target.closest("[data-tab]");
    if (!t) return;
    storeTab = t.dataset.tab;
    renderStore();
  });

  $("storeGrid").addEventListener("click", (e) => {
    const p = P();
    const price = e.target.closest("[data-price]");
    if (price) { Voice.say(fmt(Number(price.dataset.price))); return; }
    const info = e.target.closest("[data-power-info]");
    if (info) {
      const item = itemById(info.dataset.powerInfo);
      Voice.say(`The ${item.name} gives you ${S.powers[item.power].name}. ${powerText(item)}`);
      return;
    }
    const eq = e.target.closest("[data-equip]");
    if (eq) {
      const item = itemById(eq.dataset.equip);
      p.equipped[item.cat] = p.equipped[item.cat] === item.id ? null : item.id;
      save();
      Sfx.drop();
      renderStore();
      return;
    }
    const goal = e.target.closest("[data-goal]");
    if (goal) {
      const item = itemById(goal.dataset.goal);
      p.saveGoal = item.id;
      save();
      Sfx.ching();
      const msg = `Great goal! Save ${fmt(item.price)} in your Save jar for the ${item.name}.`;
      $("shopTalk").textContent = msg;
      Voice.say(msg);
      renderStore();
      return;
    }
    const buy = e.target.closest("[data-buy]");
    if (buy) openPay(itemById(buy.dataset.buy));
  });

  $("storeHomeBtn").addEventListener("click", () => { show("home"); renderHome(); });

  // ---------- Pay counter ----------
  let pay = null;

  makeNumpad($("changePad"), (k) => {
    if (!pay || !pay.changeMode) return;
    if (k === "ok") return submitChange();
    pay.changeEntry = padInput(pay.changeEntry, k, 4);
    showDisplay($("changeDisplay"), pay.changeEntry);
  });

  function openPay(item) {
    const jarKey = item.cat === "goal" ? "save" : "spend";
    if (jarTotal(jarKey) < item.price) {
      const msg = jarKey === "save"
        ? `You need more in your Save jar for the ${item.name}. Keep running!`
        : `You need more in your Spend jar for the ${item.name}. Keep running, or save up!`;
      $("shopTalk").textContent = msg;
      Voice.say(msg);
      Sfx.oops();
      return;
    }
    pay = { item, jarKey, wallet: clonePurse(P().jars[jarKey]), counter: emptyPurse(), attempts: 0, changeMode: false, changeEntry: "", changeAttempts: 0 };
    $("payImg").src = item.img;
    $("payName").textContent = item.name;
    $("payPrice").textContent = fmt(item.price);
    $("payHelp").textContent = `Put ${fmt(item.price)} on the counter, then tap Pay.`;
    $("payWalletLabel").textContent = `Your ${J.jars[jarKey].name} jar ${ICON.dot} tap to put on the counter`;
    $("changeAsk").classList.add("hidden");
    $("payModal").classList.remove("hidden");
    renderPay();
    Voice.say(`The ${item.name} costs ${fmt(item.price)}. Put the coins on the counter.`);
  }

  function renderPay() {
    const L = level();
    const sorted = pay.attempts >= 2;
    const counter = $("payCounter");
    if (sorted) {
      counter.innerHTML = DENOMS.filter((d) => pay.counter[d]).map((d) =>
        `<div class="coin-row small"><div class="row-coins">${Array.from({ length: pay.counter[d] }, () => coinHTML(d, { size: 0.9, label: true, attrs: `data-back="${d}"` })).join("")}</div></div>`).join("");
    } else {
      counter.innerHTML = purseList(pay.counter).map((d) => coinHTML(d, { size: 0.9, label: L.labels, attrs: `data-back="${d}"` })).join("");
    }
    if (!purseCount(pay.counter)) counter.innerHTML = `<p class="note">Empty</p>`;
    if (pay.attempts >= 3) counter.insertAdjacentHTML("beforeend", `<div class="counter-total">On the counter: ${fmt(purseTotal(pay.counter))}</div>`);

    $("payWallet").innerHTML = DENOMS.filter((d) => pay.wallet[d]).map((d) =>
      `<button type="button" class="wallet-stack" data-put="${d}">${coinHTML(d, { size: 0.9, label: L.labels })}<span class="stack-n">${ICON.times}${pay.wallet[d]}</span></button>`).join("") || `<p class="note">Your jar is empty.</p>`;
    $("payGo").disabled = pay.changeMode;
  }

  $("payWallet").addEventListener("click", (e) => {
    if (!pay || pay.changeMode) return;
    const b = e.target.closest("[data-put]");
    if (!b) return;
    const d = Number(b.dataset.put);
    if (!pay.wallet[d]) return;
    pay.wallet[d] -= 1;
    pay.counter[d] += 1;
    Sfx.drop();
    renderPay();
  });

  $("payCounter").addEventListener("click", (e) => {
    if (!pay || pay.changeMode) return;
    const c = e.target.closest("[data-back]");
    if (!c) return;
    const d = Number(c.dataset.back);
    pay.counter[d] -= 1;
    pay.wallet[d] += 1;
    Sfx.drop();
    renderPay();
  });

  $("payPrice").addEventListener("click", () => { if (pay) Voice.say(fmt(pay.item.price)); });
  $("payExchange").addEventListener("click", () => { if (pay && !pay.changeMode) openExchange(pay.wallet, renderPay); });
  $("payBack").addEventListener("click", () => {
    pay = null;
    $("payModal").classList.add("hidden");
    renderStore();
  });

  $("payGo").addEventListener("click", () => {
    if (!pay || pay.changeMode) return;
    const paid = purseTotal(pay.counter);
    const price = pay.item.price;
    if (paid === price) return finishPurchase();
    if (paid > price && P().unlocked >= S.changeLevel) {
      pay.changeMode = true;
      $("changeAsk").classList.remove("hidden");
      const msg = `You paid ${fmt(paid)}. It costs ${fmt(price)}. How much change do you get back?`;
      $("changePrompt").textContent = msg;
      showDisplay($("changeDisplay"), "");
      renderPay();
      Voice.say(msg);
      return;
    }
    pay.attempts += 1;
    Sfx.oops();
    const msg = paid < price ? "Not enough yet!" : "That's too much. Tap a coin on the counter to take it back.";
    const extra = pay.attempts === 2 ? " The coins are sorted biggest first." : pay.attempts >= 3 ? " Now you can see how much is on the counter." : "";
    $("payHelp").textContent = msg + extra;
    Voice.say(msg + extra);
    renderPay();
  });

  function submitChange() {
    const n = parseInt(pay.changeEntry, 10);
    if (Number.isNaN(n)) return;
    const change = purseTotal(pay.counter) - pay.item.price;
    if (n === change) {
      logMoney("Making change", pay.changeAttempts === 0, { amount: fmt(change) });
      mergeInto(pay.wallet, makeChange(change));
      return finishPurchase(change);
    }
    pay.changeAttempts += 1;
    pay.changeEntry = "";
    showDisplay($("changeDisplay"), "");
    flash($("changeDisplay"), "wrong");
    Sfx.oops();
    if (pay.changeAttempts === 1) {
      const msg = `Count up from ${fmt(pay.item.price)} to ${fmt(purseTotal(pay.counter))}. How much is that?`;
      $("changePrompt").textContent = msg;
      Voice.say(msg);
    } else {
      const msg = `Your change is ${fmt(change)}.`;
      $("changePrompt").textContent = msg;
      Voice.say(msg);
      mergeInto(pay.wallet, makeChange(change));
      setTimeout(() => finishPurchase(change), 1800);
    }
  }

  function finishPurchase(change = 0) {
    const p = P();
    const item = pay.item;
    p.jars[pay.jarKey] = pay.wallet;
    p.owned.push(item.id);
    if (item.cat === "runner" || item.cat === "trail") p.equipped[item.cat] = item.id;
    if (item.cat === "goal") p.saveGoal = null;
    save();
    pay = null;
    $("payModal").classList.add("hidden");
    renderStore();
    const where = item.cat === "room" || item.cat === "goal" ? "It's in your Record Room!" : "You're using it now!";
    const power = item.power ? ` New power: ${S.powers[item.power].name}! ${powerText(item)} Pick it before your next run.` : "";
    celebrate([{
      img: item.img,
      record: item.cat === "goal",
      title: `You bought the ${item.name}!`,
      text: `${change ? `You got ${fmt(change)} back. ` : ""}${where}${power}`
    }], renderStore);
  }

  // ---------- Start ----------
  Voice.init();
  renderHome();
  show("home");
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
