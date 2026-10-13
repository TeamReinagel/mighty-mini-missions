// Math, shape, and feelings content for Monster Maker.
// Problems are generated answer-first so every answer is a part count the monster can actually show.
(() => {
  "use strict";

  const LEVELS = {
    prek: { id: "prek", label: "Pre-K", max: 5, min: 1, choices: 3 },
    k: { id: "k", label: "K", max: 10, min: 2, choices: 4 },
    g1: { id: "g1", label: "1st", max: 12, min: 3, choices: 4 },
    g2: { id: "g2", label: "2nd", max: 12, min: 3, choices: 4 }
  };

  const PARTS = [
    { id: "eyes", noun: "eyeballs", one: "eyeball", cap: 10 },
    { id: "teeth", noun: "teeth", one: "tooth", cap: 12 },
    { id: "arms", noun: "arms", one: "arm", cap: 8 },
    { id: "legs", noun: "legs", one: "leg", cap: 8 },
    { id: "horns", noun: "horns", one: "horn", cap: 6 },
    { id: "spots", noun: "spots", one: "spot", cap: 12 }
  ];

  const SHAPE_SETS = {
    prek: ["circle", "square", "triangle", "rectangle", "heart", "star"],
    k: ["circle", "square", "triangle", "rectangle", "oval", "hexagon", "heart", "star"],
    g1: ["circle", "square", "triangle", "rectangle", "oval", "pentagon", "hexagon", "diamond", "heart", "star"],
    g2: ["circle", "square", "triangle", "rectangle", "oval", "pentagon", "hexagon", "diamond", "heart", "star"]
  };

  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (a) => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const sayNum = (s) => String(s).replace(/\u2212/g, " minus ").replace(/\+/g, " plus ").replace(/=\s*\?/g, " equals what?").replace(/\?/g, " what ");

  function pickAnswer(part, level, avoid) {
    const L = LEVELS[level];
    const hi = Math.min(part.cap, L.max);
    const lo = Math.min(L.min, hi);
    let a = ri(lo, hi);
    for (let t = 0; t < 5 && a === avoid; t++) a = ri(lo, hi);
    return a;
  }

  // ---------------------------------------------------------------- generators by level

  // The skill name feeds the weekly progress report.
  const tag = (skill, gen) => (a, p) => { const prob = gen(a, p); return prob && { skill, ...prob }; };

  const GEN = {
    prek: [
      tag("Counting objects", (a, p) => ({ visual: { type: "items", n: a, kind: p.id }, prompt: `Count the ${p.noun}!`, say: `Count the ${p.noun}. How many ${p.noun}?`, rec: `Counted ${a}` })),
      tag("Subitizing (dice dots)", (a) => ({ visual: { type: "dice", n: a }, prompt: "How many dots?", say: "How many dots?", rec: `${a} dot${a === 1 ? "" : "s"}` })),
      tag("One more", (a, p) => a < 2 ? null : ({ visual: { type: "plus", a: a - 1, b: 1, kind: p.id }, prompt: "One more!", say: `${a - 1}. And one more! How many now?`, rec: `${a - 1} and 1 more = ${a}` }))
    ],
    k: [
      tag("Counting objects", (a, p) => a < 4 ? null : ({ visual: { type: "items", n: a, kind: p.id }, prompt: `Count the ${p.noun}!`, say: `Count the ${p.noun}. How many?`, rec: `Counted ${a}` })),
      tag("Ten frames", (a) => ({ visual: { type: "tenframe", n: a }, prompt: "How many dots in the ten frame?", say: "How many dots are in the ten frame?", rec: `Ten frame: ${a}` })),
      tag("Addition within 10", (a, p) => {
        if (a < 2) return null;
        const b = ri(1, a - 1);
        return { visual: { type: "plus", a: b, b: a - b, kind: p.id }, eq: `${b} + ${a - b} = ?`, prompt: "Put them together!", say: `${b} plus ${a - b}. How many in all?` };
      }),
      tag("Subtraction within 10", (a, p) => {
        const b = ri(1, Math.min(4, 10 - a));
        if (b < 1) return null;
        const c = a + b;
        return { visual: { type: "minus", total: c, gone: b, kind: p.id }, eq: `${c} \u2212 ${b} = ?`, prompt: `${b} ran away!`, say: `${c} ${p.noun}. ${b} ran away. How many are left?` };
      }),
      tag("What number comes next", (a) => a < 4 ? null : ({ eq: `${a - 3}, ${a - 2}, ${a - 1}, ?`, prompt: "What comes next?", say: `What number comes next? ${a - 3}, ${a - 2}, ${a - 1}...` }))
    ],
    g1: [
      tag("Addition within 20", (a) => { const b = ri(1, a - 1); return { eq: `${b} + ${a - b} = ?` }; }),
      tag("Subtraction within 20", (a) => { const c = ri(a + 1, Math.min(20, a + 10)); return { eq: `${c} \u2212 ${c - a} = ?` }; }),
      tag("Missing addend", (a) => { const b = ri(1, Math.min(9, 20 - a)); return { eq: `${b} + ? = ${a + b}`, prompt: "What's missing?" }; }),
      tag("Make 10", (a) => a > 9 ? null : ({ eq: `${10 - a} + ? = 10`, prompt: "Make 10!", visual: { type: "tenframe", n: 10 - a } })),
      tag("Doubles", (a) => a % 2 || a < 4 ? null : ({ eq: `${a / 2} + ${a / 2} = ?`, prompt: "Doubles!" })),
      tag("Addition word problems", (a) => {
        const b = ri(1, a - 1);
        const prompt = `The monster has ${b} cookies. It gets ${a - b} more. How many cookies now?`;
        return { story: prompt, say: prompt, rec: `${b} + ${a - b} = ${a}` };
      }),
      tag("Subtraction word problems", (a) => {
        const b = ri(2, Math.min(9, 20 - a));
        const prompt = `${a + b} bugs sit on a log. ${b} fly away. How many bugs are left?`;
        return { story: prompt, say: prompt, rec: `${a + b} \u2212 ${b} = ${a}` };
      })
    ],
    g2: [
      tag("Two-digit subtraction with regrouping", (a) => {
        let b, c;
        for (let t = 0; t < 40; t++) {
          b = ri(12, 88 - a);
          c = b + a;
          if (c % 10 < b % 10) break;
        }
        return { eq: `${c} \u2212 ${b} = ?` };
      }),
      tag("Adding three numbers", (a) => {
        if (a < 3) return null;
        const x = ri(1, a - 2);
        const y = ri(1, a - x - 1);
        return { eq: `${x} + ${y} + ${a - x - y} = ?` };
      }),
      tag("Place value (tens)", (a) => {
        if (a > 9) return null;
        const ones = ri(1, 9);
        const n = a * 10 + ones;
        return { visual: { type: "base10", tens: a, ones }, prompt: `How many tens are in ${n}?`, say: `How many tens are in ${n}?`, rec: `${n} = ${a} tens ${ones} ones` };
      }),
      tag("Skip counting by 2s", (a) => a % 2 || a < 8 ? null : ({ eq: `${a - 6}, ${a - 4}, ${a - 2}, ?`, prompt: "Skip count by 2s!", say: `Skip count by twos. ${a - 6}, ${a - 4}, ${a - 2}... what comes next?` })),
      tag("Arrays (early multiplication)", (a) => {
        const opts = [];
        for (let r = 2; r <= 4; r++) if (a % r === 0 && a / r >= 2 && a / r <= 6) opts.push(r);
        if (!opts.length) return null;
        const r = pick(opts);
        return { visual: { type: "array", r, c: a / r }, prompt: `${r} rows of ${a / r}. How many in all?`, say: `${r} rows of ${a / r}. How many in all?`, rec: `${r} rows of ${a / r} = ${a}` };
      }),
      tag("Counting coins", (a) => {
        const dimes = a >= 10 ? 1 : 0;
        let rem = a - dimes * 10;
        const nickels = rem >= 5 ? 1 : 0;
        rem -= nickels * 5;
        const coins = [...Array(dimes).fill(10), ...Array(nickels).fill(5), ...Array(rem).fill(1)];
        if (coins.length < 2 || coins.length > 6) return null;
        return { visual: { type: "coins", coins }, prompt: "How many cents?", say: "Add up the coins. How many cents?", rec: `${coins.join("\u00a2 + ")}\u00a2 = ${a}\u00a2` };
      }),
      tag("Missing number subtraction", (a) => { const c = ri(2, 9) * 10; return { eq: `${c} \u2212 ? = ${c - a}`, prompt: "What's missing?" }; }),
      tag("Two-digit subtraction word problems", (a) => {
        let b, c;
        for (let t = 0; t < 40; t++) { b = ri(15, 80); c = b + a; if (c % 10 < b % 10 && c < 100) break; }
        const prompt = pick([
          `The monster had ${c} stickers. It gave away ${b}. How many stickers are left?`,
          `There were ${c} kids at the park. ${b} went home. How many are still playing?`
        ]);
        return { story: prompt, say: prompt, rec: `${c} \u2212 ${b} = ${a}` };
      })
    ]
  };

  function makeChoices(answer, count, lo, hi) {
    const set = new Set([answer]);
    const near = shuffle([answer - 1, answer + 1]).concat(shuffle([answer - 2, answer + 2, answer + 3, answer - 3]));
    for (const n of near) {
      if (set.size >= count) break;
      if (n >= lo && n <= hi) set.add(n);
    }
    for (let n = lo; set.size < count && n <= hi + 5; n++) set.add(n);
    return [...set].sort((x, y) => x - y);
  }

  function makeProblem(partId, level, avoid) {
    const part = PARTS.find((p) => p.id === partId);
    const L = LEVELS[level];
    const answer = pickAnswer(part, level, avoid);
    let prob = null;
    for (let t = 0; t < 30 && !prob; t++) prob = pick(GEN[level])(answer, part);
    prob.answer = answer;
    prob.part = partId;
    prob.prompt = prob.prompt || "Solve it!";
    prob.say = prob.say || (prob.eq ? sayNum(prob.eq) : prob.prompt);
    prob.record = prob.rec || (prob.eq ? prob.eq.replace("?", answer) : prob.prompt);
    prob.choices = makeChoices(answer, L.choices, 1, level === "prek" ? L.max : Math.max(L.max, answer + 2));
    return prob;
  }

  function shapeName(shapeId, level) {
    const s = window.MM.SHAPES[shapeId];
    return level === "g2" && s.nameG2 ? s.nameG2 : s.name;
  }

  function shapeFact(shapeId, level) {
    const s = window.MM.SHAPES[shapeId];
    const name = shapeName(shapeId, level);
    if (shapeId === "star") return `A star has 5 points.`;
    if (shapeId === "heart") return `A heart has a point at the bottom.`;
    if (!s.sides) return `A ${name} is round. It has no corners!`;
    if (shapeId === "square") return `A square has 4 sides that are all the same.`;
    return `A ${name} has ${s.sides} sides and ${s.corners} corners.`;
  }

  // Pre-K just names the shape; older kids answer one question about the shape they picked.
  function shapeQuestion(shapeId, level) {
    if (level === "prek" || shapeId === "heart") return null;
    const s = window.MM.SHAPES[shapeId];
    const name = shapeName(shapeId, level);
    let q, answer;
    if (shapeId === "star") { q = `How many points does a star have?`; answer = 5; }
    else if (!s.sides) { q = `How many corners does ${name === "oval" ? "an" : "a"} ${name} have?`; answer = 0; }
    else if (level === "g2" && Math.random() < 0.5) { q = `How many vertices (corners) does a ${name} have?`; answer = s.corners; }
    else { q = `How many sides does a ${name} have?`; answer = s.sides; }
    return { skill: "Shape attributes (sides, corners)", prompt: q, say: q, answer, choices: makeChoices(answer, 4, 0, 8), record: `${q} ${answer}` };
  }

  // ---------------------------------------------------------------- feelings

  const EMOTIONS = {
    happy: { name: "happy", tip: "Happy feels light and smiley inside.", ask: "What makes you feel happy?" },
    sad: { name: "sad", tip: "When we feel sad, a hug or a cuddle can help.", ask: "What helps you when you feel sad?" },
    angry: { name: "angry", tip: "When we feel angry, we can take big dragon breaths. In... and out.", ask: "What can you do when you feel angry?" },
    scared: { name: "scared", tip: "When we feel scared, we can hold a grown-up's hand.", ask: "Who helps you feel safe?" },
    surprised: { name: "surprised", tip: "Surprised feels like WHOA! Our eyes open big.", ask: "What surprised you this week?" },
    silly: { name: "silly", tip: "Silly feels wiggly and giggly!", ask: "Can you make your silliest face?" },
    sleepy: { name: "sleepy", tip: "When we feel sleepy, our body is asking for rest.", ask: "What helps you get cozy at bedtime?" },
    proud: { name: "proud", tip: "Proud is a warm feeling when we work hard at something.", ask: "What are you proud of?" }
  };

  const EMOTION_SETS = {
    prek: ["happy", "sad", "angry", "scared"],
    k: ["happy", "sad", "angry", "scared", "surprised", "silly"],
    g1: ["happy", "sad", "angry", "scared", "surprised", "silly", "sleepy", "proud"],
    g2: ["happy", "sad", "angry", "scared", "surprised", "silly", "sleepy", "proud"]
  };

  const SCENARIOS = [
    { text: "Your monster's best friend wants to play tag!", fits: ["happy", "silly"] },
    { text: "Your monster's block tower fell down.", fits: ["sad", "angry"] },
    { text: "BOOM! A loud thunderstorm is outside.", fits: ["scared", "surprised"] },
    { text: "Someone took your monster's toy without asking.", fits: ["angry", "sad"] },
    { text: "Your monster dropped its ice cream cone.", fits: ["sad", "angry"] },
    { text: "Your monster gets to eat pancakes for breakfast!", fits: ["happy"] },
    { text: "Your monster hears a strange noise in the dark.", fits: ["scared"] },
    { text: "A friend gives your monster a hug.", fits: ["happy"] },
    { text: "Your monster opens a present and finds a puppy inside!", fits: ["surprised", "happy"], min: "k" },
    { text: "Your monster puts a pancake on its head like a hat.", fits: ["silly", "happy"], min: "k" },
    { text: "It is way past your monster's bedtime.", fits: ["sleepy"], min: "g1" },
    { text: "Your monster finished a really hard puzzle all by itself!", fits: ["proud", "happy"], min: "g1" },
    { text: "Your monster learned to ride a bike today!", fits: ["proud", "happy"], min: "g1" }
  ];

  const LEVEL_ORDER = ["prek", "k", "g1", "g2"];

  function pickScenario(level, lastText) {
    const allowed = EMOTION_SETS[level];
    const pool = SCENARIOS.filter((s) =>
      LEVEL_ORDER.indexOf(s.min || "prek") <= LEVEL_ORDER.indexOf(level) &&
      s.fits.some((e) => allowed.includes(e)) &&
      s.text !== lastText);
    return pick(pool);
  }

  // ---------------------------------------------------------------- names

  const START = ["Bl", "Z", "Gr", "Fl", "W", "M", "Sn", "B", "Pl", "Gl", "N", "T", "Sk", "Fr", "D"];
  const MID = ["oo", "i", "a", "u", "o", "ee"];
  const END = ["p", "b", "m", "nk", "zz", "gg", "bble", "mp", "ffy", "x", "lly"];
  const SUFFIX = ["", "", "", " Jr.", "-o", "-a"];

  function makeName() {
    const part = () => pick(START) + pick(MID) + pick(END);
    const a = part();
    if (Math.random() < 0.3) return `${a} ${part()}`;
    return a + pick(SUFFIX);
  }

  window.MMContent = {
    LEVELS, PARTS, SHAPE_SETS, EMOTIONS, EMOTION_SETS,
    makeProblem, shapeQuestion, shapeName, shapeFact, pickScenario, makeName
  };
})();
