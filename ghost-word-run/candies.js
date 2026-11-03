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
  const HOUSE_LIST = [
    { src: "assets/christmas/cottage_0.svg", ratio: 300 / 260, sign: [50.5, 72] },
    { src: "assets/christmas/cottage_1.svg", ratio: 300 / 260, sign: [50.5, 72] },
    { src: "assets/christmas/cottage_2.svg", ratio: 300 / 260, sign: [50.5, 72] }
  ];
  const HOUSES = HOUSE_LIST.map((h) => h.src);

  const GHOST_ASSETS = {
    normal: "assets/christmas/snowman_normal.svg",
    happy: "assets/christmas/snowman_happy.svg",
    wobble: "assets/christmas/snowman_wobble.svg",
    missed: "assets/christmas/snowman_wobble.svg"
  };

  // Each costume is a complete picture of Snowy dressed up; it replaces all three plain poses,
  // and the player's correct/missed animations carry the expression instead.
  // Unlocked in this order in Christmas Village. Ids are stored in saved progress, so keep them stable.
  const COSTUMES = [
    { id: "pumpkin-cap", name: "Elf Hat", spoken: "an elf hat outfit", src: "assets/christmas/outfit_elf.svg" },
    { id: "witch-hat", name: "Winter Knit", spoken: "a winter knit outfit", src: "assets/christmas/outfit_winter.svg" },
    { id: "cat-ears", name: "Reindeer", spoken: "a reindeer outfit", src: "assets/christmas/outfit_reindeer.svg" },
    { id: "crown", name: "Christmas Crown", spoken: "a Christmas crown outfit", src: "assets/christmas/outfit_crown.svg" },
    { id: "pirate-hat", name: "Festive Scarf", spoken: "a festive scarf outfit", src: "assets/christmas/outfit_scarf.svg" },
    { id: "wizard-hat", name: "Starlight Hat", spoken: "a starlight hat outfit", src: "assets/christmas/outfit_star.svg" },
    { id: "top-hat", name: "Snowman Top Hat", spoken: "a snowman top hat outfit", src: "assets/christmas/outfit_top.svg" },
    { id: "bat-wings", name: "Cozy Earmuffs", spoken: "a cozy earmuffs outfit", src: "assets/christmas/outfit_earmuffs.svg" }
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
    return `<img class="pumpkin-bucket-img pumpkin-bucket-svg" src="assets/christmas/sack.svg" width="${width}" height="${height}" alt="Christmas Gift Sack" draggable="false" />`;
  }

  // Gift-filled Christmas sack for the end screen
  function getPumpkinBucketOverflowSVG(size = 210) {
    const width = size;
    const height = Math.round(size * 1.12);
    return `<img class="pumpkin-bucket-overflow-img big-bucket-img" src="assets/christmas/sack_full.svg" width="${width}" height="${height}" alt="Sack Full of Christmas Gifts" draggable="false" />`;
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
      "assets/christmas/sack.svg",
      "assets/christmas/sack_full.svg",
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
