// Finger tracing for the Path shop and the Desk.
//
// The stroke is a wide yellow road. As the finger moves along it, the road fills in green from
// the green dot, so the child sees how far they have come. A lift keeps the place: the green dot
// waits where the finger stopped, and touching it again carries on. Wandering a little is fine.
// Going well off the road stops the paint, keeps what was done, and moves the dot back to the
// last good spot. That slip is noted for the first-try record; the child's work is never wiped.
// A touch away from the dot does nothing but point at the dot.

const NS = "http://www.w3.org/2000/svg";
const SAMPLES = 240;
const RESUME = 0.12; // how far past the green dot a fresh touch may land
const BACK = 0.08;
const ROAD = 12; // the drawn road's width; the finger may wander wider than this
const DONE_AT = 0.94;
const NUDGE_MS = 2500;

function node(tag, attrs = {}) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
}

function sample(path) {
  const len = path.getTotalLength();
  const pts = [];
  for (let i = 0; i <= SAMPLES; i += 1) {
    const p = path.getPointAtLength((len * i) / SAMPLES);
    pts.push({ x: p.x, y: p.y, t: i / SAMPLES });
  }
  return { len, pts };
}

function closest(pts, x, y, from, to) {
  let best = Infinity;
  let t = from;
  for (const p of pts) {
    if (p.t < from || p.t > to) continue;
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < best) {
      best = d;
      t = p.t;
    }
  }
  return { dist: best, t };
}

function pointOn(svg, event) {
  const rect = svg.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 120
  };
}

