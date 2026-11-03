// Pure rounds for the off-episode Lark and Nib games.
// Sounds stay inside what each child has already met: Connor has m, short a, and am.
// Gabi's recent chapter reviewed map and mat and taught d and pad.
// Stop sounds are described with a word ("the end of pad"), never with an added vowel.

export const COMPLETIONS = {
  pockets: "lark-pockets:complete",
  ant: "lark-ant:complete",
  "i-am": "lark-i-am:complete",
  folio: "lark-folio:complete",
  strap: "lark-strap:complete"
};

const POCKETS = [
  { id: "a", label: "Apple pocket", picture: "apple", letter: "a" },
  { id: "m", label: "Moon pocket", picture: "moon", letter: "m" }
];

const pocketMiss = {
  apple: "Apple starts like apple. That pocket hums mmm, like moon.",
  moon: "Moon hums mmm. The apple pocket is for the apple sound.",
  ant: "Ant starts like apple. This pocket hums mmm.",
  map: "Map hums mmm, like moon. The other pocket is the apple sound.",
  mouse: "Mouse hums mmm, like moon. The other pocket is the apple sound."
};

function pocketGate(show, answer, item, prompt) {
  return {
    type: "pick",
    item,
    prompt,
    answer,
    show,
    choices: POCKETS,
    miss: { [answer === "a" ? "m" : "a"]: pocketMiss[show] }
  };
}

const POCKET_GATES = [
  pocketGate("apple", "a", "pockets:apple", "The apple goes in the apple pocket. The pocket shows a."),
  pocketGate("moon", "m", "pockets:moon", "Moon hums mmm. It goes in the moon pocket."),
  pocketGate("ant", "a", "pockets:ant", "Listen to ant. Which pocket does it start like?"),
  pocketGate("map", "m", "pockets:map", "Listen to map. Which pocket does it start like?"),
  pocketGate("mouse", "m", "pockets:mouse", "Listen to mouse. Which pocket does it start like?"),
  amBlend("pockets:am")
];

function amBlend(item) {
  return {
    type: "blend",
    item,
    prompt: "Tap a, then m, to make am. a like apple. mmm like moon.",
    sequence: ["a", "m"],
    choices: [
      { id: "a", label: "a, like apple", picture: "letter", letter: "a" },
      { id: "m", label: "mmm, like moon", picture: "letter", letter: "m" }
    ]
  };
}

const ANT_GATES = [
  {
    type: "pick",
    item: "ant:ant-moon",
    prompt: "Ant starts like apple. Moon hums mmm. Which picture starts like apple?",
    answer: "ant",
    choices: [
      { id: "ant", label: "ant", picture: "ant" },
      { id: "moon", label: "moon", picture: "moon" }
    ],
    miss: { moon: "Moon hums mmm. Listen to the beginning of ant." }
  },
  {
    type: "pick",
    item: "ant:apple-map",
    prompt: "Which picture starts like apple?",
    answer: "apple",
    choices: [
      { id: "apple", label: "apple", picture: "apple" },
      { id: "map", label: "map", picture: "map" }
    ],
    miss: { map: "Map hums mmm. Listen to the beginning of apple." }
  },
  {
    type: "pick",
    item: "ant:ant-mouse",
    prompt: "Which picture starts like apple?",
    answer: "ant",
    choices: [
      { id: "mouse", label: "mouse", picture: "mouse" },
      { id: "ant", label: "ant", picture: "ant" }
    ],
    miss: { mouse: "Mouse hums mmm. Listen to the beginning of ant." }
  },
  {
    type: "pick",
    item: "ant:apple-moon",
    prompt: "Which picture starts like apple?",
    answer: "apple",
    choices: [
      { id: "moon", label: "moon", picture: "moon" },
      { id: "apple", label: "apple", picture: "apple" }
    ],
    miss: { moon: "Moon hums mmm. Listen to the beginning of apple." }
  },
  amBlend("ant:am")
];

function letter(id, label) {
  return { id, label, picture: "letter", letter: id };
}

