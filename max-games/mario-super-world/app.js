/* Mario Super World
   Fifty fixed levels for Max. Baby Mario, blue overalls and a red cap, grows up.
   A shiny gold block with ! gives wings. A miss puts him back a little.
   Little enemies and prickles show up more as the courses get harder.
   Bowser waits at the last castle. Only a jump on his head hurts him. His spikes hurt back.
   The health bar shrinks by a share of what is left, and it never runs out.
*/
(function () {
  "use strict";

  const DESIGN_ID = "ds_db396dea-b340-4c5b-86e3-c59bff2f3ba0";
  const G = 400;
  const GRAVITY = 980;
  const JUMP_V = -560;
  const RUN = 185;
  const SIZES = [
    { w: 40, h: 50, label: "Baby" },
    { w: 46, h: 64, label: "Kid" },
    { w: 52, h: 78, label: "Big" }
  ];

  const WING = { w: 52, h: 48, kind: "wing" };
  const LEVELS = [
    {
      name: "First Hill",
      hint: true,
      sky: ["#b7e4fb", "#fff1d6"],
      platforms: [
        { x: 0, y: G, w: 520, h: 48 },
        { x: 610, y: G, w: 380, h: 48 },
        { x: 1080, y: G, w: 420, h: 48 }
      ],
      blocks: [{ x: 220, y: G - 150, ...WING }],
      pickups: [],
      flagX: 1360
    },
    {
      name: "Little Gaps",
      sky: ["#c5ebff", "#ffe7c8"],
      platforms: [
        { x: 0, y: G, w: 340, h: 48 },
        { x: 440, y: G, w: 260, h: 48 },
        { x: 800, y: G, w: 240, h: 48 },
        { x: 1120, y: 300, w: 170, h: 34 },
        { x: 1360, y: 190, w: 220, h: 36 }
      ],
      blocks: [{ x: 180, y: G - 150, ...WING }],
      pickups: [],
      flagX: 1480
    },
    {
      name: "Stepping Stones",
      sky: ["#d4e9ff", "#ffe8f2"],
      platforms: [
        { x: 0, y: G, w: 280, h: 48 },
        { x: 400, y: G, w: 340, h: 48 },
        { x: 860, y: 310, w: 170, h: 34 },
        { x: 1120, y: G, w: 260, h: 48 },
        { x: 1480, y: G, w: 280, h: 48 }
      ],
      blocks: [{ x: 160, y: G - 150, ...WING }],
      pickups: [{ x: 1200, y: G - 38, w: 38, h: 38 }],
      enemies: [{ x: 460, minX: 430, maxX: 660, speed: 34 }],
      flagX: 1640
    },
    {
      name: "Prickle Path",
      sky: ["#d8f3c8", "#fff1d0"],
      platforms: [
        { x: 0, y: G, w: 420, h: 48 },
        { x: 540, y: G, w: 320, h: 48 },
        { x: 980, y: G, w: 240, h: 48 },
        { x: 1320, y: 270, w: 220, h: 36 }
      ],
      blocks: [{ x: 150, y: G - 150, ...WING }],
      pickups: [],
      hazards: [{ x: 280, w: 70 }],
      enemies: [{ x: 600, minX: 570, maxX: 780, speed: 36 }],
      flagX: 1430
    },
    {
      name: "Sky Steps",
      sky: ["#f7c9a2", "#fff0c8"],
      platforms: [
        { x: 0, y: G, w: 400, h: 48 },
        { x: 520, y: G, w: 220, h: 48 },
        { x: 820, y: 300, w: 160, h: 32 },
        { x: 1060, y: 200, w: 160, h: 32 },
        { x: 1300, y: 120, w: 240, h: 36 }
      ],
      blocks: [{ x: 170, y: G - 150, ...WING }],
      pickups: [],
      enemies: [{ x: 560, minX: 540, maxX: 660, speed: 34 }],
      flagX: 1420
    },
    {
      name: "Big Hops",
      sky: ["#b7e4fb", "#e7f6ff"],
      platforms: [
        { x: 0, y: G, w: 300, h: 48 },
        { x: 450, y: G, w: 180, h: 48 },
        { x: 780, y: G, w: 180, h: 48 },
        { x: 1110, y: G, w: 180, h: 48 },
        { x: 1440, y: G, w: 320, h: 48 }
      ],
      blocks: [{ x: 150, y: G - 150, ...WING }],
      pickups: [],
      enemies: [
        { x: 480, minX: 470, maxX: 560, speed: 36 },
        { x: 1140, minX: 1130, maxX: 1220, speed: 40 }
      ],
      flagX: 1640
    },
    {
      name: "Garden Jumps",
      sky: ["#c8f0c4", "#fff6d8"],
      platforms: [
        { x: 0, y: G, w: 1500, h: 48 },
        { x: 1240, y: 280, w: 240, h: 36 }
      ],
      blocks: [{ x: 160, y: G - 150, ...WING }],
      pickups: [],
      hazards: [
        { x: 340, w: 80 },
        { x: 560, w: 90 },
        { x: 860, w: 100 },
        { x: 1100, w: 80 }
      ],
      enemies: [{ x: 700, minX: 680, maxX: 790, speed: 38 }],
      flagX: 1360
    },
    {
      name: "Two Bridges",
      sky: ["#c5ebff", "#ffe8f2"],
      platforms: [
        { x: 0, y: G, w: 360, h: 48 },
        { x: 500, y: G, w: 340, h: 48 },
        { x: 980, y: G, w: 340, h: 48 },
        { x: 1460, y: G, w: 280, h: 48 }
      ],
      blocks: [{ x: 160, y: G - 150, ...WING }],
      pickups: [],
      enemies: [
        { x: 560, minX: 530, maxX: 760, speed: 40 },
        { x: 1040, minX: 1010, maxX: 1240, speed: 42 }
      ],
      flagX: 1620
    },
    {
      name: "The Log",
      sky: ["#d4e9ff", "#fff1d6"],
      platforms: [
        { x: 0, y: G, w: 420, h: 48 },
        { x: 900, y: G, w: 380, h: 48 },
        { x: 1400, y: G, w: 300, h: 48 }
      ],
      movers: [{ x: 500, y: 340, w: 150, h: 30, min: 470, max: 720, speed: 42 }],
      blocks: [{ x: 170, y: G - 150, ...WING }],
      pickups: [],
      enemies: [{ x: 980, minX: 940, maxX: 1180, speed: 40 }],
      flagX: 1580
    },
    {
      name: "Up and Over",
      sky: ["#f7d7b0", "#fff0c8"],
      platforms: [
        { x: 0, y: G, w: 320, h: 48 },
        { x: 450, y: 300, w: 160, h: 32 },
        { x: 700, y: 190, w: 160, h: 32 },
        { x: 960, y: G, w: 360, h: 48 },
        { x: 1440, y: G, w: 280, h: 48 }
      ],
      blocks: [{ x: 150, y: G - 150, ...WING }],
      pickups: [],
      hazards: [{ x: 1140, w: 70 }],
      enemies: [{ x: 1000, minX: 990, maxX: 1060, speed: 44 }],
      flagX: 1600
    },
    {
      name: "Busy Path",
      sky: ["#b7e4fb", "#ffe7c8"],
      platforms: [
        { x: 0, y: G, w: 300, h: 48 },
        { x: 460, y: G, w: 260, h: 48 },
        { x: 880, y: G, w: 260, h: 48 },
        { x: 1300, y: G, w: 280, h: 48 },
        { x: 1720, y: G, w: 280, h: 48 }
      ],
      blocks: [{ x: 150, y: G - 150, ...WING }],
      pickups: [],
      hazards: [{ x: 1760, w: 60 }],
      enemies: [
        { x: 500, minX: 490, maxX: 640, speed: 46 },
        { x: 920, minX: 910, maxX: 1060, speed: 48 },
        { x: 1360, minX: 1340, maxX: 1480, speed: 48 }
      ],
      flagX: 1900
    },
    {
      name: "Stair Street",
      sky: ["#e7d4ff", "#fff1d6"],
      platforms: [
        { x: 0, y: G, w: 280, h: 48 },
        { x: 380, y: 330, w: 140, h: 30 },
        { x: 580, y: 250, w: 140, h: 30 },
        { x: 780, y: 170, w: 150, h: 30 },
        { x: 1020, y: G, w: 320, h: 48 },
        { x: 1460, y: G, w: 280, h: 48 }
      ],
      blocks: [{ x: 140, y: G - 150, ...WING }],
      pickups: [],
      enemies: [{ x: 1080, minX: 1060, maxX: 1240, speed: 46 }],
      flagX: 1620
    },
    {
      name: "Ferry",
      sky: ["#b7e4fb", "#d8f3c8"],
      platforms: [
        { x: 0, y: G, w: 300, h: 48 },
        { x: 1120, y: G, w: 520, h: 48 },
        { x: 1480, y: 280, w: 220, h: 34 }
      ],
      movers: [
        { x: 380, y: G, w: 140, h: 32, min: 350, max: 560, speed: 48 },
        { x: 760, y: 340, w: 140, h: 32, min: 700, max: 940, speed: 40 }
      ],
      blocks: [{ x: 140, y: G - 150, ...WING }],
      pickups: [],
      hazards: [{ x: 1360, w: 70 }],
      enemies: [{ x: 1180, minX: 1160, maxX: 1280, speed: 44 }],
      flagX: 1580
    },
    {
      name: "Prickle Islands",
      sky: ["#c8f0c4", "#fff6d8"],
      platforms: [
        { x: 0, y: G, w: 340, h: 48 },
        { x: 510, y: G, w: 210, h: 48 },
        { x: 860, y: G, w: 210, h: 48 },
        { x: 1220, y: G, w: 210, h: 48 },
        { x: 1560, y: G, w: 300, h: 48 }
      ],
      blocks: [{ x: 150, y: G - 150, ...WING }],
      pickups: [],
      hazards: [
        { x: 570, w: 60 },
        { x: 930, w: 60 },
        { x: 1290, w: 60 }
      ],
      enemies: [{ x: 1620, minX: 1600, maxX: 1680, speed: 50 }],
      flagX: 1780
    },
    {
      name: "High Road",
      sky: ["#d4e9ff", "#ffe8f2"],
      platforms: [
        { x: 0, y: G, w: 340, h: 48 },
        { x: 430, y: 280, w: 180, h: 32 },
        { x: 700, y: 180, w: 170, h: 32 },
        { x: 960, y: 280, w: 170, h: 32 },
        { x: 1220, y: G, w: 260, h: 48 },
        { x: 1560, y: 300, w: 140, h: 30 },
        { x: 1760, y: 200, w: 240, h: 34 }
      ],
      blocks: [{ x: 150, y: G - 150, ...WING }],
      pickups: [],
      enemies: [
        { x: 450, minX: 445, maxX: 540, speed: 42 },
        { x: 1280, minX: 1260, maxX: 1400, speed: 50 }
      ],
      flagX: 1880
    },
    {
      name: "Long Evening",
      sky: ["#7f93c4", "#f3d2b4"],
      platforms: [
        { x: 0, y: G, w: 300, h: 48 },
        { x: 470, y: G, w: 280, h: 48 },
        { x: 900, y: G, w: 240, h: 48 },
        { x: 1400, y: 250, w: 280, h: 36 }
      ],
      movers: [{ x: 1220, y: G, w: 130, h: 30, axis: "y", min: 250, max: G, speed: 38 }],
      blocks: [{ x: 140, y: G - 150, ...WING }],
      pickups: [],
      hazards: [{ x: 1040, w: 60 }],
      enemies: [
        { x: 520, minX: 500, maxX: 670, speed: 52 },
        { x: 940, minX: 930, maxX: 980, speed: 52 }
      ],
      flagX: 1540
    },
    {
      name: "Switchbacks",
      sky: ["#f0c9b0", "#ffe7c8"],
      platforms: [
        { x: 0, y: G, w: 300, h: 48 },
        { x: 400, y: 270, w: 170, h: 32 },
        { x: 1020, y: 270, w: 170, h: 32 },
        { x: 1280, y: G, w: 300, h: 48 },
        { x: 1660, y: 300, w: 150, h: 30 },
        { x: 1880, y: 190, w: 240, h: 34 }
      ],
      movers: [{ x: 640, y: 270, w: 130, h: 28, min: 610, max: 860, speed: 52 }],
      blocks: [{ x: 140, y: G - 150, ...WING }],
      pickups: [],
      hazards: [{ x: 1500, w: 50 }],
      enemies: [{ x: 1340, minX: 1320, maxX: 1450, speed: 52 }],
      flagX: 2000
    },
    {
      name: "Crowded Islands",
      sky: ["#c5ebff", "#f7d7b0"],
      platforms: [
        { x: 0, y: G, w: 280, h: 48 },
        { x: 440, y: G, w: 200, h: 48 },
        { x: 790, y: G, w: 200, h: 48 },
        { x: 1140, y: G, w: 210, h: 48 },
        { x: 1500, y: G, w: 210, h: 48 },
        { x: 1850, y: G, w: 280, h: 48 }
      ],
      blocks: [{ x: 140, y: G - 150, ...WING }],
      pickups: [],
      enemies: [
        { x: 470, minX: 460, maxX: 560, speed: 50 },
        { x: 820, minX: 810, maxX: 910, speed: 52 },
        { x: 1180, minX: 1170, maxX: 1270, speed: 54 },
        { x: 1540, minX: 1530, maxX: 1630, speed: 54 }
      ],
      flagX: 2020
    },
    {
      name: "Last Hills",
      sky: ["#9eb0d6", "#f7d7b0"],
      platforms: [
        { x: 0, y: G, w: 340, h: 48 },
        { x: 510, y: G, w: 240, h: 48 },
        { x: 870, y: 280, w: 160, h: 32 },
        { x: 1520, y: G, w: 340, h: 48 },
        { x: 1920, y: 310, w: 150, h: 30 },
        { x: 2140, y: 200, w: 250, h: 34 }
      ],
      movers: [{ x: 1100, y: 280, w: 140, h: 28, min: 1060, max: 1320, speed: 46 }],
      blocks: [{ x: 150, y: G - 150, ...WING }],
      pickups: [],
      hazards: [{ x: 1740, w: 70 }],
      enemies: [
        { x: 560, minX: 540, maxX: 680, speed: 56 },
        { x: 1600, minX: 1560, maxX: 1660, speed: 56 }
      ],
      flagX: 2260
    },
    {
      name: "The Yard",
      sky: ["#c8f0c4", "#fff6d8"],
      platforms: [
        { x: 0, y: G, w: 1760, h: 48 },
        { x: 180, y: 290, w: 140, h: 32 },
        { x: 1380, y: 280, w: 280, h: 36 }
      ],
      blocks: [{ x: 140, y: G - 150, ...WING }],
      pickups: [],
      hazards: [{ x: 700, w: 60 }],
      enemies: [
        { x: 360, minX: 320, maxX: 500, speed: 40 },
        { x: 600, minX: 560, maxX: 640, speed: 42 }
      ],
      flagX: 1520
    },
    {
      name: "Meadow Miles",
      sky: ["#c8f0c4", "#fff6d8"],
      platforms: [
        { x: 0, y: G, w: 360, h: 48 },
        { x: 520, y: G, w: 280, h: 48 },
        { x: 960, y: G, w: 260, h: 48 },
        { x: 1360, y: G, w: 240, h: 48 },
        { x: 1740, y: G, w: 300, h: 48 }
      ],
      blocks: [{ x: 150, y: G - 150, ...WING }],
      pickups: [],
      hazards: [{ x: 1420, w: 60 }],
      enemies: [
        { x: 580, minX: 560, maxX: 720, speed: 50 },
        { x: 1020, minX: 1000, maxX: 1140, speed: 52 }
      ],
      flagX: 1920
    },
    {
      name: "Double Log",
      sky: ["#d4e9ff", "#fff1d6"],
      platforms: [
        { x: 0, y: G, w: 340, h: 48 },
        { x: 980, y: G, w: 300, h: 48 },
        { x: 1420, y: G, w: 280, h: 48 }
      ],
      movers: [
        { x: 420, y: G, w: 140, h: 30, min: 380, max: 640, speed: 44 },
        { x: 720, y: 330, w: 140, h: 30, min: 680, max: 900, speed: 40 }
      ],
      blocks: [{ x: 150, y: G - 150, ...WING }],
      pickups: [],
      hazards: [{ x: 1500, w: 50 }],
      enemies: [{ x: 1040, minX: 1020, maxX: 1200, speed: 50 }],
      flagX: 1580
    },
    {
      name: "Burr Garden",
      sky: ["#c8f0c4", "#ffe7c8"],
      platforms: [
        { x: 0, y: G, w: 1760, h: 48 },
        { x: 1520, y: 280, w: 260, h: 36 }
      ],
      blocks: [{ x: 150, y: G - 150, ...WING }],
      pickups: [],
      hazards: [
        { x: 320, w: 70 },
        { x: 560, w: 70 },
        { x: 820, w: 80 },
        { x: 1100, w: 70 },
        { x: 1340, w: 70 }
      ],
      enemies: [
        { x: 440, minX: 420, maxX: 500, speed: 48 },
        { x: 700, minX: 680, maxX: 760, speed: 52 },
        { x: 980, minX: 960, maxX: 1040, speed: 54 }
      ],
      flagX: 1660
    },
    {
      name: "The Lifts",
      sky: ["#b7e4fb", "#fff1d6"],
      platforms: [
        { x: 0, y: G, w: 300, h: 48 },
        { x: 520, y: 300, w: 180, h: 32 },
        { x: 780, y: 300, w: 160, h: 32 },
        { x: 1020, y: 220, w: 150, h: 30 },
        { x: 1240, y: 140, w: 240, h: 34 }
      ],
      movers: [{ x: 340, y: G, w: 140, h: 30, axis: "y", min: 300, max: G, speed: 38 }],
      blocks: [{ x: 140, y: G - 150, ...WING }],
      pickups: [],
      enemies: [{ x: 560, minX: 540, maxX: 640, speed: 50 }],
      flagX: 1360
    },
    {
      name: "Tiny Isles",
      sky: ["#e7d4ff", "#fff1d6"],
      platforms: [
        { x: 0, y: G, w: 260, h: 48 },
        { x: 420, y: G, w: 180, h: 48 },
        { x: 760, y: G, w: 180, h: 48 },
        { x: 1100, y: G, w: 180, h: 48 },
        { x: 1440, y: G, w: 180, h: 48 },
        { x: 1780, y: G, w: 280, h: 48 }
      ],
      blocks: [{ x: 140, y: G - 150, ...WING }],
      pickups: [{ x: 820, y: G - 38, w: 38, h: 38 }],
      hazards: [{ x: 1500, w: 50 }],
      enemies: [
        { x: 460, minX: 440, maxX: 540, speed: 52 },
        { x: 800, minX: 780, maxX: 880, speed: 54 },
        { x: 1140, minX: 1120, maxX: 1220, speed: 56 }
      ],
      flagX: 1940
    },
    {
      name: "Steep Street",
      sky: ["#f7d7b0", "#fff0c8"],
      platforms: [
        { x: 0, y: G, w: 280, h: 48 },
        { x: 360, y: 330, w: 140, h: 30 },
        { x: 560, y: 250, w: 140, h: 30 },
        { x: 760, y: 170, w: 150, h: 30 },
        { x: 1020, y: G, w: 240, h: 48 },
        { x: 1360, y: 310, w: 150, h: 30 },
        { x: 1580, y: 200, w: 250, h: 34 }
      ],
      blocks: [{ x: 140, y: G - 150, ...WING }],
      pickups: [],
      hazards: [{ x: 1400, w: 50 }],
      enemies: [{ x: 1080, minX: 1060, maxX: 1180, speed: 54 }],
      flagX: 1700
    },
    {
      name: "Ferry Chain",
      sky: ["#b7e4fb", "#d8f3c8"],
      platforms: [
        { x: 0, y: G, w: 280, h: 48 },
        { x: 1180, y: G, w: 420, h: 48 },
        { x: 1460, y: 280, w: 240, h: 34 }
      ],
      movers: [
        { x: 360, y: G, w: 130, h: 32, min: 340, max: 560, speed: 50 },
        { x: 680, y: G, w: 130, h: 32, min: 640, max: 860, speed: 46 },
        { x: 980, y: 340, w: 140, h: 32, min: 940, max: 1120, speed: 40 }
      ],
      blocks: [{ x: 140, y: G - 150, ...WING }],
      pickups: [],
      enemies: [{ x: 1240, minX: 1220, maxX: 1320, speed: 54 }],
      flagX: 1580
    },
    {
      name: "Busy Garden",
      sky: ["#c8f0c4", "#fff6d8"],
      platforms: [
        { x: 0, y: G, w: 1980, h: 48 },
        { x: 1760, y: 270, w: 260, h: 36 }
      ],
      blocks: [{ x: 150, y: G - 150, ...WING }],
      pickups: [],
      hazards: [
        { x: 300, w: 70 },
        { x: 560, w: 70 },
        { x: 840, w: 80 },
        { x: 1140, w: 70 },
        { x: 1440, w: 70 }
      ],
      enemies: [
        { x: 420, minX: 400, maxX: 500, speed: 52 },
        { x: 700, minX: 680, maxX: 780, speed: 56 },
        { x: 1000, minX: 980, maxX: 1080, speed: 58 }
      ],
      flagX: 1900
    },
    {
      name: "Sky Bridge",
      sky: ["#c5ebff", "#ffe8f2"],
      platforms: [
        { x: 0, y: G, w: 300, h: 48 },
        { x: 420, y: 290, w: 180, h: 32 },
        { x: 1120, y: 290, w: 180, h: 32 },
        { x: 1380, y: 190, w: 160, h: 32 },
        { x: 1620, y: G, w: 260, h: 48 },
        { x: 1940, y: 300, w: 150, h: 30 },
        { x: 2160, y: 190, w: 240, h: 34 }
      ],
      movers: [{ x: 680, y: 290, w: 140, h: 28, min: 640, max: 940, speed: 48 }],
      blocks: [{ x: 140, y: G - 150, ...WING }],
      pickups: [],
      hazards: [{ x: 1160, w: 50 }],
      enemies: [
        { x: 460, minX: 440, maxX: 540, speed: 50 },
        { x: 1700, minX: 1660, maxX: 1800, speed: 56 }
      ],
      flagX: 2280
    },
    {
      name: "Night Islands",
      sky: ["#7f93c4", "#f3d2b4"],
      platforms: [
        { x: 0, y: G, w: 280, h: 48 },
        { x: 450, y: G, w: 200, h: 48 },
        { x: 810, y: G, w: 200, h: 48 },
        { x: 1160, y: G, w: 200, h: 48 },
        { x: 1510, y: G, w: 200, h: 48 },
        { x: 1860, y: G, w: 300, h: 48 }
      ],
      blocks: [{ x: 140, y: G - 150, ...WING }],
      pickups: [],
      hazards: [
        { x: 880, w: 50 },
        { x: 1580, w: 50 }
      ],
      enemies: [
        { x: 490, minX: 470, maxX: 590, speed: 56 },
        { x: 1200, minX: 1180, maxX: 1300, speed: 58 },
        { x: 1900, minX: 1880, maxX: 2060, speed: 58 }
      ],
      flagX: 2040
    },
    {
      name: "Switch Lifts",
      sky: ["#f0c9b0", "#ffe7c8"],
      platforms: [
        { x: 0, y: G, w: 300, h: 48 },
        { x: 860, y: 300, w: 180, h: 32 },
        { x: 1280, y: 220, w: 160, h: 30 },
        { x: 1520, y: 220, w: 250, h: 34 }
      ],
      movers: [
        { x: 400, y: 300, w: 140, h: 28, min: 360, max: 680, speed: 52 },
        { x: 1100, y: G, w: 130, h: 30, axis: "y", min: 220, max: G, speed: 40 }
      ],
      blocks: [{ x: 140, y: G - 150, ...WING }],
      pickups: [],
      hazards: [{ x: 1320, w: 50 }],
      enemies: [{ x: 900, minX: 880, maxX: 980, speed: 54 }],
      flagX: 1640
    },
    {
      name: "Long Steps",
      sky: ["#f7c9a2", "#fff0c8"],
      platforms: [
        { x: 0, y: G, w: 240, h: 48 },
        { x: 340, y: 330, w: 130, h: 30 },
        { x: 520, y: 250, w: 130, h: 30 },
        { x: 700, y: 170, w: 140, h: 30 },
        { x: 940, y: G, w: 220, h: 48 },
        { x: 1280, y: 310, w: 140, h: 30 },
        { x: 1500, y: 220, w: 140, h: 30 },
        { x: 1720, y: 140, w: 250, h: 34 }
      ],
      blocks: [{ x: 130, y: G - 150, ...WING }],
      pickups: [{ x: 740, y: 132, w: 38, h: 38 }],
      enemies: [{ x: 1000, minX: 980, maxX: 1100, speed: 56 }],
      flagX: 1840
    },
    {
      name: "Thick Garden",
      sky: ["#d8f3c8", "#fff1d0"],
      platforms: [
        { x: 0, y: G, w: 2100, h: 48 },
        { x: 1880, y: 270, w: 280, h: 36 }
      ],
      blocks: [{ x: 150, y: G - 150, ...WING }],
      pickups: [],
      hazards: [
        { x: 280, w: 70 },
        { x: 520, w: 80 },
        { x: 820, w: 70 },
        { x: 1100, w: 80 },
        { x: 1400, w: 70 },
        { x: 1680, w: 70 }
      ],
      enemies: [
        { x: 400, minX: 380, maxX: 460, speed: 54 },
        { x: 680, minX: 660, maxX: 760, speed: 58 },
        { x: 960, minX: 940, maxX: 1040, speed: 60 },
        { x: 1260, minX: 1240, maxX: 1340, speed: 60 }
      ],
      flagX: 2040
    },
    {
      name: "Wide Hops",
      sky: ["#b7e4fb", "#e7f6ff"],
      platforms: [
        { x: 0, y: G, w: 280, h: 48 },
        { x: 450, y: G, w: 190, h: 48 },
        { x: 810, y: G, w: 190, h: 48 },
        { x: 1170, y: G, w: 190, h: 48 },
        { x: 1530, y: G, w: 190, h: 48 },
        { x: 1890, y: G, w: 300, h: 48 }
      ],
      blocks: [{ x: 140, y: G - 150, ...WING }],
      pickups: [],
      hazards: [{ x: 1230, w: 50 }],
      enemies: [
        { x: 490, minX: 470, maxX: 580, speed: 58 },
        { x: 850, minX: 830, maxX: 940, speed: 60 },
        { x: 1570, minX: 1550, maxX: 1660, speed: 60 }
      ],
      flagX: 2060
    },
    {
      name: "Upper Path",
      sky: ["#d4e9ff", "#ffe8f2"],
      platforms: [
        { x: 0, y: G, w: 320, h: 48 },
        { x: 440, y: 270, w: 200, h: 32 },
        { x: 740, y: 270, w: 200, h: 32 },
        { x: 1040, y: 270, w: 200, h: 32 },
        { x: 1340, y: G, w: 280, h: 48 },
        { x: 1700, y: 300, w: 150, h: 30 },
        { x: 1920, y: 190, w: 250, h: 34 }
      ],
      blocks: [{ x: 140, y: G - 150, ...WING }],
      pickups: [],
      hazards: [{ x: 1460, w: 70 }],
      enemies: [
        { x: 480, minX: 460, maxX: 580, speed: 54 },
        { x: 1400, minX: 1360, maxX: 1420, speed: 58 }
      ],
      flagX: 2040
    },
    {
      name: "Fast Friends",
      sky: ["#f7d7b0", "#fff0c8"],
      platforms: [
        { x: 0, y: G, w: 300, h: 48 },
        { x: 460, y: G, w: 220, h: 48 },
        { x: 840, y: G, w: 220, h: 48 },
        { x: 1220, y: G, w: 220, h: 48 },
        { x: 1600, y: G, w: 220, h: 48 },
        { x: 1980, y: G, w: 280, h: 48 }
      ],
      blocks: [{ x: 140, y: G - 150, ...WING }],
      pickups: [],
      enemies: [
        { x: 500, minX: 480, maxX: 620, speed: 60 },
        { x: 880, minX: 860, maxX: 1000, speed: 62 },
        { x: 1260, minX: 1240, maxX: 1380, speed: 64 },
        { x: 1640, minX: 1620, maxX: 1760, speed: 64 }
      ],
      flagX: 2140
    },
    {
      name: "Burr Log",
      sky: ["#c5ebff", "#fff1d6"],
      platforms: [
        { x: 0, y: G, w: 340, h: 48 },
        { x: 900, y: G, w: 260, h: 48 },
        { x: 1680, y: 280, w: 260, h: 36 }
      ],
      movers: [
        { x: 460, y: G, w: 150, h: 30, min: 420, max: 700, speed: 52 },
        { x: 1240, y: 330, w: 140, h: 28, min: 1200, max: 1480, speed: 46 }
      ],
      blocks: [{ x: 140, y: G - 150, ...WING }],
      pickups: [],
      hazards: [{ x: 960, w: 60 }],
      enemies: [{ x: 1080, minX: 1060, maxX: 1100, speed: 58 }],
      flagX: 1820
    },
    {
      name: "Three Stories",
      sky: ["#e7d4ff", "#fff1d6"],
      platforms: [
        { x: 0, y: G, w: 300, h: 48 },
        { x: 400, y: 300, w: 160, h: 32 },
        { x: 640, y: 190, w: 160, h: 32 },
        { x: 880, y: 300, w: 160, h: 32 },
        { x: 1140, y: G, w: 280, h: 48 },
        { x: 1500, y: 290, w: 150, h: 30 },
        { x: 1720, y: 180, w: 260, h: 34 }
      ],
      blocks: [{ x: 140, y: G - 150, ...WING }],
      pickups: [],
      hazards: [{ x: 920, w: 50 }],
      enemies: [
        { x: 440, minX: 420, maxX: 500, speed: 56 },
        { x: 1200, minX: 1180, maxX: 1340, speed: 60 }
      ],
      flagX: 1860
    },
    {
      name: "Evening Ferry",
      sky: ["#7f93c4", "#f3d2b4"],
      platforms: [
        { x: 0, y: G, w: 280, h: 48 },
        { x: 640, y: 260, w: 200, h: 32 },
        { x: 1360, y: G, w: 460, h: 48 },
        { x: 1680, y: 270, w: 260, h: 34 }
      ],
      movers: [
        { x: 380, y: G, w: 140, h: 30, axis: "y", min: 260, max: G, speed: 42 },
        { x: 920, y: 260, w: 140, h: 28, min: 880, max: 1160, speed: 50 }
      ],
      blocks: [{ x: 140, y: G - 150, ...WING }],
      pickups: [],
      hazards: [{ x: 1420, w: 60 }],
      enemies: [
        { x: 680, minX: 660, maxX: 780, speed: 56 },
        { x: 1520, minX: 1500, maxX: 1600, speed: 60 }
      ],
      flagX: 1820
    },
    {
      name: "Castle Steps",
      sky: ["#f0b090", "#ffe0c0"],
      platforms: [
        { x: 0, y: G, w: 300, h: 48 },
        { x: 460, y: G, w: 200, h: 48 },
        { x: 740, y: 290, w: 150, h: 32 },
        { x: 960, y: 190, w: 160, h: 32 },
        { x: 1620, y: 190, w: 180, h: 32 },
        { x: 1880, y: 300, w: 160, h: 32 },
        { x: 2120, y: G, w: 320, h: 48 },
        { x: 2500, y: 280, w: 260, h: 36 }
      ],
      movers: [{ x: 1200, y: 190, w: 130, h: 28, min: 1160, max: 1440, speed: 50 }],
      blocks: [{ x: 140, y: G - 150, ...WING }],
      pickups: [],
      hazards: [{ x: 500, w: 60 }],
      enemies: [
        { x: 780, minX: 760, maxX: 840, speed: 56 },
        { x: 1660, minX: 1640, maxX: 1740, speed: 60 },
        { x: 2200, minX: 2160, maxX: 2340, speed: 62 }
      ],
      flagX: 2640
    },
    {
      name: "Spiky Miles",
      sky: ["#d8f3c8", "#fff1d0"],
      platforms: [
        { x: 0, y: G, w: 320, h: 48 },
        { x: 480, y: G, w: 190, h: 48 },
        { x: 830, y: G, w: 190, h: 48 },
        { x: 1180, y: G, w: 190, h: 48 },
        { x: 1530, y: G, w: 190, h: 48 },
        { x: 1880, y: G, w: 190, h: 48 },
        { x: 2230, y: G, w: 300, h: 48 }
      ],
      blocks: [{ x: 150, y: G - 150, ...WING }],
      pickups: [],
      hazards: [
        { x: 540, w: 50 },
        { x: 890, w: 50 },
        { x: 1240, w: 50 },
        { x: 1590, w: 50 },
        { x: 1940, w: 50 }
      ],
      enemies: [
        { x: 860, minX: 850, maxX: 900, speed: 58 },
        { x: 1910, minX: 1900, maxX: 1960, speed: 62 }
      ],
      flagX: 2400
    },
    {
      name: "The Parade",
      sky: ["#e7d4ff", "#f7d7b0"],
      platforms: [
        { x: 0, y: G, w: 260, h: 48 },
        { x: 420, y: G, w: 220, h: 48 },
        { x: 780, y: G, w: 220, h: 48 },
        { x: 1140, y: G, w: 220, h: 48 },
        { x: 1500, y: G, w: 220, h: 48 },
        { x: 1860, y: G, w: 220, h: 48 },
        { x: 2220, y: G, w: 280, h: 48 }
      ],
      blocks: [{ x: 130, y: G - 150, ...WING }],
      pickups: [],
      enemies: [
        { x: 460, minX: 440, maxX: 580, speed: 56 },
        { x: 820, minX: 800, maxX: 940, speed: 58 },
        { x: 1180, minX: 1160, maxX: 1300, speed: 60 },
        { x: 1540, minX: 1520, maxX: 1660, speed: 62 },
        { x: 1900, minX: 1880, maxX: 2020, speed: 64 }
      ],
      flagX: 2380
    },
    {
      name: "Moving Stairs",
      sky: ["#f7c9a2", "#fff0c8"],
      platforms: [
        { x: 0, y: G, w: 280, h: 48 },
        { x: 720, y: 310, w: 150, h: 30 },
        { x: 1320, y: 220, w: 150, h: 30 },
        { x: 1920, y: 220, w: 260, h: 34 }
      ],
      movers: [
        { x: 360, y: G, w: 130, h: 28, min: 320, max: 560, speed: 48 },
        { x: 940, y: 310, w: 130, h: 28, min: 900, max: 1140, speed: 44 },
        { x: 1560, y: 220, w: 130, h: 28, min: 1520, max: 1740, speed: 42 }
      ],
      blocks: [{ x: 140, y: G - 150, ...WING }],
      pickups: [],
      enemies: [
        { x: 760, minX: 740, maxX: 820, speed: 54 },
        { x: 1360, minX: 1340, maxX: 1420, speed: 58 }
      ],
      flagX: 2060
    },
    {
      name: "Narrow Night",
      sky: ["#6f86b8", "#f3d2b4"],
      platforms: [
        { x: 0, y: G, w: 240, h: 48 },
        { x: 405, y: G, w: 160, h: 48 },
        { x: 730, y: G, w: 160, h: 48 },
        { x: 1055, y: G, w: 160, h: 48 },
        { x: 1380, y: G, w: 160, h: 48 },
        { x: 1705, y: G, w: 160, h: 48 },
        { x: 2030, y: G, w: 280, h: 48 }
      ],
      blocks: [{ x: 120, y: G - 150, ...WING }],
      pickups: [],
      hazards: [{ x: 1105, w: 50 }],
      enemies: [
        { x: 445, minX: 425, maxX: 505, speed: 62 },
        { x: 770, minX: 750, maxX: 830, speed: 64 },
        { x: 1420, minX: 1400, maxX: 1480, speed: 66 },
        { x: 1745, minX: 1725, maxX: 1805, speed: 66 }
      ],
      flagX: 2180
    },
    {
      name: "Lift Yard",
      sky: ["#b7e4fb", "#fff1d6"],
      platforms: [
        { x: 0, y: G, w: 300, h: 48 },
        { x: 620, y: 280, w: 170, h: 32 },
        { x: 1120, y: 180, w: 260, h: 34 }
      ],
      movers: [
        { x: 380, y: G, w: 140, h: 30, axis: "y", min: 280, max: G, speed: 36 },
        { x: 880, y: G, w: 140, h: 30, axis: "y", min: 180, max: G, speed: 34 }
      ],
      blocks: [{ x: 140, y: G - 150, ...WING }],
      pickups: [{ x: 220, y: G - 38, w: 38, h: 38 }],
      enemies: [{ x: 660, minX: 640, maxX: 730, speed: 58 }],
      flagX: 1260
    },
    {
      name: "Deep Garden",
      sky: ["#9eb0d6", "#f7d7b0"],
      platforms: [
        { x: 0, y: G, w: 2280, h: 48 },
        { x: 2060, y: 270, w: 280, h: 36 }
      ],
      blocks: [{ x: 150, y: G - 150, ...WING }],
      pickups: [],
      hazards: [
        { x: 340, w: 80 },
        { x: 620, w: 80 },
        { x: 920, w: 80 },
        { x: 1220, w: 80 },
        { x: 1520, w: 80 },
        { x: 1820, w: 70 }
      ],
      enemies: [
        { x: 480, minX: 460, maxX: 540, speed: 60 },
        { x: 780, minX: 760, maxX: 840, speed: 62 },
        { x: 1080, minX: 1060, maxX: 1140, speed: 64 },
        { x: 1380, minX: 1360, maxX: 1440, speed: 66 }
      ],
      flagX: 2220
    },
    {
      name: "Rush Isles",
      sky: ["#f0c9b0", "#ffe7c8"],
      platforms: [
        { x: 0, y: G, w: 260, h: 48 },
        { x: 425, y: G, w: 180, h: 48 },
        { x: 770, y: G, w: 180, h: 48 },
        { x: 1115, y: G, w: 180, h: 48 },
        { x: 1460, y: G, w: 180, h: 48 },
        { x: 1805, y: G, w: 180, h: 48 },
        { x: 2150, y: G, w: 280, h: 48 }
      ],
      blocks: [{ x: 130, y: G - 150, ...WING }],
      pickups: [],
      hazards: [
        { x: 830, w: 50 },
        { x: 1520, w: 50 }
      ],
      enemies: [
        { x: 465, minX: 445, maxX: 545, speed: 64 },
        { x: 1155, minX: 1135, maxX: 1235, speed: 66 },
        { x: 1845, minX: 1825, maxX: 1925, speed: 68 }
      ],
      flagX: 2300
    },
    {
      name: "High Switch",
      sky: ["#d4e9ff", "#f3d2b4"],
      platforms: [
        { x: 0, y: G, w: 280, h: 48 },
        { x: 400, y: 270, w: 160, h: 32 },
        { x: 1080, y: 270, w: 160, h: 32 },
        { x: 1320, y: 170, w: 150, h: 30 },
        { x: 1560, y: 270, w: 160, h: 32 },
        { x: 1800, y: G, w: 240, h: 48 },
        { x: 2120, y: 300, w: 150, h: 30 },
        { x: 2340, y: 190, w: 260, h: 34 }
      ],
      movers: [{ x: 640, y: 270, w: 130, h: 28, min: 600, max: 900, speed: 56 }],
      blocks: [{ x: 140, y: G - 150, ...WING }],
      pickups: [],
      hazards: [{ x: 1880, w: 60 }],
      enemies: [
        { x: 1120, minX: 1100, maxX: 1180, speed: 60 },
        { x: 1860, minX: 1820, maxX: 1860, speed: 62 }
      ],
      flagX: 2480
    },
    {
      name: "Castle Road",
      sky: ["#d98b7a", "#ffd8a8"],
      platforms: [
        { x: 0, y: G, w: 300, h: 48 },
        { x: 460, y: G, w: 200, h: 48 },
        { x: 740, y: 290, w: 160, h: 32 },
        { x: 1400, y: G, w: 280, h: 48 },
        { x: 1760, y: 300, w: 150, h: 30 },
        { x: 1980, y: 190, w: 160, h: 32 },
        { x: 2400, y: 190, w: 260, h: 34 }
      ],
      movers: [
        { x: 980, y: 290, w: 140, h: 28, min: 940, max: 1200, speed: 54 },
        { x: 2200, y: G, w: 130, h: 30, axis: "y", min: 190, max: G, speed: 40 }
      ],
      blocks: [{ x: 140, y: G - 150, ...WING }],
      pickups: [{ x: 520, y: G - 38, w: 38, h: 38 }],
      hazards: [{ x: 1460, w: 60 }],
      enemies: [
        { x: 500, minX: 480, maxX: 600, speed: 62 },
        { x: 1560, minX: 1540, maxX: 1620, speed: 66 }
      ],
      flagX: 2540
    },
    {
      name: "Bowser's Castle",
      sky: ["#e07a62", "#ffd0a8"],
      bowser: true,
      bowserHome: 1900,
      bowserMin: 1720,
      bowserMax: 2100,
      platforms: [
        { x: 0, y: G, w: 340, h: 48 },
        { x: 500, y: G, w: 220, h: 48 },
        { x: 800, y: 300, w: 160, h: 32 },
        { x: 1440, y: G, w: 1200, h: 48 },
        { x: 2320, y: 270, w: 300, h: 36 }
      ],
      movers: [{ x: 1040, y: 300, w: 140, h: 28, min: 1000, max: 1240, speed: 46 }],
      blocks: [{ x: 140, y: G - 150, ...WING }],
      pickups: [],
      hazards: [{ x: 1520, w: 70 }],
      enemies: [
        { x: 540, minX: 520, maxX: 660, speed: 56 },
        { x: 840, minX: 820, maxX: 900, speed: 52 }
      ],
      flagX: 2480
    }
  ];

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const stage = document.getElementById("stage");
  const overlay = document.getElementById("overlay");
  const cardTitle = document.getElementById("card-title");
  const cardBody = document.getElementById("card-body");
  const goBtn = document.getElementById("go");
  const goldDemo = document.querySelector(".gold-demo");
  const levelNameEl = document.getElementById("level-name");
  const healthEl = document.getElementById("health");
  const healthFill = document.getElementById("health-fill");
  const sizePill = document.getElementById("size-pill");
  const wingPill = document.getElementById("wing-pill");
  const jumpBtn = document.getElementById("jump");
  const live = document.getElementById("live");

  const held = { left: false, right: false, jump: false };
  const keys = { left: false, right: false, jump: false };
  let jumpEdge = false;
  let prevJump = false;
  let queuedEdge = false;

  let mode = "title";
  let levelIndex = 0;
  let level = null;
  let size = 0;
  let mario = null;
  let bowser = null;
  let flag = null;
  let checkpoint = { x: 36, y: 0 };
  let spawn = { x: 36, y: 0 };
  let falls = 0;
  let gotWings = false;
  let grewFromFlag = false;
  let grewFromPickup = false;
  let levelStartSize = 0;
  let cleared = 0;
  let levelT0 = 0;
  let oops = 0;
  let invuln = 0;
  let growPop = 0;
  let toastText = "";
  let toastLife = 0;
  let flagPop = 0;
  let stomped = 0;
  let health = 1;
  let healthFlash = 0;
  let autoTimer = 0;
  let particles = [];
  let audioCtx = null;
  const MUSIC_URL = "audio/super-world.m4a";
  const MUSIC_OVERLAP = 2.75;
  let musicRaw = null;
  let musicBuffer = null;
  let musicBus = null;
  let musicMeter = null;
  let musicWanted = false;
  let musicNextAt = 0;
  let musicArmed = false;
  let view = { cssW: 360, cssH: 480, dpr: 1 };
  let lastTs = 0;
  const ART = {};
  const ART_SRC = {
    baby: "art/mario-baby.png",
    kid: "art/mario-kid.png",
    big: "art/mario-big.png",
    babyRun: "art/mario-baby-run.png",
    kidRun: "art/mario-kid-run.png",
    bigRun: "art/mario-big-run.png",
    wings: "art/wings.png",
    bowser: "art/bowser.png",
    bowserSit: "art/bowser-sit.png",
    flag: "art/flag.png",
    block: "art/block.png",
    blockUsed: "art/block-used.png",
    mushroom: "art/mushroom.png",
    ground: "art/ground.png",
    hill: "art/hill.png",
    cloud: "art/cloud.png",
    flower: "art/flower.png",
    enemy: "art/enemy.png",
    prickle: "art/prickle.png"
  };

  function loadArt() {
    Object.keys(ART_SRC).forEach((key) => {
      const img = new Image();
      img.onload = () => { ART[key] = img; };
      img.src = ART_SRC[key];
    });
  }

  function drawGroundSprite(p) {
    const img = ART.ground;
    const sw = img.width;
    const sh = img.height;
    if (p.y >= G - 1) {
      const srcY = Math.round(sh * 0.72);
      ctx.drawImage(img, 0, srcY, sw, sh - srcY, p.x, p.y + p.h - 8, p.w, 420);
    }
    const capSrc = Math.max(8, Math.round(sw * 0.22));
    const capDst = Math.min(p.w * 0.3, Math.max(10, p.h * 0.9));
    if (p.w <= capDst * 2 + 6) {
      ctx.drawImage(img, p.x, p.y, p.w, p.h);
      return;
    }
    const midSrc = Math.max(1, sw - capSrc * 2);
    const overlap = 8;
    ctx.drawImage(img, capSrc, 0, midSrc, sh, p.x + capDst - overlap, p.y, p.w - (capDst - overlap) * 2, p.h);
    ctx.drawImage(img, 0, 0, capSrc, sh, p.x, p.y, capDst, p.h);
    ctx.drawImage(img, sw - capSrc, 0, capSrc, sh, p.x + p.w - capDst, p.y, capDst, p.h);
  }

  function cloneLevel(i) {
    const src = LEVELS[i];
    return {
      name: src.name,
      hint: !!src.hint,
      sky: src.sky,
      bowser: !!src.bowser,
      bowserHome: src.bowserHome || 0,
      bowserMin: src.bowserMin,
      bowserMax: src.bowserMax,
      flagX: src.flagX,
      platforms: src.platforms.map((p) => ({ x: p.x, y: p.y, w: p.w, h: p.h })),
      blocks: src.blocks.map((b) => ({ x: b.x, y: b.y, w: b.w, h: b.h, kind: b.kind, used: false })),
      pickups: src.pickups.map((p) => ({ x: p.x, y: p.y, w: p.w, h: p.h, got: false })),
      movers: (src.movers || []).map((m) => ({
        x: m.x, y: m.y, w: m.w, h: m.h,
        axis: m.axis || "x",
        min: m.min, max: m.max,
        speed: m.speed, dir: 1, mover: true, dx: 0, dy: 0
      })),
      enemies: (src.enemies || []).map((e) => ({
        x: e.x, w: e.w || 40, h: e.h || 34,
        minX: e.minX, maxX: e.maxX,
        speed: e.speed || 40, dir: 1, y: 0, floor: G, gone: false
      })),
      hazards: (src.hazards || []).map((h) => ({ x: h.x, w: h.w, y: 0, h: 22 }))
    };
  }

  function worldWidth() {
    let right = level.flagX + 120;
    for (const p of level.platforms) right = Math.max(right, p.x + p.w + 40);
    for (const m of level.movers) right = Math.max(right, m.max + m.w + 40);
    return right;
  }

  function applySize(next, keepFeet) {
    const prevH = mario ? mario.h : 0;
    size = next;
    const spec = SIZES[size];
    if (!mario) return;
    mario.w = spec.w;
    mario.h = spec.h;
    mario.size = size;
    if (keepFeet) mario.y -= spec.h - prevH;
  }

  function beginLevel() {
    level = cloneLevel(levelIndex);
    applySize(size, false);
    const spec = SIZES[size];
    mario = {
      x: 36,
      y: G - spec.h,
      w: spec.w,
      h: spec.h,
      vx: 0,
      vy: 0,
      facing: 1,
      size,
      wings: false,
      grounded: false,
      coyote: 0,
      buffer: 0
    };
    spawn = { x: mario.x, y: mario.y };
    checkpoint = { x: mario.x, y: mario.y };
    for (const e of level.enemies) {
      const stand = platformUnderX(e.x, e.w);
      e.floor = stand ? stand.y : G;
      e.y = e.floor - e.h;
    }
    for (const h of level.hazards) {
      const stand = platformUnderX(h.x, h.w);
      h.y = (stand ? stand.y : G) - 16;
    }
    const stand = platformAtFlag();
    flag = { x: level.flagX, y: stand ? stand.y : G, on: true };
    bowser = level.bowser
      ? {
          x: level.bowserHome,
          y: G - 100,
          w: 140,
          h: 86,
          dir: 1,
          hp: 3,
          minX: level.bowserMin != null ? level.bowserMin : level.bowserHome - 100,
          maxX: level.bowserMax != null ? level.bowserMax : level.bowserHome + 140,
          sit: false,
          flash: 0
        }
      : null;
    falls = 0;
    gotWings = false;
    grewFromFlag = false;
    grewFromPickup = false;
    levelStartSize = size;
    oops = 0;
    invuln = 0;
    growPop = 0;
    flagPop = 0;
    stomped = 0;
    toastText = "";
    particles = [];
    levelT0 = performance.now();
    mode = "play";
    blip(480, 0.05);
    document.body.dataset.mode = "play";
    hideCard();
    say(level.bowser ? "Jump on his head, then touch the flag." : level.name);
    updateHud();
  }

  function platformUnderX(x, width) {
    const cx = x + width / 2;
    let best = null;
    for (const p of level.platforms) {
      if (cx >= p.x && cx <= p.x + p.w && (!best || p.y < best.y)) best = p;
    }
    return best;
  }

  function surfaces() {
    return level.movers.length ? level.platforms.concat(level.movers) : level.platforms;
  }

  function platformAtFlag() {
    let best = null;
    for (const p of level.platforms) {
      if (level.flagX >= p.x + 8 && level.flagX <= p.x + p.w - 8) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function toast(text) {
    toastText = text;
    toastLife = 1;
  }

  function say(text) {
    live.textContent = text;
  }

  function audio() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function loadMusic() {
    fetch(MUSIC_URL)
      .then((res) => res.arrayBuffer())
      .then((buf) => {
        musicRaw = buf;
        if (audioCtx) decodeMusic();
      })
      .catch(() => {});
  }

  function decodeMusic() {
    if (!musicRaw || musicBuffer) return;
    const raw = musicRaw;
    audio().decodeAudioData(raw.slice(0)).then((decoded) => {
      musicBuffer = decoded;
      if (musicWanted) pumpMusic();
    }).catch(() => {});
  }

  function startMusic() {
    musicWanted = true;
    try { audio(); } catch (err) { return; }
    if (!musicBuffer) decodeMusic();
    pumpMusic();
  }

  function fadeCurve(rising) {
    const steps = 64;
    const values = new Float32Array(steps);
    for (let i = 0; i < steps; i++) {
      const angle = (i / (steps - 1)) * Math.PI / 2;
      values[i] = rising ? Math.sin(angle) : Math.cos(angle);
    }
    values[0] = Math.max(values[0], 0.0001);
    values[steps - 1] = Math.max(values[steps - 1], 0.0001);
    return values;
  }

  function cueMusic(when, fadeIn) {
    const ctx = audioCtx;
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = musicBuffer;
    src.connect(gain);
    gain.connect(musicBus);
    const dur = musicBuffer.duration;
    const overlap = Math.min(MUSIC_OVERLAP, dur / 3);
    const open = fadeIn ? overlap : 0.35;
    const fadeAt = when + dur - overlap;
    gain.gain.setValueCurveAtTime(fadeCurve(true), when, open);
    gain.gain.setValueCurveAtTime(fadeCurve(false), fadeAt, overlap);
    src.start(when);
    src.stop(fadeAt + overlap + 0.05);
    src.onended = () => {
      if (!musicWanted || !musicBuffer) return;
      const step = musicBuffer.duration - overlap;
      const next = when + step * 2;
      if (next > audioCtx.currentTime) cueMusic(next, true);
    };
  }

  function pumpMusic() {
    if (!musicWanted || !musicBuffer || !audioCtx || musicArmed) return;
    const ctx = audioCtx;
    if (!musicBus) {
      musicBus = ctx.createGain();
      musicBus.gain.value = 0.5;
      musicMeter = ctx.createAnalyser();
      musicMeter.fftSize = 256;
      musicBus.connect(musicMeter);
      musicMeter.connect(ctx.destination);
    }
    const dur = musicBuffer.duration;
    const overlap = Math.min(MUSIC_OVERLAP, dur / 3);
    const when = ctx.currentTime + 0.05;
    cueMusic(when, false);
    cueMusic(when + dur - overlap, true);
    musicNextAt = when + dur - overlap;
    musicArmed = true;
  }

  function musicLevel() {
    if (!musicMeter) return 0;
    const bins = new Uint8Array(musicMeter.frequencyBinCount);
    musicMeter.getByteFrequencyData(bins);
    let sum = 0;
    for (let i = 0; i < bins.length; i++) sum += bins[i];
    return sum / bins.length;
  }

  function blip(freq, dur) {
    try {
      const ctx = audio();
      const t = ctx.currentTime;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.04, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + dur);
    } catch (err) {
      /* sound is optional */
    }
  }

  function burst(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      particles.push({
        x, y,
        vx: Math.cos(a) * 50,
        vy: Math.sin(a) * 50 - 20,
        life: 0.6,
        color,
        r: 4
      });
    }
  }

  function moveCourse(dt) {
    for (const m of level.movers) {
      const prevX = m.x;
      const prevY = m.y;
      if (m.axis === "y") {
        m.y += m.dir * m.speed * dt;
        if (m.y < m.min || m.y > m.max) {
          m.dir *= -1;
          m.y = Math.max(m.min, Math.min(m.max, m.y));
        }
      } else {
        m.x += m.dir * m.speed * dt;
        if (m.x < m.min || m.x > m.max) {
          m.dir *= -1;
          m.x = Math.max(m.min, Math.min(m.max, m.x));
        }
      }
      m.dx = m.x - prevX;
      m.dy = m.y - prevY;
    }
  }

  function update(dt) {
    moveCourse(dt);
    if (mario.ride) {
      mario.x += mario.ride.dx;
      mario.y = mario.ride.y - mario.h;
      mario.ride = null;
    }

    const down = held.jump || keys.jump;
    if ((down && !prevJump) || queuedEdge) jumpEdge = true;
    prevJump = down;
    queuedEdge = false;

    const dir = (held.right || keys.right ? 1 : 0) - (held.left || keys.left ? 1 : 0);
    mario.vx = dir * RUN;
    if (dir) mario.facing = dir;

    if (mario.wings && down) {
      mario.vy -= 1100 * dt;
      if (mario.vy < -240) mario.vy = -240;
    } else {
      mario.vy += (mario.wings ? 340 : GRAVITY) * dt;
    }
    if (mario.vy > 560) mario.vy = 560;
    if (mario.y < 24 && mario.vy < 0) mario.vy = 0;

    const canJump = mario.grounded || mario.coyote > 0;
    if (!mario.wings && down && canJump) {
      mario.vy = JUMP_V;
      mario.grounded = false;
      mario.coyote = 0;
      mario.buffer = 0;
      blip(520, 0.07);
    } else if (jumpEdge && !canJump) {
      mario.buffer = 0.16;
    }
    jumpEdge = false;
    mario.buffer -= dt;
    mario.coyote -= dt;

    const prevY = mario.y;
    mario.x += mario.vx * dt;
    if (mario.x < 0) mario.x = 0;
    const maxX = worldWidth() - mario.w;
    if (mario.x > maxX) mario.x = maxX;

    mario.y += mario.vy * dt;
    mario.grounded = false;
    let land = null;
    const prevBottom = prevY + mario.h;
    const nowBottom = mario.y + mario.h;
    if (mario.vy >= 0) {
      for (const p of surfaces()) {
        const overlapX = Math.min(mario.x + mario.w, p.x + p.w) - Math.max(mario.x, p.x);
        if (overlapX < 10) continue;
        if (prevBottom <= p.y + 30 && nowBottom >= p.y && (!land || p.y < land.y)) land = p;
      }
    }
    if (land) {
      mario.y = land.y - mario.h;
      mario.vy = 0;
      mario.grounded = true;
      mario.coyote = 0.16;
      if (land.mover) mario.ride = land;
      if (mario.buffer > 0) {
        mario.vy = JUMP_V;
        mario.grounded = false;
        mario.coyote = 0;
        mario.buffer = 0;
        blip(520, 0.08);
      }
    }

    for (const b of level.blocks) {
      const near = mario.x < b.x + b.w + 18 && mario.x + mario.w > b.x - 18 && mario.y < b.y + b.h + 10 && mario.y + mario.h > b.y - 6;
      if (!b.used && near) {
        b.used = true;
        if (b.kind === "wing") grantWings(b);
        if (mario.vy < 0) mario.vy = 70;
        continue;
      }
      if (mario.vy >= 0 && prevY + mario.h <= b.y + 16 && overlap(mario, b)) {
        mario.y = b.y - mario.h;
        mario.vy = 0;
        mario.grounded = true;
        mario.coyote = 0.16;
      }
    }

    for (const item of level.pickups) {
      const zone = { x: item.x - 24, y: item.y - 240, w: item.w + 48, h: item.h + 240 };
      if (item.got || !overlap(mario, zone)) continue;
      item.got = true;
      if (size < 2) {
        applySize(size + 1, true);
        grewFromPickup = true;
        growPop = 1;
        burst(item.x + 18, item.y, "#ff8d7a");
        blip(640, 0.12);
        toast("You grew!");
      } else {
        burst(item.x + 18, item.y, "#ffe08a");
      }
    }

    if (bowser && !bowser.sit) {
      bowser.x += bowser.dir * 42 * dt;
      if (bowser.x < bowser.minX || bowser.x > bowser.maxX) {
        bowser.dir *= -1;
        bowser.x = Math.max(bowser.minX, Math.min(bowser.maxX, bowser.x));
      }
      bowser.y = G - bowser.h;
      if (bowser.flash > 0) bowser.flash -= dt;
      const parts = bowserParts();
      const feet = mario.y + mario.h;
      let onHead = mario.vy > 20 && feet < parts.head.y + parts.head.h * 0.8 && overlap(mario, parts.head);
      let onSpikes = mario.vy > 10 && feet < parts.spikes.y + parts.spikes.h * 0.85 && overlap(mario, parts.spikes);
      if (onHead && onSpikes) {
        const mx = mario.x + mario.w / 2;
        const headMid = parts.head.x + parts.head.w / 2;
        const spikeMid = parts.spikes.x + parts.spikes.w / 2;
        if (Math.abs(mx - spikeMid) + 8 < Math.abs(mx - headMid)) onHead = false;
        else onSpikes = false;
      }
      if ((onHead || onSpikes || overlap(mario, parts.body)) && bowser.flash <= 0 && invuln <= 0) {
        if (onHead) {
          bowser.hp -= 1;
          bowser.flash = 0.4;
          mario.vy = -340;
          mario.y = Math.min(mario.y, parts.head.y - mario.h);
          burst(parts.head.x + parts.head.w / 2, parts.head.y, "#ffe08a");
          blip(180, 0.1);
          if (bowser.hp <= 0) {
            bowser.sit = true;
            bowser.y = G - 70;
            flagPop = 1;
            toast("To the flag!");
            blip(660, 0.15);
          }
        } else if (onSpikes) {
          takeDamage();
          mario.vy = -320;
          mario.y = Math.min(mario.y, parts.spikes.y - mario.h - 4);
          const back = mario.x + mario.w / 2 < bowser.x + bowser.w / 2 ? -76 : 76;
          mario.x = Math.max(0, Math.min(worldWidth() - mario.w, mario.x + back));
          invuln = 0.55;
          oops = 0.7;
          toast("Ow!");
          blip(160, 0.12);
        } else {
          takeDamage();
          const back = mario.x + mario.w / 2 < bowser.x + bowser.w / 2 ? -70 : 70;
          mario.x = Math.max(0, Math.min(worldWidth() - mario.w, mario.x + back));
          mario.vy = -220;
          invuln = 0.45;
          oops = 0.6;
          toast("Oops!");
          blip(200, 0.1);
        }
      }
    }

    for (const e of level.enemies) {
      if (e.gone) continue;
      e.x += e.dir * e.speed * dt;
      if (e.x < e.minX || e.x > e.maxX) {
        e.dir *= -1;
        e.x = Math.max(e.minX, Math.min(e.maxX, e.x));
      }
      e.y = e.floor - e.h;
      const head = { x: e.x - 4, y: e.y - 8, w: e.w + 8, h: 20 };
      const feet = mario.y + mario.h;
      const onHead = mario.vy > 10 && feet < e.y + 16 && overlap(mario, head);
      if ((onHead || overlap(mario, e)) && invuln <= 0) {
        if (onHead) {
          e.gone = true;
          stomped += 1;
          mario.vy = -340;
          mario.y = Math.min(mario.y, e.y - mario.h);
          burst(e.x + e.w / 2, e.y, "#e7b98a");
          toast("Bop!");
          blip(420, 0.08);
        } else {
          const back = mario.x + mario.w / 2 < e.x + e.w / 2 ? -60 : 60;
          mario.x = Math.max(0, Math.min(worldWidth() - mario.w, mario.x + back));
          mario.vy = -200;
          takeDamage();
          invuln = 0.4;
          oops = 0.5;
          toast("Oops!");
          blip(200, 0.08);
        }
      }
    }

    if (invuln <= 0) {
      for (const h of level.hazards) {
        if (overlap(mario, h)) {
          respawn();
          break;
        }
      }
    }

    if (flag.on && reachedFlag()) {
      if (bowser && !bowser.sit) {
        if (toastLife <= 0) toast("Jump on his head");
      } else {
        finishLevel();
      }
    }

    if (mode === "play" && mario.y > G + 180) respawn();

    if (mario.grounded && mode === "play") {
      const under = platformUnder();
      if (under) {
        const inset = 14;
        const safe = mario.x > under.x + inset && mario.x + mario.w < under.x + under.w - inset;
        const clear = !level.hazards.some((h) => overlap(mario, { x: h.x - 8, y: mario.y, w: h.w + 16, h: mario.h }));
        if (safe && clear) checkpoint = { x: mario.x, y: mario.y };
      }
    }

    if (oops > 0) oops -= dt;
    if (invuln > 0) invuln -= dt;
    if (healthFlash > 0) healthFlash -= dt;
    if (growPop > 0) growPop -= dt;
    if (flagPop > 0) flagPop -= dt;
    if (toastLife > 0) toastLife -= dt;
  }

  function platformUnder() {
    const cx = mario.x + mario.w / 2;
    const feet = mario.y + mario.h;
    let best = null;
    for (const p of level.platforms) {
      if (cx >= p.x && cx <= p.x + p.w && Math.abs(feet - p.y) < 6) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function reachedFlag() {
    const nearX = mario.x + mario.w > flag.x - 42 && mario.x < flag.x + 58;
    return nearX && mario.y < flag.y + 8;
  }

  function grantWings(block) {
    mario.wings = true;
    gotWings = true;
    burst(block.x + block.w / 2, block.y, "#ffe08a");
    blip(700, 0.14);
    toast("Wings!");
  }

  function takeDamage() {
    if (invuln > 0) return;
    health *= 0.7;
    healthFlash = 0.45;
  }

  function bowserParts() {
    const art = ART.bowser;
    const h = 118;
    const w = art ? h * (art.width / art.height) : bowser.w;
    const cx = bowser.x + bowser.w / 2;
    const rect = { x: cx - w / 2, y: G + 4 - h, w: w, h: h };
    function part(x0, x1, y0, y1) {
      const left = bowser.dir < 0 ? 1 - x1 : x0;
      const right = bowser.dir < 0 ? 1 - x0 : x1;
      return {
        x: rect.x + left * rect.w,
        y: rect.y + y0 * rect.h,
        w: (right - left) * rect.w,
        h: (y1 - y0) * rect.h
      };
    }
    return {
      body: rect,
      head: part(0.58, 0.98, 0.02, 0.5),
      spikes: part(0.1, 0.58, 0, 0.36)
    };
  }

  function respawn() {
    takeDamage();
    mario.vx = 0;
    mario.vy = 0;
    mario.x = checkpoint.x;
    mario.y = checkpoint.y;
    const cx = mario.x + mario.w / 2;
    let stand = null;
    for (const p of level.platforms) {
      if (cx >= p.x && cx <= p.x + p.w) {
        const feet = checkpoint.y + mario.h;
        if (p.y >= feet - 40 && p.y <= feet + 80 && (!stand || p.y < stand.y)) stand = p;
      }
    }
    if (stand) mario.y = stand.y - mario.h;
    else {
      mario.x = spawn.x;
      mario.y = spawn.y;
    }
    falls += 1;
    oops = 0.9;
    invuln = 0.55;
    toast("Oops!");
    say("Oops, back a little.");
    burst(mario.x + mario.w / 2, mario.y + mario.h, "#cfe9ff");
    blip(210, 0.12);
  }

  function playNote() {
    const note = courseNote();
    if (!stomped) return note;
    const who = stomped === 1 ? "a little enemy" : "the little enemies";
    return note.replace(/\.$/, ", and bounced on " + who + ".");
  }

  function courseNote() {
    const who = levelStartSize === 0 ? "Baby Mario" : "Mario";
    const place = level.name;
    if (level.bowser) {
      const end = levelIndex === LEVELS.length - 1 ? "the last flag" : "the flag";
      if (falls && gotWings) return who + " used the gold wings, got set back a little, bounced on Bowser until he sat down, and touched " + end + ".";
      if (falls) return who + " got set back a little, bounced on Bowser until he sat down, and touched " + end + ".";
      if (gotWings) return who + " flew in with gold wings, bounced on Bowser until he sat down, and touched " + end + ".";
      return who + " bounced on Bowser until he sat down, and touched " + end + ".";
    }
    if (gotWings && falls && grewFromFlag) {
      return who + " got wings from the gold block, came back a little after a miss, touched the flag at " + place + ", and grew from its mushroom.";
    }
    if (gotWings && grewFromFlag) {
      return who + " hit the shiny gold block, flew to the flag at " + place + ", and grew from the mushroom there.";
    }
    if (gotWings && grewFromPickup && falls) {
      return who + " grew from a mushroom, flew with gold wings, got set back a little, and touched the flag at " + place + ".";
    }
    if (gotWings && grewFromPickup) {
      return who + " grew from a mushroom, hit the gold wing block, and flew to the flag at " + place + ".";
    }
    if (gotWings && falls) {
      return who + " got wings from the gold block, got set back a little, and still touched the flag at " + place + ".";
    }
    if (gotWings) return who + " hit the shiny gold block, flew to a new spot, and touched the flag at " + place + ".";
    if (falls && grewFromFlag) {
      return who + " missed a jump and came back a little, then touched the flag at " + place + " and grew from its mushroom.";
    }
    if (grewFromFlag) return who + " touched the flag at " + place + " and grew from the mushroom it shared.";
    if (grewFromPickup && falls) return who + " grew from a mushroom, got set back a little, and touched the flag at " + place + ".";
    if (grewFromPickup) return who + " grew from a mushroom and touched the flag at " + place + ".";
    if (falls) return who + " missed a jump, got set back a little, and then touched the flag at " + place + ".";
    return who + " jumped across " + place + " and touched the flag.";
  }

  function postPlay(note, seconds) {
    const body = {
      action: "play",
      designId: DESIGN_ID,
      reachedEnd: true,
      seconds: seconds,
      note: note
    };
    fetch("/api/design-studio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).catch(() => {});
  }

  function finishLevel() {
    if (mode !== "play") return;
    if (level.bowser && bowser && !bowser.sit) return;
    if (size === 0) {
      applySize(1, true);
      grewFromFlag = true;
      growPop = 1;
      burst(flag.x, flag.y - 40, "#ff8d7a");
    }
    const seconds = Math.max(0, Math.round((performance.now() - levelT0) / 1000));
    const note = playNote();
    postPlay(note, seconds);
    blip(523, 0.12);
    setTimeout(() => blip(659, 0.16), 90);
    burst(flag.x, flag.y - 80, "#fff");
    cleared = Math.max(cleared, levelIndex + 1);
    const last = levelIndex === LEVELS.length - 1;
    mode = last ? "win" : "cheer";
    document.body.dataset.mode = mode;
    showCard(last);
    say(note);
    clearTimeout(autoTimer);
    if (!last) autoTimer = setTimeout(nextLevel, 3200);
  }

  function showCard(win) {
    goldDemo.hidden = true;
    if (win) {
      cardTitle.textContent = "You did it!";
      cardBody.textContent = "Every flag is yours, and Bowser sat down.";
      goBtn.textContent = "Again";
    } else if (grewFromFlag) {
      cardTitle.textContent = "You grew!";
      cardBody.textContent = "The flag shared a mushroom.";
      goBtn.textContent = "Next";
    } else {
      cardTitle.textContent = "Flag!";
      cardBody.textContent = "You touched the flag.";
      goBtn.textContent = "Next";
    }
    overlay.classList.add("show");
    updateHud();
  }

  function hideCard() {
    overlay.classList.remove("show");
  }

  function showTitle() {
    mode = "title";
    document.body.dataset.mode = "title";
    level = cloneLevel(0);
    applySize(0, false);
    const spec = SIZES[0];
    mario = {
      x: 80, y: G - spec.h, w: spec.w, h: spec.h,
      vx: 0, vy: 0, facing: 1, size: 0, wings: false, grounded: true
    };
    flag = { x: level.flagX, y: G, on: true };
    bowser = null;
    goldDemo.hidden = false;
    cardTitle.textContent = "Mario Super World";
    cardBody.textContent = "Hit the shiny gold block. Wings let you fly to the flag.";
    goBtn.textContent = "Play";
    overlay.classList.add("show");
    levelNameEl.textContent = "Mario Super World";
    sizePill.textContent = "Baby";
    wingPill.hidden = true;
    jumpBtn.classList.remove("is-fly");
    jumpBtn.setAttribute("aria-label", "Jump");
  }

  function nextLevel() {
    clearTimeout(autoTimer);
    if (mode !== "cheer") return;
    if (levelIndex >= LEVELS.length - 1) return;
    levelIndex += 1;
    beginLevel();
  }

  function again() {
    clearTimeout(autoTimer);
    levelIndex = 0;
    size = 0;
    cleared = 0;
    health = 1;
    beginLevel();
  }

  function onGo() {
    startMusic();
    if (mode === "title") {
      levelIndex = 0;
      size = 0;
      cleared = 0;
      health = 1;
      beginLevel();
    } else if (mode === "cheer") nextLevel();
    else if (mode === "win") again();
  }

  function updateHud() {
    if (mode === "title") {
      levelNameEl.textContent = "Mario Super World";
    } else {
      levelNameEl.textContent = (levelIndex + 1) + " " + level.name;
    }
    sizePill.textContent = SIZES[size].label;
    const flying = mario && mario.wings && mode === "play";
    wingPill.hidden = !flying;
    jumpBtn.classList.toggle("is-fly", !!flying);
    jumpBtn.setAttribute("aria-label", flying ? "Fly" : "Jump");
    const shown = Math.max(health, 0.08);
    healthFill.style.width = (shown * 100) + "%";
    healthEl.classList.toggle("is-mid", health <= 0.55 && health > 0.22);
    healthEl.classList.toggle("is-low", health <= 0.22);
    healthEl.classList.toggle("is-hit", healthFlash > 0);
    healthEl.setAttribute("aria-valuenow", String(Math.max(1, Math.round(health * 100))));
  }

  function updateParticles(dt) {
    for (const p of particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 40 * dt;
    }
    particles = particles.filter((p) => p.life > 0);
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    view.cssW = Math.max(1, rect.width);
    view.cssH = Math.max(1, rect.height);
    view.dpr = dpr;
    canvas.width = Math.max(1, Math.round(view.cssW * dpr));
    canvas.height = Math.max(1, Math.round(view.cssH * dpr));
  }

  function camera() {
    const viewW = 360;
    if (view.cssW < 2 || view.cssH < 2) {
      return { camX: 0, camY: 0, scale: 1, viewW, viewH: 480 };
    }
    const scale = view.cssW / viewW;
    const viewH = view.cssH / scale;
    let camX = mario.x - viewW * 0.34;
    const maxX = Math.max(0, worldWidth() - viewW);
    if (camX < 0) camX = 0;
    if (camX > maxX) camX = maxX;
    let camY = G - viewH * 0.72;
    if (mario.y < camY + 70) camY = mario.y - 70;
    if (camY > G - viewH * 0.62) camY = G - viewH * 0.62;
    return { camX, camY, scale, viewW, viewH };
  }

  function draw() {
    const dpr = view.dpr;
    const cam = camera();
    const t = performance.now() / 1000;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    const colors = level ? level.sky : ["#b7e4fb", "#fff1d6"];
    sky.addColorStop(0, colors[0]);
    sky.addColorStop(1, colors[1]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(dpr * cam.scale, 0, 0, dpr * cam.scale, -cam.camX * cam.scale * dpr, -cam.camY * cam.scale * dpr);
    ctx.imageSmoothingEnabled = true;
    drawHills(t, cam);
    drawPonds();
    for (let i = 0; i < level.platforms.length; i++) drawPlatform(level.platforms[i], i);
    for (const m of level.movers) drawPlatform(m, 1);
    for (const h of level.hazards) drawHazard(h);
    for (const e of level.enemies) if (!e.gone) drawEnemy(e, t);
    for (const item of level.pickups) if (!item.got) drawMushroom(item.x, item.y + Math.sin(t * 3) * 2, item.w);
    for (const b of level.blocks) drawBlock(b, t);
    if (flag && flag.on) drawFlag(t);
    if (bowser) drawBowser(t);
    if (mario) drawMario(t);
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (toastLife > 0 && mario) {
      ctx.globalAlpha = Math.min(1, toastLife * 2);
      ctx.fillStyle = "#5c4636";
      ctx.font = "700 22px Trebuchet MS, Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(toastText, mario.x + mario.w / 2, mario.y - 18);
      ctx.globalAlpha = 1;
    }
    if (level && level.hint && mode === "play" && !gotWings) drawHint(t);
    if (level && level.bowser && mode === "play" && bowser && !bowser.sit && performance.now() - levelT0 < 2400) {
      ctx.fillStyle = "#5c4636";
      ctx.font = "700 20px Trebuchet MS, Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Jump on his head", 640, 150);
    }
  }

  function drawHills(t, cam) {
    ctx.save();
    ctx.translate(cam.camX * 0.4, 0);
    const hills = [];
    for (let x = -40; x < worldWidth() + 80; x += 340) hills.push({ x: x, c: "#c3e7b0" });
    if (ART.hill) {
      for (const h of hills) {
        const w = 300;
        const hh = w * (ART.hill.height / ART.hill.width);
        ctx.drawImage(ART.hill, h.x - 20, G - hh + 48, w, hh);
      }
    } else {
      for (const h of hills) {
        ctx.fillStyle = h.c;
        ctx.beginPath();
        ctx.ellipse(h.x, G + 30, 220, 78, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.translate(cam.camX * 0.25, -20);
    for (let x = -80; x < worldWidth() + 200; x += 280) {
      drawCloud(x, 36 + ((x / 280) % 3) * 26, 0.9);
    }
    ctx.restore();
    void t;
  }

  function drawCloud(x, y, s) {
    if (ART.cloud) {
      const w = 110 * s;
      const h = w * (ART.cloud.height / ART.cloud.width);
      ctx.drawImage(ART.cloud, x - w / 2, y - h / 2, w, h);
      return;
    }
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.ellipse(x, y, 34 * s, 20 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 28 * s, y + 4, 26 * s, 16 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 26 * s, y + 6, 22 * s, 14 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPonds() {
    const grounds = level.platforms.filter((p) => p.y === G).slice().sort((a, b) => a.x - b.x);
    for (let i = 0; i < grounds.length - 1; i++) {
      const a = grounds[i];
      const b = grounds[i + 1];
      const x = a.x + a.w;
      const w = b.x - x;
      if (w < 8) continue;
      ctx.fillStyle = "#9edcf0";
      ctx.beginPath();
      ctx.ellipse(x + w / 2, G + 18, w / 2, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.ellipse(x + w * 0.4, G + 12, w * 0.18, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlatform(p, index) {
    if (ART.ground) {
      drawGroundSprite(p);
      if (p.w > 150 && p.y === G) {
        for (let k = 0; k < 2; k++) drawFlower(p.x + 36 + ((index * 47 + k * 80) % (p.w - 70)), p.y);
      }
      return;
    }
    const r = Math.min(16, p.h / 2);
    ctx.fillStyle = "#e7b98a";
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, p.h, r);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#6d5648";
    ctx.stroke();
    ctx.fillStyle = "#8ed18a";
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, Math.min(16, p.h), [r, r, 6, 6]);
    ctx.fill();
    if (p.w > 150 && p.y === G) {
      for (let k = 0; k < 2; k++) drawFlower(p.x + 36 + ((index * 47 + k * 80) % (p.w - 70)), p.y);
    }
  }

  function drawFlower(x, y) {
    if (ART.flower) {
      const h = 34;
      const w = h * (ART.flower.width / ART.flower.height);
      ctx.drawImage(ART.flower, x - w / 2, y - h + 4, w, h);
      return;
    }
    ctx.fillStyle = "#7dce7a";
    ctx.fillRect(x - 1.5, y - 10, 3, 10);
    ctx.fillStyle = "#ff9bb5";
    ctx.beginPath();
    ctx.arc(x, y - 12, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffe08a";
    ctx.beginPath();
    ctx.arc(x, y - 12, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBlock(b, t) {
    const y = b.y + Math.sin(t * 4 + b.x) * 2;
    const blockArt = b.used ? ART.blockUsed : ART.block;
    if (blockArt) {
      const pad = 10;
      ctx.drawImage(blockArt, b.x - pad, y - pad * 1.2, b.w + pad * 2.1, b.h + pad * 2);
      return;
    }
    ctx.beginPath();
    ctx.roundRect(b.x, y, b.w, b.h, 12);
    if (b.used) {
      ctx.fillStyle = "#f3e6cf";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#d7c4a4";
      ctx.stroke();
      return;
    }
    const g = ctx.createLinearGradient(b.x, y, b.x, y + b.h);
    g.addColorStop(0, "#fff6cc");
    g.addColorStop(0.45, "#ffcf4d");
    g.addColorStop(1, "#f0a322");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#e09a2e";
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.beginPath();
    ctx.ellipse(b.x + 16, y + 14, 10, 6, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8a4b12";
    ctx.font = "700 30px Trebuchet MS, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("!", b.x + b.w / 2, y + b.h / 2 + 1);
    ctx.textBaseline = "alphabetic";
  }

  function drawMushroom(x, y, w) {
    if (ART.mushroom) {
      const h = w * (ART.mushroom.height / ART.mushroom.width);
      ctx.drawImage(ART.mushroom, x, y, w, h);
      return;
    }
    ctx.fillStyle = "#fff6ea";
    ctx.beginPath();
    ctx.roundRect(x + w * 0.28, y + w * 0.42, w * 0.44, w * 0.5, 8);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#6d5648";
    ctx.stroke();
    ctx.fillStyle = "#ef5d52";
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + w * 0.4, w * 0.48, w * 0.32, 0, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x + w * 0.38, y + w * 0.28, 4, 0, Math.PI * 2);
    ctx.arc(x + w * 0.62, y + w * 0.32, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHazard(h) {
    if (ART.prickle) {
      const ih = 30;
      const iw = ih * (ART.prickle.width / ART.prickle.height);
      const step = Math.max(12, iw * 0.72);
      for (let x = h.x; x < h.x + h.w - 6; x += step) {
        ctx.drawImage(ART.prickle, x, h.y - 10, Math.min(iw, h.x + h.w - x), ih);
      }
      return;
    }
    ctx.fillStyle = "#7dce7a";
    ctx.strokeStyle = "#6d5648";
    ctx.lineWidth = 2;
    for (let x = h.x + 8; x < h.x + h.w; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x - 6, h.y + h.h);
      ctx.lineTo(x, h.y);
      ctx.lineTo(x + 6, h.y + h.h);
      ctx.fill();
      ctx.stroke();
    }
  }

  function drawEnemy(e, t) {
    const bob = Math.sin(t * 8 + e.x) * 1.5;
    if (ART.enemy) {
      const h = e.h + 10;
      const w = h * (ART.enemy.width / ART.enemy.height);
      ctx.save();
      ctx.translate(e.x + e.w / 2, e.y + e.h + bob);
      if (e.dir < 0) ctx.scale(-1, 1);
      ctx.drawImage(ART.enemy, -w / 2, -h, w, h);
      ctx.restore();
      return;
    }
    ctx.fillStyle = "#c48a52";
    ctx.beginPath();
    ctx.ellipse(e.x + e.w / 2, e.y + e.h / 2 + bob, e.w / 2, e.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFlag(t) {
    const rise = flagPop > 0 ? (flagPop / 1) * 30 : 0;
    const x = flag.x;
    const y = flag.y + rise;
    if (ART.flag) {
      const h = 228;
      const w = h * (ART.flag.width / ART.flag.height);
      const wave = 1 + Math.sin(t * 4) * 0.03;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(wave, 1);
      ctx.drawImage(ART.flag, -w * 0.14, -h, w, h);
      ctx.restore();
      if (grewFromFlag && mode !== "play") drawMushroom(x + 16, y - 210, 36);
      return;
    }
    ctx.strokeStyle = "#f7f1e4";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 210);
    ctx.stroke();
    ctx.fillStyle = "#ffcf4d";
    ctx.beginPath();
    ctx.arc(x, y - 214, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#e0b45a";
    ctx.lineWidth = 3;
    ctx.stroke();
    const wave = Math.sin(t * 4) * 6;
    ctx.fillStyle = "#8fd0ef";
    ctx.beginPath();
    ctx.moveTo(x + 3, y - 200);
    ctx.quadraticCurveTo(x + 34, y - 188 + wave, x + 46, y - 176);
    ctx.quadraticCurveTo(x + 30, y - 168, x + 3, y - 158);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#6d5648";
    ctx.stroke();
    if (grewFromFlag && mode !== "play") drawMushroom(x + 16, y - 210, 36);
  }

  function drawBowser(t) {
    const b = bowser;
    const art = b.sit ? (ART.bowserSit || ART.bowser) : ART.bowser;
    if (art) {
      const h = b.sit ? 132 : 118;
      const w = h * (art.width / art.height);
      ctx.save();
      ctx.translate(b.x + b.w / 2, G + 4);
      if (b.dir < 0) ctx.scale(-1, 1);
      if (!b.sit && b.flash > 0 && Math.floor(b.flash * 12) % 2 === 0) ctx.globalAlpha = 0.55;
      ctx.drawImage(art, -w / 2, -h, w, h);
      ctx.restore();
      if (!b.sit) {
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(b.x + 20 + i * 16, b.y - 18, 6, 0, Math.PI * 2);
          ctx.fillStyle = i < b.hp ? "#ff9b8a" : "#f3e6cf";
          ctx.fill();
          ctx.strokeStyle = "#6d5648";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      void t;
      return;
    }
    const sit = b.sit ? 16 : 0;
    const x = b.x;
    const y = b.y + sit;
    const flash = b.flash > 0 && Math.floor(b.flash * 12) % 2 === 0;
    ctx.save();
    ctx.translate(x + b.w / 2, y + b.h);
    if (b.dir < 0) ctx.scale(-1, 1);
    ctx.translate(-(b.w / 2), -b.h);
    const body = flash ? "#fff6ea" : "#7dce7a";
    ctx.fillStyle = "#5eae62";
    ctx.beginPath();
    ctx.ellipse(b.w * 0.55, b.h * 0.62, b.w * 0.42, b.h * 0.36, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#6d5648";
    ctx.stroke();
    ctx.fillStyle = "#f0c14a";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(b.w * 0.4 + i * 16, b.h * 0.4, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(b.w * 0.42, b.h * 0.48, b.w * 0.32, b.h * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffe7c2";
    ctx.beginPath();
    ctx.ellipse(b.w * 0.4, b.h * 0.58, 16, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(b.w * 0.62, b.h * 0.28, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f0c14a";
    ctx.beginPath();
    ctx.arc(b.w * 0.48, b.h * 0.12, 6, 0, Math.PI * 2);
    ctx.arc(b.w * 0.74, b.h * 0.1, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(b.w * 0.54, b.h * 0.28, 6, 0, Math.PI * 2);
    ctx.arc(b.w * 0.7, b.h * 0.28, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5c4636";
    ctx.beginPath();
    if (b.sit) {
      ctx.arc(b.w * 0.54, b.h * 0.3, 2, 0, Math.PI * 2);
      ctx.arc(b.w * 0.7, b.h * 0.3, 2, 0, Math.PI * 2);
    } else {
      ctx.arc(b.w * 0.55, b.h * 0.28, 3, 0, Math.PI * 2);
      ctx.arc(b.w * 0.71, b.h * 0.28, 3, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.strokeStyle = "#c47a62";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(b.w * 0.62, b.h * 0.36, 6, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.restore();
    if (!b.sit) {
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(b.x + 20 + i * 16, b.y - 14, 6, 0, Math.PI * 2);
        ctx.fillStyle = i < b.hp ? "#ff9b8a" : "#f3e6cf";
        ctx.fill();
        ctx.strokeStyle = "#6d5648";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    void t;
  }

  function heroFrame(t) {
    const running = mode === "play" && mario.grounded && Math.abs(mario.vx) > 8;
    if (mode === "play" && !mario.grounded) return 6;
    if (!running) return 0;
    return Math.floor(t * 10) % 16;
  }

  function drawMarioSprite(t, sprite, sheet) {
    const m = mario;
    const pop = 1 + Math.max(0, growPop) * 0.18;
    const bob = mode !== "play" ? Math.sin(t * 3) * 2 : 0;
    const cx = m.x + m.w / 2;
    const foot = m.y + m.h + bob;
    const frameH = sheet ? sheet.height / 4 : sprite.height;
    const frameW = sheet ? sheet.width / 4 : sprite.width;
    const h = m.h * 1.16;
    const w = h * (frameW / frameH);
    ctx.save();
    ctx.translate(cx, foot);
    ctx.scale(pop, pop);
    if (oops > 0.6) ctx.rotate(-0.08);
    ctx.fillStyle = "rgba(109, 86, 72, 0.18)";
    ctx.beginPath();
    ctx.ellipse(0, 2, m.w * 0.42, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    if (m.facing < 0) ctx.scale(-1, 1);
    if (m.wings && ART.wings) {
      const flap = 1 + Math.sin(t * 14) * 0.08;
      const ww = Math.max(m.w * 2.5, h * 1.15);
      const wh = ww * (ART.wings.height / ART.wings.width);
      ctx.save();
      ctx.translate(0, -h * 0.62);
      ctx.scale(1, flap);
      ctx.drawImage(ART.wings, -ww / 2, -wh / 2, ww, wh);
      ctx.restore();
    }
    if (sheet) {
      const frame = heroFrame(t);
      const sx = (frame % 4) * frameW;
      const sy = Math.floor(frame / 4) * frameH;
      ctx.drawImage(sheet, sx, sy, frameW, frameH, -w / 2, -h, w, h);
    } else {
      const step = Math.abs(m.vx) > 8 ? Math.sin(t * 12) * 1.5 : 0;
      ctx.drawImage(sprite, -w / 2, -h + step, w, h);
    }
    ctx.restore();
  }

  function drawMario(t) {
    const m = mario;
    const blink = invuln > 0 && Math.floor(t * 12) % 2 === 0;
    if (blink) return;
    const sheet = m.size >= 2 ? ART.bigRun : m.size === 1 ? ART.kidRun : ART.babyRun;
    const sprite = m.size >= 2 ? ART.big : m.size === 1 ? ART.kid : ART.baby;
    if (sheet || sprite) {
      drawMarioSprite(t, sprite, sheet);
      return;
    }
    const pop = 1 + Math.max(0, growPop) * 0.18;
    const bob = mode !== "play" ? Math.sin(t * 3) * 2 : 0;
    const cx = m.x + m.w / 2;
    const foot = m.y + m.h + bob;
    ctx.save();
    ctx.translate(cx, foot);
    ctx.scale(pop, pop);
    if (oops > 0.6) ctx.rotate(-0.08);
    ctx.fillStyle = "rgba(109, 86, 72, 0.18)";
    ctx.beginPath();
    ctx.ellipse(0, 2, m.w * 0.42, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    if (m.facing < 0) ctx.scale(-1, 1);

    if (m.wings) {
      const flap = Math.sin(t * 14) * 0.45;
      ctx.save();
      ctx.translate(0, -m.h * 0.58);
      ctx.fillStyle = "#fff4c8";
      ctx.strokeStyle = "#e0b15a";
      ctx.lineWidth = 3;
      ctx.save();
      ctx.rotate(-0.9 + flap);
      ctx.beginPath();
      ctx.ellipse(-16, 0, 22, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.rotate(0.9 - flap);
      ctx.beginPath();
      ctx.ellipse(16, 0, 22, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.restore();
    }

    const walk = Math.sin(t * 12) * (Math.abs(m.vx) > 8 ? 1 : 0);
    const headR = m.size === 0 ? m.h * 0.36 : m.size === 1 ? m.h * 0.3 : m.h * 0.26;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#6d5648";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.fillStyle = "#5c4033";
    ctx.beginPath();
    ctx.ellipse(-8, -6 + walk * 2, 7, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(8, -6 - walk * 2, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#3d7edb";
    ctx.beginPath();
    ctx.roundRect(-m.w * 0.32, -m.h * 0.52, m.w * 0.64, m.h * 0.4, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ef5d52";
    ctx.beginPath();
    ctx.roundRect(-m.w * 0.28, -m.h * 0.62, m.w * 0.56, m.h * 0.28, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffd56a";
    ctx.beginPath();
    ctx.arc(-4, -m.h * 0.38, 2.2, 0, Math.PI * 2);
    ctx.arc(4, -m.h * 0.38, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffd0b5";
    ctx.beginPath();
    ctx.arc(-m.w * 0.42, -m.h * 0.48 + walk * 2, 5, 0, Math.PI * 2);
    ctx.arc(m.w * 0.34, -m.h * 0.5 - walk * 2, 5, 0, Math.PI * 2);
    ctx.fill();

    const headY = -m.h + headR + 2;
    ctx.fillStyle = "#ffd0b5";
    ctx.beginPath();
    ctx.arc(0, headY, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#5c4636";
    ctx.beginPath();
    ctx.arc(-headR * 0.32, headY - 1, m.size === 0 ? 2.4 : 2, 0, Math.PI * 2);
    ctx.arc(headR * 0.32, headY - 1, m.size === 0 ? 2.4 : 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-headR * 0.24, headY - 2.4, 1, 0, Math.PI * 2);
    ctx.arc(headR * 0.4, headY - 2.4, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff9b8a";
    ctx.beginPath();
    ctx.arc(-headR * 0.55, headY + 4, m.size === 0 ? 3.4 : 2.6, 0, Math.PI * 2);
    ctx.arc(headR * 0.55, headY + 4, m.size === 0 ? 3.4 : 2.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#c47a62";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, headY + 4, 5, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = "#e23d45";
    ctx.strokeStyle = "#6d5648";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, headY - headR * 0.42, headR * 0.92, headR * 0.5, 0, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(headR * 0.72, headY - headR * 0.28, headR * 0.34, headR * 0.14, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (m.size === 2) {
      ctx.fillStyle = "#6b4226";
      ctx.beginPath();
      ctx.ellipse(0, headY + 7, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawHint(t) {
    const block = level.blocks[0];
    if (!block || block.used) return;
    const y = block.y + block.h + 16 + Math.sin(t * 3) * 3;
    ctx.fillStyle = "#f0a322";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(block.x - 36 - (2 - i) * 14, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame(ts) {
    const dt = Math.min(0.033, lastTs ? (ts - lastTs) / 1000 : 0.016);
    lastTs = ts;
    try {
      if (mode === "play") update(dt);
      pumpMusic();
      updateParticles(dt);
      if (level && mario) draw();
      updateHud();
    } catch (err) {
      window.__mswError = String(err && err.stack || err);
    }
    requestAnimationFrame(frame);
  }

  function bindHold(button, key) {
    const pointers = new Set();
    function sync(e, on) {
      if (on) pointers.add(e.pointerId);
      else pointers.delete(e.pointerId);
      const was = held[key];
      held[key] = pointers.size > 0;
      if (key === "jump" && held[key] && !was) queuedEdge = true;
    }
    function down(e) {
      e.preventDefault();
      try { button.setPointerCapture(e.pointerId); } catch (err) { /* already gone */ }
      sync(e, true);
    }
    function up(e) { sync(e, false); }
    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointercancel", up);
    button.addEventListener("lostpointercapture", up);
  }

  function bindKeys() {
    window.addEventListener("keydown", (e) => {
      if (e.repeat) return;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = true;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " ") {
        keys.jump = true;
        queuedEdge = true;
        if (mode === "play") e.preventDefault();
      }
      if (e.key === "Enter") onGo();
    });
    window.addEventListener("keyup", (e) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = false;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " ") keys.jump = false;
    });
  }

  function boot() {
    loadArt();
    loadMusic();
    resize();
    window.addEventListener("resize", resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
    bindHold(document.getElementById("left"), "left");
    bindHold(document.getElementById("right"), "right");
    bindHold(jumpBtn, "jump");
    bindKeys();
    goBtn.addEventListener("click", onGo);
    const shell = document.getElementById("shell");
    shell.addEventListener("selectstart", (e) => e.preventDefault());
    shell.addEventListener("dragstart", (e) => e.preventDefault());
    shell.addEventListener("contextmenu", (e) => e.preventDefault());
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    showTitle();
    requestAnimationFrame(frame);
  }

  window.__msw = {
    snapshot() {
      return {
        mode,
        levelIndex,
        levelName: level ? level.name : "",
        size,
        falls,
        gotWings,
        grewFromFlag,
        grewFromPickup,
        flagOn: flag ? flag.on : false,
        wings: mario ? !!mario.wings : false,
        mario: mario ? { x: mario.x, y: mario.y, w: mario.w, h: mario.h, vx: mario.vx, vy: mario.vy, grounded: mario.grounded } : null,
        checkpoint: { x: checkpoint.x, y: checkpoint.y },
        platforms: level ? level.platforms.map((p) => ({ x: p.x, y: p.y, w: p.w, h: p.h })) : [],
        blocks: level ? level.blocks.map((b) => ({ x: b.x, y: b.y, used: b.used })) : [],
        bowser: bowser ? { x: bowser.x, y: bowser.y, w: bowser.w, h: bowser.h, hp: bowser.hp, sit: bowser.sit } : null,
        levelCount: LEVELS.length,
        health,
        music: {
          ready: !!musicBuffer,
          duration: musicBuffer ? Math.round(musicBuffer.duration * 100) / 100 : 0,
          nextAt: Math.round(musicNextAt * 100) / 100,
          time: audioCtx ? Math.round(audioCtx.currentTime * 100) / 100 : 0,
          state: audioCtx ? audioCtx.state : "none",
          level: Math.round(musicLevel())
        },
        stomped,
        enemies: level ? level.enemies.filter((e) => !e.gone).map((e) => ({ x: Math.round(e.x), y: Math.round(e.y) })) : [],
        flag: flag ? { x: flag.x, y: flag.y, on: flag.on } : null,
        layout: LEVELS.map((L) => L.platforms.map((p) => [p.x, p.y, p.w, p.h]))
      };
    },
    setHolds(h) {
      held.left = !!h.left;
      held.right = !!h.right;
      if (h.jump && !held.jump) queuedEdge = true;
      held.jump = !!h.jump;
    },
    start: onGo,
    next: nextLevel,
    note: playNote,
    hurt() {
      invuln = 0;
      takeDamage();
      updateHud();
      return health;
    },
    goto(index) {
      levelIndex = Math.max(0, Math.min(LEVELS.length - 1, index | 0));
      beginLevel();
    }
  };

  boot();
})();
