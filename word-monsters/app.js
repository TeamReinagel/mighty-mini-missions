(() => {
  "use strict";

  const REGIONS = window.WM_REGIONS;
  const STORE_KEY = "wordMonsters.v2"; // updated for toddler & preschool edition
  const TRIP_LEN = 6;                  // 6 encounters per trip — fast-paced & joyful for ages 2–3
  const MAX_REQUEUE = 2;
  const STAGE_AT = [1, 3, 6];          // Caught at 1, Evolved at 3, Mega at 6
  const HARD_FROM = 3;                 // regions from this index on hide the monster's answer clues until the catch

  const ALL = [];
  const SAY = {};
  const SUCCESS_SAY = {};

  REGIONS.forEach((r, ri) => r.words.forEach((e) => {
    e.region = r.id;
    e.regionIndex = ri;
    ALL.push(e);
    if (e.say) SAY[e.w] = e.say;
    if (e.successSay) SUCCESS_SAY[e.w] = e.successSay;
  }));

  const getItem = (w) => ALL.find((e) => e.w === w) || { w, label: w };

  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const shuffle = (a) => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------------------------------------------------------------- visual helpers

  function renderShapeSVG(shape, color = "#ff3b5c", size = 76) {
    let inner = "";
    if (shape === "circle") {
      inner = `<circle cx="50" cy="50" r="40" fill="${color}" stroke="#2b2440" stroke-width="5"/>
        <circle cx="38" cy="44" r="5" fill="#2b2440"/><circle cx="62" cy="44" r="5" fill="#2b2440"/>
        <circle cx="40" cy="42" r="1.5" fill="#fff"/><circle cx="64" cy="42" r="1.5" fill="#fff"/>
        <path d="M40 56 Q50 66 60 56" stroke="#2b2440" stroke-width="4" fill="none" stroke-linecap="round"/>
        <ellipse cx="32" cy="52" rx="4" ry="2" fill="#ff7aa8" opacity=".7"/>
        <ellipse cx="68" cy="52" rx="4" ry="2" fill="#ff7aa8" opacity=".7"/>`;
    } else if (shape === "square") {
      inner = `<rect x="12" y="12" width="76" height="76" rx="16" fill="${color}" stroke="#2b2440" stroke-width="5"/>
        <circle cx="38" cy="44" r="5" fill="#2b2440"/><circle cx="62" cy="44" r="5" fill="#2b2440"/>
        <circle cx="40" cy="42" r="1.5" fill="#fff"/><circle cx="64" cy="42" r="1.5" fill="#fff"/>
        <path d="M40 56 Q50 66 60 56" stroke="#2b2440" stroke-width="4" fill="none" stroke-linecap="round"/>
        <ellipse cx="32" cy="52" rx="4" ry="2" fill="#ff7aa8" opacity=".7"/>
        <ellipse cx="68" cy="52" rx="4" ry="2" fill="#ff7aa8" opacity=".7"/>`;
    } else if (shape === "triangle") {
      inner = `<polygon points="50,12 88,86 12,86" fill="${color}" stroke="#2b2440" stroke-width="5" stroke-linejoin="round"/>
        <circle cx="42" cy="54" r="4.5" fill="#2b2440"/><circle cx="58" cy="54" r="4.5" fill="#2b2440"/>
        <circle cx="43" cy="53" r="1.5" fill="#fff"/><circle cx="59" cy="53" r="1.5" fill="#fff"/>
        <path d="M44 64 Q50 70 56 64" stroke="#2b2440" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    } else if (shape === "star") {
      inner = `<polygon points="50,6 63,33 94,36 71,56 78,87 50,71 22,87 29,56 6,36 37,33" fill="${color}" stroke="#2b2440" stroke-width="4.5" stroke-linejoin="round"/>
        <circle cx="42" cy="46" r="4.5" fill="#2b2440"/><circle cx="58" cy="46" r="4.5" fill="#2b2440"/>
        <circle cx="43" cy="44" r="1.5" fill="#fff"/><circle cx="59" cy="44" r="1.5" fill="#fff"/>
        <path d="M44 55 Q50 62 56 55" stroke="#2b2440" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    } else if (shape === "heart") {
      inner = `<path d="M50 26 C36 -6 2 24 50 82 C98 24 64 -6 50 26 Z" fill="${color}" stroke="#2b2440" stroke-width="5" stroke-linejoin="round"/>
        <circle cx="40" cy="42" r="4.5" fill="#2b2440"/><circle cx="60" cy="42" r="4.5" fill="#2b2440"/>
        <circle cx="41" cy="40" r="1.5" fill="#fff"/><circle cx="61" cy="40" r="1.5" fill="#fff"/>
        <path d="M43 52 Q50 58 57 52" stroke="#2b2440" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    } else if (shape === "diamond") {
      inner = `<polygon points="50,10 88,50 50,90 12,50" fill="${color}" stroke="#2b2440" stroke-width="5" stroke-linejoin="round"/>
        <circle cx="42" cy="46" r="4.5" fill="#2b2440"/><circle cx="58" cy="46" r="4.5" fill="#2b2440"/>
        <circle cx="43" cy="44" r="1.5" fill="#fff"/><circle cx="59" cy="44" r="1.5" fill="#fff"/>
        <path d="M44 56 Q50 62 56 56" stroke="#2b2440" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    } else if (shape === "oval") {
      inner = `<ellipse cx="50" cy="50" rx="44" ry="32" fill="${color}" stroke="#2b2440" stroke-width="5"/>
        <circle cx="38" cy="44" r="4.5" fill="#2b2440"/><circle cx="62" cy="44" r="4.5" fill="#2b2440"/>
        <circle cx="40" cy="42" r="1.5" fill="#fff"/><circle cx="64" cy="42" r="1.5" fill="#fff"/>
        <path d="M42 54 Q50 62 58 54" stroke="#2b2440" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    } else if (TRICKY_SHAPES[shape]) {
      const [outline, fx, fy, fs] = TRICKY_SHAPES[shape];
      inner = outline.replace("FILL", color) + shapeFace(fx, fy, fs);
    }
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  }

  function shapeFace(x, y, s = 1) {
    const ink = "#2b2440";
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <circle cx="-8" cy="-4" r="4.5" fill="${ink}"/><circle cx="8" cy="-4" r="4.5" fill="${ink}"/>
      <circle cx="-7" cy="-5.5" r="1.5" fill="#fff"/><circle cx="9" cy="-5.5" r="1.5" fill="#fff"/>
      <path d="M-6 5 Q0 11 6 5" stroke="${ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>`;
  }

  // [outline with FILL placeholder, face x, face y, face scale]
  const TRICKY_SHAPES = (() => {
    const poly = (pts) => `<polygon points="${pts}" fill="FILL" stroke="#2b2440" stroke-width="5" stroke-linejoin="round"/>`;
    return {
      rectangle: [`<rect x="4" y="24" width="92" height="52" rx="8" fill="FILL" stroke="#2b2440" stroke-width="5"/>`, 50, 50, 1],
      pentagon: [poly("50,10 92,41 76,90 24,90 8,41"), 50, 58, 1],
      hexagon: [poly("95,50 72,89 28,89 5,50 28,11 72,11"), 50, 50, 1],
      octagon: [poly("91,67 67,91 33,91 9,67 9,33 33,9 67,9 91,33"), 50, 50, 1],
      trapezoid: [poly("30,22 70,22 95,80 5,80"), 50, 54, 1],
      parallelogram: [poly("30,24 97,24 70,78 3,78"), 50, 51, 1],
      crescent: [`<path d="M66 12 A40 40 0 1 0 66 88 A58 58 0 0 1 66 12 Z" fill="FILL" stroke="#2b2440" stroke-width="5" stroke-linejoin="round"/>`, 32, 50, 0.8],
      semicircle: [`<path d="M6 70 A44 44 0 0 1 94 70 Z" fill="FILL" stroke="#2b2440" stroke-width="5" stroke-linejoin="round"/>`, 50, 52, 1]
    };
  })();

  // ---------------------------------------------------------------- comparison pictures (Giant's Garden)

  const CMP_OBJS = ["🍎", "🐶", "⭐️", "🚗", "🐻", "🦆", "🍓", "🎈", "🐸", "🌻", "🐱", "🍪", "🐠", "🦄"];
  const BLOCK_COLORS = ["#ff5fa2", "#ffd23f", "#19c3b3", "#7b5cff", "#ff8c42", "#3a86ff"];
  const JUICE = ["#4dabf7", "#ff8c42", "#ff5fa2", "#8bd450"];
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pickOne = (a) => a[Math.floor(Math.random() * a.length)];

  function sizePic(obj, scale) {
    return `<div class="cmp-box"><span class="cmp-obj" style="font-size:${Math.round(scale * 96)}px">${obj}</span></div>`;
  }
  function towerPic(n) {
    let blocks = "";
    for (let i = 0; i < n; i++) {
      const y = 124 - (i + 1) * 19;
      blocks += `<rect x="10" y="${y}" width="40" height="18" rx="4" fill="${BLOCK_COLORS[i % BLOCK_COLORS.length]}" stroke="#2b2440" stroke-width="3"/>`;
    }
    const top = 124 - n * 19;
    blocks += `<circle cx="24" cy="${top + 8}" r="2.5" fill="#2b2440"/><circle cx="36" cy="${top + 8}" r="2.5" fill="#2b2440"/>
      <path d="M26 ${top + 12} Q30 ${top + 15} 34 ${top + 12}" stroke="#2b2440" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    return `<div class="cmp-box"><svg viewBox="0 0 60 128" height="118">${blocks}</svg></div>`;
  }
  function countPic(obj, n) {
    return `<div class="cmp-box cmp-count">${Array.from({ length: n }, () => `<span>${obj}</span>`).join("")}</div>`;
  }
  function cupPic(full, juice) {
    const liquid = full ? `<path d="M15 24 L65 24 L59 94 L21 94 Z" fill="${juice}"/><ellipse cx="40" cy="24" rx="25" ry="5" fill="#fff" opacity=".45"/>` : "";
    return `<div class="cmp-box"><svg viewBox="0 0 80 104" height="112">
      ${liquid}
      <path d="M12 10 L68 10 L60 96 L20 96 Z" fill="${full ? "none" : "#f2f8ff"}" stroke="#2b2440" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M22 18 L26 86" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/></svg></div>`;
  }

  // Returns the cards for a comparison encounter. "_mid" cards are the in-between ones (never a target).
  function cmpCards(group) {
    const obj = pickOne(CMP_OBJS);
    switch (group) {
      case "size": return [{ w: "big", html: sizePic(obj, 1) }, { w: "small", html: sizePic(obj, 0.4) }];
      case "size3": return [{ w: "biggest", html: sizePic(obj, 1) }, { w: "_mid", html: sizePic(obj, 0.66) }, { w: "smallest", html: sizePic(obj, 0.36) }];
      case "height": return [{ w: "tall", html: towerPic(rint(5, 6)) }, { w: "short", html: towerPic(rint(1, 2)) }];
      case "height3": return [{ w: "tallest", html: towerPic(6) }, { w: "_mid", html: towerPic(4) }, { w: "shortest", html: towerPic(2) }];
      case "count": return [{ w: "more", html: countPic(obj, rint(5, 8)) }, { w: "less", html: countPic(obj, rint(1, 2)) }];
      case "fill": {
        const juice = pickOne(JUICE);
        return [{ w: "full", html: cupPic(true, juice) }, { w: "empty", html: cupPic(false, juice) }];
      }
      default: return [];
    }
  }

  function renderColorBlob(color = "#ff3b5c", size = 76) {
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="40" fill="${color}" stroke="#2b2440" stroke-width="5"/>
      <ellipse cx="36" cy="30" rx="14" ry="7" transform="rotate(-30 36 30)" fill="#ffffff" opacity=".55"/>
      <circle cx="38" cy="48" r="5" fill="#2b2440"/><circle cx="62" cy="48" r="5" fill="#2b2440"/>
      <circle cx="40" cy="46" r="1.5" fill="#fff"/><circle cx="64" cy="46" r="1.5" fill="#fff"/>
      <path d="M40 58 Q50 68 60 58" stroke="#2b2440" stroke-width="4" fill="none" stroke-linecap="round"/>
      <ellipse cx="32" cy="56" rx="4" ry="2" fill="#ff7aa8" opacity=".7"/>
      <ellipse cx="68" cy="56" rx="4" ry="2" fill="#ff7aa8" opacity=".7"/>
    </svg>`;
  }

  function renderCardContent(item) {
    if (!item) return "";
    if (item.type === "color") {
      return `<div class="card-visual">${renderColorBlob(item.color, 76)}</div>
              <div class="card-label" style="color:${item.text || item.color}">${esc(item.label)}</div>`;
    }
    if (item.type === "sound") {
      return `<div class="card-letter-val sound-letter" style="color:${item.color}">${esc(item.letter)}</div>`;
    }
    if (item.type === "shape") {
      return `<div class="card-visual">${renderShapeSVG(item.shape, item.color, 76)}</div>
              <div class="card-label">${esc(item.label)}</div>`;
    }
    if (item.type === "number") {
      const stars = Array.from({ length: item.count }, () => `<span class="c-star">⭐️</span>`).join("");
      return `<div class="card-num-val" style="color:${item.color}">${esc(item.label)}</div>
              <div class="card-stars-row count-${item.count}">${stars}</div>`;
    }
    if (item.type === "letter") {
      return `<div class="card-letter-val" style="color:${item.color}">${esc(item.label)}</div>
              <div class="card-letter-hint"><span class="c-icon">${item.icon || "✨"}</span> <span class="c-word">${esc(item.anchor || "")}</span></div>`;
    }
    return `<div class="card-label">${esc(item.label || item.w)}</div>`;
  }

  function caughtBadgeHTML(e, cardHTML) {
    if (e.type === "color") {
      return `<div class="catch-badge color-badge">${renderColorBlob(e.color, 90)}<div class="badge-title" style="color:${e.text || e.color}">${esc(e.label)}</div></div>`;
    }
    if (e.type === "sound") {
      return `<div class="catch-badge letter-badge"><div class="badge-letter" style="color:${e.color}">${esc(e.letter.toUpperCase())}${esc(e.letter)}</div>
        <div class="badge-hint">${e.icon} ${esc(e.pic)}</div></div>`;
    }
    if (e.type === "cmp") {
      return `<div class="catch-badge cmp-badge">${cardHTML || ""}<div class="badge-title">${esc(e.label)}</div></div>`;
    }
    if (e.type === "shape") {
      return `<div class="catch-badge shape-badge">${renderShapeSVG(e.shape, e.color, 90)}<div class="badge-title" style="color:${e.color}">${esc(e.label)}</div></div>`;
    }
    if (e.type === "number") {
      const stars = "⭐️".repeat(e.count);
      return `<div class="catch-badge number-badge"><div class="badge-num" style="color:${e.color}">${esc(e.label)}</div><div class="badge-stars">${stars}</div></div>`;
    }
    if (e.type === "letter") {
      return `<div class="catch-badge letter-badge"><div class="badge-letter" style="color:${e.color}">${esc(e.label)}</div><div class="badge-hint">${e.icon || "✨"} ${esc(e.anchor || "")}</div></div>`;
    }
    return `<div class="badge-title">${esc(e.label || e.w)}</div>`;
  }

  // ---------------------------------------------------------------- state

  let state = load();

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && s.words) return withDefaults(s);
    } catch (e) { /* fall through */ }
    return withDefaults({});
  }
  function withDefaults(s) {
    return {
      words: s.words || {},
      settings: Object.assign({ rate: 0.82, voice: "", unlockAll: true, sfx: true, music: true }, s.settings || {}),
      region: s.region || REGIONS[0].id,
      trips: s.trips || 0
    };
  }
  function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  function rec(w) { return state.words[w] || (state.words[w] = { pts: 0, seen: false, tries: 0, firstTry: 0, helps: 0 }); }
  function pts(w) { return (state.words[w] || {}).pts || 0; }
  function stageOf(p) { return p >= STAGE_AT[2] ? 3 : p >= STAGE_AT[1] ? 2 : p >= STAGE_AT[0] ? 1 : 0; }
  function isCaught(w) { return pts(w) >= STAGE_AT[0]; }
  function caughtIn(region) { return region.words.filter((e) => isCaught(e.w)).length; }
  function totalCaught() { return ALL.filter((e) => isCaught(e.w)).length; }
  function isUnlocked(ri) { return true; } // All 3 regions open for Connor, Kyler, and Ethan!
  function currentRegion() {
    const r = REGIONS.find((x) => x.id === state.region);
    return r || REGIONS[0];
  }

  // ---------------------------------------------------------------- speech

  const Speech = {
    voices: [],
    init() {
      if (!("speechSynthesis" in window)) return;
      const load = () => { this.voices = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang)); };
      load();
      speechSynthesis.onvoiceschanged = load;
      // Safari drops speech that doesn't start inside a tap until one utterance has, and the
      // first question is spoken well after the map tap, so warm it up on the first touch.
      const unlock = () => {
        const u = new SpeechSynthesisUtterance(" ");
        u.volume = 0;
        speechSynthesis.speak(u);
        ["touchend", "click", "keydown"].forEach((t) => document.removeEventListener(t, unlock, true));
      };
      ["touchend", "click", "keydown"].forEach((t) => document.addEventListener(t, unlock, true));
    },
    pickVoice() {
      const v = this.voices;
      if (state.settings.voice) {
        const m = v.find((x) => x.name === state.settings.voice);
        if (m) return m;
      }
      return v.find((x) => /en[-_]US/i.test(x.lang) && /google/i.test(x.name)) ||
        v.find((x) => /en[-_]US/i.test(x.lang)) || v[0] || null;
    },
    // Resolves when the line finishes (or is cut off). Some browsers never fire onend,
    // so a length-based cap keeps callers from waiting forever.
    say(text) {
      if (!("speechSynthesis" in window)) return Promise.resolve();
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = this.pickVoice();
      if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = "en-US"; }
      u.rate = state.settings.rate;
      u.pitch = 1.1; // slightly higher, friendlier tone for toddlers
      return new Promise((resolve) => {
        const cap = setTimeout(resolve, 1500 + (String(text).length * 110) / (u.rate || 1));
        u.onend = u.onerror = () => { clearTimeout(cap); resolve(); };
        setTimeout(() => speechSynthesis.speak(u), 60);
      });
    }
  };

  const Clips = {
    db: null,
    urls: new Map(),
    current: null,
    async init() {
      if (!window.indexedDB) return;
      try {
        this.db = await new Promise((res, rej) => {
          const r = indexedDB.open("wordMonstersToddler", 1);
          r.onupgradeneeded = () => r.result.createObjectStore("clips");
          r.onsuccess = () => res(r.result);
          r.onerror = () => rej(r.error);
        });
        await new Promise((res) => {
          const req = this.db.transaction("clips").objectStore("clips").openCursor();
          req.onsuccess = () => {
            const c = req.result;
            if (c) {
              this.urls.set(c.key, URL.createObjectURL(c.value));
              c.continue();
            } else res();
          };
          req.onerror = () => res();
        });
      } catch (e) {}
    },
    has(w) { return this.urls.has(w); },
    play(w) {
      if (this.current) { this.current.pause(); this.current = null; }
      const url = this.urls.get(w);
      if (!url) return false;
      const a = new Audio(url);
      this.current = a;
      a.play().catch(() => {});
      return true;
    },
    async put(w, blob) {
      if (!this.db) return;
      await new Promise((res, rej) => {
        const tx = this.db.transaction("clips", "readwrite");
        tx.objectStore("clips").put(blob, w);
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
      });
      if (this.urls.has(w)) URL.revokeObjectURL(this.urls.get(w));
      this.urls.set(w, URL.createObjectURL(blob));
    },
    async remove(w) {
      if (!this.db) return;
      await new Promise((res, rej) => {
        const tx = this.db.transaction("clips", "readwrite");
        tx.objectStore("clips").delete(w);
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
      });
      if (this.urls.has(w)) URL.revokeObjectURL(this.urls.get(w));
      this.urls.delete(w);
    }
  };

  const Music = {
    el: null,
    volume: 0.32,
    duckTimer: null,
    init() {
      this.el = new Audio("audio/bouncy-monster-loop.m4a");
      this.el.loop = true;
      this.el.preload = "auto";
      this.el.volume = this.volume;
    },
    start() {
      if (!state.settings.music || !this.el || document.hidden) return;
      this.el.play().catch(() => {});
    },
    stop() { if (this.el) this.el.pause(); },
    toggle() {
      state.settings.music = !state.settings.music;
      save();
      if (state.settings.music) this.start(); else this.stop();
    },
    duck(ms = 1800) {
      if (!this.el) return;
      this.el.volume = 0.07;
      clearTimeout(this.duckTimer);
      this.duckTimer = setTimeout(() => { this.el.volume = this.volume; }, ms);
    }
  };

  const sayItemPrompt = (e) => {
    Music.duck(2200);
    if (Clips.has(e.w)) {
      if (window.speechSynthesis) speechSynthesis.cancel();
      Clips.play(e.w);
    } else {
      Speech.say(e.say || e.label || e.w);
    }
  };

  const sayItemSuccess = async (e) => {
    Music.duck(60000);
    await Speech.say(e.successSay || e.label || e.w);
    Music.duck(300);
  };

  const sayWord = (w) => {
    const item = getItem(w);
    sayItemPrompt(item);
  };

  // ---------------------------------------------------------------- sfx

  const Sfx = {
    ctx: null,
    ensure() {
      if (!this.ctx && "AudioContext" in window) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    },
    tone(freq, delay, dur, type = "sine", gain = 0.25, endFreq = null) {
      if (!state.settings.sfx) return;
      this.ensure();
      if (!this.ctx) return;
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t + dur);
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    },
    pop() { this.tone(440, 0, 0.08, "triangle", 0.25, 880); },
    catch() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, i * 0.06, 0.18, "sine", 0.2));
    },
    evolve() {
      const notes = [392, 523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((f, i) => this.tone(f, i * 0.08, 0.28, "triangle", 0.25));
    },
    boing() { this.tone(280, 0, 0.24, "sine", 0.28, 120); },
    escape() {
      this.tone(360, 0, 0.12, "sine", 0.2, 280);
      this.tone(260, 0.1, 0.18, "sine", 0.2, 160);
    },
    fanfare() {
      const c = [523.25, 659.25, 783.99, 1046.5];
      c.forEach((f, i) => this.tone(f, i * 0.1, 0.25, "triangle", 0.2));
      setTimeout(() => c.forEach((f) => this.tone(f * 1.25, 0, 0.5, "sine", 0.15)), 460);
    },
    appear() { this.tone(260, 0, 0.18, "sine", 0.16, 720); this.tone(900, 0.16, 0.08, "triangle", 0.08); },
    squeak() { this.tone(900, 0, 0.12, "sine", 0.14, 1500); this.tone(1400, 0.1, 0.12, "sine", 0.1, 800); },
    sparkle() { [1568, 2093, 2637, 3136].forEach((f, i) => this.tone(f, 0.15 + i * 0.05, 0.12, "sine", 0.05)); }
  };

  const FX = window.WM_FX;
  const { monsterSVG } = window.WM_ART;

  // ---------------------------------------------------------------- screens

  function show(name) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === `screen-${name}`));
    if (name === "home") {
      renderHome();
      if (homeShown) mapView.focus(currentRegion().id);
      else mapView.intro(currentRegion().id);
      homeShown = true;
    }
    if (name === "dex") renderDex();
  }

  let homeShown = false;
  const mapView = window.WM_MAP.panZoom($("map"), { zoomIn: $("btn-zoom-in"), zoomOut: $("btn-zoom-out") });
  $("btn-recenter").addEventListener("click", () => {
    Sfx.pop();
    mapView.focus(currentRegion().id, { animate: true });
  });

  function renderHome() {
    const regions = REGIONS.map((r) => ({
      id: r.id,
      caught: caughtIn(r),
      total: r.words.length,
      pals: r.words
        .filter((e) => isCaught(e.w))
        .sort((a, b) => pts(b.w) - pts(a.w))
        .slice(0, 2)
        .map((e) => ({ w: e.w, stage: Math.max(1, stageOf(pts(e.w))) }))
    }));
    mapView.setContent(window.WM_MAP.mapSVG({ regions, current: currentRegion().id, buddy: "Connor" }));
    $("dex-count").textContent = totalCaught();
  }

  let mapBusy = false;
  $("map").addEventListener("click", (ev) => {
    if (mapBusy) return;
    const mon = ev.target.closest(".map-mon, .buddy");
    if (mon) {
      Sfx.squeak();
      mon.classList.remove("boop");
      void mon.getBoundingClientRect();
      mon.classList.add("boop");
      FX.burstAt(mon, 12, { symbols: ["⭐️", "✨", "❤️"], power: 160 });
      return;
    }
    const zone = ev.target.closest(".zone");
    if (!zone) return;
    const ri = REGIONS.findIndex((r) => r.id === zone.dataset.region);
    if (ri < 0) return;

    mapBusy = true;
    Sfx.pop();
    const from = currentRegion().id;
    state.region = REGIONS[ri].id;
    save();
    mapView.travelTo(from, state.region).then(() => {
      renderHome();
      const picked = $("map").querySelector(`.zone[data-region="${state.region}"]`);
      if (picked) {
        picked.classList.add("chosen");
        FX.burstAt(picked.querySelector(".illustrated-sign") || picked, 30, { symbols: ["⭐️", "✨", "🌟"], power: 240 });
      }
      setTimeout(() => { mapBusy = false; startTrip(); }, 650);
    });
  });

  // ---------------------------------------------------------------- trip planning

  function buildTrip(region) {
    const pool = region.words.slice();
    // Prioritize uncaught or unmastered items
    const uncaught = pool.filter((e) => pts(e.w) < STAGE_AT[0]);
    const learning = pool.filter((e) => pts(e.w) >= STAGE_AT[0] && pts(e.w) < STAGE_AT[2]);
    const mastered = pool.filter((e) => pts(e.w) >= STAGE_AT[2]);

    const trip = [];
    const used = new Set();

    // 1. Pick uncaught items first
    shuffle(uncaught).forEach((e) => {
      if (trip.length < TRIP_LEN && !used.has(e.w)) { trip.push(e); used.add(e.w); }
    });
    // 2. Add evolving items
    shuffle(learning).forEach((e) => {
      if (trip.length < TRIP_LEN && !used.has(e.w)) { trip.push(e); used.add(e.w); }
    });
    // 3. Fill with mastered items or rest of pool
    shuffle(mastered.concat(pool)).forEach((e) => {
      if (trip.length < TRIP_LEN && !used.has(e.w)) { trip.push(e); used.add(e.w); }
    });

    return shuffle(trip).slice(0, TRIP_LEN);
  }

  // ---------------------------------------------------------------- play

  let trip = null;
  let enc = null;
  let busy = false;

  function startTrip() {
    Sfx.ensure();
    const region = currentRegion();
    trip = { region, queue: buildTrip(region), i: 0, requeues: 0, results: [] };
    state.trips++;
    save();
    $("screen-play").style.setProperty("--sky1", region.sky[0]);
    $("screen-play").style.setProperty("--sky2", region.sky[1]);
    $("screen-play").style.setProperty("--bg", `url("images/bg-${region.id}.webp")`);
    show("play");
    nextEncounter();
  }

  function renderDots() {
    $("trip-dots").innerHTML = trip.queue.map((e, i) => {
      const r = trip.results[i];
      const icon = r ? (r.escaped ? "💨" : "⭐️") : "";
      return `<span class="dot ${i === trip.i ? "now" : ""} ${r ? "filled" : ""}">${icon}</span>`;
    }).join("");
  }

  function nextEncounter() {
    if (trip.i >= trip.queue.length) { endTrip(); return; }
    const e = trip.queue[trip.i];
    rec(e.w).seen = true;
    rec(e.w).lastTrip = state.trips;
    save();
    enc = { e, wrong: 0, done: false };
    busy = false;
    renderDots();
    renderEncounter();
  }

  function renderEncounter() {
    const { e } = enc;
    const mon = $("monster");
    resetCatchFx();
    mon.className = "monster";
    mon.innerHTML = monsterSVG(e.w, Math.max(1, stageOf(pts(e.w))), false, e.regionIndex >= HARD_FROM);
    void mon.offsetWidth;
    mon.classList.add("enter");
    Sfx.appear();

    setTimeout(() => {
      if (!enc || enc.e !== e || enc.done) return;
      mon.className = "monster idle";
      FX.say("hear", mon);
    }, 650);

    const sign = $("sign");
    if (e.type === "sound") {
      sign.className = "sign pic-sign";
      sign.innerHTML = `<span class="sign-pic">${e.icon}</span>`;
    } else if (e.type === "cmp") {
      sign.className = "sign word-sign";
      sign.textContent = e.label;
    } else {
      sign.className = "sign hidden";
      sign.innerHTML = "";
    }

    let cards;
    if (e.type === "cmp") {
      cards = shuffle(cmpCards(e.group));
    } else {
      // Pick 2 decoys: listed look-alikes first (may come from other regions), then same-type items here.
      let decoys = shuffle((e.alts || []).filter((w) => w !== e.w && ALL.some((x) => x.w === w))).map(getItem).slice(0, 2);
      if (decoys.length < 2) {
        const sameType = trip.region.words.filter((x) => x.type === e.type && x.w !== e.w && !decoys.includes(x) && !(e.never || []).includes(x.w));
        decoys = decoys.concat(shuffle(sameType).slice(0, 2 - decoys.length));
      }
      cards = shuffle([e, ...decoys]).map((item) => ({ w: item.w, label: item.label || item.w, html: renderCardContent(item) }));
    }
    enc.cards = cards;

    const opts = $("options");
    opts.innerHTML = cards.map((c) => `
      <button class="opt rich-card ${e.type === "cmp" ? "cmp-card" : ""}" data-w="${esc(c.w)}" aria-label="${esc(c.label || "choice")}">
        ${c.html}
      </button>
    `).join("");

    $("btn-catch").classList.add("hidden");
    $("btn-hear").classList.remove("hidden");
    $("btn-help").classList.add("hidden");

    setTimeout(() => {
      if (enc && enc.e === e && !enc.done) sayItemPrompt(e);
    }, 700);
  }

  // Toddler single-tap direct catch!
  $("options").addEventListener("click", (ev) => {
    const btn = ev.target.closest(".opt");
    if (!btn || !enc || enc.done || busy) return;
    const w = btn.dataset.w;
    if (w === enc.e.w) {
      doCatch(btn);
    } else {
      doWrong(btn);
    }
  });

  $("monster").addEventListener("click", () => {
    if (enc && !enc.done) {
      Sfx.squeak();
      sayItemPrompt(enc.e);
    }
  });

  $("btn-hear").addEventListener("click", () => {
    if (enc && !enc.done) sayItemPrompt(enc.e);
  });

  $("btn-quit").addEventListener("click", () => {
    if (window.speechSynthesis) speechSynthesis.cancel();
    trip = null;
    enc = null;
    $("catch-card").classList.add("hidden");
    show("home");
  });

  async function doWrong(btn) {
    busy = true;
    enc.wrong++;
    btn.classList.add("wrong-card");
    Sfx.boing();
    const mon = $("monster");
    mon.className = "monster";
    void mon.offsetWidth;
    mon.classList.add("dodge");
    FX.say("miss", mon);
    FX.shake($("stage"));

    const t = trip;
    await sleep(700);
    if (trip !== t) return;
    mon.className = "monster idle";
    busy = false;

    // Toddler-friendly: if they missed twice, gently highlight the correct one with a glowing pulse!
    if (enc.wrong >= 2) {
      const correctBtn = $("options").querySelector(`.opt[data-w="${enc.e.w}"]`);
      if (correctBtn) correctBtn.classList.add("hint-pulse");
    }
    // Repeat the prompt encouragingly
    sayItemPrompt(enc.e);
  }

  async function doCatch(btn) {
    enc.done = true;
    busy = true;
    const t = trip;
    const { e, wrong, cards } = enc;
    const r = rec(e.w);
    const before = stageOf(r.pts);
    const award = wrong === 0 ? 1 : 1; // Always reward toddlers on catch!
    r.pts += award;
    r.tries++;
    if (wrong === 0) r.firstTry++;
    const after = stageOf(r.pts);
    save();
    window.MightyProgress?.log({
      game: "word-monsters",
      skill: trip.region.subtitle,
      item: e.label || e.w,
      correct: wrong === 0,
      extra: { wrongTaps: wrong }
    });
    trip.results[trip.i] = { e, before, after, award };
    btn.classList.add("right");

    const mon = $("monster");
    await netCatch(mon);
    if (trip !== t) return;
    FX.burstAt(mon, 28, { symbols: ["⭐️", "✨", "🌟"], power: 220 });
    await sleep(350);
    if (trip !== t) return;

    const evolved = after > before && before >= 1;
    const fresh = after >= 1 && before === 0;
    const title = evolved ? (after === 3 ? "MEGA Monster!" : "It Evolved!") : fresh ? "Caught!" : "Yay!";
    if (evolved) Sfx.evolve(); else Sfx.catch();

    const card = $("catch-card");
    card.innerHTML = `<div class="rays ${evolved ? "rainbow" : ""}"></div>
      <div class="card ${evolved ? "evolved" : ""}">
        <h3>${title}</h3>
        <div class="mon dance">${monsterSVG(e.w, Math.max(1, after))}</div>
        ${caughtBadgeHTML(e, (cards.find((c) => c.w === e.w) || {}).html)}
      </div>`;
    card.classList.remove("hidden");
    const cardEl = card.querySelector(".card");
    if (evolved) {
      FX.flash();
      FX.burstAt(cardEl, 70, { power: 460 });
      FX.rain(40);
    } else {
      FX.burstAt(cardEl, 36);
    }
    Sfx.sparkle();
    const spoken = sleep(evolved ? 650 : 380).then(() => (trip === t ? sayItemSuccess(e) : null));

    await waitForTapOrTimeout(card, 2600, spoken.then(() => sleep(400)));
    card.classList.add("hidden");
    if (trip !== t) return;
    trip.i++;
    nextEncounter();
  }

  // The net flicks down so its ring lands over the monster, then the monster bounces
  // and shrinks into the ring (drawn above the net so it sits "inside").
  const NET_ANGLE = 84;
  const NET_GRIP = "88% 81%"; // the handle grip in images/net.webp
  const center = (r, fy = 0.5) => [r.left + r.width / 2, r.top + r.height * fy];

  async function netCatch(mon) {
    const net = $("net");
    const hoop = net.querySelector(".net-hoop");
    resetCatchFx();
    mon.className = "monster";

    net.style.transformOrigin = NET_GRIP;
    net.style.transform = `translateX(-50%) rotate(${NET_ANGLE}deg) scaleX(-1)`;
    const [hx, hy] = center(hoop.getBoundingClientRect());
    const monBox = mon.getBoundingClientRect();
    const [mx, my] = center(monBox, 0.62);
    const dx = mx - hx, dy = my - hy;
    const at = (deg) => `translate(calc(-50% + ${dx}px), ${dy}px) rotate(${deg}deg) scaleX(-1)`;

    // Pivots around the grip, like a wrist flicking the net down over the monster.
    await animateTo(net, [
      { transform: at(NET_ANGLE - 115), opacity: 0 },
      { transform: at(NET_ANGLE - 95), opacity: 1, offset: 0.15 },
      { transform: at(NET_ANGLE + 10), opacity: 1, offset: 0.7, easing: "ease-out" },
      { transform: at(NET_ANGLE - 3), opacity: 1, offset: 0.88 },
      { transform: at(NET_ANGLE), opacity: 1 }
    ], { duration: 560, easing: "ease-in" });

    Sfx.pop();
    const ring = hoop.getBoundingClientRect();
    const s = Math.min(0.6, (ring.width * 0.95) / (monBox.width * 0.78));
    mon.style.zIndex = 4;
    mon.style.transformOrigin = "50% 62%";
    await animateTo(mon, [
      { transform: "none" },
      { transform: "translateY(-16%) scale(1.06, .94)", offset: 0.22 },
      { transform: `translateY(-10%) scale(${(1 + s) / 2})`, offset: 0.5 },
      { transform: `scale(${s * 1.15}, ${s * 0.85})`, offset: 0.76 },
      { transform: `translateY(-4%) scale(${s * 0.95}, ${s * 1.05})`, offset: 0.9 },
      { transform: `scale(${s})` }
    ], { duration: 720, easing: "ease-out" });
  }

  // Browsers can silently drop finished fill-forwards animations from getAnimations() while
  // still showing their last frame, so bake the end state into inline styles that reset can clear.
  async function animateTo(el, frames, opts) {
    const a = el.animate(frames, { ...opts, fill: "forwards" });
    await a.finished.catch(() => {});
    if (a.playState === "finished") a.commitStyles();
    a.cancel();
  }

  function resetCatchFx() {
    const net = $("net"), mon = $("monster");
    for (const el of [net, mon]) {
      el.getAnimations().forEach((a) => { if (!(a instanceof CSSAnimation)) a.cancel(); });
      el.style.transform = "";
      el.style.opacity = "";
      el.style.zIndex = "";
      el.style.transformOrigin = "";
    }
  }

  // Ends on a tap, or once at least `ms` has passed and `until` (e.g. the spoken line) is done.
  function waitForTapOrTimeout(el, ms, until = Promise.resolve()) {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        el.removeEventListener("pointerdown", finish);
        resolve();
      };
      setTimeout(() => el.addEventListener("pointerdown", finish), 600);
      Promise.all([sleep(ms), until]).then(finish);
    });
  }

  // ---------------------------------------------------------------- end of trip

  function endTrip() {
    const seen = new Map();
    trip.results.forEach((r) => {
      if (!r) return;
      const prev = seen.get(r.e.w);
      if (!prev || r.after >= prev.after) {
        seen.set(r.e.w, r);
      }
    });
    const list = [...seen.values()];
    const caughtCount = list.filter((r) => r.after >= 1).length;

    $("end-title").textContent = caughtCount
      ? `You caught ${caughtCount} monster${caughtCount === 1 ? "" : "s"}!`
      : "Great exploring!";
    $("end-grid").innerHTML = list.map((r, i) => {
      const stage = stageOf(pts(r.e.w));
      let badge = "";
      if (r.before === 0 && r.after >= 1) badge = `<span class="badge new">NEW!</span>`;
      else if (r.after > r.before) badge = `<span class="badge">EVOLVED!</span>`;
      return `<div class="mon-tile pop-in stage-${stage}" style="--i:${i}" data-w="${esc(r.e.w)}">${badge}<div class="mon">${monsterSVG(r.e.w, stage)}</div>
        <div class="label">${esc(r.e.label || r.e.w)}</div><div class="stars">${"⭐️".repeat(stage)}</div></div>`;
    }).join("");

    $("end-next").textContent = "Tap Go again to catch more!";
    trip = null;
    enc = null;
    show("end");
    Sfx.fanfare();
    if (caughtCount) setTimeout(() => FX.rain(70), 200);
  }

  $("end-grid").addEventListener("click", (ev) => {
    const tile = ev.target.closest(".mon-tile[data-w]");
    if (tile) sayWord(tile.dataset.w);
  });
  $("btn-again").addEventListener("click", startTrip);
  $("btn-end-home").addEventListener("click", () => show("home"));

  // ---------------------------------------------------------------- dex

  function renderDex() {
    $("dex-body").innerHTML = REGIONS.map((r) => {
      const tiles = r.words.map((e) => {
        const stage = stageOf(pts(e.w));
        if (!stage) {
          return `<div class="mon-tile unknown"><div class="mon">${monsterSVG(e.w, 1, true)}</div><div class="label">?</div><div class="stars"></div></div>`;
        }
        return `<button class="mon-tile stage-${stage}" data-w="${esc(e.w)}"><div class="mon">${monsterSVG(e.w, stage)}</div>
          <div class="label">${esc(e.label || e.w)}</div><div class="stars">${"⭐️".repeat(stage)}</div></button>`;
      }).join("");
      return `<section class="dex-region">
        <h3>${esc(r.name)} <span class="dex-sub">(${esc(r.subtitle)})</span> &mdash; ${caughtIn(r)} / ${r.words.length}</h3>
        <div class="mon-grid">${tiles}</div></section>`;
    }).join("");
  }

  $("dex-body").addEventListener("click", (ev) => {
    const tile = ev.target.closest(".mon-tile[data-w]");
    if (!tile) return;
    sayWord(tile.dataset.w);
    tile.classList.remove("wiggle");
    void tile.offsetWidth;
    tile.classList.add("wiggle");
  });
  $("btn-dex").addEventListener("click", () => { Sfx.pop(); show("dex"); });
  $("btn-dex-home").addEventListener("click", () => show("home"));

  // ---------------------------------------------------------------- grown-up corner (long-press the title)

  (function setupLongPress() {
    const el = $("title");
    let timer = null;
    const cancel = () => { clearTimeout(timer); timer = null; };
    el.addEventListener("pointerdown", () => { cancel(); timer = setTimeout(openParent, 1500); });
    ["pointerup", "pointerleave", "pointercancel"].forEach((t) => el.addEventListener(t, cancel));
    el.addEventListener("contextmenu", (ev) => ev.preventDefault());

    $("map").addEventListener("contextmenu", (ev) => ev.preventDefault());
  })();

  function openParent() {
    renderParent();
    $("parent").classList.remove("hidden");
  }
  $("btn-parent-close").addEventListener("click", () => {
    $("parent").classList.add("hidden");
    renderHome();
  });

  function renderParent() {
    const stageName = ["not yet", "caught", "evolved", "mega"];
    const rows = (r) => r.words.map((e) => {
      const x = state.words[e.w];
      const p = pts(e.w);
      const status = !x || !x.seen ? `<span class="muted">not met yet</span>` : stageName[stageOf(p)];
      const first = x && x.tries ? `${x.firstTry}/${x.tries}` : "-";
      const voice = Clips.has(e.w)
        ? `<button class="clip-btn" data-play="${esc(e.w)}" title="Play">▶️</button><button class="clip-btn" data-rec="${esc(e.w)}" title="Re-record">🎙️</button><button class="clip-btn" data-del="${esc(e.w)}" title="Delete recording">🗑️</button>`
        : `<button class="clip-btn" data-rec="${esc(e.w)}" title="Record">🎙️</button>`;
      return `<tr><td><b>${esc(e.label || e.w)}</b>${e.pic ? ` <span class="muted">(${esc(e.pic)})</span>` : ""}</td>
        <td>${status}</td><td>${p}</td><td>${first}</td><td class="voice">${voice}</td></tr>`;
    }).join("");

    const voices = Speech.voices;
    const current = Speech.pickVoice();
    const voiceOpts = voices.map((v) => `<option value="${esc(v.name)}" ${current && current.name === v.name ? "selected" : ""}>${esc(v.name)} (${esc(v.lang)})</option>`).join("");

    $("parent-body").innerHTML = `
      <p>Expeditions played: <b>${state.trips}</b> &middot; Monsters caught: <b>${totalCaught()}</b> / ${ALL.length}</p>
      <p class="muted">Toddler &amp; Preschool Edition for Connor (3), Kyler (almost 3), and Ethan (2).
        Single-tap matching. The first three places on the map (Giggle Meadow, Wobble Woods, Sparkle Cave) are the starter level: colors, shapes, numbers 1–10, and letters A–Z.
        The four places further along (Shape Castle, Giant's Garden, Rainbow Reef, Echo Lagoon) are the next level up: more colors, tricky shapes, big/small comparisons, and letter sounds
        (he sees a picture, hears the word, and taps the letter it starts with). Look-alike letters like b/d/p are mixed in on purpose.
        If the robot voice says a sound oddly, record your own for that row.
        Caught = ${STAGE_AT[0]} catch, evolved = ${STAGE_AT[1]}, mega = ${STAGE_AT[2]}.</p>

      <h3>Voice</h3>
      <label>Voice: <select id="p-voice"><option value="">Auto</option>${voiceOpts}</select></label>
      <label>Speed: <input id="p-rate" type="range" min="0.5" max="1.2" step="0.05" value="${state.settings.rate}" />
        <span id="p-rate-val">${state.settings.rate}</span></label>
      <div class="row-btns">
        <button id="p-test-red">🔊 Test: "Red"</button>
        <button id="p-test-star">🔊 Test: "Star"</button>
        <button id="p-test-num">🔊 Test: "Number 3"</button>
        <button id="p-test-b">🔊 Test: "Letter B"</button>
      </div>
      <p class="muted">Tap 🎙️ next to any color, shape, number, or letter to record Mom or Dad's voice! Your recording will always play instead of the robot voice.</p>

      <h3>Settings</h3>
      <label><input id="p-sfx" type="checkbox" ${state.settings.sfx ? "checked" : ""}/> Sound effects</label>
      <label><input id="p-music" type="checkbox" ${state.settings.music ? "checked" : ""}/> Background music</label>

      ${REGIONS.map((r) => `<h3>${esc(r.name)} &mdash; ${esc(r.subtitle)}</h3>
        <table><tr><th>Item</th><th>Status</th><th>Pts</th><th>1st-try</th><th>My voice</th></tr>${rows(r)}</table>`).join("")}

      <h3>Danger zone</h3>
      <div class="row-btns"><button id="p-reset" class="danger">Reset all progress</button></div>`;

    $("p-voice").addEventListener("change", (ev) => { state.settings.voice = ev.target.value; save(); });
    $("p-rate").addEventListener("input", (ev) => {
      state.settings.rate = Number(ev.target.value);
      $("p-rate-val").textContent = state.settings.rate;
      save();
    });
    $("p-test-red").addEventListener("click", () => sayWord("red"));
    $("p-test-star").addEventListener("click", () => sayWord("star"));
    $("p-test-num").addEventListener("click", () => sayWord("3"));
    $("p-test-b").addEventListener("click", () => sayWord("B"));
    $("parent-body").onclick = (ev) => {
      const b = ev.target.closest(".clip-btn");
      if (!b) return;
      if (b.dataset.play) sayWord(b.dataset.play);
      if (b.dataset.del) Clips.remove(b.dataset.del).then(renderParent);
      if (b.dataset.rec) {
        if (Recorder.active) { Recorder.stop(); return; }
        b.textContent = "⏹️";
        b.classList.add("recording");
        Recorder.start(b.dataset.rec, renderParent);
      }
    };
    $("p-sfx").addEventListener("change", (ev) => { state.settings.sfx = ev.target.checked; save(); });
    $("p-music").addEventListener("change", (ev) => {
      if (ev.target.checked !== state.settings.music) Music.toggle();
      paintMusicBtn();
    });
    $("p-reset").addEventListener("click", () => {
      if (!confirm("Erase all monsters and progress on this device?")) return;
      state = withDefaults({ settings: state.settings });
      save();
      renderParent();
    });
  }

  const Recorder = {
    stream: null,
    rec: null,
    chunks: [],
    word: null,
    timer: null,
    active: false,
    async start(w, onDone) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Audio recording isn't supported on this browser.");
        return;
      }
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        alert("Microphone permission was denied.");
        return;
      }
      this.word = w;
      this.chunks = [];
      this.active = true;
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m)) || "";
      this.rec = mime ? new MediaRecorder(this.stream, { mimeType: mime }) : new MediaRecorder(this.stream);
      this.rec.ondataavailable = (ev) => { if (ev.data && ev.data.size > 0) this.chunks.push(ev.data); };
      this.rec.onstop = async () => {
        const type = this.rec.mimeType || "audio/webm";
        const blob = new Blob(this.chunks, { type });
        if (blob.size > 500) await Clips.put(this.word, blob);
        this.cleanup();
        if (onDone) onDone();
      };
      this.rec.start();
      this.timer = setTimeout(() => this.stop(), 3500);
    },
    stop() {
      clearTimeout(this.timer);
      if (this.rec && this.rec.state === "recording") this.rec.stop();
    },
    cleanup() {
      this.active = false;
      this.word = null;
      if (this.stream) { this.stream.getTracks().forEach((t) => t.stop()); this.stream = null; }
    }
  };

  function paintMusicBtn() {
    const btn = $("btn-music");
    if (!btn) return;
    btn.textContent = state.settings.music ? "🎵" : "🔇";
    btn.setAttribute("aria-label", state.settings.music ? "Music on (tap to mute)" : "Music muted (tap to play)");
  }

  // ---------------------------------------------------------------- init

  Speech.init();
  Clips.init();
  Music.init();

  const startMusicOnFirstTouch = () => {
    Music.start();
    window.removeEventListener("pointerdown", startMusicOnFirstTouch);
    window.removeEventListener("keydown", startMusicOnFirstTouch);
  };
  window.addEventListener("pointerdown", startMusicOnFirstTouch, { once: true });
  window.addEventListener("keydown", startMusicOnFirstTouch, { once: true });

  $("btn-music").addEventListener("click", () => {
    Music.toggle();
    paintMusicBtn();
  });
  paintMusicBtn();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  FX.floaties($("screen-home"));
  show("home");
})();
