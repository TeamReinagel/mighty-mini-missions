// The look and words of Letter Lights. The rules (which letters, what a miss says) live in
// letters.mjs and app.mjs. A second skin replaces only this file.
// This one: a string of holiday lights with dark bulbs. Each letter found lights a bulb with
// that letter on it.

const NS = "http://www.w3.org/2000/svg";
const GLOW = ["#ff4d5e", "#ffd23f", "#3ddc84", "#4da3ff", "#ff8c42", "#c77dff", "#ff6fb5", "#2ee6d6"];

function svg(tag, attrs = {}, text) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (text != null) node.textContent = text;
  return node;
}

// Bulb spots along a drooping wire, inside a 360 x 150 picture.
function spots(total) {
  return Array.from({ length: total }, (_, i) => {
    const x = 30 + (300 * i) / Math.max(1, total - 1);
    const t = (x - 30) / 300;
    const y = 34 + Math.sin(t * Math.PI * 2) * 12 + 18 * Math.sin(t * Math.PI);
    return [x, y];
  });
}

export const SKIN = {
  title: "Letter Lights",
  background: "./assets/bg.svg",
  prize: "./assets/icon.svg",

  say: {
    right: ["Light on!", "It's glowing!", "Yes! Light on.", "Another light!"],
    kept: ["You found it. Light on!", "There it is. Light on!"],
    roundDone: "All the lights are on!",
    nextOpen: "New letters are ready.",
    hintLabel: "Help"
  },

  goal(total) {
    const wrap = document.createElement("div");
    wrap.className = "goal lights-goal";
    const pic = svg("svg", { viewBox: "0 0 360 150", role: "img", "aria-label": `A string of ${total} dark lights` });
    const at = spots(total);
    const d = at.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y - 20}`).join(" ");
    pic.append(svg("path", { d: `M0 20 ${d.replace("M", "L")} L360 20`, fill: "none", stroke: "#1f4d2e", "stroke-width": 4 }));
    at.forEach(([x, y], index) => {
      const g = svg("g", { class: "bulb", "data-index": index });
      g.append(
        svg("rect", { x: x - 7, y: y - 24, width: 14, height: 12, rx: 3, fill: "#2f6b3e" }),
        svg("ellipse", { class: "glass", cx: x, cy: y + 8, rx: 17, ry: 23, fill: "rgba(255,255,255,.18)", stroke: "rgba(255,255,255,.55)", "stroke-width": 2 })
      );
      pic.append(g);
    });
    wrap.append(pic);
    wrap.dataset.total = String(total);
    wrap._spots = at;
    return wrap;
  },

  fill(goal, index, letter, { still } = {}) {
    const pic = goal.querySelector("svg");
    const g = pic.querySelector(`.bulb[data-index="${index}"]`);
    if (!g) return;
    const [x, y] = goal._spots[index];
    const color = GLOW[index % GLOW.length];
    const glass = g.querySelector(".glass");
    glass.setAttribute("fill", color);
    glass.setAttribute("stroke", "white");
    g.insertBefore(svg("ellipse", { cx: x, cy: y + 8, rx: 30, ry: 36, fill: color, opacity: 0.28 }), glass);
    g.append(svg("text", { x, y: y + 17, "text-anchor": "middle", "font-size": 24, "font-weight": 900, fill: "#241c33" }, letter));
    g.style.transformOrigin = `${x}px ${y}px`;
    if (!still) g.classList.add("fresh");
  },

  dress(button, index) {
    button.classList.add("bulb-pick");
    button.style.setProperty("--glow", GLOW[(index * 3 + 2) % GLOW.length]);
  }
};
