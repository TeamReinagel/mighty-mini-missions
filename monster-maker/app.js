(() => {
  "use strict";

  const { COLORS, renderMonster, renderShape, renderIcon } = window.MM;
  const C = window.MMContent;
  const STORE_KEY = "monsterMathMaker.v1";
  const PART_IDS = C.PARTS.map((p) => p.id);
  const STEPS = ["shape", "color", ...PART_IDS, "feeling", "name"];

  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // ---------------------------------------------------------------- storage

  const store = (() => {
    let data;
    try { data = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { data = {}; }
    data.level = data.level || "k";
    data.sound = data.sound !== false;
    data.monsters = Array.isArray(data.monsters) ? data.monsters : [];
    return {
      data,
      save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch { /* storage full or blocked */ } }
    };
  })();

  // ---------------------------------------------------------------- sound

  const Speech = {
    voices: [],
    init() {
      if (!("speechSynthesis" in window)) return;
      const load = () => { this.voices = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang)); };
      load();
      speechSynthesis.onvoiceschanged = load;
      // Safari only allows speech after one utterance has started inside a tap.
      const unlock = () => {
        const u = new SpeechSynthesisUtterance(" ");
        u.volume = 0;
        speechSynthesis.speak(u);
        ["touchend", "click", "keydown"].forEach((t) => document.removeEventListener(t, unlock, true));
      };
      ["touchend", "click", "keydown"].forEach((t) => document.addEventListener(t, unlock, true));
    },
    say(text) {
      if (!store.data.sound || !("speechSynthesis" in window)) return Promise.resolve();
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = this.voices.find((x) => /en[-_]US/i.test(x.lang) && /google|samantha/i.test(x.name)) ||
        this.voices.find((x) => /en[-_]US/i.test(x.lang)) || this.voices[0];
      if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = "en-US"; }
      u.rate = 0.9;
      u.pitch = 1.15;
      return new Promise((resolve) => {
        const timer = setTimeout(resolve, 1500 + String(text).length * 110);
        u.onend = u.onerror = () => { clearTimeout(timer); resolve(); };
        setTimeout(() => speechSynthesis.speak(u), 60);
      });
    },
    stop() { if ("speechSynthesis" in window) speechSynthesis.cancel(); }
  };

  const Sfx = {
    ctx: null,
    tone(freq, dur, type = "sine", vol = 0.15, slide = 0) {
      try {
        this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, t);
        if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g).connect(this.ctx.destination);
        o.start(t);
        o.stop(t + dur);
      } catch { /* audio unavailable */ }
    },
    pop() { this.tone(520, 0.12, "sine", 0.18, 1.8); },
    right() { [523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.18, "triangle", 0.14), i * 90)); },
    boing() { this.tone(260, 0.25, "sine", 0.12, 0.6); },
    tada() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, "triangle", 0.14), i * 120)); }
  };

  // ---------------------------------------------------------------- screens

  function show(name) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === `screen-${name}`));
  }

  function renderHome() {
    $("levels").innerHTML = Object.values(C.LEVELS).map((L) =>
      `<button class="level${L.id === store.data.level ? " on" : ""}" data-level="${L.id}" role="radio" aria-checked="${L.id === store.data.level}">${L.label}</button>`).join("");
    $("gallery-count").textContent = store.data.monsters.length || "";
    $("btn-sound").classList.toggle("off", !store.data.sound);
  }

  $("levels").addEventListener("click", (e) => {
    const b = e.target.closest("[data-level]");
    if (!b) return;
    store.data.level = b.dataset.level;
    store.save();
    renderHome();
  });

  $("btn-sound").addEventListener("click", () => {
    store.data.sound = !store.data.sound;
    store.save();
    renderHome();
    if (store.data.sound) Speech.say("Voice on!");
  });

  // ---------------------------------------------------------------- build state

  let spec = null;
  let stepIndex = 0;
  let current = null;   // the active problem or prompt for the step
  let lastSay = "";
  let busy = false;

  function newSpec() {
    return {
      id: `m${Date.now().toString(36)}`,
      seed: Math.floor(Math.random() * 1e9),
      level: store.data.level,
      shape: null, color: "purple",
      eyes: 0, teeth: 0, arms: 0, legs: 0, horns: 0, spots: 0,
      emotion: "happy", name: "",
      problems: [],
      created: Date.now()
    };
  }

  function say(text) { lastSay = text; return Speech.say(text); }

  function drawStage(pop) {
    const s = spec.shape ? spec : { ...spec, shape: "circle" };
    $("stage-monster").innerHTML = spec.shape ? renderMonster(s, { pop }) : `<img src="images/mascot.webp" alt="" style="max-height:60%;max-width:80%;margin:auto">`;
  }

  function stepIcon(step) {
    if (PART_IDS.includes(step)) return renderIcon(step, spec.color);
    if (step === "shape") return renderShape(spec.shape || "triangle", spec.color);
    if (step === "color") return `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="${(COLORS.find((c) => c.id === spec.color) || COLORS[0]).fill}" stroke="#3b2a4a" stroke-width="3"/></svg>`;
    if (step === "feeling") return `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="#ffd84d" stroke="#3b2a4a" stroke-width="3"/><circle cx="15" cy="17" r="2.5" fill="#3b2a4a"/><circle cx="25" cy="17" r="2.5" fill="#3b2a4a"/><path d="M13 24 Q20 31 27 24" stroke="#3b2a4a" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
    return `<svg viewBox="0 0 40 40"><text x="20" y="29" text-anchor="middle" font-size="24" font-weight="700" fill="#3b2a4a" font-family="Andika, sans-serif">Aa</text></svg>`;
  }

  function drawSteps() {
    $("steps").innerHTML = STEPS.map((s, i) =>
      `<span class="step-dot${i < stepIndex ? " done" : ""}${i === stepIndex ? " now" : ""}">${stepIcon(s)}</span>`).join("");
  }

  function startBuild() {
    spec = newSpec();
    stepIndex = 0;
    show("build");
    goStep();
  }

  function nextStep() {
    stepIndex++;
    if (stepIndex >= STEPS.length) return finish();
    goStep();
  }

  function goStep() {
    busy = false;
    $("panel").classList.remove("picked");
    drawSteps();
    drawStage();
    const step = STEPS[stepIndex];
    if (step === "shape") return stepShape();
    if (step === "color") return stepColor();
    if (step === "feeling") return stepFeeling();
    if (step === "name") return stepName();
    return stepPart(step);
  }

  // ---------------------------------------------------------------- shape + color

  function stepShape() {
    const shapes = C.SHAPE_SETS[spec.level];
    $("panel").innerHTML = `
      <h2>Pick a body shape!</h2>
      <div class="grid-pick" style="${gridVars(shapes.length, shapes.length > 8 ? 5 : shapes.length > 6 ? 4 : 3, 1, 70)}">${shapes.map((s, i) =>
        `<button class="shape-btn" data-shape="${s}" aria-label="${C.shapeName(s, spec.level)}">${renderShape(s, COLORS[i % COLORS.length].id)}</button>`).join("")}</div>`;
    say("Pick a shape for your monster's body!");
    $("panel").querySelectorAll("[data-shape]").forEach((b) => b.addEventListener("click", () => chooseShape(b.dataset.shape)));
  }

  async function chooseShape(shapeId) {
    spec.shape = shapeId;
    Sfx.pop();
    drawStage();
    drawSteps();
    const name = C.shapeName(shapeId, spec.level);
    const fact = C.shapeFact(shapeId, spec.level);
    const q = C.shapeQuestion(shapeId, spec.level);
    if (!q) {
      $("panel").innerHTML = `
        <div class="big-shape">${renderShape(shapeId, spec.color)}</div>
        <h2>${cap(name)}!</h2>
        <p class="fact">${esc(fact)}</p>
        <div class="row"><button class="small-btn" id="btn-reshape">Pick a different shape</button></div>
        <button class="next-btn" id="btn-next">Next &#x27A1;&#xFE0F;</button>`;
      $("btn-reshape").onclick = stepShape;
      $("btn-next").onclick = nextStep;
      say(`A ${name}! ${fact}`);
      return;
    }
    current = { ...q, kind: "shape" };
    $("panel").innerHTML = `
      <div class="big-shape">${renderShape(shapeId, spec.color)}</div>
      <h2>${cap(name)}!</h2>
      <p class="story">${esc(q.prompt)}</p>
      ${choicesHTML(q.choices, false)}
      <div class="row"><button class="small-btn" id="btn-reshape">Pick a different shape</button></div>`;
    $("btn-reshape").onclick = stepShape;
    bindChoices(async () => {
      spec.problems.push({ part: "shape", record: `${cap(name)}: ${q.answer} ${/points/.test(q.prompt) ? "points" : /vertices|corners/.test(q.prompt) ? "corners" : "sides"}` });
      await say(`Yes! ${fact}`);
      nextStep();
    });
    say(`A ${name}! ${q.say}`);
  }

  function stepColor() {
    $("panel").innerHTML = `
      <h2>Pick a color!</h2>
      <div class="grid-pick swatches" style="${gridVars(COLORS.length, 4, 1, 150)}">${COLORS.map((c) =>
        `<button class="swatch${c.id === spec.color ? " on" : ""}" data-color="${c.id}" style="background:${c.fill}" aria-label="${c.name}"></button>`).join("")}</div>
      <button class="next-btn" id="btn-next">Next &#x27A1;&#xFE0F;</button>`;
    say("What color is your monster?");
    $("panel").querySelectorAll("[data-color]").forEach((b) => b.addEventListener("click", () => {
      spec.color = b.dataset.color;
      $("panel").querySelectorAll("[data-color]").forEach((x) => x.classList.toggle("on", x === b));
      Sfx.pop();
      drawStage();
      drawSteps();
      say(cap(b.dataset.color) + "!");
    }));
    $("btn-next").onclick = nextStep;
  }

  // ---------------------------------------------------------------- part problems

  // Grid width is capped by the panel height so every row stays on screen.
  function gridVars(n, cols, cellAspect, reserve) {
    return `--cols:${cols};--rows:${Math.ceil(n / cols)};--aspect:${cellAspect};--reserve:${typeof reserve === "number" ? reserve + "px" : reserve}`;
  }

  function choicesHTML(choices, withDots) {
    return `<div class="choices">${choices.map((n) =>
      `<button class="choice" data-n="${n}">${n}${withDots && n > 0 ? `<span class="dots">${"<i></i>".repeat(n)}</span>` : ""}</button>`).join("")}</div>`;
  }

  function helperReact(cls) {
    const h = $("helper");
    if (!h) return;
    h.classList.remove("cheer", "hmm");
    void h.offsetWidth;
    h.classList.add(cls);
  }

  function burst() {
    const box = $("burst");
    box.innerHTML = "";
    const colors = ["#ffd84d", "#ff8fc1", "#5cb8ff", "#7ed957", "#a98bff"];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const d = 90 + Math.random() * 60;
      const el = document.createElement("i");
      el.style.setProperty("--x", `${Math.cos(a) * d}px`);
      el.style.setProperty("--y", `${Math.sin(a) * d}px`);
      el.style.setProperty("--c", colors[i % colors.length]);
      el.style.animationDelay = `${Math.random() * 0.15}s`;
      box.appendChild(el);
    }
    setTimeout(() => { box.innerHTML = ""; }, 1300);
  }

  function bindChoices(onRight) {
    $("panel").querySelectorAll(".choice").forEach((b) => b.addEventListener("click", async () => {
      if (busy) return;
      const n = Number(b.dataset.n);
      if (n === current.answer) {
        busy = true;
        window.MightyProgress?.log({
          game: "monster-maker",
          skill: `${current.skill || "Math"} (${C.LEVELS[spec.level].label})`,
          item: current.record || current.prompt,
          correct: !current.misses,
          extra: current.misses ? { wrongTaps: current.misses } : undefined
        });
        b.classList.add("right");
        Sfx.right();
        helperReact("cheer");
        await onRight();
      } else {
        current.misses = (current.misses || 0) + 1;
        b.classList.add("wrong");
        Sfx.boing();
        helperReact("hmm");
        say(current.retry || "Hmm, not quite. Try again!");
      }
    }));
  }

  function itemsHTML(n, kind, opts = {}) {
    const perRow = n <= 5 ? n : Math.ceil(n / 2) <= 6 ? Math.ceil(n / 2) : 5;
    let s = "";
    for (let i = 0; i < n; i++) {
      const gone = opts.goneFrom !== undefined && i >= opts.goneFrom;
      s += `<button class="item${gone ? " gone" : ""}" data-count${gone ? ' data-gone="1"' : ""}>${renderIcon(kind, spec.color)}</button>`;
    }
    return `<div class="items" style="grid-template-columns:repeat(${perRow}, auto)">${s}</div>`;
  }

  const DICE = {
    1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[25, 25], [50, 50], [75, 75]],
    4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]],
    6: [[28, 22], [72, 22], [28, 50], [72, 50], [28, 78], [72, 78]]
  };

  function visualHTML(v) {
    if (!v) return "";
    switch (v.type) {
      case "items": return `<div class="visual">${itemsHTML(v.n, v.kind)}</div>`;
      case "plus": return `<div class="visual">${itemsHTML(v.a, v.kind)}<span class="op">+</span>${itemsHTML(v.b, v.kind)}</div>`;
      case "minus": return `<div class="visual">${itemsHTML(v.total, v.kind, { goneFrom: v.total - v.gone })}</div>`;
      case "dice": return `<div class="visual"><div class="dice">${DICE[v.n].map(([x, y]) => `<i style="left:${x}%;top:${y}%"></i>`).join("")}</div></div>`;
      case "tenframe": {
        let s = "";
        for (let i = 0; i < 10; i++) s += `<span>${i < v.n ? "<i></i>" : ""}</span>`;
        return `<div class="visual"><div class="tenframe">${s}</div></div>`;
      }
      case "array": return `<div class="visual"><div class="array" style="grid-template-columns:repeat(${v.c}, auto)">${"<i></i>".repeat(v.r * v.c)}</div></div>`;
      case "base10": return `<div class="visual"><div class="base10">${'<div class="rod"></div>'.repeat(v.tens)}<div class="units">${'<div class="unit"></div>'.repeat(v.ones)}</div></div></div>`;
      case "coins": return `<div class="visual"><div class="coins">${v.coins.map((c) => `<span class="coin c${c}">${c}&cent;</span>`).join("")}</div></div>`;
      default: return "";
    }
  }

  function stepPart(partId, avoid) {
    const part = C.PARTS.find((p) => p.id === partId);
    const prob = C.makeProblem(partId, spec.level, avoid);
    current = prob;
    const head = `<div class="part-head">${renderIcon(partId, spec.color)}<h2>${cap(part.noun)}!</h2></div>`;
    const body = [
      visualHTML(prob.visual),
      prob.eq ? `<div class="eq">${esc(prob.eq)}</div>` : "",
      prob.story ? `<p class="story">${esc(prob.story)}</p>` : (!prob.eq || prob.prompt !== "Solve it!" ? `<p class="sub">${esc(prob.prompt)}</p>` : "")
    ].join("");
    $("panel").innerHTML = `${head}${body}${choicesHTML(prob.choices, spec.level === "prek")}
      <div class="row"><button class="small-btn" id="btn-new-prob">New problem</button></div>`;
    $("btn-new-prob").onclick = () => { if (!busy) stepPart(partId, prob.answer); };

    let counted = 0;
    $("panel").querySelectorAll("[data-count]").forEach((b) => b.addEventListener("click", () => {
      if (b.classList.contains("counted") || b.dataset.gone) return;
      counted++;
      b.dataset.n = counted;
      b.classList.add("counted");
      Sfx.pop();
      Speech.say(String(counted));
    }));

    bindChoices(async () => {
      const n = prob.answer;
      spec[partId] = n;
      spec.problems = spec.problems.filter((p) => p.part !== partId);
      spec.problems.push({ part: partId, record: prob.record, answer: n });
      await sleep(250);
      drawStage({ part: partId, from: 0 });
      drawSteps();
      burst();
      for (let i = 1; i <= n; i++) {
        setTimeout(() => Sfx.pop(), 100 + (i - 1) * 500);
      }
      const words = [];
      for (let i = 1; i <= n; i++) words.push(i);
      await Promise.all([
        say(`${words.join(", ")}. ${n} ${n === 1 ? part.one : part.noun}!`),
        sleep(n * 500 + 500)
      ]);
      await sleep(300);
      nextStep();
    });

    say(`Your monster needs ${part.noun}! ${prob.story ? "" : ""}${prob.say}`);
  }

  // ---------------------------------------------------------------- feelings

  let lastScenario = "";

  function stepFeeling() {
    const sc = C.pickScenario(spec.level, lastScenario);
    lastScenario = sc.text;
    const emotions = C.EMOTION_SETS[spec.level];
    const cols = emotions.length === 6 ? 3 : 4;
    $("panel").classList.remove("picked");
    $("panel").innerHTML = `
      <p class="scenario">${esc(sc.text)}</p>
      <h2 class="feel-ask">How might your monster feel?</h2>
      <div class="grid-pick feel-grid" style="${gridVars(emotions.length, cols, 1.3, "calc(32cqh + 48px + max(0px, (380px - 100cqw) * 0.7))")};--maxw:460px">${emotions.map((e) => `
        <button class="feel-btn" data-emo="${e}">
          ${renderMonster({ shape: "circle", color: spec.color, eyes: 2, teeth: 2, emotion: e, seed: 3 }, { viewBox: "78 66 244 280" })}
          ${C.EMOTIONS[e].name}
        </button>`).join("")}</div>
      <div id="feel-reply"></div>
      <div class="row feel-more"><button class="small-btn" id="btn-new-story">New story</button></div>`;
    $("btn-new-story").onclick = stepFeeling;
    say(`${sc.text} How might your monster feel?`);

    $("panel").querySelectorAll("[data-emo]").forEach((b) => b.addEventListener("click", () => {
      const e = b.dataset.emo;
      const info = C.EMOTIONS[e];
      spec.emotion = e;
      $("panel").querySelectorAll("[data-emo]").forEach((x) => x.classList.toggle("on", x === b));
      Sfx.pop();
      drawStage();
      const fits = sc.fits.includes(e);
      const lead = fits
        ? `Yes, your monster might feel ${info.name}.`
        : `Your monster feels ${info.name}. Different monsters can feel different ways, and that's okay!`;
      $("panel").classList.add("picked");
      $("feel-reply").innerHTML = `
        <div class="bubble">${esc(lead)} ${esc(info.tip)}<span class="ask">Talk about it: ${esc(info.ask)}</span></div>
        <div class="row"><button class="small-btn" id="btn-refeel">Pick a different feeling</button></div>
        <button class="next-btn" id="btn-next">Next &#x27A1;&#xFE0F;</button>`;
      $("btn-refeel").onclick = () => {
        $("panel").classList.remove("picked");
        $("feel-reply").innerHTML = "";
      };
      $("btn-next").onclick = () => {
        spec.feelingStory = sc.text;
        // Feelings have no wrong answer, so this counts as practice only.
        window.MightyProgress?.log({
          game: "monster-maker",
          skill: "Naming feelings",
          item: info.name,
          correct: null,
          extra: { story: sc.text, fitsStory: fits }
        });
        nextStep();
      };
      say(`${lead} ${info.tip} ${info.ask}`);
    }));
  }

  // ---------------------------------------------------------------- name + finish

  function stepName() {
    const names = [C.makeName(), C.makeName(), C.makeName()];
    if (!spec.name) spec.name = names[0];
    $("panel").innerHTML = `
      <h2>Name your monster!</h2>
      <div class="names">${names.map((n) => `<button class="name-btn${n === spec.name ? " on" : ""}" data-name="${esc(n)}">${esc(n)}</button>`).join("")}
        <button class="small-btn" id="btn-more-names">More names</button></div>
      <input id="name-input" class="name-input" maxlength="24" placeholder="or type a name" autocomplete="off" />
      <button class="next-btn" id="btn-finish">Finish! &#x2B50;</button>`;
    say("What's your monster's name? Tap one, or type your own!");
    $("panel").querySelectorAll("[data-name]").forEach((b) => b.addEventListener("click", () => {
      spec.name = b.dataset.name;
      $("name-input").value = "";
      $("panel").querySelectorAll("[data-name]").forEach((x) => x.classList.toggle("on", x === b));
      say(spec.name);
    }));
    $("btn-more-names").onclick = () => { spec.name = ""; stepName(); };
    $("name-input").addEventListener("input", (e) => {
      const v = e.target.value.trim();
      if (v) {
        spec.name = v;
        $("panel").querySelectorAll("[data-name]").forEach((x) => x.classList.remove("on"));
      }
    });
    $("btn-finish").onclick = finish;
  }

  function finish() {
    spec.name = spec.name || C.makeName();
    store.data.monsters.unshift(spec);
    store.save();
    showMonster(spec, true);
  }

  // ---------------------------------------------------------------- done / detail view

  let viewing = null;

  function recipeHTML(m) {
    const L = C.LEVELS[m.level] || C.LEVELS.k;
    const shapeName = C.shapeName(m.shape, m.level);
    const rows = C.PARTS.filter((p) => m[p.id]).map((p) => {
      const rec = (m.problems || []).find((x) => x.part === p.id);
      const n = m[p.id];
      return `<div class="recipe-row">${renderIcon(p.id, m.color)}<b>${n} ${n === 1 ? p.one : p.noun}</b>${rec ? `<small>${esc(rec.record)}</small>` : ""}</div>`;
    }).join("");
    const emo = C.EMOTIONS[m.emotion] || C.EMOTIONS.happy;
    return `
      <h3>${esc(m.name)} the ${esc(shapeName)} monster</h3>
      ${rows}
      <div class="recipe-row"><span style="width:32px;text-align:center">&#x2764;&#xFE0F;</span><b>Feels ${esc(emo.name)}</b></div>
      <div class="recipe-row"><small style="margin-left:0">${esc(L.label)} math</small></div>`;
  }

  let viewingFresh = false;

  function showMonster(m, fresh) {
    viewing = m;
    viewingFresh = fresh;
    show("done");
    $("rename").classList.add("hidden");
    $("done-title").textContent = fresh ? `Meet ${m.name}!` : m.name;
    $("done-monster").innerHTML = renderMonster(m);
    $("done-recipe").innerHTML = recipeHTML(m);
    $("btn-delete").classList.toggle("hidden", fresh);
    $("btn-again").textContent = fresh ? "Build another!" : "Build a new one!";
    if (fresh) {
      Sfx.tada();
      confetti();
      const parts = C.PARTS.filter((p) => m[p.id]).map((p) => `${m[p.id]} ${m[p.id] === 1 ? p.one : p.noun}`);
      say(`Meet ${m.name}! ${m.name} has ${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}. You did it!`);
    }
  }

  function confetti() {
    const box = $("confetti");
    box.innerHTML = "";
    const colors = COLORS.map((c) => c.fill);
    for (let i = 0; i < 60; i++) {
      const el = document.createElement("i");
      el.style.left = `${Math.random() * 100}%`;
      el.style.background = colors[i % colors.length];
      el.style.animationDuration = `${2 + Math.random() * 2}s`;
      el.style.animationDelay = `${Math.random() * 0.8}s`;
      box.appendChild(el);
    }
    setTimeout(() => { box.innerHTML = ""; }, 5000);
  }

  // ---------------------------------------------------------------- gallery

  function renderGallery() {
    const list = store.data.monsters;
    $("gallery-grid").innerHTML = list.length
      ? list.map((m, i) => {
        const frame = (COLORS.find((c) => c.id === m.color) || COLORS[0]).fill;
        const tilt = [-2, 1.5, -1, 2, -1.5, 1][i % 6];
        return `<button class="gallery-card" data-i="${i}" style="--frame:${frame};--tilt:${tilt}deg">${renderMonster(m)}<span class="plate">${esc(m.name)}</span></button>`;
      }).join("")
      : `<div class="gallery-empty">No monsters yet. Go build one!</div>`;
    $("btn-print-all").classList.toggle("hidden", !list.length);
    show("gallery");
  }

  $("gallery-grid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-i]");
    if (b) showMonster(store.data.monsters[Number(b.dataset.i)], false);
  });

  // ---------------------------------------------------------------- printing

  function printPageHTML(m, outline) {
    const emo = C.EMOTIONS[m.emotion] || C.EMOTIONS.happy;
    return `<div class="print-page">
      <h1>${esc(m.name)}</h1>
      <p class="print-sub">${outline ? "Color me in!" : `the ${esc(C.shapeName(m.shape, m.level))} monster`}</p>
      <div class="print-monster">${renderMonster(m, { outline })}</div>
      <div class="recipe">${recipeHTML(m)}</div>
      <p class="print-feel">${esc(m.name)} feels ${esc(emo.name)}. ${esc(emo.ask)}</p>
      <p class="print-made">Made by ______________________ &nbsp; on ${new Date(m.created).toLocaleDateString()}</p>
    </div>`;
  }

  function printHalfHTML(m) {
    const parts = C.PARTS.filter((p) => m[p.id]).map((p) => `${m[p.id]} ${m[p.id] === 1 ? p.one : p.noun}`).join(" \u00b7 ");
    return `<div class="print-half">
      <h2>${esc(m.name)}</h2>
      <div class="print-monster">${renderMonster(m)}</div>
      <p>${esc(parts)}</p>
      <p>Feels ${esc((C.EMOTIONS[m.emotion] || C.EMOTIONS.happy).name)}</p>
    </div>`;
  }

  function doPrint(html) {
    Speech.stop();
    $("print-root").innerHTML = html;
    setTimeout(() => window.print(), 100);
  }

  $("btn-print").onclick = () => viewing && doPrint(printPageHTML(viewing, false));
  $("btn-print-color").onclick = () => viewing && doPrint(printPageHTML(viewing, true));
  $("btn-print-all").onclick = () => {
    const list = store.data.monsters;
    let html = "";
    for (let i = 0; i < list.length; i += 2) {
      html += `<div class="print-pair">${printHalfHTML(list[i])}${list[i + 1] ? printHalfHTML(list[i + 1]) : ""}</div>`;
    }
    doPrint(html);
  };

  // ---------------------------------------------------------------- wiring

  $("btn-start").onclick = startBuild;
  $("btn-gallery").onclick = renderGallery;
  function openRename(names) {
    if (!viewing) return;
    names = names || [C.makeName(), C.makeName(), C.makeName()];
    let picked = viewing.name;
    $("rename-panel").innerHTML = `
      <h2>New name for ${esc(viewing.name)}?</h2>
      <div class="names">${names.map((n) => `<button class="name-btn" data-name="${esc(n)}">${esc(n)}</button>`).join("")}
        <button class="small-btn" id="btn-rename-more">More names</button></div>
      <input id="rename-input" class="name-input" maxlength="24" placeholder="or type a name" autocomplete="off" />
      <div class="row">
        <button class="mid-btn" id="btn-rename-cancel">Keep old name</button>
        <button class="next-btn" id="btn-rename-save">Save &#x2B50;</button>
      </div>`;
    $("rename").classList.remove("hidden");
    say(`What's ${viewing.name}'s new name? Tap one, or type your own!`);
    const panel = $("rename-panel");
    panel.querySelectorAll("[data-name]").forEach((b) => b.addEventListener("click", () => {
      picked = b.dataset.name;
      $("rename-input").value = "";
      panel.querySelectorAll("[data-name]").forEach((x) => x.classList.toggle("on", x === b));
      say(picked);
    }));
    $("rename-input").addEventListener("input", (e) => {
      const v = e.target.value.trim();
      picked = v || viewing.name;
      panel.querySelectorAll("[data-name]").forEach((x) => x.classList.remove("on"));
    });
    $("btn-rename-more").onclick = () => openRename();
    $("btn-rename-cancel").onclick = () => $("rename").classList.add("hidden");
    $("btn-rename-save").onclick = () => {
      viewing.name = picked;
      store.save();
      $("rename").classList.add("hidden");
      $("done-title").textContent = viewingFresh ? `Meet ${picked}!` : picked;
      $("done-recipe").innerHTML = recipeHTML(viewing);
      $("done-monster").innerHTML = renderMonster(viewing);
      Sfx.tada();
      say(`Hello, ${picked}!`);
    };
  }

  $("btn-rename").onclick = () => openRename();
  $("btn-to-gallery").onclick = renderGallery;
  $("btn-again").onclick = startBuild;
  $("btn-hear").onclick = () => lastSay && Speech.say(lastSay);
  const goHome = () => { Speech.stop(); renderHome(); show("home"); };
  $("btn-build-home").onclick = goHome;
  $("btn-done-home").onclick = goHome;
  $("btn-gallery-home").onclick = goHome;
  $("btn-delete").onclick = () => {
    if (!viewing || !confirm(`Delete ${viewing.name}?`)) return;
    store.data.monsters = store.data.monsters.filter((m) => m.id !== viewing.id);
    store.save();
    renderGallery();
  };

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});

  Speech.init();
  renderHome();
  show("home");
})();