function iamGates(scene) {
  const picture = scene === "mouse" ? "mouse" : scene === "bird" ? "bird" : "apple";
  const line = scene === "mouse" ? "I, blank, a mouse." : scene === "bird" ? "I, blank, a bird." : "I, blank, an apple catcher.";
  return [
    {
      type: "pick",
      item: "i-am:a",
      prompt: "Lark says the apple sound. Tap a.",
      answer: "a",
      choices: [letter("a", "a, like apple"), letter("m", "mmm, like moon")],
      miss: { m: "That letter hums mmm. The apple sound is a." }
    },
    {
      type: "pick",
      item: "i-am:m",
      prompt: "Nib hums mmm, like moon. Tap m.",
      answer: "m",
      choices: [letter("m", "mmm, like moon"), letter("a", "a, like apple")],
      miss: { a: "That letter is the apple sound. mmm is m." }
    },
    {
      type: "blend",
      item: "i-am:am",
      prompt: "Tap a, then m, to make the word am.",
      sequence: ["a", "m"],
      choices: [letter("a", "a, like apple"), letter("m", "mmm, like moon")]
    },
    {
      type: "pick",
      item: "i-am:word",
      prompt: `Nib's journal says: ${line} Tap the word am.`,
      answer: "am",
      show: picture,
      choices: [
        { id: "a", label: "a", picture: "letter", letter: "a" },
        { id: "am", label: "am", picture: "word", letter: "am" },
        { id: "m", label: "m", picture: "letter", letter: "m" }
      ],
      miss: {
        a: "That is only the apple sound. am has mmm at the end too.",
        m: "am starts with the apple sound. Then it hums mmm."
      }
    }
  ];
}

function wordChoice(id, picture) {
  return { id, label: id, picture, word: id, emphasis: "last" };
}

const FOLIO_GATES = [
  {
    type: "pick",
    item: "folio:map-model",
    prompt: "Mat ends with t. Map ends with p. Tap map.",
    answer: "map",
    choices: [wordChoice("map", "map"), wordChoice("mat", "mat")],
    miss: { mat: "That word is mat. It ends with t. Map ends with p." }
  },
  {
    type: "pick",
    item: "folio:mat",
    prompt: "Tap mat.",
    answer: "mat",
    choices: [wordChoice("mat", "mat"), wordChoice("map", "map")],
    miss: { map: "That word is map. It ends with p. Mat ends with t." }
  },
  {
    type: "pick",
    item: "folio:map",
    prompt: "The paper map needs its cover. Tap map.",
    answer: "map",
    choices: [wordChoice("map", "map"), wordChoice("mat", "mat")],
    miss: { mat: "That cover says mat. Listen to the end of map. It ends with p." }
  },
  {
    type: "pick",
    item: "folio:pad",
    prompt: "The strap needs a pad. Tap pad.",
    answer: "pad",
    choices: [wordChoice("pad", "pad"), wordChoice("map", "map"), wordChoice("mat", "mat")],
    miss: {
      map: "That word is map. The strap needs pad. Pad ends with d.",
      mat: "That word is mat. The strap needs pad. Pad ends with d."
    }
  },
  {
    type: "swap",
    item: "folio:build-map",
    prompt: "This word says mat. Tap p so the last sound makes map.",
    answer: "p",
    base: ["m", "a"],
    choices: [letter("p", "p, like the end of map"), letter("t", "t, like the end of mat")],
    miss: { t: "That keeps mat. Map ends with p." }
  }
];

const STRAP_GATES = [
  {
    type: "pick",
    item: "strap:d-model",
    prompt: "Pad ends with d. Tap d.",
    answer: "d",
    show: "door",
    choices: [letter("d", "d, like the end of pad"), letter("a", "a, like apple")],
    miss: { a: "That letter is a, like apple. Pad ends with d." }
  },
  {
    type: "pick",
    item: "strap:d-shape",
    prompt: "Find d again. b and p are different letters.",
    answer: "d",
    show: "pad",
    choices: [letter("b", "b"), letter("d", "d, like the end of pad"), letter("p", "p, like the end of map")],
    miss: {
      b: "That letter is b. d has the stick on the other side. Listen for the end of pad.",
      p: "That letter is p, like the end of map. Pad ends with d."
    }
  },
  {
    type: "blend",
    item: "strap:pad",
    prompt: "Make pad. Tap p, then a, then d.",
    sequence: ["p", "a", "d"],
    choices: [
      letter("p", "p, like the end of map"),
      letter("a", "a, like apple"),
      letter("d", "d, like the end of pad")
    ]
  },
  {
    type: "pick",
    item: "strap:place",
    prompt: "Tuck the pad under the strap. Leave the map out.",
    answer: "pad",
    show: "strap",
    choices: [wordChoice("pad", "pad"), wordChoice("map", "map")],
    miss: { map: "That is the map. The strap needs the soft pad." }
  }
];

