// Penguin Pond's rules: Max's First Grade math (Joyce steps max-skip-count, max-odd-even,
// max-bar-graphs). No look or theme here (that is skin.mjs); "the red one" and "fish" are the
// skin's names, passed in.

export const LEVELS = [
  { id: "skip", label: "Hop by 2s, 5s, 10s", steps: ["max-skip-count"], skill: "Skip counting", flag: "skip-count", next: "odd-even", hello: "Skip counting jumps by the same number every time." },
  { id: "odd-even", label: "Odd or even", steps: ["max-odd-even"], skill: "Odd and even", flag: "odd-even", next: "graph", hello: "Even numbers make pairs with none left over. Odd numbers have one left over." },
  { id: "graph", label: "Bar graphs", steps: ["max-bar-graphs"], skill: "Bar graphs", flag: "bar-graphs", hello: "A bar graph shows how many. Find the bar, then read the number at its top." }
];

const pick = (rng, list) => list[Math.floor(rng() * list.length)];

function shuffle(rng, list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Five numbers that jump by 2, 5, or 10, with one missing. The gap is the last number or one in
 * the middle. Wrong choices are the mistakes kids make: counting on by one, or jumping by a
 * different number.
 */
export function skipRound(rng, { by: forced } = {}) {
  const by = forced || pick(rng, [2, 5, 10]);
  const maxStart = by === 2 ? 30 : by === 5 ? 60 : 80;
  const start = by * Math.floor(rng() * (maxStart / by + 1));
  const numbers = [0, 1, 2, 3, 4].map((i) => start + i * by);
  const gap = rng() < 0.6 ? 4 : 1 + Math.floor(rng() * 3);
  const answer = numbers[gap];
  const before = numbers[gap - 1];
  const other = by === 10 ? 5 : by === 5 ? 10 : 5;
  const wrong = [before + 1, before + other, answer + by, answer + 1].filter((n, i, all) => n !== answer && n > 0 && all.indexOf(n) === i);
  return { by, numbers, gap, answer, before, choices: shuffle(rng, [answer, ...wrong.slice(0, 2)]) };
}

export const isEven = (n) => n % 2 === 0;

/** A count to call odd or even. With `pictures`, small enough to see the pairs. */
export function oddEvenRound(rng, { pictures }) {
  const n = pictures ? 3 + Math.floor(rng() * 12) : 11 + Math.floor(rng() * 89);
  return { n, answer: isEven(n) ? "even" : "odd", pictures };
}

const NAMES = ["red", "blue", "green", "yellow"];

/**
 * A bar graph of 3 or 4 bars (values 1 to 10, all different, so "most" and "fewest" have one
 * answer) and one question about it: read a bar, find the most, find the fewest, or how many more.
 */
export function graphRound(rng, { kind: forcedKind } = {}) {
  const size = rng() < 0.5 ? 3 : 4;
  const values = shuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, size);
  const bars = NAMES.slice(0, size).map((name, i) => ({ name, value: values[i] }));
  const kind = forcedKind || pick(rng, ["read", "read", "most", "fewest", "more"]);
  if (kind === "most" || kind === "fewest") {
    const sorted = [...bars].sort((a, b) => b.value - a.value);
    const answer = kind === "most" ? sorted[0] : sorted.at(-1);
    return { bars, kind, answer: answer.name, value: answer.value };
  }
  if (kind === "read") {
    const bar = pick(rng, bars);
    // Wrong choices: another bar's number (read the wrong bar) and one off by one (read the
    // line above or below). Off by two fills in at the edges of the scale.
    const other = pick(rng, bars.filter((b) => b !== bar)).value;
    const near = shuffle(rng, [bar.value + 1, bar.value - 1]).concat([bar.value + 2, bar.value - 2])
      .filter((n) => n >= 0 && n <= 10 && n !== other);
    const wrong = [other, near[0]];
    return { bars, kind, bar: bar.name, answer: bar.value, choices: shuffle(rng, [bar.value, ...wrong]) };
  }
  // How many more: the bar with more, minus the bar with fewer.
  const [big, small] = shuffle(rng, bars).slice(0, 2).sort((a, b) => b.value - a.value);
  const answer = big.value - small.value;
  const wrong = [big.value, answer + 1, answer - 1, small.value].filter((n, i, all) => n !== answer && n >= 0 && all.indexOf(n) === i);
  return { bars, kind, big: big.name, small: small.name, bigValue: big.value, smallValue: small.value, answer, choices: shuffle(rng, [answer, ...wrong.slice(0, 2)]) };
}

