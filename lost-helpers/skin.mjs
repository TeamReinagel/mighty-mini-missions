// The look, words, and sounds of The Lost Helpers. The rules live in shops.mjs (finds and
// progress), app.js (screens), and trace.mjs (tracing). A second skin can replace this file
// without touching the skill, the difficulty, or the mechanic.

export const SKIN = {
  title: "The Lost Helpers",

  // Street: one door per shop this child can open. A lost helper is a shadow in the window.
  intro: "The helpers are hiding! Tap a door to find one.",
  pick: "Tap a door to find a helper.",
  allHome: "Everyone is home! Tap any door to play again.",

  // Shop: the helper hides behind the right answer and walks one stone closer to home.
  found: ["Found you!", "Peekaboo!", "There I am!", "You found me!"],
  home: "I'm home! Thank you!",
  playAgain: "I'm home. Let's play!",

  // Tracing
  trace: {
    start: "Start at the green dot.",
    keep: "Keep going from the green dot.",
    off: "Oops, off the road! Back to the green dot.",
    clean: "You stayed on the road!",
    again: "You did it! Once more, on the road."
  },

  // Each shop's door color and the picture on its roof.
  shops: {
    path: { color: "#ff9f43", badge: "🖍️" },
    paint: { color: "#ff5d8f", badge: "🎨" },
    toys: { color: "#4fa3ff", badge: "🧸" },
    market: { color: "#ef4f3f", badge: "🍎" },
    book: { color: "#7d5cf0", badge: "📚" },
    desk: { color: "#f5b821", badge: "✏️" },
    garden: { color: "#3fbf5f", badge: "🌷" },
    post: { color: "#2a6fdb", badge: "✉️" },
    bell: { color: "#18b6b0", badge: "🔔" },
    bakery: { color: "#c9845a", badge: "🧁" },
    quilt: { color: "#e05aa8", badge: "🧵" },
    laundry: { color: "#5cb8e6", badge: "🧺" },
    coins: { color: "#d4a017", badge: "🪙" }
  },

  // Short everyday sounds, one per event. Frequencies in Hz, times in seconds.
  sounds: {
    tap: [{ f: 740, t: 0.09, type: "triangle", v: 0.05 }],
    miss: [{ f: 150, t: 0.07, type: "sine", v: 0.035 }],
    found: [{ f: 660, t: 0.07, type: "triangle", v: 0.05 }, { f: 990, t: 0.1, type: "triangle", v: 0.05, at: 0.07 }],
    hop: [{ f: 520, t: 0.06, type: "sine", v: 0.04 }],
    home: [{ f: 660, t: 0.08, type: "triangle", v: 0.05 }, { f: 830, t: 0.08, type: "triangle", v: 0.05, at: 0.08 }, { f: 990, t: 0.14, type: "triangle", v: 0.05, at: 0.16 }]
  }
};
