(() => {
  "use strict";

  // Seven Christmas gifts. Legacy IDs preserve saved progress.
  const CANDIES = [
    {
      id: "swirl-pop",
      name: "Ruby Ribbon Gift",
      src: "assets/christmas/gift_0.svg"
    },
    {
      id: "candy-corn",
      name: "Evergreen Gift",
      src: "assets/christmas/gift_1.svg"
    },
    {
      id: "twist-pink",
      name: "Snowflake Gift",
      src: "assets/christmas/gift_2.svg"
    },
    {
      id: "gummy-bear",
      name: "Golden Gift",
      src: "assets/christmas/gift_3.svg"
    },
    {
      id: "chocolate-truffle",
      name: "Berry Gift",
      src: "assets/christmas/gift_4.svg"
    },
    {
      id: "twist-citrus",
      name: "Winter Blue Gift",
      src: "assets/christmas/gift_5.svg"
    },
    {
      id: "pumpkin-drop",
      name: "Candy Cane Gift",
      src: "assets/christmas/gift_6.svg"
    }
  ];

  // Christmas Village houses. sign: where the door's sign panel sits, as % of the image (center x, center y).
  // ratio is the picture's width / height, used as the door's aspect-ratio.
  // sign is the center of the plain door, as a percent of the picture.
  const HOUSE_LIST = [
    { src: "assets/christmas/cottage_0.png", ratio: "625 / 800", sign: [51, 68] },
    { src: "assets/christmas/cottage_1.png", ratio: "729 / 800", sign: [50, 74] },
    { src: "assets/christmas/cottage_2.png", ratio: "705 / 800", sign: [50, 72] }
  ];
  const HOUSES = HOUSE_LIST.map((h) => h.src);

  const GHOST_ASSETS = {
    normal: "assets/christmas/snowman_normal.png",
    happy: "assets/christmas/snowman_happy.png",
    wobble: "assets/christmas/snowman_wobble.png",
    missed: "assets/christmas/snowman_wobble.png"
  };

  // Each costume is a complete picture of Snowy dressed up; it replaces all three plain poses,
  // and the player's correct/missed animations carry the expression instead.
  // Unlocked in this order in Christmas Village. Ids are stored in saved progress, so keep them stable.
  const COSTUMES = [
    { id: "pumpkin-cap", name: "Santa Hat", spoken: "a Santa hat", src: "assets/christmas/outfit_elf.png" },
    { id: "witch-hat", name: "Christmas Sweater", spoken: "a Christmas sweater", src: "assets/christmas/outfit_winter.png" },
    { id: "cat-ears", name: "Reindeer", spoken: "a reindeer outfit", src: "assets/christmas/outfit_reindeer.png" },
    { id: "crown", name: "Gift Bow", spoken: "a gift bow", src: "assets/christmas/outfit_crown.png" },
    { id: "pirate-hat", name: "Candy Cane Scarf", spoken: "a candy cane scarf", src: "assets/christmas/outfit_scarf.png" },
    { id: "wizard-hat", name: "Star Cap", spoken: "a star cap", src: "assets/christmas/outfit_star.png" },
    { id: "top-hat", name: "Holly Top Hat", spoken: "a holly top hat", src: "assets/christmas/outfit_top.png" },
    { id: "bat-wings", name: "Earmuffs", spoken: "earmuffs", src: "assets/christmas/outfit_earmuffs.png" }
  ];

  let wornCostumeId = null;
  function setCostume(id) {
    wornCostumeId = COSTUMES.some((c) => c.id === id) ? id : null;
  }

  function getCandyItem(indexOrId) {
    if (typeof indexOrId === "number") {
      return CANDIES[Math.abs(indexOrId) % CANDIES.length];
    }
    return CANDIES.find((c) => c.id === indexOrId) || CANDIES[0];
  }

  function getCandySVG(indexOrId, size = 40) {
    const item = getCandyItem(indexOrId);
    return `<img class="candy-img candy-svg candy-svg-${item.id}" src="${item.src}" width="${size}" height="${size}" alt="${item.name}" draggable="false" />`;
  }

  function getRandomCandySVG(size = 40) {
    const idx = Math.floor(Math.random() * CANDIES.length);
    return getCandySVG(idx, size);
  }

  // Snowy the Snowman with expressive snowman states: normal, happy, and wobble,
  // wearing his current costume unless a costume id (or "none") is passed.
  function getGhostSVG(expression = "normal", size = 72, costumeId = wornCostumeId) {
    const costume = COSTUMES.find((c) => c.id === costumeId);
    const src = costume ? costume.src : (GHOST_ASSETS[expression] || GHOST_ASSETS.normal);
    const height = Math.round(size * 1.05);
    const label = costume ? `Snowy the Snowman dressed as ${costume.name}` : `Snowy the Snowman (${expression})`;
    return `<img class="ghost-img ghost-svg ghost-${expression}" src="${src}" width="${size}" height="${height}" alt="${label}" draggable="false" />`;
  }

  // Christmas gift sack for the in-game HUD
  function getPumpkinBucketSVG(size = 48) {
    const width = size;
    const height = Math.round(size * 1.08);
    return `<img class="pumpkin-bucket-img pumpkin-bucket-svg" src="assets/christmas/sack.png" width="${width}" height="${height}" alt="Christmas Gift Sack" draggable="false" />`;
  }

  // Gift-filled Christmas sack for the end screen
  function getPumpkinBucketOverflowSVG(size = 210) {
    const width = size;
    const height = Math.round(size * 1.12);
    return `<img class="pumpkin-bucket-overflow-img big-bucket-img" src="assets/christmas/sack_full.png" width="${width}" height="${height}" alt="Sack Full of Christmas Gifts" draggable="false" />`;
  }

  function getPumpkinBucketBackSVG(size = 154) {
    return getPumpkinBucketOverflowSVG(size);
  }

  function getPumpkinBucketFrontSVG() {
    return "";
  }

  // Preload the Christmas art before play.
  function preloadAllAssets() {
    const allUrls = [
      ...Object.values(GHOST_ASSETS),
      "assets/christmas/sack.png",
      "assets/christmas/sack_full.png",
      "assets/christmas/heart.svg",
      ...CANDIES.map(c => c.src),
      ...COSTUMES.map(c => c.src),
      ...HOUSES
    ];
    allUrls.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }

  preloadAllAssets();

  window.GHOST_CANDIES = {
    list: CANDIES,
    costumes: COSTUMES,
    houses: HOUSE_LIST,
    setCostume,
    getCandySVG,
    getRandomCandySVG,
    getGhostSVG,
    getPumpkinBucketSVG,
    getPumpkinBucketBackSVG,
    getPumpkinBucketFrontSVG,
    getPumpkinBucketOverflowSVG,
    preloadAllAssets
  };
})();