// `thing` is the skin's word for what is counted ("fish"); `who(name)` names a bar ("Red").
export function lines({ thing, who }) {
  return {
    skipPrompt(deal) {
      const said = deal.numbers.map((n, i) => (i === deal.gap ? "what" : String(n))).join(", ");
      return `Count by ${deal.by}s. ${said}. What number is missing?`;
    },
    skipMiss(deal, picked) {
      if (picked === deal.before + 1) return `${picked} is counting by ones. These numbers jump by ${deal.by}s. What is ${deal.before} and ${deal.by} more?`;
      return `${picked} is a different jump. From ${deal.before}, jump ${deal.by} more.`;
    },
    skipHint: (deal) => `Each number is ${deal.by} more than the one before. What is ${deal.before} and ${deal.by} more?`,
    skipRight: (deal) => `${deal.numbers.join(", ")}. Counting by ${deal.by}s.`,

    oddPrompt: (deal) => (deal.pictures
      ? `${deal.n} penguins want to slide in pairs. Is ${deal.n} even or odd?`
      : `Is ${deal.n} even or odd?`),
    oddMiss(deal) {
      if (deal.pictures) {
        return isEven(deal.n)
          ? `Look at the pairs. Every penguin has a partner, so ${deal.n} is even.`
          : `Look at the pairs. One penguin is left over, so ${deal.n} is odd.`;
      }
      const last = deal.n % 10;
      return `Look at the last digit, ${last}. ${last} is ${isEven(last) ? "even" : "odd"}, so ${deal.n} is ${deal.answer}.`;
    },
    oddHint: (deal) => (deal.pictures
      ? "Put them in pairs. If one is left over, it's odd. If none are left, it's even."
      : "Look at the last digit. 0, 2, 4, 6, or 8 is even. 1, 3, 5, 7, or 9 is odd."),
    oddRight: (deal) => `${deal.n} is ${deal.answer}.`,

    graphPrompt(deal) {
      if (deal.kind === "read") return `How many ${thing} did ${who(deal.bar)} catch?`;
      if (deal.kind === "most") return `Who caught the most ${thing}? Tap that bar.`;
      if (deal.kind === "fewest") return `Who caught the fewest ${thing}? Tap that bar.`;
      return `How many more ${thing} did ${who(deal.big)} catch than ${who(deal.small)}?`;
    },
    graphMiss(deal, picked) {
      if (deal.kind === "read") {
        const other = deal.bars.find((bar) => bar.value === picked && bar.name !== deal.bar);
        if (other) return `${picked} is ${who(other.name)}'s bar. Find ${who(deal.bar)}'s bar, then read the number at its top.`;
        return `Close. Follow the top of ${who(deal.bar)}'s bar straight across to the numbers.`;
      }
      if (deal.kind === "most" || deal.kind === "fewest") {
        const bar = deal.bars.find((b) => b.name === picked);
        return `${who(picked)} caught ${bar.value}. Look for a ${deal.kind === "most" ? "taller" : "shorter"} bar.`;
      }
      if (picked === deal.bigValue) return `${picked} is how many ${who(deal.big)} caught. How many more than ${who(deal.small)}? Count up from ${deal.smallValue} to ${deal.bigValue}.`;
      return `${who(deal.big)} caught ${deal.bigValue}. ${who(deal.small)} caught ${deal.smallValue}. Count up from ${deal.smallValue} to ${deal.bigValue}.`;
    },
    graphHint(deal) {
      if (deal.kind === "read") return `Find ${who(deal.bar)}'s bar. Follow its top across to the numbers.`;
      if (deal.kind === "most") return "The most is the tallest bar.";
      if (deal.kind === "fewest") return "The fewest is the shortest bar.";
      return `Read both bars: ${who(deal.big)} and ${who(deal.small)}. Then count up from the smaller one.`;
    },
    graphRight(deal) {
      if (deal.kind === "read") return `${who(deal.bar)} caught ${deal.answer}.`;
      if (deal.kind === "most" || deal.kind === "fewest") return `${who(deal.answer)} caught the ${deal.kind}, ${deal.value}.`;
      return `${deal.bigValue} take away ${deal.smallValue} is ${deal.answer}. ${deal.answer} more.`;
    }
  };
}
