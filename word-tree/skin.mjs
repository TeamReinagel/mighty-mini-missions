// The look and words of Word Tree. The rules (which words, which choices, what a miss says)
// live in words.mjs and app.mjs. A second skin replaces only this file.
// This one: a bare Christmas tree with empty hooks. Each word found hangs an ornament with
// that word on it. A full tree lights its star.

const NS = "http://www.w3.org/2000/svg";
const ORNAMENTS = ["#e8445a", "#3b82f6", "#f5b700", "#a855f7", "#14b8a6", "#f97316", "#ec4899", "#22c55e"];
// Hook spots on the tree, top to bottom, inside a 300 x 240 picture.
const HOOKS = [[150, 70], [118, 112], [184, 112], [96, 160], [150, 150], [206, 160], [80, 206], [220, 206]];

function svg(tag, attrs = {}, text) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (text != null) node.textContent = text;
  return node;
}

function ornament(x, y, color, word) {
  const g = svg("g", { class: "ornament" });
  g.style.transformOrigin = `${x}px ${y}px`;
  g.append(
    svg("rect", { x: x - 6, y: y - 25, width: 12, height: 8, rx: 2, fill: "#d9c27a" }),
    svg("circle", { cx: x, cy: y, r: 22, fill: color, stroke: "rgba(255,255,255,.75)", "stroke-width": 2 }),
    svg("text", { x, y: y + 6, "text-anchor": "middle", "font-size": word.length > 4 ? 13 : 16, "font-weight": 800, fill: "white" }, word)
  );
  return g;
}

export const SKIN = {
  title: "Word Tree",
  background: "./assets/bg.svg",
  prize: "./assets/icon.svg",
  colors: ORNAMENTS,

  say: {
    right: ["On the tree it goes.", "Hang it up!", "Yes, that's the word.", "Another one on the tree."],
    kept: ["You found it. On the tree it goes.", "There it is. Hang it up."],
    roundDone: "The tree is full, and the star is shining!",
    nextOpen: "New words are ready.",
    hintLabel: "Hint"
  },

  /** The tree with `total` empty hooks. */
  goal(total) {
    const wrap = document.createElement("div");
    wrap.className = "goal tree-goal";
    const pic = svg("svg", { viewBox: "0 0 300 240", role: "img", "aria-label": `A tree with ${total} empty hooks` });
    pic.append(
      svg("rect", { x: 138, y: 214, width: 24, height: 22, rx: 4, fill: "#7a4a24" }),
      svg("polygon", { points: "150,40 236,140 64,140", fill: "#1f7a4c" }),
      svg("polygon", { points: "150,82 262,218 38,218", fill: "#23905a" }),
      svg("polygon", { points: "150,40 210,110 90,110", fill: "#2aa465" })
    );
    const star = svg("polygon", { class: "star", points: "150,6 158,26 180,27 163,40 169,61 150,49 131,61 137,40 120,27 142,26", fill: "rgba(255,255,255,.35)" });
    pic.append(star);
    HOOKS.slice(0, total).forEach(([x, y], index) => {
      pic.append(svg("circle", { class: "hook", "data-index": index, cx: x, cy: y, r: 20, fill: "none", stroke: "rgba(255,255,255,.8)", "stroke-width": 3, "stroke-dasharray": "6 5" }));
    });
    wrap.append(pic);
    wrap.dataset.total = String(total);
    return wrap;
  },

  /** Hangs the found word on hook `index`. A full tree lights the star. */
  fill(goal, index, word, { still } = {}) {
    const pic = goal.querySelector("svg");
    const hook = pic.querySelector(`.hook[data-index="${index}"]`);
    const [x, y] = HOOKS[index] || HOOKS.at(-1);
    hook?.remove();
    const node = ornament(x, y, ORNAMENTS[index % ORNAMENTS.length], word);
    if (!still) node.classList.add("fresh");
    pic.append(node);
    if (index + 1 >= Number(goal.dataset.total)) {
      const star = pic.querySelector(".star");
      star.setAttribute("fill", "#ffd447");
      if (!still) star.classList.add("fresh");
    }
  },

  /** Choice buttons look like ornaments; each gets its own color. */
  dress(button, index) {
    button.classList.add("bauble");
    button.style.setProperty("--bauble", ORNAMENTS[(index * 3 + 1) % ORNAMENTS.length]);
  }
};
