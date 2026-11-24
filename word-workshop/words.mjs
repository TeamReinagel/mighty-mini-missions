// Word Workshop's rules: Max's First Grade word study (Joyce steps max-compound,
// max-contractions, max-parts-of-speech). No look or theme here (that is skin.mjs).

import { letterName } from "../play/letter-names.mjs";

export const LEVELS = [
  { id: "compound", label: "Word pairs", steps: ["max-compound"], skill: "Compound words", flag: "compound", next: "contraction", hello: "Two small words can snap together into one bigger word." },
  { id: "contraction", label: "Squeeze words", steps: ["max-contractions"], skill: "Contractions", flag: "contraction", next: "parts", hello: "A contraction squeezes two words into one. The apostrophe sits where letters left." },
  { id: "parts", label: "Word jobs", steps: ["max-parts-of-speech"], skill: "Parts of speech", flag: "parts-of-speech", hello: "Every word has a job. A noun names, a verb acts, an adjective describes." }
];

// [first word, second word, picture of the whole word, two second words that make no word].
// Every wrong pair was checked to make a non-word (snowcup, not snowball).
export const COMPOUNDS = [
  ["sun", "flower", "🌻", ["pig", "cup"]],
  ["rain", "bow", "🌈", ["pig", "jam"]],
  ["snow", "man", "⛄", ["cup", "pen"]],
  ["cup", "cake", "🧁", ["fox", "rug"]],
  ["foot", "ball", "🏈", ["cup", "jam"]],
  ["pan", "cake", "🥞", ["hat", "fox"]],
  ["butter", "fly", "🦋", ["pig", "hat"]],
  ["pop", "corn", "🍿", ["hat", "rug"]],
  ["back", "pack", "🎒", ["jam", "pig"]],
  ["tooth", "brush", "🪥", ["cup", "fox"]],
  ["gold", "fish", "🐠", ["jam", "rug"]],
  ["door", "bell", "🔔", ["pig", "fox"]],
  ["mail", "box", "📫", ["pig", "hat"]],
  ["play", "ground", "🛝", ["cup", "fox"]],
  ["skate", "board", "🛹", ["pig", "jam"]],
  ["sea", "shell", "🐚", ["cup", "rug"]],
  ["bath", "tub", "🛁", ["pig", "fox"]],
  ["birth", "day", "🎂", ["cup", "pen"]],
  ["snow", "flake", "❄️", ["pig", "jam"]],
  ["lady", "bug", "🐞", ["cup", "pen"]],
  ["cow", "boy", "🤠", ["jam", "rug"]],
  ["tea", "pot", "🫖", ["fox", "rug"]],
  ["sail", "boat", "⛵", ["pig", "jam"]],
  ["bed", "room", "🛏️", ["fox", "jam"]],
  ["hand", "bag", "👜", ["fox", "jam"]]
].map(([first, second, picture, wrong]) => ({ first, second, word: first + second, picture, wrong }));

// [the two words, the contraction, a misplaced apostrophe, a real contraction that means something else].
export const CONTRACTIONS = [
  ["do not", "don't", "do'nt", "didn't"],
  ["is not", "isn't", "is'nt", "it's"],
  ["did not", "didn't", "did'nt", "don't"],
  ["cannot", "can't", "ca'nt", "don't"],
  ["are not", "aren't", "are'nt", "isn't"],
  ["was not", "wasn't", "was'nt", "isn't"],
  ["does not", "doesn't", "does'nt", "didn't"],
  ["I am", "I'm", "Im'", "I'll"],
  ["it is", "it's", "i'ts", "isn't"],
  ["you are", "you're", "your'e", "you'll"],
  ["we are", "we're", "wer'e", "we'll"],
  ["they are", "they're", "the'yre", "they'll"],
  ["she is", "she's", "sh'es", "she'll"],
  ["I will", "I'll", "Il'l", "I'm"],
  ["we will", "we'll", "wel'l", "we're"],
  ["I have", "I've", "Iv'e", "I'm"],
  ["let us", "let's", "le'ts", "it's"],
  ["that is", "that's", "tha'ts", "what's"]
].map(([full, short, misplaced, other]) => ({ full, short, misplaced, other }));

// What each real contraction stands for, including the ones only used as wrong choices.
export const MEANS = {
  ...Object.fromEntries(CONTRACTIONS.map((item) => [item.short, item.full])),
  "you'll": "you will", "they'll": "they will", "she'll": "she will", "what's": "what is"
};

/**
 * Which letters of the two words the contraction leaves out, and where: "do not" and "don't"
 * leave out the o at index 4 of "do not".
 */
export function leftOut(full, short) {
  const plain = short.replace("'", "");
  const joined = full.replace(" ", "");
  let start = 0;
  while (start < plain.length && plain[start].toLowerCase() === joined[start].toLowerCase()) start += 1;
  const gone = joined.length - plain.length;
  const letters = joined.slice(start, start + gone);
  // Index in `full` (which has a space): letters after the space shift by one.
  const space = full.indexOf(" ");
  const at = space >= 0 && start >= space ? start + 1 : start;
  return { letters, at };
}