// host: where the pad goes. strokes: [{ d, cue }]. tolerance: road half-width in pad units
// (the pad is 100 wide). say(text): speak a line. sound(name): play a skin sound.
// Resolves { clean } once every stroke is done; clean is false after any slip.
export function runTrace(host, { strokes, tolerance = 14, say, sound, words, helperSrc }) {
  return new Promise((resolve) => {
    let slipped = false;
    let index = 0;
    let progress = 0;
    let drawing = false;
    let lastNudge = -Infinity;
    let toldKeep = false;
    let cur = null;
    let last = null;

    const wrap = document.createElement("div");
    wrap.className = "trace-host";
    const svg = node("svg", { viewBox: "0 0 100 120", class: "trace-pad", role: "img", "aria-label": "Tracing pad" });
    svg.append(
      node("line", { x1: 6, y1: 10, x2: 94, y2: 10, class: "guide-line" }),
      node("line", { x1: 6, y1: 50, x2: 94, y2: 50, class: "guide-line mid" }),
      node("line", { x1: 6, y1: 90, x2: 94, y2: 90, class: "guide-line" })
    );

    // The whole shape stays faintly visible, so what "done" looks like is always in the picture.
    const ghost = node("g", { class: "ghost" });
    for (const s of strokes) ghost.append(node("path", { d: s.d }));
    const roads = node("g");
    const fills = node("g", { class: "fills" });
    const ring = node("circle", { r: 9, class: "bead-ring" });
    const bead = node("circle", { r: 6, class: "bead" });
    svg.append(ghost, roads, fills, ring, bead);

    const peek = document.createElement("img");
    peek.className = "trace-peek";
    peek.src = helperSrc || "";
    peek.alt = "";

    wrap.append(svg, peek);
    host.append(wrap);

    const at = (t) => cur.info.pts[Math.round(t * SAMPLES)];

    function placeBead(t, { pulse = false } = {}) {
      const p = at(t);
      for (const c of [bead, ring]) {
        c.setAttribute("cx", p.x.toFixed(2));
        c.setAttribute("cy", p.y.toFixed(2));
      }
      if (pulse) {
        ring.classList.remove("pulse");
        void ring.getBoundingClientRect();
        ring.classList.add("pulse");
      }
    }

    function paint(t) {
      if (cur.dot) return;
      cur.fill.style.strokeDashoffset = String(cur.info.len * (1 - t));
    }

    function arrow(info) {
      // A small chevron halfway along shows which way the road goes.
      const a = info.pts[Math.round(SAMPLES * 0.46)];
      const b = info.pts[Math.round(SAMPLES * 0.54)];
      const deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      const mid = info.pts[SAMPLES / 2];
      return node("path", {
        d: "M -3 -3.5 L 2 0 L -3 3.5",
        class: "road-arrow",
        transform: `translate(${mid.x.toFixed(2)} ${mid.y.toFixed(2)}) rotate(${deg.toFixed(1)})`
      });
    }

    function setupStroke() {
      const s = strokes[index];
      const road = node("path", { d: s.d, class: "road", "stroke-width": Math.min(ROAD, tolerance * 2) });
      const center = node("path", { d: s.d, class: "road-center" });
      const fill = node("path", { d: s.d, class: "fill" });
      roads.replaceChildren(road, center);
      fills.append(fill);
      const info = sample(fill);
      const dot = info.len < 2;
      if (dot) {
        road.remove();
        center.remove();
        roads.append(node("circle", { cx: info.pts[0].x, cy: info.pts[0].y, r: ROAD * 0.75, class: "road" }));
      } else {
        roads.append(arrow(info));
        fill.style.strokeDasharray = String(info.len);
        fill.style.strokeDashoffset = String(info.len);
      }
      cur = { s, fill, info, dot };
      progress = 0;
      toldKeep = false;
      bead.style.display = "";
      ring.style.display = "";
      placeBead(0, { pulse: true });
      say(dot ? (s.cue || "Now tap the dot.") : s.cue);
    }

    function finishStroke() {
      drawing = false;
      if (cur.dot) {
        const p = cur.info.pts[0];
        cur.fill.replaceWith(node("circle", { cx: p.x, cy: p.y, r: 4, class: "fill-dot" }));
      } else {
        paint(1);
      }
      roads.replaceChildren();
      index += 1;
      if (index >= strokes.length) {
        finish();
        return;
      }
      sound("tap");
      setupStroke();
    }

    function finish() {
      bead.style.display = "none";
      ring.style.display = "none";
      svg.classList.add("done");
      wrap.classList.add("done");
      sound("found");
      say(slipped ? words.again : words.clean);
      setTimeout(() => resolve({ clean: !slipped }), 1100);
    }

    function nudge() {
      placeBead(progress, { pulse: true });
      const now = performance.now();
      if (now - lastNudge < NUDGE_MS) return;
      lastNudge = now;
      say(progress > 0 ? words.keep : words.start);
    }

    function slip() {
      slipped = true;
      drawing = false;
      sound("miss");
      roads.classList.remove("flash");
      void roads.getBoundingClientRect();
      roads.classList.add("flash");
      placeBead(progress, { pulse: true });
      lastNudge = performance.now();
      say(words.off);
    }

    function onDown(event) {
      if (!cur || index >= strokes.length) return;
      event.preventDefault();
      const { x, y } = pointOn(svg, event);
      if (cur.dot) {
        const p = cur.info.pts[0];
        if (Math.hypot(p.x - x, p.y - y) <= tolerance + 4) finishStroke();
        else nudge();
        return;
      }
      const near = closest(cur.info.pts, x, y, Math.max(0, progress - BACK), Math.min(1, progress + RESUME));
      if (near.dist > tolerance) {
        nudge();
        return;
      }
      drawing = true;
      last = { x, y };
      try { svg.setPointerCapture(event.pointerId); } catch { /* fine */ }
      if (near.t > progress) {
        progress = near.t;
        paint(progress);
      }
      placeBead(progress);
    }

    function step(x, y) {
      // The paint can only run ahead as far as the finger really moved, so cutting across the
      // inside of a curve doesn't fill the road the finger skipped.
      const moved = last ? Math.hypot(x - last.x, y - last.y) : 0;
      last = { x, y };
      const reach = Math.max(0.03, (moved * 1.6 + 3) / cur.info.len);
      const near = closest(cur.info.pts, x, y, Math.max(0, progress - BACK), Math.min(1, progress + reach));
      if (near.dist > tolerance * 1.3) {
        slip();
        return false;
      }
      if (near.dist <= tolerance && near.t > progress) {
        progress = near.t;
        paint(progress);
        placeBead(progress);
      }
      if (progress >= DONE_AT) {
        finishStroke();
        return false;
      }
      return true;
    }

    function onMove(event) {
      if (!drawing) return;
      event.preventDefault();
      const events = typeof event.getCoalescedEvents === "function" ? event.getCoalescedEvents() : [];
      for (const e of events.length ? events : [event]) {
        const { x, y } = pointOn(svg, e);
        if (!step(x, y)) return;
      }
    }

    function onUp() {
      if (!drawing) return;
      drawing = false;
      if (progress > 0.05 && progress < DONE_AT && !toldKeep) {
        toldKeep = true;
        placeBead(progress, { pulse: true });
        lastNudge = performance.now();
        say(words.keep);
      }
    }

    svg.addEventListener("pointerdown", onDown);
    svg.addEventListener("pointermove", onMove);
    svg.addEventListener("pointerup", onUp);
    svg.addEventListener("pointercancel", onUp);
    setupStroke();
  });
}
