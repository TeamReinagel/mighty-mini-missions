// The look and words of Word Workshop. The rules (word lists, choices, what a miss says) live
// in words.mjs and app.mjs. A second skin replaces only this file.
// This one: a toy workshop. Each right answer wraps a gift and loads it on the sleigh.

const NS = "http://www.w3.org/2000/svg";
const PAPER = ["#e8445a", "#3b82f6", "#22c55e", "#a855f7", "#f97316", "#14b8a6", "#ec4899", "#eab308"];
// Gift spots on the sleigh bed, inside a 340 x 210 picture: the bottom row, then a row on top.
const GIFT = 60;
const SPOTS = [[48, 66], [112, 66], [176, 66], [240, 66], [80, 8], [144, 8], [208, 8], [16, 8]];

function svg(tag, attrs = {}, text) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (text != null) node.textContent = text;
  return node;
}

export const SKIN = {
  title: "Word Workshop",
  background: "./assets/bg.svg",
  prize: "./assets/icon.svg",

  // Pictures for the three word jobs. The words "noun", "verb", "adjective" are the skill.
  jobIcons: { n: "🧸", v: "🏃", a: "🎨" },

  say: {
    right: ["Wrapped and loaded!", "Onto the sleigh.", "That one's ready.", "Nice work, wrap it up."],
    kept: ["You got it. Onto the sleigh.", "There it is. Wrap it up."],
    roundDone: "The sleigh is full. Every gift is ready!",
    nextOpen: "A new job is open in the workshop.",
    hintLabel: "Hint"
  },

  /** An empty sleigh with `total` spots for gifts. */
  goal(total) {
    const wrap = document.createElement("div");
    wrap.className = "goal sleigh-goal";
    const pic = svg("svg", { viewBox: "0 0 340 210", role: "img", "aria-label": `A sleigh with room for ${total} gifts` });
    SPOTS.slice(0, total).forEach(([x, y], index) => {
      pic.append(svg("rect", { class: "spot", "data-index": index, x, y, width: GIFT - 4, height: GIFT - 4, rx: 8, fill: "none", stroke: "rgba(255,255,255,.85)", "stroke-width": 3, "stroke-dasharray": "7 6" }));
    });
    pic.append(
      svg("path", { class: "body", d: "M30 122 H306 Q330 122 330 96 V80 H316 V100 Q316 108 306 108 H30 Z", fill: "#c62f3c" }),
      svg("rect", { x: 30, y: 116, width: 290, height: 46, rx: 12, fill: "#c62f3c" }),
      svg("rect", { x: 40, y: 128, width: 270, height: 8, rx: 4, fill: "#f5c542" }),
      svg("path", { d: "M20 196 H306 Q332 196 336 176", fill: "none", stroke: "#f5c542", "stroke-width": 8, "stroke-linecap": "round" }),
      svg("line", { x1: 80, y1: 160, x2: 80, y2: 196, stroke: "#f5c542", "stroke-width": 7 }),
      svg("line", { x1: 260, y1: 160, x2: 260, y2: 196, stroke: "#f5c542", "stroke-width": 7 })
    );
    wrap.append(pic);
    wrap.dataset.total = String(total);
    return wrap;
  },

  /** Wraps a gift with `piece` on its tag and sets it in spot `index`. */
  fill(goal, index, piece, { still } = {}) {
    const pic = goal.querySelector("svg");
    pic.querySelector(`.spot[data-index="${index}"]`)?.remove();
    const [x, y] = SPOTS[index] || SPOTS.at(-1);
    const color = PAPER[index % PAPER.length];
    const g = svg("g", { class: "gift" });
    g.style.transformOrigin = `${x + GIFT / 2}px ${y + GIFT / 2}px`;
    const text = String(piece ?? "");
    g.append(
      svg("rect", { x, y, width: GIFT - 4, height: GIFT - 4, rx: 8, fill: color }),
      svg("rect", { x: x + GIFT / 2 - 6, y, width: 8, height: GIFT - 4, fill: "rgba(255,255,255,.8)" }),
      svg("rect", { x: x + 3, y: y + 14, width: GIFT - 10, height: 26, rx: 6, fill: "white" }),
      svg("text", { x: x + GIFT / 2 - 2, y: y + 34, "text-anchor": "middle", "font-size": /\p{Extended_Pictographic}/u.test(text) ? 20 : text.length > 6 ? 11 : 15, "font-weight": 800, fill: "#241c33" }, text)
    );
    if (!still) g.classList.add("fresh");
    // Gifts sit behind the sleigh's raised front.
    pic.insertBefore(g, pic.querySelector(".body"));
  },

  dress(button, index) {
    button.style.setProperty("--paper", PAPER[(index * 2 + 1) % PAPER.length]);
  }
};
