// Activities on a child's page. Missions is one option.
// To add a game, append an object with title, icon, href, the skills it practices, and the
// levels it suits. A child's home screen shows the games that practice something they are
// working on at their level; everything else waits under "More games".
// A game with `after` stays off both lists for that child until the earlier skill is in use.
// The flag lives in localStorage `mighty-ready.v1` and is set by the game that comes before it.

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
    id: "today-with-joyce",
    title: "Today with Joyce",
    icon: "./classroom/joyce.png",
    href: "./classroom/",
    alwaysHome: true
  },
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
    id: "color-tap",
    title: "Dino Picnic",
    icon: "./color-tap/assets/icon.jpg",
    href: "./color-tap/",
    profiles: ["ethan"],
    practices: ["colors-shapes"],
    levels: ["toddler"]
  },
  {
    id: "snack-count",
    title: "Sundae Stand",
    icon: "./snack-count/assets/icon.jpg",
    href: "./snack-count/",
    profiles: ["ethan", "connor", "gabi"],
    practices: ["counting"],
    levels: ["toddler", "prek", "k"],
    after: { ethan: "colors" }
  },
  {
    id: "more-or-fewer",
    title: "Lost Sheep",
    icon: "./more-or-fewer/assets/icon.jpg",
    href: "./more-or-fewer/",
    profiles: ["connor", "gabi"],
    practices: ["counting"],
    levels: ["prek", "k"],
    after: { connor: "count-20", gabi: "numbers" }
  },
  {
    id: "pattern-park",
    title: "Dino Express",
    icon: "./pattern-park/assets/icon.jpg",
    href: "./pattern-park/",
    profiles: ["connor", "gabi"],
    practices: ["counting"],
    levels: ["prek", "k"],
    after: { connor: "compare", gabi: "compare" }
  },
  {
    id: "sound-bugs",
    title: "Jungle Jump",
    icon: "./sound-bugs/assets/icon.jpg",
    href: "./sound-bugs/",
    profiles: ["connor"],
    practices: ["letter-sounds"],
    levels: ["prek", "k"],
    after: { connor: "letters" }
  },
  {
    id: "sound-teams",
    title: "Tide Pool",
    icon: "./sound-teams/assets/icon.jpg",
    href: "./sound-teams/",
    profiles: ["gabi"],
    practices: ["blending"],
    levels: ["prek", "k"],
    after: { gabi: "blending" }
  },
  {
    id: "block-trade",
    title: "Moon Crates",
    icon: "./block-trade/assets/icon.jpg",
    href: "./block-trade/",
    profiles: ["max"],
    practices: ["math-facts"],
    levels: ["1st", "2nd"]
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

// Home and More both use this. A future skill stays hidden until its `after` flag is true.
window.gameOpen = function gameOpen(profile, game, flags) {
  if (!game) return false;
  if (game.alwaysHome) return true;
  if (!profile) return false;
  if (Array.isArray(game.profiles) && !game.profiles.includes(profile.id)) return false;
  const need = game.after?.[profile.id];
  if (need) return Boolean(flags?.[need]);
  return true;
};
