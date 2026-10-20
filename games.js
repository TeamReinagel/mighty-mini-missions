// Activities on a child's page. Missions is one option.
// To add a game, append an object with title, icon, href, the skills it practices, and the
// levels it suits. A child's home screen shows the games that practice something they are
// working on at their level; everything else waits under "More games".

// Skill ids are stored in each profile's `practicing` list, so keep existing ids stable.
// `kid` is the short label children see on a tile; `label` is what grown-ups see.
window.MIGHTY_SKILLS = [
  { id: "colors-shapes", label: "Colors & shapes", kid: "Colors & shapes" },
  { id: "counting", label: "Counting & numbers", kid: "Counting" },
  { id: "letters", label: "Letter names (big & little)", kid: "Letters" },
  { id: "letter-sounds", label: "Letter sounds", kid: "Letter sounds" },
  { id: "blending", label: "Sounding out words (CVC)", kid: "Sounding out" },
  { id: "sight-words", label: "Sight words", kid: "Sight words" },
  { id: "rhyming", label: "Rhyming", kid: "Rhymes" },
  { id: "math-facts", label: "Adding & subtracting", kid: "Math" },
  { id: "money", label: "Coins & money", kid: "Coins" },
  { id: "feelings", label: "Naming feelings", kid: "Feelings" },
  { id: "missions", label: "Real-world missions", kid: "Go play" },
  { id: "game-design", label: "Designing games", kid: "My games" }
];

// Youngest to oldest. A game's `levels` list says which of these it suits.
window.MIGHTY_STAGES = [
  { id: "toddler", label: "Toddler" },
  { id: "prek", label: "Pre-K" },
  { id: "k", label: "Kindergarten" },
  { id: "1st", label: "1st grade" },
  { id: "2nd", label: "2nd grade" }
];

window.MIGHTY_GAMES = [
  {
    id: "missions",
    title: "Missions",
    kind: "missions",
    icon: "./logo.png",
    iconScale: 1.55,
    practices: ["missions"],
    levels: ["prek", "k", "1st", "2nd"]
  },
  {
    id: "monster-hunt",
    title: "Monster Hunt",
    icon: "./word-monsters/icons/icon-192.png",
    href: "./word-monsters/",
    practices: ["colors-shapes", "counting", "letters", "letter-sounds"],
    levels: ["toddler", "prek", "k"]
  },
  {
    id: "ghost-word-run",
    title: "Ghost Word Run",
    icon: "./ghost-word-run/icons/icon-192.png",
    href: "./ghost-word-run/",
    practices: ["sight-words", "rhyming"],
    levels: ["k", "1st", "2nd"]
  },
  {
    id: "coin-record-run",
    title: "Coin Record Run",
    icon: "./coin-record-run/icons/icon-192.png",
    href: "./coin-record-run/",
    practices: ["money", "counting"],
    levels: ["k", "1st", "2nd"]
  },
  {
    id: "monster-maker",
    title: "Monster Maker",
    icon: "./monster-maker/icons/icon-192.png",
    href: "./monster-maker/",
    practices: ["counting", "math-facts", "feelings"],
    levels: ["prek", "k", "1st", "2nd"]
  },
  {
    id: "train-set",
    title: "Train Set",
    icon: "./train-set/icons/icon-192.png",
    href: "./train-set/",
    practices: ["colors-shapes"],
    levels: ["toddler", "prek"]
  },
  {
    id: "hatch-match",
    title: "Hatch Match",
    icon: "./hatch-match/icons/icon-192.png",
    href: "./hatch-match/",
    practices: ["letters"],
    levels: ["prek", "k"]
  },
  {
    id: "otter-slide",
    title: "Otter Slide",
    icon: "./otter-slide/icons/icon-192.png",
    href: "./otter-slide/",
    practices: ["blending"],
    levels: ["prek", "k", "1st"]
  },
  {
    id: "design-studio",
    title: "Design with Sid",
    icon: "./design-studio/icon.svg",
    href: "./design-studio/",
    profiles: ["max"],
    practices: ["game-design"]
  },
  {
    id: "mario-super-world",
    title: "Mario Super World",
    icon: "./max-games/mario-super-world/icon.png",
    href: "./max-games/mario-super-world/",
    profiles: ["max"],
    practices: ["game-design"]
  }
];
