(() => {
  "use strict";

  const STORE_KEY = "mightyMini.ghostWordRun.v1";
  const MUSIC_STORE_KEY = "mightyMini.ghostWordRun.musicMuted";
  const content = window.GHOST_RUN_CONTENT;
  const category = content.categories[0];
  const candies = window.GHOST_CANDIES;

  const $ = (id) => document.getElementById(id);
  const screens = {
    home: $("homeScreen"),
    game: $("gameScreen"),
    end: $("endScreen"),
    street: $("streetScreen")
  };

  const levelSelect = $("levelSelect");
  const gameWorld = $("gameWorld");
  const rows = $("rows");
  const pickupsWrap = $("pickups");
  const player = $("player");
  const promptCard = $("promptCard");
  const targetWord = $("targetWord");
  const candyScore = $("candyScore");
  const feedback = $("feedback");
  const chancesTrack = $("chancesTrack");
  const chanceTokens = [ $("chance1"), $("chance2"), $("chance3"), $("chance4") ];
  const goalBadge = $("goalBadge");
  const powerBadge = $("powerBadge");
  const homeGhost = $("homeGhost");
  const pauseGhost = $("pauseGhost");
  const miniBucketBody = $("miniBucketBody");
  const bigBucketBack = $("bigBucketBack");
  const bigBucketFront = $("bigBucketFront");
  const musicButton = $("musicButton");
  const streetFeedback = $("streetFeedback");
  const streetWorld = $("streetWorld");
  const streetHouses = $("streetHouses");
  const streetBoo = $("streetBoo");
  const streetWord = $("streetWord");
  const streetTreats = $("streetTreats");
  const streetHint = $("streetHint");
  const prizeOverlay = $("prizeOverlay");
  const prizeTitle = $("prizeTitle");
  const prizeShow = $("prizeShow");
  const prizeName = $("prizeName");
  const closetModal = $("closetModal");
  const closetGrid = $("closetGrid");

  // A run earns Trick-or-Treat Street when it scores at least this share of the trail's best.
  const STREET_SCORE_SHARE = 0.9;
  // The visit's one costume hides behind a random correct door among the first few.
  const COSTUME_DOOR_MIN = 5;
  const COSTUME_DOOR_MAX = 10;

  // Costume powers. Each beats plain Boo by roughly 10-15% on average, and each is strongest for
  // a different kind of run, so the best pick depends on the trail. Keep the numbers in sync
  // with tools/balance_sim.py and re-run it after any change.
  const POWERS = {
    "pumpkin-cap": { name: "Harvest Bonus", text: "Every 5th right word adds 1 bonus candy.", tip: "Good on any trail.", harvestEvery: 5 },
    "witch-hat": { name: "Slow Spell", text: "The trail speeds up more slowly.", tip: "Best when the trail gets too fast.", ramp: 0.84 },
    "cat-ears": { name: "Nine Lives", text: "Start with 4 chances instead of 3.", tip: "Best on a new trail.", maxChances: 4 },
    "crown": { name: "Royal Riches", text: "5 right in a row earns 5 candies, but there is no 3-in-a-row bonus.", tip: "Best on trails you know well.", streakEvery: 5, streakPay: 5 },
    "pirate-hat": { name: "Treasure Hearts", text: "A heart caught when you have all your chances is worth 3 candies.", tip: "Best when you hardly ever miss.", fullHeartCandy: 3 },
    "wizard-hat": { name: "Magic Shield", text: "A shield blocks one miss. It comes back after 8 right words.", tip: "Best while you are learning the words.", shieldRecharge: 8 },
    "top-hat": { name: "Showtime", text: "On your last chance, every right word earns 2 extra candies.", tip: "Best for big comebacks.", lastChanceBonus: 2 },
    "bat-wings": { name: "Heart Radar", text: "Hearts are much easier to catch.", tip: "Best when you need hearts back.", catchReach: 0.32 }
  };
  const BASE_CATCH_REACH = 0.22;

  // Boo's neighborhood map: each house lights up when lifetime candy (runs + street treats)
  // reaches its number. Early houses come every run or two; later ones take a week of play.
  const MAP_HOUSES = [
    [10, "Pumpkin Cottage"], [25, "Bat Barn"], [50, "Moonbeam House"], [80, "Candy Corn Corner"],
    [120, "Spider Hollow"], [160, "Owl Tower"], [200, "Lollipop Lane"], [250, "Black Cat Inn"],
    [300, "Cauldron Cabin"], [375, "Gumdrop Garden"], [450, "Lantern Lodge"], [525, "Broomstick Barn"],
    [600, "Toffee Treehouse"], [700, "Skeleton Shack"], [800, "Caramel Castle"], [900, "Foggy Farmhouse"],
    [1000, "Witch's Workshop"], [1150, "Mummy Manor"], [1300, "Starlight Steeple"], [1500, "Grand Haunted Mansion"]
  ].map(([candy, name]) => ({ candy, name }));
  const housesLit = (totalCandy) => MAP_HOUSES.filter((house) => totalCandy >= house.candy).length;
  // Rounds at or past this count as "the trail got fast" when suggesting a costume.
  const FAST_ROUND = 20;

  // Trick-or-Treat Street visit; lives outside `state` because it starts after the run ends.
  let street = null;

  let state = null;
  let frameId = 0;
  let lastFrame = 0;
  let pointerActive = false;
  let lastClientX = null;  // Crossfade Music Player: Seamlessly loops with a 2-second overlap fade out/in
  class CrossfadeMusicPlayer {
    constructor(src, { targetVolume = 0.28, overlap = 2.0 } = {}) {
      this.src = src;
      this.targetVolume = targetVolume;
      this.overlap = overlap;
      this.muted = false;
      this.playing = false;

      this.deckA = new Audio(src);
      this.deckB = new Audio(src);
      this.deckA.preload = "auto";
      this.deckB.preload = "auto";

      this.activeDeck = this.deckA;
      this.nextDeck = this.deckB;
      this.crossfading = false;

      this.tick = this.tick.bind(this);
      this.deckA.addEventListener("timeupdate", this.tick);
      this.deckB.addEventListener("timeupdate", this.tick);
    }

    start() {
      this.playing = true;
      this.crossfading = false;
      this.nextDeck.pause();
      this.nextDeck.currentTime = 0;
      this.activeDeck.currentTime = 0;
      this.activeDeck.volume = this.muted ? 0 : this.targetVolume;
      this.activeDeck.play().catch(() => {});
    }

    pause() {
      this.playing = false;
      this.deckA.pause();
      this.deckB.pause();
    }

    resume() {
      if (this.muted) return;
      this.playing = true;
      this.activeDeck.play().catch(() => {});
    }

    stop() {
      this.playing = false;
      this.crossfading = false;
      this.deckA.pause();
      this.deckA.currentTime = 0;
      this.deckB.pause();
      this.deckB.currentTime = 0;
    }

    setMuted(muted) {
      this.muted = muted;
      if (muted) {
        this.deckA.volume = 0;
        this.deckB.volume = 0;
      } else {
        this.activeDeck.volume = this.targetVolume;
        if (this.playing && this.activeDeck.paused) {
          this.activeDeck.play().catch(() => {});
        }
      }
    }

    toggleMute() {
      this.setMuted(!this.muted);
      return this.muted;
    }

    tick() {
      if (!this.playing || this.crossfading) return;
      const cur = this.activeDeck;
      if (!cur.duration || isNaN(cur.duration)) return;

      const timeLeft = cur.duration - cur.currentTime;
      // When 2 seconds remain, begin 2-second crossfade loop!
      if (timeLeft <= this.overlap && timeLeft > 0) {
        this.startCrossfade();
      }
    }

    startCrossfade() {
      this.crossfading = true;
      const outgoing = this.activeDeck;
      const incoming = this.nextDeck;

      incoming.currentTime = 0;
      incoming.volume = 0;
      incoming.play().catch(() => {});

      const startTime = performance.now();
      const durationMs = this.overlap * 1000;
      const targetVol = this.muted ? 0 : this.targetVolume;
      const startOutVol = outgoing.volume;

      const step = (now) => {
        if (!this.crossfading) return;
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);

        if (!this.muted) {
          outgoing.volume = Math.max(0, startOutVol * (1 - progress));
          incoming.volume = Math.min(targetVol, targetVol * progress);
        }

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          outgoing.pause();
          outgoing.currentTime = 0;
          outgoing.volume = 0;
          incoming.volume = targetVol;

          // Swap active and next decks
          this.activeDeck = incoming;
          this.nextDeck = outgoing;
          this.crossfading = false;
        }
      };

      requestAnimationFrame(step);
    }
  }

  const music = new CrossfadeMusicPlayer("trick-or-treat-fun.m4a", {
    targetVolume: 0.28,
    overlap: 2.0
  });

  const MUSIC_ON_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`;
  const MUSIC_OFF_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M4.27 3L3 4.27l9 9v.28c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4v-1.73l4.73 4.73c-.45.31-.96.53-1.52.66l1.52 1.52c1.02-.27 1.94-.74 2.72-1.37L19.73 21 21 19.73 4.27 3zM14 7h4V3h-6v4.73l2 2V7z"/></svg>`;

  const savedMuted = localStorage.getItem(MUSIC_STORE_KEY) === "true";
  if (savedMuted) music.setMuted(true);
  updateMusicButtonUI();

  function updateMusicButtonUI() {
    if (!musicButton) return;
    musicButton.innerHTML = music.muted ? MUSIC_OFF_SVG : MUSIC_ON_SVG;
    musicButton.classList.toggle("muted", music.muted);
    musicButton.setAttribute("aria-label", music.muted ? "Unmute background music" : "Mute background music");
  }

  function toggleMusic() {
    const isMuted = music.toggleMute();
    localStorage.setItem(MUSIC_STORE_KEY, String(isMuted));
    updateMusicButtonUI();
  }

  // Initialize visual SVGs for cute ghost and jack-o'-lantern buckets
  if (candies) {
    candies.setCostume(loadSaved().wearing);
    if (homeGhost) homeGhost.innerHTML = candies.getGhostSVG("normal", 84);
    if (pauseGhost) pauseGhost.innerHTML = candies.getGhostSVG("normal", 78);
    if (player) player.innerHTML = candies.getGhostSVG("normal", 72);
    if (miniBucketBody) miniBucketBody.innerHTML = candies.getPumpkinBucketSVG(48);
    if (bigBucketBack) bigBucketBack.innerHTML = candies.getPumpkinBucketBackSVG(154);
    if (bigBucketFront) bigBucketFront.innerHTML = candies.getPumpkinBucketFrontSVG(154);
  }

  // Tricky Words: words this child asked Joyce about on the tablet, then words they
  // missed here, topped up to TRICKY_MIN with the next sight words not yet mastered.
  const TRICKY_MIN = 30;
  const trickyKid = window.MightyProgress?.currentKid?.().id || "unknown";
  const TRICKY_STORE_KEY = `mightyMini.ghostWordRun.tricky.${trickyKid}`;
  const sightSpelling = new Map((content.sightWords || []).map((word) => [word.toLowerCase(), word]));

  function trickyWords(data) {
    const words = [];
    const seen = new Set();
    const add = (raw) => {
      const key = String(raw || "").trim().toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      words.push(sightSpelling.get(key) || key);
    };
    (data?.trouble || []).forEach((entry) => add(entry?.word ?? entry));
    (data?.practice || []).forEach(add);
    const mastered = new Set((data?.mastered || []).map((word) => String(word).toLowerCase()));
    for (const word of content.sightWords || []) {
      if (words.length >= TRICKY_MIN) break;
      if (!mastered.has(word.toLowerCase())) add(word);
    }
    return words;
  }

  function savedTricky() {
    try { return JSON.parse(localStorage.getItem(TRICKY_STORE_KEY)); } catch (_) { return null; }
  }

  const trickyLevel = {
    id: "tricky-words",
    name: "Tricky Words",
    description: "Words to practice - up to 3 paths",
    minChoices: 2,
    maxChoices: 3,
    words: trickyWords(savedTricky())
  };
  category.levels.push(trickyLevel);

  async function refreshTricky() {
    if (trickyKid === "unknown" || !/^https?:$/.test(location.protocol)) return;
    try {
      const res = await fetch(`/api/trouble-words/${encodeURIComponent(trickyKid)}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data?.trouble)) return;
      localStorage.setItem(TRICKY_STORE_KEY, JSON.stringify(data));
      trickyLevel.words = trickyWords(data);
    } catch (_) {
      // Offline: keep the last list this tablet saw.
    }
  }
  refreshTricky();

  category.levels.forEach((level) => {
    const option = document.createElement("option");
    option.value = level.id;
    option.textContent = `${level.name} - ${level.description}`;
    levelSelect.appendChild(option);
  });

  function shuffle(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function showScreen(name) {
    Object.entries(screens).forEach(([key, screen]) => screen.classList.toggle("hidden", key !== name));
    if (name === "home") updateHomeInfo();
  }

  function selectedLevel() {
    return category.levels.find((level) => level.id === levelSelect.value) || category.levels[0];
  }

  function ensureTargets(minimumAhead = 6) {
    if (!state) return;
    while (state.targets.length < state.nextSpawnIndex + minimumAhead) {
      state.targets.push(...shuffle(state.level.words));
    }
  }

  const soundAlikeGroups = content.soundAlikeGroups || [];
  function soundsAlike(a, b) {
    return soundAlikeGroups.some((group) => group.includes(a) && group.includes(b));
  }

  function choicesFor(target, count, level) {
    const picked = [target];
    for (const word of shuffle(level.words)) {
      if (picked.length >= count) break;
      if (picked.some((existing) => existing === word || soundsAlike(existing, word))) continue;
      picked.push(word);
    }
    return shuffle(picked);
  }

  function updateChancesHUD(restoredIndex = -1) {
    if (!state) return;
    const chancesLeft = Math.max(0, Math.min(state.maxChances, state.chances));
    chancesTrack.setAttribute("aria-label", `${chancesLeft} chances left`);
    chanceTokens.forEach((token, index) => {
      if (!token) return;
      token.classList.toggle("hidden", index >= state.maxChances);
      const isActive = index < chancesLeft;
      token.classList.toggle("active", isActive);
      token.classList.toggle("lost", !isActive);
      token.classList.toggle("warning", chancesLeft === 1 && index === 0);
      if (index === restoredIndex) {
        token.classList.remove("restored");
        void token.offsetWidth;
        token.classList.add("restored");
      }
    });
  }

  function startGame() {
    const level = selectedLevel();
    const saved = loadSaved();
    const power = POWERS[saved.wearing] || {};
    const best = saved.bestByLevel[level.id] || 0;
    state = {
      level,
      power,
      goal: Math.max(1, Math.ceil(best * STREET_SCORE_SHARE)),
      goalReached: false,
      targets: shuffle(level.words),
      round: 0,
      candy: 0,
      displayedCandy: 0,
      streak: 0,
      correctTotal: 0,
      chances: power.maxChances || 3,
      maxChances: power.maxChances || 3,
      chancesLost: 0,
      shield: Boolean(power.shieldRecharge),
      shieldCount: 0,
      powerCandy: 0,
      shieldSaves: 0,
      heartsCaught: 0,
      missRounds: [],
      totalMisses: 0,
      playerX: 0.5,
      rows: [],
      pickups: [],
      nextSpawnIndex: 0,
      lastPickupSpawnRound: -2,
      startTime: performance.now(),
      paused: false,
      running: true,
      finishAt: 0
    };

    ensureTargets(8);

    rows.replaceChildren();
    if (pickupsWrap) pickupsWrap.replaceChildren();
    player.style.left = "calc(50% - 36px)";
    player.style.setProperty("--ghost-tilt", "0deg");
    player.classList.remove("correct", "missed");
    if (candies) player.innerHTML = candies.getGhostSVG("normal", 72);

    candyScore.textContent = "0";
    $("bucketCandies").replaceChildren();
    updateChancesHUD();
    goalBadge.classList.remove("reached");
    updateRunBadges();

    $("dragHint").style.display = "";
    $("pauseOverlay").classList.add("hidden");
    showScreen("game");

    music.start();

    spawnRow(0);
    state.rows[0].y = 95;
    state.rows[0].element.style.transform = "translateY(95px)";
    announceTarget(state.rows[0].target);
    state.rows[0].announced = true;

    lastFrame = performance.now();
    cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(tick);
  }

  function spawnRow(roundIndex) {
    ensureTargets(6);
    const target = state.targets[roundIndex];

    // Gradually ramp choice count based on round number if level allows
    const range = state.level.maxChoices - state.level.minChoices;
    const choiceCount = state.level.minChoices + Math.min(range, Math.floor(roundIndex / 6));
    const choices = choicesFor(target, choiceCount, state.level);

    const row = document.createElement("div");
    row.className = "word-row";
    row.style.gridTemplateColumns = `repeat(${choiceCount}, minmax(0, 1fr))`;

    choices.forEach((word, choiceIdx) => {
      const gate = document.createElement("div");
      gate.className = "word-gate";
      gate.dataset.word = word;
      const candyIdx = (roundIndex * 3 + choiceIdx) % (candies ? candies.list.length : 7);
      gate.dataset.candyIdx = String(candyIdx);

      const candySvg = candies ? candies.getCandySVG(candyIdx, 44) : "";
      gate.innerHTML = `
        <div class="gate-candy-wrap">${candySvg}</div>
        <span class="gate-word">${word}</span>
      `;
      row.appendChild(gate);
    });

    rows.appendChild(row);
    state.rows.push({
      element: row,
      choices,
      target,
      y: 0,
      roundIndex,
      resolved: false,
      announced: false
    });
    state.nextSpawnIndex = roundIndex + 1;

    // Periodically spawn a small chance restore pickup between word rows:
    // If the player has missed chances (< 3), offer a lifeline every 2-3 rows.
    // If at full chances, offer a heart candy bonus every 4-5 rows.
    if (roundIndex >= 1) {
      const needsLifeline = state.chances < state.maxChances;
      const roundsSincePickup = roundIndex - state.lastPickupSpawnRound;
      const shouldSpawnPickup = (needsLifeline && roundsSincePickup >= 2) || (roundsSincePickup >= 4);

      if (shouldSpawnPickup) {
        state.lastPickupSpawnRound = roundIndex;
        // Position pickup between previous row and this row
        const prevRow = state.rows[state.rows.length - 2];
        const prevY = prevRow ? prevRow.y : 95;
        const pickupY = (prevY + 0) / 2;
        const laneNorms = [0.2, 0.5, 0.8];
        const xNorm = laneNorms[Math.floor(Math.random() * laneNorms.length)];
        spawnChancePickup(pickupY, xNorm);
      }
    }
  }

  function spawnChancePickup(y, xNorm) {
    if (!pickupsWrap) return;
    const pickup = document.createElement("div");
    pickup.className = "trail-pickup";
    pickup.style.left = `${xNorm * 100}%`;
    pickup.style.transform = `translate(-50%, ${y}px)`;
    pickup.innerHTML = `
      <span class="pickup-glow"></span>
      <img class="pickup-img" src="assets/candy_heart_restore.png" width="48" height="42" alt="Restore Chance Heart" draggable="false" />
    `;
    pickupsWrap.appendChild(pickup);
    state.pickups.push({
      element: pickup,
      y,
      xNorm,
      resolved: false
    });
  }

  function collectPickup(pickup) {
    makeSparkBurst(pickup.element);
    playRestoreChime();
    state.heartsCaught += 1;

    if (state.chances < state.maxChances) {
      const restoredIndex = state.chances;
      state.chances = Math.min(state.maxChances, state.chances + 1);
      updateChancesHUD(restoredIndex);
      showFeedback("+1 chance back!");
    } else {
      const bonus = state.power.fullHeartCandy || 1;
      state.powerCandy += bonus - 1;
      state.candy += bonus;
      state.displayedCandy += bonus;
      candyScore.textContent = String(state.displayedCandy);
      showFeedback(bonus > 1 ? `Treasure heart! +${bonus} candies!` : "Heart bonus! +1 candy!");
    }
    updateRunBadges();
  }

  function updateRunBadges() {
    if (!state) return;
    if (!state.goalReached && state.candy >= state.goal) {
      state.goalReached = true;
      goalBadge.classList.add("reached");
      playRestoreChime();
    }
    goalBadge.textContent = state.goalReached ? "Street unlocked!" : `Goal: ${state.goal}`;

    const p = state.power;
    let text = p.name || "";
    let ready = false;
    if (p.shieldRecharge) {
      ready = state.shield;
      text = state.shield ? "Shield ready" : `Shield back in ${p.shieldRecharge - state.shieldCount}`;
    } else if (p.harvestEvery) {
      const left = p.harvestEvery - (state.correctTotal % p.harvestEvery);
      ready = left === 1;
      text = `Harvest in ${left}`;
    } else if (p.streakEvery) {
      ready = state.streak % p.streakEvery === p.streakEvery - 1;
      text = `Royal streak ${state.streak % p.streakEvery}/${p.streakEvery}`;
    } else if (p.lastChanceBonus) {
      ready = state.chances === 1;
      text = ready ? "Showtime is on!" : "Showtime: last chance";
    }
    powerBadge.textContent = text;
    powerBadge.classList.toggle("ready", ready);
    powerBadge.classList.toggle("hidden", !text);
  }

  function announceTarget(target) {
    targetWord.textContent = target;
    promptCard.setAttribute("aria-label", `Fly through the word ${target}`);
    speak(target);
  }

  // A thrown error must never kill the animation loop, or the trail silently empties
  function tick(now) {
    try {
      step(now);
    } catch (error) {
      console.error("Ghost Word Run frame error:", error);
      if (state?.running) frameId = requestAnimationFrame(tick);
    }
  }

  function step(now) {
    if (!state?.running) return;
    if (state.paused) {
      // Frozen time must not count toward the speed ramp.
      state.startTime += now - lastFrame;
      lastFrame = now;
      frameId = requestAnimationFrame(tick);
      return;
    }

    const elapsed = Math.min((now - lastFrame) / 1000, 0.04);
    lastFrame = now;
    const worldHeight = gameWorld.clientHeight;
    const playerCenterY = worldHeight - worldHeight * 0.13 - 42;

    // Tetris-like continual speed ramp: starts comfortable (145 px/s) and gradually
    // but continually accelerates as you survive more words and time, becoming blistering fast!
    const elapsedSeconds = (now - state.startTime) / 1000;
    const speed = 145 + (state.round * 9 + elapsedSeconds * 1.3) * (state.power.ramp || 1);

    state.rows.forEach((row) => {
      row.y += speed * elapsed;
      row.element.style.transform = `translateY(${row.y}px)`;
      const rowCenterY = -112 + row.y + 42;

      if (!row.announced && row.roundIndex === state.round && row.y >= 95) {
        announceTarget(row.target);
        row.announced = true;
      }

      if (rowCenterY >= playerCenterY && !row.resolved) {
        resolveRound(row);
      }
    });

    // Move pickups along with the trail speed and test collisions with Boo
    state.pickups.forEach((pickup) => {
      pickup.y += speed * elapsed;
      pickup.element.style.transform = `translate(-50%, ${pickup.y}px)`;

      if (!pickup.resolved && Math.abs(pickup.y - playerCenterY) <= 38) {
        if (Math.abs(pickup.xNorm - state.playerX) <= (state.power.catchReach || BASE_CATCH_REACH)) {
          pickup.resolved = true;
          collectPickup(pickup);
        }
      }
    });

    // Clean up passed or resolved pickups
    state.pickups = state.pickups.filter((pickup) => {
      if (pickup.resolved || pickup.y > worldHeight + 80) {
        pickup.element.remove();
        return false;
      }
      return true;
    });

    // Spawn new rows continuously as long as run is active
    if (!state.finishAt) {
      const newestRow = state.rows[state.rows.length - 1];
      // Adaptive row spacing gives human reaction time even as speed ramps continually
      const reactionTime = Math.max(1.35, 2.35 - Math.min(state.round, 30) * 0.025);
      // Spacing must stay below the visible trail height or rows get cleaned up before the next spawns
      const rowSpacing = Math.min(worldHeight * 0.9, Math.max(worldHeight * 0.6, speed * reactionTime));
      if (!newestRow || newestRow.y >= rowSpacing) {
        spawnRow(state.nextSpawnIndex);
      }
    }

    // Clean up passed rows
    state.rows = state.rows.filter((row) => {
      if (-112 + row.y > worldHeight + 110) {
        row.element.remove();
        return false;
      }
      return true;
    });

    // Finish when run ends (0 chances remaining)
    if (state.finishAt && now >= state.finishAt) {
      finishGame();
      return;
    }

    frameId = requestAnimationFrame(tick);
  }

  function resolveRound(row) {
    row.resolved = true;
    const selectedIndex = Math.min(row.choices.length - 1, Math.floor(state.playerX * row.choices.length));
    const selectedWord = row.choices[selectedIndex];
    const correct = selectedWord === row.target;
    window.MightyProgress?.log({
      game: "ghost-word-run",
      skill: `Sight words: ${state.level.name} (${state.level.description.split(" - ")[0]})`,
      item: row.target,
      correct,
      extra: correct ? undefined : { picked: selectedWord }
    });
    const selectedGate = row.element.children[selectedIndex];
    const candyIdx = Number(selectedGate?.dataset.candyIdx || 0);

    [...row.element.children].forEach((gate) => {
      gate.classList.add(gate.dataset.word === row.target ? "correct-gate" : "wrong-gate");
    });

    player.classList.remove("correct", "missed");
    void player.offsetWidth;

    if (correct) {
      const p = state.power;
      state.streak += 1;
      state.correctTotal += 1;
      const plainEarned = state.streak % 3 === 0 ? 2 : 1;
      const streakEvery = p.streakEvery || 3;
      const onStreak = state.streak % streakEvery === 0;
      let earned = onStreak ? (p.streakPay || 2) : 1;
      let message = onStreak
        ? `${p.streakEvery ? "Royal streak" : "Sweet streak"}! +${earned} candies!`
        : "Sweet! +1 candy!";
      if (p.lastChanceBonus && state.chances === 1) {
        earned += p.lastChanceBonus;
        message = `Showtime! +${earned} candies!`;
      }
      if (p.harvestEvery && state.correctTotal % p.harvestEvery === 0) {
        earned += 1;
        message = `Harvest bonus! +${earned} candies!`;
      }
      if (p.shieldRecharge && !state.shield && ++state.shieldCount >= p.shieldRecharge) {
        state.shield = true;
        state.shieldCount = 0;
        message = "Magic shield is back!";
      }
      state.powerCandy += earned - plainEarned;
      state.candy += earned;

      player.innerHTML = candies ? candies.getGhostSVG("happy", 72) : "";
      player.classList.add("correct");

      launchCandy(selectedGate, earned, candyIdx);
      makeSparkBurst(selectedGate);
      showFeedback(message);
      playTone(true);

      window.setTimeout(() => {
        if (state?.running) player.innerHTML = candies ? candies.getGhostSVG("normal", 72) : "";
      }, 550);
    } else {
      state.totalMisses += 1;
      state.missRounds.push(row.roundIndex);
      const shielded = state.shield;
      if (shielded) {
        // The shield keeps the chance and the streak; the word still comes back for practice.
        state.shield = false;
        state.shieldCount = 0;
        state.shieldSaves += 1;
      } else {
        state.chances -= 1;
        state.chancesLost += 1;
        state.streak = 0;
      }

      player.innerHTML = candies ? candies.getGhostSVG("wobble", 72) : "";
      player.classList.add("missed");
      playTone(false);
      updateChancesHUD();

      if (state.chances > 0) {
        if (shielded) showFeedback(`Shield saved you! (${row.target})`);
        else showFeedback(state.chances === 1 ? `Watch out! 1 chance left! (${row.target})` : `Oops! ${state.chances} chances left! (${row.target})`);
        // Re-queue the missed word 2-3 rows ahead for practice
        ensureTargets(6);
        const retryAt = Math.max(state.nextSpawnIndex, row.roundIndex + 2);
        state.targets[retryAt] = row.target;
      } else {
        // 0 chances remaining! End the run
        showFeedback("Out of chances! Great flying!");
        state.finishAt = performance.now() + 1050;
      }

      window.setTimeout(() => {
        if (state?.running && !state.finishAt) {
          player.innerHTML = candies ? candies.getGhostSVG("normal", 72) : "";
        }
      }, 550);
    }

    state.round += 1;
    updateRunBadges();
    window.setTimeout(() => player.classList.remove("correct", "missed"), 480);

    if (!state.finishAt) {
      const nextRow = state.rows.find((candidate) => !candidate.resolved && candidate.roundIndex === state.round);
      if (nextRow && nextRow.y >= 95 && !nextRow.announced) {
        announceTarget(nextRow.target);
        nextRow.announced = true;
      }
    }
  }

  // Trick-or-Treat Street: a reward visit after a run that scores within 90% of the trail's best.
  // It practices rhyming: Max hears a word and knocks on the door whose word rhymes with it.
  // He can knock as long as he likes; wrong doors cost nothing, and one correct door per visit
  // hides a new costume.
  const rhymeFamilies = content.rhymeFamilies || [];
  const pick = (items) => items[Math.floor(Math.random() * items.length)];

  function enterStreet() {
    const saved = loadSaved();
    saved.streetVisits += 1;
    localStorage.setItem(STORE_KEY, JSON.stringify(saved));
    const hasLockedCostume = candies?.costumes.some((c) => !saved.costumes.includes(c.id));
    street = {
      prompt: "",
      target: "",
      familyIndex: -1,
      busy: false,
      firstTry: true,
      knocks: 0,
      treats: 0,
      costumeAt: hasLockedCostume
        ? COSTUME_DOOR_MIN + Math.floor(Math.random() * (COSTUME_DOOR_MAX - COSTUME_DOOR_MIN + 1))
        : 0,
      costumeFound: false
    };
    streetTreats.textContent = "0";
    $("streetBucket").innerHTML = candies ? candies.getPumpkinBucketSVG(48) : "";
    streetBoo.innerHTML = candies ? candies.getGhostSVG("normal", 80) : "";
    streetBoo.style.left = "50%";
    updateStreetHint();
    showScreen("street");
    nextKnock();
  }

  function updateStreetHint() {
    streetHint.textContent = street.costumeAt && !street.costumeFound
      ? "A costume is hiding behind a rhyming door!"
      : "Find more rhymes for treats, or tap All done.";
  }

  function speakRhymePrompt() {
    if (street?.prompt) speak(`What rhymes with ${SPOKEN_AS[street.prompt] || street.prompt}?`);
  }

  function nextKnock() {
    let familyIndex = Math.floor(Math.random() * rhymeFamilies.length);
    if (familyIndex === street.familyIndex) familyIndex = (familyIndex + 1) % rhymeFamilies.length;
    const family = rhymeFamilies[familyIndex];
    const prompt = pick(family);
    const target = pick(family.filter((word) => word !== prompt && !soundsAlike(word, prompt)));

    const tooClose = (other) => (content.nearRhymes || []).some((group) =>
      group.some((word) => family.includes(word)) && group.some((word) => other.includes(word)));
    const otherFamilies = shuffle(rhymeFamilies.filter((other, index) => index !== familyIndex && !tooClose(other))).slice(0, 2);
    const doors = shuffle([target, ...otherFamilies.map(pick)]);
    Object.assign(street, { prompt, target, familyIndex, busy: false, firstTry: true });

    const houseArt = candies ? candies.houses : [];
    streetHouses.replaceChildren();
    doors.forEach((word, index) => {
      const art = houseArt[index % houseArt.length];
      const house = document.createElement("button");
      house.type = "button";
      house.className = "street-house";
      house.dataset.word = word;
      house.setAttribute("aria-label", `Door that says ${word}`);
      house.style.aspectRatio = `1 / ${art.ratio}`;
      house.innerHTML = `
        <img class="house-img" src="${art.src}" alt="" draggable="false" />
        <span class="door-word" style="left:${art.sign[0]}%;top:${art.sign[1]}%">${word}</span>
      `;
      house.addEventListener("click", () => knockOn(house));
      streetHouses.appendChild(house);
    });

    streetWord.textContent = prompt;
    speakRhymePrompt();
  }

  function moveStreetBoo(house) {
    const scene = streetWorld.getBoundingClientRect();
    const rect = house.getBoundingClientRect();
    streetBoo.style.left = `${((rect.left + rect.width / 2 - scene.left) / scene.width) * 100}%`;
  }

  function setStreetBoo(expression) {
    if (candies) streetBoo.innerHTML = candies.getGhostSVG(expression, 80);
  }

  function knockOn(house) {
    const visit = street;
    if (!visit || visit.busy) return;
    moveStreetBoo(house);

    if (house.dataset.word !== visit.target) {
      visit.firstTry = false;
      house.classList.remove("rattle");
      void house.offsetWidth;
      house.classList.add("rattle");
      playTone(false);
      showFeedback("Not this door!", streetFeedback);
      setStreetBoo("wobble");
      window.setTimeout(() => {
        if (street === visit) setStreetBoo("normal");
      }, 600);
      window.setTimeout(() => {
        if (street === visit && !visit.busy) speakRhymePrompt();
      }, 500);
      return;
    }

    visit.busy = true;
    visit.knocks += 1;
    window.MightyProgress?.log({
      game: "ghost-word-run",
      skill: "Rhyming (Trick-or-Treat Street)",
      item: `${visit.prompt} / ${visit.target}`,
      correct: visit.firstTry
    });
    speak(`${SPOKEN_AS[visit.prompt] || visit.prompt}, ${SPOKEN_AS[visit.target] || visit.target}!`);
    house.classList.add("opened");
    makeSparkBurst(house);
    playRestoreChime();
    setStreetBoo("happy");

    if (visit.costumeAt && !visit.costumeFound && visit.knocks >= visit.costumeAt) {
      visit.costumeFound = true;
      showFeedback("A costume!", streetFeedback);
      window.setTimeout(() => {
        if (street === visit) giveCostume();
      }, 1500);
      return;
    }

    const treat = visit.firstTry ? 2 : 1;
    addStreetTreats(treat, house);
    showFeedback(`Treat! +${treat}`, streetFeedback);
    window.setTimeout(() => {
      if (street !== visit) return;
      setStreetBoo("normal");
      nextKnock();
    }, 1500);
  }

  function addStreetTreats(amount, fromEl) {
    const saved = loadSaved();
    const litBefore = housesLit(saved.totalCandy);
    saved.totalCandy += amount;
    saved.doorsOpened += 1;
    localStorage.setItem(STORE_KEY, JSON.stringify(saved));
    if (housesLit(saved.totalCandy) > litBefore) {
      const house = MAP_HOUSES[housesLit(saved.totalCandy) - 1];
      window.setTimeout(() => showFeedback(`${house.name} lit up on Boo's map!`, streetFeedback), 700);
    }
    const visit = street;
    for (let i = 0; i < amount; i++) {
      window.setTimeout(() => {
        if (street !== visit) return;
        flyCandy(fromEl, $("streetBucket"), visit.knocks + i, () => {
          if (street !== visit) return;
          visit.treats += 1;
          streetTreats.textContent = String(visit.treats);
        });
      }, i * 130);
    }
  }

  function giveCostume() {
    const saved = loadSaved();
    const costume = candies.costumes.find((c) => !saved.costumes.includes(c.id));
    if (!costume) {
      closePrize();
      return;
    }
    saved.costumes.push(costume.id);
    saved.wearing = costume.id;
    localStorage.setItem(STORE_KEY, JSON.stringify(saved));
    candies.setCostume(costume.id);
    refreshBooArt();
    prizeTitle.textContent = "You found a costume!";
    prizeShow.innerHTML = candies.getGhostSVG("happy", 150);
    prizeName.textContent = costume.name;
    const power = POWERS[costume.id];
    $("prizePower").textContent = power ? `Power: ${power.name}. ${power.text}` : "";
    speak(`You got ${costume.spoken}!`);
    prizeOverlay.classList.remove("hidden");
  }

  function closePrize() {
    prizeOverlay.classList.add("hidden");
    if (!street) return;
    updateStreetHint();
    setStreetBoo("normal");
    nextKnock();
  }

  function leaveStreet() {
    street = null;
    streetHouses.replaceChildren();
    prizeOverlay.classList.add("hidden");
    clearTimeout(speakTimer);
    window.speechSynthesis?.cancel();
    music.stop();
    showScreen("home");
  }

  function refreshBooArt() {
    if (!candies) return;
    if (homeGhost) homeGhost.innerHTML = candies.getGhostSVG("normal", 84);
    if (pauseGhost) pauseGhost.innerHTML = candies.getGhostSVG("normal", 78);
    if (player) player.innerHTML = candies.getGhostSVG("normal", 72);
    if (street) setStreetBoo("normal");
    updateClosetCount();
    updateHomeInfo();
  }

  function launchCandy(gate, amount, baseCandyIdx = 0) {
    if (!gate) return;
    for (let i = 0; i < amount; i++) {
      window.setTimeout(() => {
        if (!state?.running) return;
        const currentCandyIdx = (baseCandyIdx + i) % (candies ? candies.list.length : 7);
        flyCandy(gate, $("miniBucket"), currentCandyIdx, () => {
          state.displayedCandy += 1;
          candyScore.textContent = String(state.displayedCandy);
          addCandyToBucket(currentCandyIdx);
        });
      }, i * 130);
    }
  }

  function flyCandy(fromEl, bucket, candyIdx, onLand) {
    const start = fromEl.getBoundingClientRect();
    const destination = bucket.getBoundingClientRect();
    const candy = document.createElement("div");
    candy.className = "flying-candy";
    candy.innerHTML = candies ? candies.getCandySVG(candyIdx % candies.list.length, 42) : "";
    candy.style.left = `${start.left + start.width / 2 - 21}px`;
    candy.style.top = `${start.top + start.height / 2 - 21}px`;
    document.body.appendChild(candy);

    const dx = destination.left + destination.width / 2 - (start.left + start.width / 2);
    const dy = destination.top + destination.height / 2 - (start.top + start.height / 2);
    const flight = candy.animate([
      { transform: "translate(0, 0) rotate(0) scale(.65)", opacity: 0 },
      { transform: "translate(0, -48px) rotate(140deg) scale(1.3)", opacity: 1, offset: .22 },
      { transform: `translate(${dx * .55}px, ${dy * .42 - 65}px) rotate(320deg) scale(1.05)`, opacity: 1, offset: .62 },
      { transform: `translate(${dx}px, ${dy}px) rotate(540deg) scale(.45)`, opacity: 1 }
    ], { duration: 640, easing: "cubic-bezier(.2,.75,.25,1)", fill: "forwards" });

    flight.finished.then(() => {
      candy.remove();
      onLand();
      bucket.classList.remove("bucket-pop");
      void bucket.offsetWidth;
      bucket.classList.add("bucket-pop");
    }).catch(() => candy.remove());
  }

  function addCandyToBucket(candyIdx = 0) {
    const fill = $("bucketCandies");
    const piece = document.createElement("span");
    piece.className = "bucket-candy";
    const positions = [
      { x: 3, r: -22, size: 21 },
      { x: 13, r: 4, size: 22 },
      { x: 23, r: 24, size: 20 },
      { x: 8, r: -12, size: 22 },
      { x: 18, r: 15, size: 21 },
      { x: -1, r: -30, size: 19 },
      { x: 27, r: 20, size: 21 }
    ];
    const pos = positions[(state.displayedCandy - 1) % positions.length];
    piece.style.setProperty("--candy-x", `${pos.x}px`);
    piece.style.setProperty("--candy-r", `${pos.r}deg`);
    piece.innerHTML = candies ? candies.getCandySVG(candyIdx, pos.size) : "";
    fill.appendChild(piece);
    while (fill.children.length > 7) fill.firstElementChild.remove();
  }

  function makeSparkBurst(gate) {
    if (!gate) return;
    const rect = gate.getBoundingClientRect();
    for (let i = 0; i < 10; i++) {
      const spark = document.createElement("span");
      const angle = (Math.PI * 2 * i) / 10;
      spark.className = "candy-spark";
      spark.style.left = `${rect.left + rect.width / 2}px`;
      spark.style.top = `${rect.top + rect.height / 2}px`;
      spark.style.setProperty("--spark-x", `${Math.cos(angle) * (48 + (i % 3) * 12)}px`);
      spark.style.setProperty("--spark-y", `${Math.sin(angle) * (42 + (i % 2) * 14)}px`);
      document.body.appendChild(spark);
      window.setTimeout(() => spark.remove(), 650);
    }
  }

  function showFeedback(message, target = feedback) {
    target.textContent = message;
    target.classList.remove("show");
    void target.offsetWidth;
    target.classList.add("show");
  }

  function setPlayerFromClientX(clientX) {
    if (!state?.running || state.paused) return;
    const rect = gameWorld.getBoundingClientRect();
    const edge = 38;
    const x = Math.max(edge, Math.min(rect.width - edge, clientX - rect.left));
    const prevX = state.playerX;
    state.playerX = x / rect.width;
    player.style.left = `${x - 36}px`;

    if (lastClientX !== null) {
      const delta = clientX - lastClientX;
      if (delta < -3) player.style.setProperty("--ghost-tilt", "-8deg");
      else if (delta > 3) player.style.setProperty("--ghost-tilt", "8deg");
      else player.style.setProperty("--ghost-tilt", "0deg");
    }
    lastClientX = clientX;
    $("dragHint").style.display = "none";
  }

  gameWorld.addEventListener("pointerdown", (event) => {
    pointerActive = true;
    lastClientX = event.clientX;
    gameWorld.setPointerCapture?.(event.pointerId);
    setPlayerFromClientX(event.clientX);
  });
  gameWorld.addEventListener("pointermove", (event) => {
    if (pointerActive) setPlayerFromClientX(event.clientX);
  });
  gameWorld.addEventListener("pointerup", () => {
    pointerActive = false;
    lastClientX = null;
    player.style.setProperty("--ghost-tilt", "0deg");
  });
  gameWorld.addEventListener("pointercancel", () => {
    pointerActive = false;
    lastClientX = null;
    player.style.setProperty("--ghost-tilt", "0deg");
  });

  window.addEventListener("keydown", (event) => {
    if (!state?.running || state.paused) return;
    const step = 0.12;
    if (event.key === "ArrowLeft") {
      state.playerX = Math.max(0.06, state.playerX - step);
      player.style.setProperty("--ghost-tilt", "-8deg");
      window.setTimeout(() => player.style.setProperty("--ghost-tilt", "0deg"), 200);
    } else if (event.key === "ArrowRight") {
      state.playerX = Math.min(0.94, state.playerX + step);
      player.style.setProperty("--ghost-tilt", "8deg");
      window.setTimeout(() => player.style.setProperty("--ghost-tilt", "0deg"), 200);
    } else return;
    player.style.left = `calc(${state.playerX * 100}% - 36px)`;
    $("dragHint").style.display = "none";
  });

  // Chrome's speech engine can wedge after many rapid cancel/speak cycles; resuming and
  // speaking on the next tick keeps it alive, and holding the utterance prevents early GC.
  // Some voices misread very short words on their own ("capital I", a clipped "nnn" for "an").
  const SPOKEN_AS = { I: "eye", an: "ann" };

  // Browsers default to their oldest, most robotic voice. Prefer the natural-sounding ones a
  // device has (Apple Premium/Enhanced, Edge Natural, Google), skip macOS novelty voices, and
  // let a grown-up override the pick from the help screen.
  const VOICE_STORE_KEY = "mightyMini.ghostWordRun.voice";
  const NOVELTY_VOICES = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley)\b/i;
  const failedVoices = new Set();
  let chosenVoice = null;

  function englishVoices() {
    if (!("speechSynthesis" in window)) return [];
    return speechSynthesis.getVoices().filter((v) => /^en([-_]|$)/i.test(v.lang) && !NOVELTY_VOICES.test(v.name));
  }

  function voiceScore(voice) {
    const name = voice.name;
    let score = 0;
    if (/premium/i.test(name)) score += 100;
    if (/natural|neural/i.test(name)) score += 90;
    if (/enhanced/i.test(name)) score += 80;
    if (/google/i.test(name)) score += 60;
    if (/\b(ava|zoe|samantha|allison|susan|evan|nathan|joelle|noelle|aria|jenny)\b/i.test(name)) score += 20;
    if (/^en[-_]us/i.test(voice.lang)) score += 15;
    if (voice.localService) score += 5;
    return score;
  }

  function pickVoice() {
    const voices = englishVoices().filter((v) => !failedVoices.has(v.name));
    const savedName = localStorage.getItem(VOICE_STORE_KEY);
    chosenVoice = voices.find((v) => v.name === savedName)
      || voices.slice().sort((a, b) => voiceScore(b) - voiceScore(a))[0]
      || null;
    renderVoiceSelect();
  }

  function renderVoiceSelect() {
    const select = $("voiceSelect");
    if (!select) return;
    const voices = englishVoices();
    const savedName = localStorage.getItem(VOICE_STORE_KEY);
    select.replaceChildren();
    const auto = document.createElement("option");
    auto.value = "";
    auto.textContent = `Best available${!savedName && chosenVoice ? ` (${chosenVoice.name})` : ""}`;
    select.appendChild(auto);
    voices.sort((a, b) => voiceScore(b) - voiceScore(a)).forEach((voice) => {
      const option = document.createElement("option");
      option.value = voice.name;
      option.textContent = `${voice.name} (${voice.lang})`;
      select.appendChild(option);
    });
    select.value = savedName && voices.some((v) => v.name === savedName) ? savedName : "";
  }

  if ("speechSynthesis" in window) {
    pickVoice();
    speechSynthesis.addEventListener?.("voiceschanged", pickVoice);
  }

  let currentUtterance = null;
  let speakTimer = 0;
  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    speechSynthesis.resume();
    clearTimeout(speakTimer);
    speakTimer = window.setTimeout(() => {
      if (!chosenVoice) pickVoice();
      const utterance = new SpeechSynthesisUtterance(SPOKEN_AS[text] || text);
      const voice = chosenVoice;
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }
      utterance.rate = 0.75;
      utterance.pitch = 1;
      // Online-only voices (Google, Edge Natural) fail without a connection; fall back to an on-device one.
      utterance.onerror = (event) => {
        if (!voice || voice.localService || event.error === "interrupted" || event.error === "canceled") return;
        failedVoices.add(voice.name);
        pickVoice();
        if (chosenVoice && chosenVoice !== voice) speak(text);
      };
      currentUtterance = utterance;
      speechSynthesis.speak(utterance);
    }, 60);
  }

  // Browsers cap how many AudioContexts a page may hold, so every effect shares one
  let sharedAudioContext = null;
  function getAudioContext() {
    if (!sharedAudioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      sharedAudioContext = new AudioContext();
    }
    if (sharedAudioContext.state === "suspended") sharedAudioContext.resume().catch(() => {});
    return sharedAudioContext;
  }

  function playTone(success) {
    if (!success) {
      playFailSound();
      return;
    }
    try {
      const context = getAudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = success ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(success ? 540 : 230, context.currentTime);
      if (success) oscillator.frequency.linearRampToValueAtTime(760, context.currentTime + 0.13);
      gain.gain.setValueAtTime(0.08, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.23);
    } catch (_) { /* Sound is optional. */ }
  }

  // A soft, cartoon "wah-wah": two notes sliding down. Filtered so it reads as "oops", not harsh.
  function playFailSound() {
    try {
      const context = getAudioContext();
      const start = context.currentTime;
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1100;
      filter.connect(context.destination);
      [[330, 277, 0], [262, 196, 0.24]].forEach(([from, to, offset]) => {
        const osc = context.createOscillator();
        const wobble = context.createOscillator();
        const wobbleDepth = context.createGain();
        const gain = context.createGain();
        const t = start + offset;
        const length = offset ? 0.42 : 0.22;
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(from, t);
        osc.frequency.exponentialRampToValueAtTime(to, t + length);
        wobble.frequency.value = 7;
        wobbleDepth.gain.value = offset ? 6 : 0;
        wobble.connect(wobbleDepth).connect(osc.frequency);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.11, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + length);
        osc.connect(gain).connect(filter);
        osc.start(t);
        wobble.start(t);
        osc.stop(t + length + 0.02);
        wobble.stop(t + length + 0.02);
      });
    } catch (_) { /* Sound is optional. */ }
  }

  function playRestoreChime() {
    try {
      const context = getAudioContext();
      [587, 740, 880].forEach((freq, idx) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, context.currentTime + idx * 0.07);
        gain.gain.setValueAtTime(0.09, context.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + idx * 0.07 + 0.28);
        osc.connect(gain).connect(context.destination);
        osc.start(context.currentTime + idx * 0.07);
        osc.stop(context.currentTime + idx * 0.07 + 0.3);
      });
    } catch (_) { /* Sound is optional. */ }
  }

  function finishGame() {
    state.running = false;
    cancelAnimationFrame(frameId);
    const saved = loadSaved();
    const prevBest = saved.bestByLevel[state.level.id] || 0;
    const isNewRecord = state.candy > prevBest;
    const litBefore = housesLit(saved.totalCandy);
    saved.totalCandy += state.candy;
    saved.wordsRead += state.correctTotal;
    saved.runs += 1;
    saved.bestByLevel[state.level.id] = Math.max(prevBest, state.candy);
    if (isNewRecord) saved.bestCostumeByLevel[state.level.id] = saved.wearing || null;
    saved.lastRunByLevel[state.level.id] = {
      words: state.round,
      misses: state.missRounds.length,
      fastMisses: state.missRounds.filter((round) => round >= FAST_ROUND).length
    };
    localStorage.setItem(STORE_KEY, JSON.stringify(saved));

    const litNow = housesLit(saved.totalCandy);
    $("endMapLine").textContent = litNow > litBefore
      ? `New on Boo's map: ${MAP_HOUSES[litNow - 1].name}${litNow - litBefore > 1 ? ` and ${litNow - litBefore - 1} more` : ""}!`
      : "";
    $("endMapLine").classList.toggle("hidden", litNow <= litBefore);

    const powerLine = powerReport();
    $("endPowerLine").textContent = powerLine;
    $("endPowerLine").classList.toggle("hidden", !powerLine);
    const tip = strategyTip(state.level.id, saved);
    $("endTipLine").textContent = tip;
    $("endTipLine").classList.toggle("hidden", !tip);

    $("endCandy").textContent = String(state.candy);

    const endBestLine = $("endBestLine");
    if (endBestLine) {
      if (isNewRecord && state.candy > 0) {
        endBestLine.textContent = `New record! Beat previous best of ${prevBest}!`;
      } else {
        endBestLine.textContent = `Trail Record: ${saved.bestByLevel[state.level.id]} candies`;
      }
    }

    if (state.candy >= 20) {
      $("endMessage").textContent = "Legendary flying! Boo's pumpkin is overflowing with sweet treats!";
    } else if (state.candy >= 10) {
      $("endMessage").textContent = "Incredible run! Boo collected a massive stash of candy!";
    } else if (state.candy >= 5) {
      $("endMessage").textContent = "Great flying! You spotted lots of tricky words on the path!";
    } else {
      $("endMessage").textContent = "Good try! Every flight makes those words easier to spot!";
    }

    const earnedStreet = state.candy > 0 && state.candy >= prevBest * STREET_SCORE_SHARE;
    $("streetInvite").classList.toggle("hidden", !earnedStreet);
    $("streetInviteText").textContent = isNewRecord
      ? "A new best! Boo earned a trip to Trick-or-Treat Street!"
      : "So close to your best! Boo earned a trip to Trick-or-Treat Street!";
    $("againButton").classList.toggle("primary-button", !earnedStreet);
    $("againButton").classList.toggle("secondary-button", earnedStreet);

    populateBigBucket();
    makeCandyRain();
    showScreen("end");
  }

  function populateBigBucket() {
    if (bigBucketBack && candies) {
      bigBucketBack.innerHTML = candies.getPumpkinBucketOverflowSVG(220);
    }
    const wrap = $("bigBucketCandies");
    if (wrap) wrap.replaceChildren();
    if (bigBucketFront) bigBucketFront.replaceChildren();
  }

  function loadSaved() {
    const fresh = () => ({
      totalCandy: 0, wordsRead: 0, runs: 0, streetVisits: 0, doorsOpened: 0,
      bestByLevel: {}, bestCostumeByLevel: {}, lastRunByLevel: {}, costumes: [], wearing: null
    });
    try {
      return Object.assign(fresh(), JSON.parse(localStorage.getItem(STORE_KEY)) || {});
    } catch (_) {
      return fresh();
    }
  }

  function costumeName(id) {
    return candies?.costumes.find((c) => c.id === id)?.name || "Just Boo";
  }

  // One line on the end screen showing what the worn costume's power did this run.
  function powerReport() {
    const p = state.power;
    if (!p.name) return "";
    if (p.shieldRecharge) {
      return state.shieldSaves
        ? `Magic Shield blocked ${state.shieldSaves} ${state.shieldSaves === 1 ? "miss" : "misses"}!`
        : "Magic Shield was ready, but you didn't need it!";
    }
    if (p.maxChances) {
      return state.chancesLost >= 3 && state.round > 0
        ? "Nine Lives gave you an extra chance to keep flying!"
        : "Nine Lives kept a spare chance ready for you.";
    }
    if (p.ramp) {
      const elapsed = (performance.now() - state.startTime) / 1000;
      const normal = state.round * 9 + elapsed * 1.3;
      const slower = Math.round((normal * (1 - p.ramp)) / (145 + normal) * 100);
      return `Slow Spell made the trail ${slower}% slower by the end!`;
    }
    if (p.catchReach) {
      return `Heart Radar helped you catch ${state.heartsCaught} ${state.heartsCaught === 1 ? "heart" : "hearts"}!`;
    }
    if (state.powerCandy > 0) return `${p.name} earned ${state.powerCandy} bonus ${state.powerCandy === 1 ? "candy" : "candies"}!`;
    if (p.streakEvery) return "Royal Riches pays off on long streaks. Try it on a trail you know well!";
    if (p.lastChanceBonus) return "Showtime starts on your last chance. Keep going to make a comeback!";
    return "";
  }

  // Coaching line: looks at how the last run on this trail went and suggests costumes Max owns.
  function strategyTip(levelId, saved) {
    if (!candies || !saved.costumes.length) return "";
    const last = saved.lastRunByLevel[levelId];
    let reason;
    let ideas;
    if (!last) {
      reason = "New trail?";
      ideas = ["cat-ears", "wizard-hat", "bat-wings"];
    } else if (last.misses <= Math.max(1, Math.floor(last.words * 0.1))) {
      reason = "You know these words!";
      ideas = ["crown", "pirate-hat", "pumpkin-cap"];
    } else if (last.words >= FAST_ROUND && last.fastMisses * 2 >= last.misses) {
      reason = "The trail got too fast last time.";
      ideas = ["witch-hat", "bat-wings", "wizard-hat"];
    } else {
      reason = "Still learning these words?";
      ideas = ["wizard-hat", "cat-ears", "top-hat"];
    }
    const owned = ideas.filter((id) => saved.costumes.includes(id));
    if (owned.includes(saved.wearing)) return `${reason} ${costumeName(saved.wearing)} is a great pick.`;
    if (owned.length) return `${reason} Try ${owned.slice(0, 2).map(costumeName).join(" or ")}.`;
    if (saved.costumes.includes("pumpkin-cap") && saved.wearing !== "pumpkin-cap") return `${reason} Pumpkin Hat helps on any trail.`;
    return "";
  }

  function updateHomeInfo() {
    const saved = loadSaved();
    const level = selectedLevel();
    const best = saved.bestByLevel[level.id] || 0;
    const trailGoal = $("trailGoal");
    if (best) {
      const bestWith = level.id in saved.bestCostumeByLevel ? ` as ${costumeName(saved.bestCostumeByLevel[level.id])}` : "";
      trailGoal.innerHTML = `Best: <strong>${best}</strong>${bestWith}. Get <strong>${Math.ceil(best * STREET_SCORE_SHARE)}</strong> for Trick-or-Treat Street.`;
    } else {
      trailGoal.innerHTML = "Get any candy to visit <strong>Trick-or-Treat Street</strong>!";
    }
    const power = POWERS[saved.wearing];
    $("wearingLine").innerHTML = power
      ? `Wearing <strong>${costumeName(saved.wearing)}</strong>: ${power.text}`
      : "";
    $("trailTip").textContent = strategyTip(level.id, saved);
    updateMapStrip(saved);
  }

  function updateMapStrip(saved) {
    const total = saved.totalCandy;
    const lit = housesLit(total);
    const next = MAP_HOUSES[lit];
    const prevMark = lit ? MAP_HOUSES[lit - 1].candy : 0;
    $("mapStripCandy").textContent = total.toLocaleString();
    $("mapStripFill").style.width = next ? `${Math.round(((total - prevMark) / (next.candy - prevMark)) * 100)}%` : "100%";
    $("mapStripNext").textContent = next
      ? `${lit} of ${MAP_HOUSES.length} houses lit. ${next.candy - total} more for ${next.name}!`
      : `All ${MAP_HOUSES.length} houses lit! Boo is the Candy Champion!`;
    if (candies && !$("mapStripBucket").firstChild) $("mapStripBucket").innerHTML = candies.getPumpkinBucketSVG(44);
  }

  function renderMap() {
    const saved = loadSaved();
    const lit = housesLit(saved.totalCandy);
    const next = MAP_HOUSES[lit];
    $("mapSummary").textContent = next
      ? `${lit} of ${MAP_HOUSES.length} houses lit. ${next.candy - saved.totalCandy} more candies to light ${next.name}!`
      : "Every house is lit! Boo is the Candy Champion!";

    const stats = [
      [saved.totalCandy.toLocaleString(), "candies"],
      [saved.wordsRead.toLocaleString(), "words read"],
      [saved.doorsOpened.toLocaleString(), "rhymes"],
      [`${saved.costumes.length}/${candies ? candies.costumes.length : 8}`, "costumes"]
    ];
    $("mapStats").innerHTML = stats.map(([value, label]) => `<div class="map-stat"><strong>${value}</strong><span>${label}</span></div>`).join("");

    const art = candies ? candies.houses : [];
    const road = $("mapRoad");
    road.replaceChildren();
    MAP_HOUSES.forEach((house, index) => {
      const stop = document.createElement("div");
      const isLit = index < lit;
      const isNext = index === lit;
      stop.className = `map-stop ${index % 2 ? "right" : "left"}${isLit ? " lit" : ""}${isNext ? " next" : ""}`;
      const houseArt = art[index % art.length];
      stop.innerHTML = `
        <div class="map-house">${houseArt ? `<img src="${houseArt.src}" alt="" draggable="false" />` : ""}</div>
        <div class="map-label">
          <strong>${isLit || isNext ? house.name : "???"}</strong>
          <span>${isLit ? "Lit up!" : `${house.candy.toLocaleString()} candies`}</span>
        </div>
        ${index === Math.max(0, lit - 1) && lit ? `<div class="map-boo">${candies ? candies.getGhostSVG("happy", 46) : ""}</div>` : ""}
      `;
      road.appendChild(stop);
    });
    if (!lit) {
      const start = document.createElement("div");
      start.className = "map-start";
      start.innerHTML = `${candies ? candies.getGhostSVG("normal", 46) : ""}<span>Boo starts here! Collect candy to light the first house.</span>`;
      road.prepend(start);
    }
  }

  function makeCandyRain() {
    const holder = $("celebrationCandy");
    holder.replaceChildren();
    for (let i = 0; i < 20; i++) {
      const candy = document.createElement("span");
      candy.className = "candy-rain-piece";
      candy.style.left = `${Math.random() * 92}%`;
      candy.style.animationDelay = `${Math.random() * 2.5}s`;
      candy.style.animationDuration = `${2.3 + Math.random() * 1.6}s`;
      const size = 32 + Math.floor(Math.random() * 14);
      candy.innerHTML = candies ? candies.getRandomCandySVG(size) : "";
      holder.appendChild(candy);
    }
  }

  function leaveGame() {
    if (state) state.running = false;
    cancelAnimationFrame(frameId);
    clearTimeout(speakTimer);
    window.speechSynthesis?.cancel();
    music.stop();
    rows.replaceChildren();
    if (pickupsWrap) pickupsWrap.replaceChildren();
    $("pauseOverlay").classList.add("hidden");
    showScreen("home");
  }

  function togglePause(paused) {
    if (!state?.running) return;
    state.paused = paused;
    $("pauseOverlay").classList.toggle("hidden", !paused);
    if (paused) {
      clearTimeout(speakTimer);
      window.speechSynthesis?.cancel();
      music.pause();
    } else {
      music.resume();
      speakCurrentWord();
    }
  }

  function speakCurrentWord() {
    const nextRow = state?.rows.find((row) => !row.resolved);
    if (nextRow) speak(nextRow.target);
  }

  function updateClosetCount() {
    const count = $("closetCount");
    if (!count || !candies) return;
    count.textContent = `${loadSaved().costumes.length}/${candies.costumes.length}`;
  }

  function renderCloset() {
    const saved = loadSaved();
    closetGrid.replaceChildren();
    [{ id: null, name: "Just Boo" }, ...candies.costumes].forEach((costume) => {
      const unlocked = !costume.id || saved.costumes.includes(costume.id);
      const item = document.createElement("button");
      item.type = "button";
      item.className = "closet-item";
      item.classList.toggle("locked", !unlocked);
      item.classList.toggle("wearing", (saved.wearing || null) === costume.id);
      item.disabled = !unlocked;
      item.setAttribute("aria-label", unlocked ? `Wear ${costume.name}` : "Costume not found yet");
      const power = POWERS[costume.id];
      item.innerHTML = `
        <span class="closet-boo">${candies.getGhostSVG("normal", 70, costume.id || "none")}</span>
        <span class="closet-name">${unlocked ? costume.name : "?"}</span>
        <span class="closet-power-name">${unlocked ? (power ? power.name : "No power") : ""}</span>
      `;
      item.addEventListener("click", () => {
        const latest = loadSaved();
        latest.wearing = costume.id;
        localStorage.setItem(STORE_KEY, JSON.stringify(latest));
        candies.setCostume(costume.id);
        refreshBooArt();
        renderCloset();
      });
      closetGrid.appendChild(item);
    });
    const worn = POWERS[saved.wearing];
    $("closetPower").innerHTML = worn
      ? `<strong>${costumeName(saved.wearing)}: ${worn.name}</strong><p>${worn.text}</p><p class="power-tip">${worn.tip}</p>`
      : "<strong>Just Boo</strong><p>No power. Tap a costume to see what it does.</p>";
  }

  updateClosetCount();
  updateHomeInfo();
  levelSelect.addEventListener("change", updateHomeInfo);
  const mapModal = $("mapModal");
  $("mapButton").addEventListener("click", () => {
    renderMap();
    mapModal.classList.remove("hidden");
    const road = $("mapRoad");
    const focus = road.querySelector(".map-stop.next") || road.lastElementChild;
    if (focus) road.scrollTop = focus.offsetTop - road.clientHeight / 2 + focus.offsetHeight / 2;
  });
  $("closeMapButton").addEventListener("click", () => mapModal.classList.add("hidden"));
  $("closetButton").addEventListener("click", () => {
    renderCloset();
    closetModal.classList.remove("hidden");
  });
  $("closeClosetButton").addEventListener("click", () => closetModal.classList.add("hidden"));
  $("prizeButton").addEventListener("click", closePrize);
  $("streetButton").addEventListener("click", () => {
    enterStreet();
  });
  $("streetHearButton").addEventListener("click", () => {
    speakRhymePrompt();
  });
  $("streetClosetButton").addEventListener("click", () => {
    renderCloset();
    closetModal.classList.remove("hidden");
  });
  $("streetDoneButton").addEventListener("click", leaveStreet);
  $("streetHomeButton").addEventListener("click", leaveStreet);

  $("startButton").addEventListener("click", startGame);
  $("againButton").addEventListener("click", startGame);
  $("chooseButton").addEventListener("click", () => showScreen("home"));
  $("quitButton").addEventListener("click", leaveGame);
  $("pauseQuitButton").addEventListener("click", leaveGame);
  $("pauseButton").addEventListener("click", () => togglePause(true));
  $("resumeButton").addEventListener("click", () => togglePause(false));
  if (musicButton) musicButton.addEventListener("click", toggleMusic);
  $("hearButton").addEventListener("click", speakCurrentWord);

  const helpModal = $("helpModal");
  $("howButton").addEventListener("click", () => {
    pickVoice();
    helpModal.classList.remove("hidden");
  });
  $("voiceSelect").addEventListener("change", (event) => {
    if (event.target.value) localStorage.setItem(VOICE_STORE_KEY, event.target.value);
    else localStorage.removeItem(VOICE_STORE_KEY);
    pickVoice();
    speak("Hi Max! Can you find the word said?");
  });
  $("voiceTestButton").addEventListener("click", () => speak("Hi Max! Can you find the word said?"));
  $("closeHelpButton").addEventListener("click", () => helpModal.classList.add("hidden"));
  $("helpDoneButton").addEventListener("click", () => helpModal.classList.add("hidden"));

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
