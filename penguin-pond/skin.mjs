// The look and words of Penguin Pond. The rules (numbers, graphs, what a miss says) live in
// math.mjs and app.mjs. A second skin replaces only this file.
// This one: penguins on an icy pond. Each right answer drops a fish in the bucket. The graph
// counts fish each penguin caught; each penguin wears its bar's color as a scarf.

const NS = "http://www.w3.org/2000/svg";
const SCARF = { red: "#e8445a", blue: "#3b82f6", green: "#22c55e", yellow: "#f5b700" };
// Fish spots in the bucket, inside a 300 x 200 picture.
const FISH = [[70, 64], [150, 58], [230, 64], [86, 112], [166, 108], [236, 114], [120, 150], [200, 150]];

function svg(tag, attrs = {}, text) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (text != null) node.textContent = text;
  return node;
}

function fishShape(x, y, { fill, stroke, dash }) {
  const g = svg("g", { class: "fish" });
  g.style.transformOrigin = `${x}px ${y}px`;
  const style = { fill, stroke, "stroke-width": 3, ...(dash ? { "stroke-dasharray": "6 5" } : {}) };
  g.append(
    svg("ellipse", { cx: x, cy: y, rx: 30, ry: 17, ...style }),
    svg("polygon", { points: `${x + 26},${y} ${x + 46},${y - 15} ${x + 46},${y + 15}`, ...style })
  );
  return g;
}

export const SKIN = {
  title: "Penguin Pond",
  background: "./assets/bg.svg",
  prize: "./assets/icon.svg",
  thing: "fish",
  who: (name) => name.charAt(0).toUpperCase() + name.slice(1),
  scarf: (name) => SCARF[name] || "#7c6cf0",

  say: {
    right: ["Splash! A fish for the bucket.", "Into the bucket!", "The penguins cheer.", "One more fish."],
    kept: ["You got it. A fish for the bucket.", "There it is. Into the bucket."],
    roundDone: "The bucket is full. Fish for everyone!",
    nextOpen: "A new pond game is open.",
    hintLabel: "Hint"
  },

  /** A small penguin, as an SVG element. `scarf` is a color name or "". */
  penguin(scarf = "") {
    const pic = svg("svg", { viewBox: "0 0 60 72", class: "penguin", "aria-hidden": "true" });
    pic.append(
      svg("ellipse", { cx: 30, cy: 42, rx: 22, ry: 27, fill: "#22303f" }),
      svg("ellipse", { cx: 30, cy: 47, rx: 14, ry: 20, fill: "#ffffff" }),
      svg("circle", { cx: 24, cy: 24, r: 3, fill: "#ffffff" }), svg("circle", { cx: 36, cy: 24, r: 3, fill: "#ffffff" }),
      svg("circle", { cx: 24, cy: 24, r: 1.5, fill: "#111" }), svg("circle", { cx: 36, cy: 24, r: 1.5, fill: "#111" }),
      svg("polygon", { points: "26,29 34,29 30,35", fill: "#f59e0b" }),
      svg("ellipse", { cx: 22, cy: 69, rx: 7, ry: 3, fill: "#f59e0b" }), svg("ellipse", { cx: 38, cy: 69, rx: 7, ry: 3, fill: "#f59e0b" })
    );
    if (scarf) pic.append(svg("rect", { x: 12, y: 33, width: 36, height: 7, rx: 3, fill: SCARF[scarf] || scarf }));
    return pic;
  },

  /** A bucket with `total` fish-shaped spots. */
  goal(total) {
    const wrap = document.createElement("div");
    wrap.className = "goal bucket-goal";
    const pic = svg("svg", { viewBox: "0 0 300 200", role: "img", "aria-label": `A bucket with room for ${total} fish` });
    pic.append(
      svg("path", { d: "M30 30 H270 L248 196 H52 Z", fill: "#5b8fb9" }),
      svg("rect", { x: 22, y: 22, width: 256, height: 16, rx: 8, fill: "#7fb0d8" })
    );
    FISH.slice(0, total).forEach(([x, y], index) => {
      const spot = fishShape(x - 10, y, { fill: "none", stroke: "rgba(255,255,255,.8)", dash: true });
      spot.classList.add("spot");
      spot.dataset.index = String(index);
      pic.append(spot);
    });
    wrap.append(pic);
    wrap.dataset.total = String(total);
    return wrap;
  },

  /** A fish with the answer on it lands in spot `index`. */
  fill(goal, index, piece, { still } = {}) {
    const pic = goal.querySelector("svg");
    pic.querySelector(`.spot[data-index="${index}"]`)?.remove();
    const [x, y] = FISH[index] || FISH.at(-1);
    const fish = fishShape(x - 10, y, { fill: "#f59e0b", stroke: "#c2410c" });
    fish.append(svg("text", { x: x - 12, y: y + 6, "text-anchor": "middle", "font-size": String(piece).length > 3 ? 12 : 16, "font-weight": 900, fill: "#3b1d06" }, String(piece ?? "")));
    if (!still) fish.classList.add("fresh");
    pic.append(fish);
  },

  dress(button) {
    button.classList.add("ice");
  }
};
