// Word marks for Lark & Nib’s Treasure Quest. The same word always marks the same way.
// An arch joins letters that make one sound. A bar sits on a long vowel or a soft c or g.
// A sight word is one yellow word, not a string of sounds.

const TEAM_SAY = {
  igh: "eye",
  sh: "sh",
  ch: "ch",
  th: "th",
  wh: "w",
  ph: "f",
  ng: "ng",
  nk: "nk",
  ck: "k",
  ee: "ee",
  ea: "ee",
  oo: "oo",
  ou: "ow",
  ow: "ow",
  ai: "ay",
  ay: "ay",
  oa: "oh",
  oi: "oy",
  oy: "oy",
  aw: "aw",
  au: "aw",
  al: "all",
  ar: "ar",
  er: "er",
  ir: "er",
  or: "or",
  ur: "er"
};

const TEAMS = Object.keys(TEAM_SAY).sort((a, b) => b.length - a.length || a.localeCompare(b));

const LETTER_SAY = {
  a: "ah", b: "buh", c: "k", d: "d", e: "eh", f: "fff", g: "g", h: "h",
  i: "ih", j: "j", k: "k", l: "lll", m: "mmm", n: "nnn", o: "o", p: "p",
  q: "kw", r: "rrr", s: "sss", t: "t", u: "uh", v: "vvv", w: "w", x: "ks",
  y: "y", z: "zzz"
};

const LONG = { a: "ay", e: "ee", i: "eye", o: "oh", u: "yoo", y: "eye" };

const HARD_G = new Set(["get", "gift", "give", "girl", "gear", "begin", "finger", "bigger"]);

export function marksOpen(trailNumber, revealed) {
  return Number(trailNumber) <= 4 || Boolean(revealed);
}

export function pictureUnlocked(read, total) {
  return total > 0 && read >= total;
}

export function readWord(token, opts = {}) {
  const matched = String(token).match(/^([^A-Za-z]*)([A-Za-z]+)([^A-Za-z]*)$/);
  if (!matched) return { text: String(token), skip: true, before: "", after: "", chunks: [], sight: false };
  return { ...annotate(matched[2], opts), before: matched[1], after: matched[3], skip: false };
}

export function annotate(word, opts = {}) {
  const text = String(word);
  const lower = text.toLowerCase();
  const sight = new Set((opts.sight || []).map((entry) => entry.toLowerCase()));
  const taught = new Set(opts.taught || []);
  const parts = opts.splits?.[lower];
  if (Array.isArray(parts) && parts.length) {
    const groups = parts.map((part, index) => {
      const inner = annotate(part, { ...opts, splits: {} });
      const chunks = inner.chunks.map((chunk, chunkIndex) => (
        index > 0 && chunkIndex === 0 ? { ...chunk, gap: true } : chunk
      ));
      return { text: part, say: part, chunks };
    });
    return { text, sight: false, groups, chunks: groups.flatMap((group) => group.chunks) };
  }
  if (sight.has(lower)) {
    return { text, sight: true, chunks: [{ text, say: lower, mark: "sight" }] };
  }
  const chunks = [];
  let index = 0;
  while (index < lower.length) {
    const team = TEAMS.find((entry) => taught.has(entry) && lower.startsWith(entry, index));
    if (team) {
      chunks.push({ text: text.slice(index, index + team.length), say: TEAM_SAY[team], mark: "arch" });
      index += team.length;
      continue;
    }
    const letter = lower[index];
    const next = lower[index + 1] || "";
    if (taught.has("soft-c") && letter === "c" && "eiy".includes(next)) {
      chunks.push({ text: text[index], say: "sss", mark: "bar", soft: "c" });
      index += 1;
      continue;
    }
    if (taught.has("soft-g") && letter === "g" && "eiy".includes(next) && !HARD_G.has(lower)) {
      chunks.push({ text: text[index], say: "juh", mark: "bar", soft: "g" });
      index += 1;
      continue;
    }
    chunks.push({ text: text[index], say: LETTER_SAY[letter] || letter, mark: "plain" });
    index += 1;
  }
  if (taught.has("silent-e")) applySilentE(chunks);
  if (taught.has("open")) applyOpen(chunks);
  if (taught.has("y-long")) applyY(chunks);
  return { text, sight: false, chunks };
}

function applySilentE(chunks) {
  const last = chunks.at(-1);
  if (!last || last.text.toLowerCase() !== "e" || last.mark !== "plain" || last.text.length !== 1) return;
  let vowel = null;
  let consonants = 0;
  for (let index = chunks.length - 2; index >= 0; index -= 1) {
    const chunk = chunks[index];
    if (chunk.mark === "arch") break;
    if (chunk.text.length === 1 && "aeiou".includes(chunk.text.toLowerCase())) {
      vowel = chunk;
      break;
    }
    consonants += 1;
  }
  if (!vowel || consonants < 1) return;
  vowel.mark = "bar";
  vowel.say = LONG[vowel.text.toLowerCase()] || vowel.say;
  last.silent = true;
  last.say = "";
}

function applyOpen(chunks) {
  const vowels = chunks.filter((chunk) => chunk.text.length === 1 && "aeiou".includes(chunk.text.toLowerCase()));
  if (vowels.length !== 1) return;
  const vowel = vowels[0];
  if (vowel.mark === "arch") return;
  if (chunks.at(-1) !== vowel && chunks.length !== 1) return;
  vowel.mark = "bar";
  vowel.say = LONG[vowel.text.toLowerCase()] || vowel.say;
}

function applyY(chunks) {
  const last = chunks.at(-1);
  if (!last || last.text.toLowerCase() !== "y" || last.mark !== "plain" || chunks.length < 2) return;
  last.mark = "bar";
  last.say = "eye";
}

export function sliderSegments(annotated) {
  if (!annotated) return [];
  if (annotated.sight) return [{ text: annotated.text, say: annotated.chunks[0].say, sight: true }];
  if (annotated.groups?.length) return annotated.groups.map((group) => ({ text: group.text, say: group.say }));
  return annotated.chunks.filter((chunk) => !chunk.silent).map((chunk) => ({
    text: chunk.text,
    say: chunk.say,
    mark: chunk.mark
  }));
}

function pair(text) {
  const names = [...text].map((letter, index) => (index === 0 ? letter.toUpperCase() : letter.toLowerCase()));
  if (names.length < 2) return names[0] || "";
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

export function joyceHint(annotated) {
  if (!annotated || annotated.sight) return "Say this one as a whole word.";
  const arch = (annotated.chunks || []).find((chunk) => chunk.mark === "arch");
  if (arch) return `${pair(arch.text)} stay together. They say ${arch.say}.`;
  const soft = (annotated.chunks || []).find((chunk) => chunk.soft);
  if (soft?.soft === "c") return "This c says sss.";
  if (soft?.soft === "g") return "This g says juh.";
  if ((annotated.chunks || []).some((chunk) => chunk.mark === "bar")) return "That vowel says its name.";
  return "Say the first sound. Then say the rest.";
}
