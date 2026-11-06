// Word Monsters' painted monsters, drawn for this game. Each species has three stages; stage 3
// wears the crown and wings. Sprites are two layers in ../word-monsters/images/monsters/:
// "b" is gray fur that gets tinted, "f" is everything painted on top. Same tint as monsters.js.

const BASE = "../word-monsters/images/monsters/";
const FUR_GRAY = 0.82;

// Per species, per stage: [width, height] (copied from word-monsters/monsters.js).
const SIZES = [
  [[325, 360], [288, 360], [293, 360]],
  [[271, 360], [270, 360], [291, 360]],
  [[310, 360], [286, 360], [304, 360]],
  [[250, 360], [250, 360], [251, 360]],
  [[309, 360], [273, 360], [258, 360]],
  [[309, 360], [295, 360], [309, 360]],
  [[280, 360], [289, 360], [291, 360]],
  [[282, 360], [295, 360], [306, 360]],
  [[257, 360], [278, 360], [271, 360]],
  [[329, 360], [347, 360], [340, 360]]
];

// One fur color per species, so a species always looks like itself.
const FUR = [
  [255, 140, 36], [52, 124, 236], [64, 190, 86], [150, 84, 222], [255, 120, 182],
  [28, 182, 172], [232, 52, 64], [242, 192, 40], [166, 226, 46], [120, 150, 255]
];

export const SPECIES = SIZES.length;

let uid = 0;

/** An <svg> of one monster, sized by CSS height. */
export function monster(species, stage, className = "") {
  const s = ((species % SPECIES) + SPECIES) % SPECIES;
  const st = Math.max(1, Math.min(3, stage | 0));
  const [w, h] = SIZES[s][st - 1];
  const [r, g, b] = FUR[s].map((c) => (c / 255 / FUR_GRAY).toFixed(3));
  const id = `pm${++uid}`;
  const src = `${BASE}m${s + 1}-${st}`;
  const wrap = document.createElement("span");
  wrap.className = `monster ${className}`.trim();
  wrap.style.aspectRatio = `${w} / ${h}`;
  wrap.innerHTML = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0 0 0 0 0 0 0 1 0"/></filter></defs>
    <image href="${src}b.webp" width="${w}" height="${h}" filter="url(#${id})"/>
    <image href="${src}f.webp" width="${w}" height="${h}"/></svg>`;
  return wrap;
}