// Sentences with each word's job: [word|n] names, [word|v|who does it], [word|a|what it describes].
export const SENTENCES = [
  "The [big|a|the dog] [dog|n] [runs|v|the dog].",
  "A [little|a|the bird] [bird|n] [sings|v|the bird].",
  "The [happy|a|the cat] [cat|n] [sleeps|v|the cat].",
  "[Snow|n] [falls|v|the snow] on the [tall|a|the tree] [tree|n].",
  "The [green|a|the frog] [frog|n] [hops|v|the frog].",
  "A [fast|a|the car] [car|n] [zooms|v|the car].",
  "The [tiny|a|the mouse] [mouse|n] [squeaks|v|the mouse].",
  "[Dad|n] [reads|v|Dad] a [funny|a|the book] [book|n].",
  "[Penguins|n] [slide|v|the penguins] on the [shiny|a|the ice] [ice|n].",
  "The [old|a|the owl] [owl|n] [hoots|v|the owl].",
  "[Gabi|n] [paints|v|Gabi] a [pink|a|the flower] [flower|n].",
  "The [loud|a|the drum] [drum|n] [bangs|v|the drum].",
  "[Max|n] [eats|v|Max] a [cold|a|the apple] [apple|n].",
  "The [soft|a|the kitten] [kitten|n] [naps|v|the kitten].",
  "A [brave|a|the knight] [knight|n] [rides|v|the knight] a [white|a|the horse] [horse|n].",
  "The [hungry|a|the bear] [bear|n] [eats|v|the bear] [honey|n]."
];

export const JOBS = {
  n: { id: "n", name: "noun", does: "names something" },
  v: { id: "v", name: "verb", does: "is an action" },
  a: { id: "a", name: "adjective", does: "describes" }
};

/** Splits a marked sentence into tokens: { text, job?, link? }. */
export function parseSentence(marked) {
  const tokens = [];
  const re = /\[([^\]|]+)\|([nva])(?:\|([^\]]+))?\]|([^[]+)/g;
  let match;
  while ((match = re.exec(marked))) {
    if (match[4] != null) tokens.push({ text: match[4] });
    else tokens.push({ text: match[1], job: match[2], link: match[3] || "" });
  }
  return tokens;
}

export const plain = (tokens) => tokens.map((token) => token.text).join("");

function shuffle(rng, list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickFrom(rng, list, recent = []) {
  const fresh = list.filter((item) => !recent.includes(item));
  const pool = fresh.length ? fresh : list;
  return pool[Math.floor(rng() * pool.length)];
}

export function compoundRound(rng, { recent = [], again = null } = {}) {
  const item = again || pickFrom(rng, COMPOUNDS, recent);
  return { item, key: item.word, choices: shuffle(rng, [item.second, ...item.wrong]) };
}

export function contractionRound(rng, { recent = [], again = null } = {}) {
  const item = again || pickFrom(rng, CONTRACTIONS, recent);
  return { item, key: item.short, choices: shuffle(rng, [item.short, item.misplaced, item.other]) };
}

// Each job gets asked about in turn, so a round is not all nouns.
export function partsRound(rng, { recent = [], again = null, job } = {}) {
  if (again) return again;
  const want = job || ["n", "v", "a"][Math.floor(rng() * 3)];
  const options = [];
  for (const marked of SENTENCES) {
    const tokens = parseSentence(marked);
    tokens.forEach((token, index) => {
      if (token.job === want) options.push({ marked, tokens, index, key: `${token.text}:${marked}` });
    });
  }
  const fresh = options.filter((entry) => !recent.includes(entry.key));
  const pool = fresh.length ? fresh : options;
  const pick = pool[Math.floor(rng() * pool.length)];
  return { ...pick, word: pick.tokens[pick.index].text, job: want, link: pick.tokens[pick.index].link };
}

const spellOut = (letters) => [...letters].map(letterName).join(" ");
const cap = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const does = (who) => (who.endsWith("s") ? "do" : "does");

export const lines = {
  compoundPrompt: (item) => `${cap(item.first)} plus which word makes one bigger word?`,
  compoundRight: (item) => `${cap(item.first)} plus ${item.second} makes ${item.word}.`,
  compoundMiss: (item, picked) => `${cap(item.first)}${picked} is not a word. Look at the picture.`,
  compoundHint: (item) => `Look at the picture. What is it called? It starts with ${item.first}.`,

  contractionPrompt: (item) => `Which word is the short way to say ${item.full}?`,
  contractionMiss(item, picked) {
    if (MEANS[picked]) return `${picked} means ${MEANS[picked]}. We need ${item.full}.`;
    const { letters } = leftOut(item.full, item.short);
    return `The apostrophe is in the wrong spot. It goes where ${spellOut(letters)} ${letters.length > 1 ? "were" : "was"} left out.`;
  },
  contractionHint(item) {
    const { letters } = leftOut(item.full, item.short);
    return `${item.full}. The ${letters.length > 1 ? "letters" : "letter"} ${spellOut(letters)} ${letters.length > 1 ? "leave" : "leaves"}. The apostrophe takes ${letters.length > 1 ? "their" : "its"} place.`;
  },

  partsPrompt: (deal) => `${plain(deal.tokens)} What job does ${deal.word} do?`,
  partsMiss(deal, picked) {
    const was = JOBS[picked];
    const why = deal.job === "n"
      ? `${deal.word} names something. You can point to it.`
      : deal.job === "v"
        ? `${deal.word} is the action. It's what ${deal.link} ${does(deal.link)}.`
        : `${deal.word} describes. It tells what ${deal.link} is like.`;
    return `Not ${was.id === "a" ? "an" : "a"} ${was.name}. ${cap(why)}`;
  },
  partsHint: (deal) => `Ask: does ${deal.word} name something, show an action, or describe something?`
};