const DONE = {
  pockets: "Both pockets are full, and am is written. Go back to Joyce and tap I'm done.",
  ant: "You found the pictures that start like apple, and you made am. Go back to Joyce and tap I'm done.",
  "i-am": "Nib wrote the word. Go back to Joyce and tap I'm done.",
  folio: "Map, mat, and pad each have a cover. Go back to Joyce and tap I'm done.",
  strap: "The pad is under the strap. The bag can come through. Go back to Joyce and tap I'm done."
};

const START = {
  pockets: "Nib has two pockets. One is for apples. One hums mmm. Tap start.",
  ant: "Lark is holding two pictures. Find the one that starts like apple. Tap start.",
  "i-am": "Nib wants to write am in the journal. Tap start.",
  folio: "The map cover and the mat cover look almost the same. Listen for the last sound. Tap start.",
  strap: "Nib's strap is caught. It needs a pad. Tap start."
};

function gatesFor(state) {
  if (state.play === "pockets") return POCKET_GATES;
  if (state.play === "ant") return ANT_GATES;
  if (state.play === "i-am") return iamGates(state.scene || "apple");
  if (state.play === "folio") return FOLIO_GATES;
  if (state.play === "strap") return STRAP_GATES;
  return null;
}

export function startActivity(play, { scene } = {}) {
  if (!gatesFor({ play, scene })) return null;
  return { play, scene: scene || "", index: 0, built: [], tried: false, done: false };
}

export function startLine(play) {
  return START[play] || "";
}

function blendMiss(expect, choice) {
  const sounds = {
    a: "a, like apple",
    m: "mmm, like moon",
    p: "p, like the end of map",
    d: "d, like the end of pad"
  };
  return `The next sound is ${sounds[expect] || expect}. You tapped ${sounds[choice] || choice}.`;
}

export function activityView(state) {
  const gates = state ? gatesFor(state) : null;
  const total = gates?.length || 0;
  if (!state || state.done) {
    return { done: true, prompt: DONE[state?.play] || "All done.", choices: [], built: [], show: "", step: total, total };
  }
  const gate = gates?.[state.index];
  if (!gate) return { done: true, prompt: DONE[state.play], choices: [], built: [], show: "", step: total, total };
  return {
    done: false,
    kind: gate.type,
    prompt: gate.prompt,
    choices: gate.choices,
    built: gate.type === "blend" ? state.built : gate.type === "swap" ? [...gate.base] : [],
    sequence: gate.sequence || [],
    show: gate.show || "",
    base: gate.base || [],
    step: state.index,
    total
  };
}

export function correctChoice(state) {
  const gate = gatesFor(state)?.[state.index];
  if (!gate || state.done) return "";
  if (gate.type === "blend") return gate.sequence[state.built.length] || "";
  return gate.answer;
}

function advance(state, gates) {
  const done = state.index + 1 >= gates.length;
  return { ...state, index: state.index + 1, built: [], tried: false, done };
}

export function activityChoose(state, choice) {
  const gates = gatesFor(state);
  const gate = gates?.[state.index];
  if (!gate || state.done) return { state, correct: false, first: false, partial: false, item: "", feedback: "", complete: false };
  if (gate.type === "blend") {
    const expect = gate.sequence[state.built.length];
    if (choice !== expect) {
      return {
        state: { ...state, tried: true },
        correct: false,
        first: !state.tried,
        partial: false,
        item: gate.item,
        feedback: blendMiss(expect, choice),
        complete: false
      };
    }
    const built = [...state.built, choice];
    if (built.length < gate.sequence.length) {
      return { state: { ...state, built }, correct: true, first: false, partial: true, item: gate.item, feedback: "", complete: false };
    }
    const next = advance(state, gates);
    return { state: next, correct: true, first: !state.tried, partial: false, item: gate.item, feedback: "", complete: next.done };
  }
  if (choice !== gate.answer) {
    return {
      state: { ...state, tried: true },
      correct: false,
      first: !state.tried,
      partial: false,
      item: gate.item,
      feedback: gate.miss?.[choice] || "Listen once more, then try the other one.",
      complete: false
    };
  }
  const next = advance(state, gates);
  return { state: next, correct: true, first: !state.tried, partial: false, item: gate.item, feedback: "", complete: next.done };
}
