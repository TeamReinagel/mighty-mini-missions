const STORAGE_KEY = "mighty-mini-missions:v1";
const PROFILES_STORAGE_KEY = "mighty-mini-missions:profiles";
const fallbackData = window.MAX_MISSIONS_FALLBACK_DATA;

const AVATAR_EMOJI = { rocket: "🚀", star: "⭐", bear: "🐻", heart: "❤️", sun: "☀️" };
const LEVEL_ORDER = ["toddler", "prek", "kinder", "1st", "any"];
const DEFAULT_LEVELS = {
  build: "any",
  phonics: "any",
  math: "any",
  nature: "any",
  social: "any",
  responsibility: "any"
};

const DEFAULT_PROFILES = [
  {
    id: "max",
    name: "Max",
    avatar: "rocket",
    levels: { build: "any", phonics: "1st", math: "1st", nature: "any", social: "any", responsibility: "any" }
  },
  {
    id: "gabi",
    name: "Gabi",
    avatar: "star",
    levels: { build: "prek", phonics: "prek", math: "prek", nature: "prek", social: "prek", responsibility: "prek" }
  },
  {
    id: "connor",
    name: "Connor",
    avatar: "bear",
    levels: { build: "toddler", phonics: "toddler", math: "toddler", nature: "toddler", social: "toddler", responsibility: "toddler" }
  }
];

/** @typedef {{id:string, category:string, difficulty:'easy'|'medium'|'hard'|'any', minutes?:string, title:string, prompt:string, materials:string[], steps:string[], siblingStation?:string}} Mission */

const CATEGORY_LABELS = {
  any: "Any",
  build: "Build",
  phonics: "Phonics",
  math: "Movement Math",
  nature: "Nature",
  social: "Co-op",
  responsibility: "Responsibility"
};

const CATEGORY_EMOJI = { build: "🔧", phonics: "📖", math: "🔢", nature: "🌿", social: "🤝", responsibility: "✅" };

const DIFFICULTY_LABELS = {
  any: "Any",
  easy: "Easy",
  medium: "Medium",
  hard: "Hard"
};

function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === "tap") {
      osc.frequency.value = 440;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === "reveal") {
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.08);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.16);
      osc.type = "sine";
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === "celebrate") {
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.06);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.12);
      osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.18);
      osc.type = "sine";
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (_) {}
}

function safeJsonParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function loadProfiles() {
  const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
  const data = safeJsonParse(raw ?? "{}", {});
  let profiles = Array.isArray(data.profiles) && data.profiles.length > 0 ? data.profiles : DEFAULT_PROFILES;
  const activeId = data.activeProfileId ?? profiles[0]?.id ?? "max";
  if (!raw || !Array.isArray(safeJsonParse(raw, {}).profiles) || safeJsonParse(raw, {}).profiles.length === 0) {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify({ profiles, activeProfileId: activeId }));
  }
  return { profiles, activeProfileId: activeId };
}

function saveProfiles(profiles, activeProfileId) {
  localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify({ profiles, activeProfileId }));
}

function loadProfileSettings(profileId) {
  const raw = localStorage.getItem(STORAGE_KEY);
  const data = safeJsonParse(raw ?? "{}", {});
  let all = data.profileSettings ?? {};
  if (Object.keys(all).length === 0 && (data.difficulty !== undefined || data.favorites !== undefined)) {
    all = { max: { difficulty: data.difficulty ?? "any", category: data.category ?? "any", audioOn: Boolean(data.audioOn ?? false), favorites: Array.isArray(data.favorites) ? data.favorites : [] } };
    data.profileSettings = all;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
  const settings = all[profileId] ?? {};
  return {
    difficulty: settings.difficulty ?? "any",
    category: settings.category ?? "any",
    audioOn: Boolean(settings.audioOn ?? false),
    favorites: Array.isArray(settings.favorites) ? settings.favorites : []
  };
}

function saveProfileSettings(profileId, settings) {
  const raw = localStorage.getItem(STORAGE_KEY);
  const data = safeJsonParse(raw ?? "{}", {});
  const all = data.profileSettings ?? {};
  all[profileId] = {
    difficulty: settings.difficulty,
    category: settings.category,
    audioOn: settings.audioOn,
    favorites: settings.favorites
  };
  data.profileSettings = all;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadStored(profileId) {
  return loadProfileSettings(profileId);
}

function saveStored(profileId, next) {
  saveProfileSettings(profileId, next);
}

function loadCompletions(profileId) {
  const raw = localStorage.getItem(STORAGE_KEY);
  const data = safeJsonParse(raw ?? "{}", {});
  const all = data.profileCompletions ?? {};
  return Array.isArray(all[profileId]) ? all[profileId] : [];
}

function saveCompletion(profileId, completion) {
  const raw = localStorage.getItem(STORAGE_KEY);
  const data = safeJsonParse(raw ?? "{}", {});
  const all = data.profileCompletions ?? {};
  all[profileId] = all[profileId] ?? [];
  all[profileId].unshift(completion);
  data.profileCompletions = all;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function pickOne(arr) {
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickTwoDistinct(arr) {
  if (arr.length <= 1) return [arr[0] ?? null, null];
  const a = pickOne(arr);
  let b = pickOne(arr);
  let guard = 0;
  while (b && a && b.id === a.id && guard < 25) {
    b = pickOne(arr);
    guard++;
  }
  return [a, b];
}

function difficultyRank(d) {
  if (d === "easy") return 1;
  if (d === "medium") return 2;
  if (d === "hard") return 3;
  return 99;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function substituteTemplates(text, vars) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = vars[key];
    if (v === undefined || v === null) return `{{${key}}}`;
    return String(v);
  });
}

function buildTemplatePickers(templateVariables) {
  /** @type {Record<string, any[]>} */
  const tv = templateVariables ?? {};
  return {
    pick(name) {
      const list = tv[name];
      if (!Array.isArray(list) || list.length === 0) return null;
      return pickOne(list);
    },
    pickMin(name) {
      const list = tv[name];
      if (!Array.isArray(list) || list.length === 0) return null;
      const nums = list.filter((x) => typeof x === "number");
      if (nums.length) return Math.min(...nums);
      return list[0];
    }
  };
}

function renderChoiceCard(el, mission, rendered) {
  if (!mission) {
    el.disabled = true;
    el.removeAttribute("data-category");
    el.innerHTML = `<div class="choice-title">No mission</div><div class="choice-preview">Try resetting filters.</div>`;
    return;
  }
  el.disabled = false;
  el.setAttribute("data-category", mission.category);
  const emoji = CATEGORY_EMOJI[mission.category] ?? "⭐";
  el.innerHTML = `
    <div class="choice-emoji">${emoji}</div>
    <div class="choice-title">${escapeHtml(rendered.title)}</div>
    <div class="choice-preview">${escapeHtml(rendered.prompt)}</div>
  `;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function speakText(text) {
  if (!("speechSynthesis" in window)) return false;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.pitch = 1.0;
    utter.volume = 1.0;
    window.speechSynthesis.speak(utter);
    return true;
  } catch {
    return false;
  }
}

async function loadMissionData() {
  // Prefer missions.json when running via a local server.
  try {
    const res = await fetch("./missions.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } catch {
    // Fallback for file:// or strict browsers.
    return fallbackData ?? { missions: [], templateVariables: {} };
  }
}

function $(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: ${id}`);
  return el;
}

let onPanelShown = () => {};

function showOnly(panelId, ids) {
  onPanelShown(panelId);
  const toShow = $(panelId);
  const toHide = ids.filter((id) => id !== panelId).map((id) => $(id));

  toHide.forEach((el) => {
    if (el.classList.contains("hidden")) return;
    el.classList.add("panel-transition-out");
    el.addEventListener(
      "transitionend",
      function onOut() {
        el.removeEventListener("transitionend", onOut);
        el.classList.add("hidden");
        el.classList.remove("panel-transition-out");
      },
      { once: true }
    );
  });

  const wasHidden = toShow.classList.contains("hidden");
  toShow.classList.remove("hidden");
  if (wasHidden) {
    toShow.classList.add("panel-transition-out");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toShow.classList.remove("panel-transition-out");
      });
    });
  }
}

function setHidden(id, hidden) {
  $(id).classList.toggle("hidden", hidden);
}

function setText(id, text) {
  $(id).textContent = text;
}

function setHtml(id, html) {
  $(id).innerHTML = html;
}

function fillList(listEl, items, ordered = false) {
  listEl.innerHTML = "";
  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = item;
    listEl.appendChild(li);
  }
  if (ordered) listEl.setAttribute("role", "list");
}

function levelRank(l) {
  const i = LEVEL_ORDER.indexOf(l);
  return i >= 0 ? i : -1;
}

function missionPassesLevel(mission, profileLevels) {
  const cat = mission.category;
  const profileLevel = profileLevels?.[cat] ?? "any";
  if (profileLevel === "any") return true;
  const missionLevel = mission.level ?? "prek";
  const pRank = levelRank(profileLevel);
  const mRank = levelRank(missionLevel);
  if (pRank < 0) return true;
  return mRank <= pRank;
}

function filteredMissions(all, filters, profileLevels) {
  const { difficulty, category } = filters;
  return all.filter((m) => {
    const okCategory = category === "any" ? true : m.category === category;
    const okDifficulty = difficulty === "any" ? true : m.difficulty === difficulty;
    const okLevel = missionPassesLevel(m, profileLevels);
    return okCategory && okDifficulty && okLevel;
  });
}

function missionToRendered(mission, templatePickers, templateMode = "random") {
  const vars = {};
  for (const key of ["SOUND", "LETTER", "N1", "N2"]) {
    vars[key] = templateMode === "min" ? templatePickers.pickMin(key) : templatePickers.pick(key);
  }
  // Derive any extra variables (ex: N3) in future; keep minimal for now.

  const rendered = {
    ...mission,
    title: substituteTemplates(mission.title, vars),
    prompt: substituteTemplates(mission.prompt, vars),
    materials: (mission.materials ?? []).map((x) => substituteTemplates(x, vars)),
    steps: (mission.steps ?? []).map((x) => substituteTemplates(x, vars)),
    siblingStation: substituteTemplates(mission.siblingStation ?? "", vars),
    _vars: vars
  };
  return rendered;
}

function easierDifficulty(d) {
  if (d === "hard") return "medium";
  if (d === "medium") return "easy";
  return "easy";
}

function formatStatus({ total, filtered, difficulty, category, source }) {
  const cat = CATEGORY_LABELS[category] ?? category;
  const diff = DIFFICULTY_LABELS[difficulty] ?? difficulty;
  const base = `${filtered} of ${total} missions • ${cat} • ${diff}`;
  return source ? `${base} • ${source}` : base;
}

function setSegmentedSelected(container, dataAttr, value) {
  const buttons = container.querySelectorAll("button");
  buttons.forEach((b) => {
    const v = b.getAttribute(dataAttr);
    b.classList.toggle("selected", v === value);
  });
}

function buildPrintDeck(container, missions, renderFn) {
  container.innerHTML = "";
  // Add a quick reference card first
  const refCard = document.createElement("div");
  refCard.className = "print-card print-card-ref";
  refCard.innerHTML = `
    <div class="pc-top">
      <div class="pc-title">Quick Reference</div>
    </div>
    <p class="pc-prompt"><strong>Stop rule:</strong> Stop early is a win. "Done for now" counts.</p>
    <div class="pc-footer">If frustration hits, try an easier twist or swap missions.</div>
  `;
  container.appendChild(refCard);
  
  for (const m of missions) {
    const r = renderFn(m);
    const card = document.createElement("div");
    card.className = "print-card";
    let twistsHtml = "";
    if (m.twists) {
      const twists = [];
      if (m.twists.easier) twists.push(`<strong>Easier:</strong> ${escapeHtml(m.twists.easier)}`);
      if (m.twists.harder) twists.push(`<strong>Harder:</strong> ${escapeHtml(m.twists.harder)}`);
      if (m.twists.variant) twists.push(`<strong>Variant:</strong> ${escapeHtml(m.twists.variant)}`);
      if (twists.length > 0) {
        twistsHtml = `<div class="pc-twists">${twists.join("<br>")}</div>`;
      }
    }
    card.innerHTML = `
      <div class="pc-top">
        <div class="pc-title">${escapeHtml(r.title)}</div>
        <div class="pc-meta">${escapeHtml(CATEGORY_LABELS[m.category] ?? m.category)} • ${escapeHtml(
          DIFFICULTY_LABELS[m.difficulty] ?? m.difficulty
        )}</div>
      </div>
      <p class="pc-prompt">${escapeHtml(r.prompt)}</p>
      <div class="pc-footer">Materials: ${escapeHtml((r.materials ?? []).slice(0, 3).join(", "))}${
        (r.materials ?? []).length > 3 ? "…" : ""
      }</div>
      ${twistsHtml}
    `;
    container.appendChild(card);
  }
}

async function main() {
  let { profiles, activeProfileId } = loadProfiles();
  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
  if (!activeProfile) throw new Error("No profiles");
  activeProfileId = activeProfile.id;

  const stored = loadStored(activeProfileId);
  let state = {
    ...stored,
    favorites: new Set(stored.favorites),
    showFavoritesOnly: false,
    activeProfileId,
    profiles
  };

  const data = await loadMissionData();
  const missions = Array.isArray(data.missions) ? data.missions : [];
  const templatePickers = buildTemplatePickers(data.templateVariables);

  // Elements.
  const ids = ["profilePickerPanel", "hubPanel", "mainPanel", "settingsPanel", "badgesPanel", "missionLogPanel", "manageProfilesPanel", "printPanel"];
  const welcome = $("welcome");
  const choices = $("choices");
  const missionEl = $("mission");

  const missionNowButton = $("missionNowButton");
  const twoChoicesButton = $("twoChoicesButton");

  const choiceA = $("choiceA");
  const choiceB = $("choiceB");
  const shuffleChoicesButton = $("shuffleChoicesButton");
  const backToHomeFromChoices = $("backToHomeFromChoices");

  const missionCategory = $("missionCategory");
  const missionDifficulty = $("missionDifficulty");
  const missionMinutes = $("missionMinutes");
  const missionTitle = $("missionTitle");
  const missionPrompt = $("missionPrompt");
  const missionMaterials = $("missionMaterials");
  const missionSteps = $("missionSteps");
  const missionSiblingStation = $("missionSiblingStation");
  const missionTwists = $("missionTwists");
  const twistsList = $("twistsList");
  const whyButton = $("whyButton");
  const imageButton = $("imageButton");
  const speakButton = $("speakButton");
  const favoriteButton = $("favoriteButton");
  const missionImageWrap = $("missionImageWrap");
  const missionImage = $("missionImage");
  const missionImageHint = $("missionImageHint");

  const skillsModal = $("skillsModal");
  const closeSkillsModal = $("closeSkillsModal");
  const skillsForMax = $("skillsForMax");
  const skillsForParent = $("skillsForParent");

  const tryAgainEasierButton = $("tryAgainEasierButton");
  const swapMissionButton = $("swapMissionButton");
  const newMissionButton = $("newMissionButton");
  const doneForNowButton = $("doneForNowButton");

  const settingsButton = $("settingsButton");
  const closeSettingsButton = $("closeSettingsButton");

  const resetFiltersButton = $("resetFiltersButton");
  const statusText = $("statusText");

  const audioToggle = $("audioToggle");
  const showFavoritesButton = $("showFavoritesButton");
  const clearFavoritesButton = $("clearFavoritesButton");

  const printDeck = $("printDeck");
  const printButton = $("printButton");
  const backFromPrint = $("backFromPrint");

  const choicesDifficultyPill = $("choicesDifficultyPill");
  const choicesCategoryPill = $("choicesCategoryPill");

  const backToGamesButton = $("backToGamesButton");
  const hubHeading = $("hubHeading");
  const hubGrid = $("hubGrid");
  const profileIndicator = $("profileIndicator");
  const profileAvatar = $("profileAvatar");
  const profileName = $("profileName");
  const headerSubtitle = document.getElementById("headerSubtitle");
  const profileCards = $("profileCards");
  const manageProfilesButton = $("manageProfilesButton");
  const manageProfilesSettingsButton = document.getElementById("manageProfilesSettingsButton");
  const manageProfilesPanel = $("manageProfilesPanel");
  const manageProfilesList = $("manageProfilesList");
  const closeManageProfilesButton = $("closeManageProfilesButton");
  const addProfileButton = $("addProfileButton");

  const missionCompleteButton = $("missionCompleteButton");
  const completionModal = $("completionModal");
  const closeCompletionModal = document.getElementById("closeCompletionModal");
  const completionRatings = $("completionRatings");
  const completionNoteInput = document.getElementById("completionNoteInput");
  const completionDoneButton = $("completionDoneButton");
  const missionLogButton = document.getElementById("missionLogButton");
  const missionLogPanel = $("missionLogPanel");
  const missionLogProfileTabs = $("missionLogProfileTabs");
  const missionLogList = $("missionLogList");
  const closeMissionLogButton = document.getElementById("closeMissionLogButton");
  const viewBadgesButton = document.getElementById("viewBadgesButton");
  const badgesPanel = document.getElementById("badgesPanel");
  const badgesProfileTabs = document.getElementById("badgesProfileTabs");
  const badgesGrid = document.getElementById("badgesGrid");
  const closeBadgesButton = document.getElementById("closeBadgesButton");
  const rewardOverlay = document.getElementById("rewardOverlay");
  const rewardPresent = document.getElementById("rewardPresent");
  const rewardBadge = document.getElementById("rewardBadge");
  const badgeCircle = document.getElementById("badgeCircle");
  const badgeTitle = document.getElementById("badgeTitle");
  const collectBadgeButton = document.getElementById("collectBadgeButton");
  const confetti = document.getElementById("confetti");

  const difficultySegment = document.querySelector('[aria-label="Difficulty"]');
  const categorySegment = document.querySelector('[aria-label="Category"]');

  if (!(difficultySegment instanceof HTMLElement) || !(categorySegment instanceof HTMLElement)) {
    throw new Error("Missing segmented controls");
  }

  /** @type {{raw: Mission, rendered: any} | null} */
  let current = null;
  /** @type {{a: Mission|null, b: Mission|null} | null} */
  let currentChoices = null;
  let sourceLabel = data === fallbackData ? "fallback" : "json";
  /** @type {Map<string, { src: string, hint?: string }>} */
  const imageCache = new Map();

  function getActiveProfile() {
    return state.profiles.find((p) => p.id === state.activeProfileId) ?? state.profiles[0];
  }

  function persist() {
    saveStored(state.activeProfileId, {
      difficulty: state.difficulty,
      category: state.category,
      audioOn: state.audioOn,
      favorites: Array.from(state.favorites)
    });
  }

  function persistProfiles() {
    saveProfiles(state.profiles, state.activeProfileId);
  }

  let activePanel = "profilePickerPanel";
  let homePanel = "profilePickerPanel";
  const homePanels = new Set(["profilePickerPanel", "hubPanel", "mainPanel"]);

  onPanelShown = (panelId) => {
    activePanel = panelId;
    if (homePanels.has(panelId)) homePanel = panelId;
    syncChrome();
  };

  function syncChrome() {
    const onMissions = activePanel === "mainPanel";
    resetFiltersButton.classList.toggle("hidden", !onMissions);
    const p = getActiveProfile();
    if (!headerSubtitle) return;
    if (activePanel === "profilePickerPanel") {
      headerSubtitle.textContent = "Tap → choose → go play";
    } else if (activePanel === "hubPanel" && p) {
      headerSubtitle.textContent = `${p.name}, pick a game`;
    } else if (onMissions && p) {
      headerSubtitle.textContent = `${p.name}'s missions`;
    }
  }

  function updateProfileHeader() {
    const p = getActiveProfile();
    if (p) {
      profileAvatar.textContent = AVATAR_EMOJI[p.avatar] ?? "👤";
      profileName.textContent = p.name;
    }
    syncChrome();
  }

  function renderHub() {
    const p = getActiveProfile();
    hubHeading.textContent = p ? `${p.name}, pick a game` : "Pick a game";
    hubGrid.innerHTML = "";
    const activities = Array.isArray(window.MIGHTY_GAMES) ? window.MIGHTY_GAMES : [];
    for (const activity of activities) {
      if (Array.isArray(activity.profiles) && (!p || !activity.profiles.includes(p.id))) continue;
      const frame = document.createElement("span");
      frame.className = "hub-icon-frame";
      const icon = document.createElement("img");
      icon.className = "hub-icon";
      icon.src = activity.icon || "";
      icon.alt = "";
      icon.draggable = false;
      if (activity.iconScale) icon.style.transform = `scale(${Number(activity.iconScale)})`;
      frame.appendChild(icon);

      const label = document.createElement("span");
      label.className = "hub-label";
      label.textContent = activity.title || "Game";

      if (activity.kind === "missions") {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "hub-tile";
        button.append(frame, label);
        button.addEventListener("click", openMissions);
        hubGrid.appendChild(button);
      } else if (activity.href) {
        const link = document.createElement("a");
        link.className = "hub-tile";
        link.href = activity.href;
        link.append(frame, label);
        hubGrid.appendChild(link);
      }
    }
  }

  function openHub() {
    renderHub();
    showOnly("hubPanel", ids);
    updateStatus();
  }

  function openMissions() {
    showOnly("mainPanel", ids);
    showWelcome();
  }

  function returnFromOverlay() {
    showOnly(homePanel, ids);
    updateStatus();
  }

  function renderProfileCards() {
    profileCards.innerHTML = "";
    for (const p of state.profiles) {
      const count = loadCompletions(p.id).length;
      const card = document.createElement("button");
      card.className = "profile-card";
      card.type = "button";
      card.innerHTML = `
        <span class="profile-card-avatar">${AVATAR_EMOJI[p.avatar] ?? "👤"}</span>
        <span class="profile-card-name">${escapeHtml(p.name)}</span>
        ${count > 0 ? `<span class="profile-card-badges">${count} completed</span>` : ""}
      `;
      card.addEventListener("click", () => selectProfile(p.id));
      profileCards.appendChild(card);
    }
  }

  function selectProfile(profileId) {
    state.activeProfileId = profileId;
    const p = getActiveProfile();
    const settings = loadStored(profileId);
    state.difficulty = settings.difficulty;
    state.category = settings.category;
    state.audioOn = settings.audioOn;
    state.favorites = new Set(settings.favorites);
    state.showFavoritesOnly = false;
    persistProfiles();
    persist();
    updateProfileHeader();
    updateSegments();
    openHub();
  }

  function effectiveFilteredMissions() {
    const profile = getActiveProfile();
    const base = filteredMissions(missions, state, profile?.levels);
    if (!state.showFavoritesOnly) return base;
    return base.filter((m) => state.favorites.has(m.id));
  }

  function updateStatus() {
    if (activePanel !== "mainPanel") {
      statusText.textContent = "";
      return;
    }
    const filtered = effectiveFilteredMissions().length;
    statusText.textContent = formatStatus({
      total: missions.length,
      filtered,
      difficulty: state.difficulty,
      category: state.category,
      source: sourceLabel
    });
  }

  function updateSegments() {
    setSegmentedSelected(difficultySegment, "data-difficulty", state.difficulty);
    setSegmentedSelected(categorySegment, "data-category", state.category);
    audioToggle.checked = state.audioOn;
  }

  function showWelcome() {
    setHidden("welcome", false);
    setHidden("choices", true);
    setHidden("mission", true);
    state.showFavoritesOnly = false;
    updateStatus();
  }

  function showChoicesList(mA, mB) {
    const filtered = effectiveFilteredMissions();
    if (!filtered.length) {
      showWelcome();
      statusText.textContent = "No missions match filters. Tap “Reset filters.”";
      return;
    }

    const [a, b] = mA && mB ? [mA, mB] : pickTwoDistinct(filtered);
    currentChoices = { a, b };

    const rA = a ? missionToRendered(a, templatePickers, "random") : null;
    const rB = b ? missionToRendered(b, templatePickers, "random") : null;

    renderChoiceCard(choiceA, a, rA ?? { title: "No mission", prompt: "Try resetting filters." });
    renderChoiceCard(choiceB, b, rB ?? { title: "No mission", prompt: "Try resetting filters." });

    choicesDifficultyPill.textContent = DIFFICULTY_LABELS[state.difficulty] ?? state.difficulty;
    choicesCategoryPill.textContent = CATEGORY_LABELS[state.category] ?? state.category;

    setHidden("welcome", true);
    setHidden("choices", false);
    setHidden("mission", true);
    updateStatus();
  }

  function updateFavoriteStar(missionId) {
    const isFav = state.favorites.has(missionId);
    favoriteButton.textContent = isFav ? "★" : "☆";
    favoriteButton.setAttribute("aria-label", isFav ? "Remove favorite" : "Save as favorite");
    favoriteButton.setAttribute("title", isFav ? "Remove favorite" : "Save as favorite");
  }

  function showMission(mission, { templateMode = "random", note = "" } = {}) {
    const rendered = missionToRendered(mission, templatePickers, templateMode);
    current = { raw: mission, rendered };

    missionCategory.textContent = CATEGORY_LABELS[mission.category] ?? mission.category;
    missionDifficulty.textContent = DIFFICULTY_LABELS[mission.difficulty] ?? mission.difficulty;
    missionMinutes.textContent = mission.minutes ?? "10–20";
    missionTitle.textContent = rendered.title;
    missionPrompt.textContent = note ? `${rendered.prompt} ${note}` : rendered.prompt;

    // Reset illustration UI.
    missionImage.removeAttribute("src");
    missionImageHint.textContent = "";
    setHidden("missionImageWrap", true);
    imageButton.disabled = false;

    // If we already generated one this session, show it.
    const cached = imageCache.get(mission.id);
    if (cached?.src) {
      missionImage.src = cached.src;
      missionImageHint.textContent = cached.hint || "Illustration (cached for this session).";
      setHidden("missionImageWrap", false);
    } else {
      // Try to load a pre-generated illustration (works offline).
      const pregenSrc = `./illustrations/${mission.id}.png`;
      const onDone = () => {
        missionImage.onload = null;
        missionImage.onerror = null;
      };
      missionImage.onload = () => {
        onDone();
        missionImageHint.textContent = "Illustration (saved).";
        setHidden("missionImageWrap", false);
      };
      missionImage.onerror = () => {
        onDone();
        missionImage.removeAttribute("src");
        setHidden("missionImageWrap", true);
      };
      missionImage.src = pregenSrc;
    }

    fillList(missionMaterials, rendered.materials ?? []);
    fillList(missionSteps, rendered.steps ?? []);
    missionSiblingStation.textContent = rendered.siblingStation || "Give littles a simple parallel station (blocks, stickers, sensory bin).";

    // Render twists if available
    if (mission.twists) {
      twistsList.innerHTML = "";
      if (mission.twists.easier) {
        const btn = document.createElement("button");
        btn.className = "secondary small";
        btn.textContent = "Easier: " + mission.twists.easier;
        btn.type = "button";
        btn.addEventListener("click", () => {
          if (!current) return;
          const targetDiff = easierDifficulty(current.raw.difficulty);
          const sameCat = missions.filter((m) => m.category === current.raw.category);
          const candidates = sameCat.filter((m) => difficultyRank(m.difficulty) <= difficultyRank(targetDiff));
          const pick = candidates.length ? pickOne(candidates) : null;
          if (pick) {
            showMission(pick, { note: "(Easier try)" });
          } else {
            showMission(current.raw, { templateMode: "min", note: mission.twists.easier });
          }
        });
        twistsList.appendChild(btn);
      }
      if (mission.twists.harder) {
        const btn = document.createElement("button");
        btn.className = "secondary small";
        btn.textContent = "Harder: " + mission.twists.harder;
        btn.type = "button";
        btn.addEventListener("click", () => {
          if (!current) return;
          const sameCat = missions.filter((m) => m.category === current.raw.category);
          const candidates = sameCat.filter((m) => difficultyRank(m.difficulty) > difficultyRank(current.raw.difficulty));
          const pick = candidates.length ? pickOne(candidates) : null;
          if (pick) {
            showMission(pick, { note: "(Harder try)" });
          } else {
            statusText.textContent = mission.twists.harder;
          }
        });
        twistsList.appendChild(btn);
      }
      if (mission.twists.variant) {
        const btn = document.createElement("button");
        btn.className = "secondary small";
        btn.textContent = "Variant: " + mission.twists.variant;
        btn.type = "button";
        btn.addEventListener("click", () => {
          statusText.textContent = mission.twists.variant;
        });
        twistsList.appendChild(btn);
      }
      setHidden("missionTwists", false);
    } else {
      setHidden("missionTwists", true);
    }

    updateFavoriteStar(mission.id);

    const missionEl = $("mission");
    missionEl.setAttribute("data-category", mission.category);
    missionEl.classList.add("reveal");
    missionEl.addEventListener("animationend", () => missionEl.classList.remove("reveal"), { once: true });
    if (state.audioOn) playSound("reveal");

    setHidden("welcome", true);
    setHidden("choices", true);
    setHidden("mission", false);
    updateStatus();

    if (state.audioOn) {
      speakButton.focus();
      speakMission(rendered);
    }
  }

  function speakMission(rendered) {
    const steps = (rendered.steps ?? []).slice(0, 4).join(". ");
    const text = `${rendered.title}. ${rendered.prompt}. Steps: ${steps}.`;
    const ok = speakText(text);
    if (!ok) statusText.textContent = "Audio not available on this browser.";
  }

  function randomMission() {
    const filtered = effectiveFilteredMissions();
    return pickOne(filtered);
  }

  function ensureMainPanel() {
    showOnly("mainPanel", ids);
  }

  function ensureSettingsPanel() {
    showOnly("settingsPanel", ids);
  }

  function ensurePrintPanel() {
    showOnly("printPanel", ids);
  }

  let lastPanelBeforeManage = "profilePickerPanel";

  function ensureProfilePickerPanel() {
    renderProfileCards();
    showOnly("profilePickerPanel", ids);
  }

  function ensureManageProfilesPanel() {
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el && !el.classList.contains("hidden")) {
        lastPanelBeforeManage = id;
        break;
      }
    }
    renderManageProfilesList();
    showOnly("manageProfilesPanel", ids);
  }

  function renderManageProfilesList() {
    const LEVEL_LABELS = { toddler: "Toddler", prek: "Pre-K", kinder: "K", "1st": "1st", any: "Any" };
    const categories = ["build", "phonics", "math", "nature", "social", "responsibility"];
    manageProfilesList.innerHTML = "";
    for (const p of state.profiles) {
      const levels = { ...DEFAULT_LEVELS, ...(p.levels || {}) };
      const item = document.createElement("div");
      item.className = "manage-profile-item";
      const levelsHtml = categories
        .map(
          (cat) =>
            `<label class="muted small">${CATEGORY_LABELS[cat] ?? cat}
              <select data-profile-id="${escapeHtml(p.id)}" data-category="${escapeHtml(cat)}">
                ${LEVEL_ORDER.map((l) => `<option value="${l}" ${l === levels[cat] ? "selected" : ""}>${LEVEL_LABELS[l] ?? l}</option>`).join("")}
              </select>
            </label>`
        )
        .join("");
      item.innerHTML = `
        <div class="manage-profile-item-header">
          <span class="manage-profile-item-name">${AVATAR_EMOJI[p.avatar] ?? "👤"} ${escapeHtml(p.name)}</span>
          ${state.profiles.length > 1 ? `<button class="ghost small" data-remove-profile="${escapeHtml(p.id)}" type="button">Remove</button>` : ""}
        </div>
        <div class="manage-profile-levels">${levelsHtml}</div>
      `;
      manageProfilesList.appendChild(item);
    }
    manageProfilesList.querySelectorAll("select").forEach((sel) => {
      sel.addEventListener("change", (e) => {
        const t = e.target;
        const pid = t.getAttribute("data-profile-id");
        const cat = t.getAttribute("data-category");
        const profile = state.profiles.find((pr) => pr.id === pid);
        if (profile && profile.levels) {
          profile.levels[cat] = t.value;
          persistProfiles();
        }
      });
    });
    manageProfilesList.querySelectorAll("[data-remove-profile]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pid = btn.getAttribute("data-remove-profile");
        state.profiles = state.profiles.filter((pr) => pr.id !== pid);
        if (state.activeProfileId === pid) {
          state.activeProfileId = state.profiles[0]?.id;
          selectProfile(state.activeProfileId);
        }
        persistProfiles();
        renderManageProfilesList();
      });
    });
  }

  let initialLoad = true;
  function route() {
    const h = window.location.hash || "";
    if (h === "#print") {
      initialLoad = false;
      ensurePrintPanel();
      const deck = effectiveFilteredMissions();
      buildPrintDeck(printDeck, deck.length ? deck : missions, (m) => missionToRendered(m, templatePickers, "random"));
      updateStatus();
      return;
    }
    if (!initialLoad) returnFromOverlay();
    initialLoad = false;
    updateStatus();
  }

  // Wire segmented controls.
  difficultySegment.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const d = t.getAttribute("data-difficulty");
    if (!d) return;
    state.difficulty = d;
    state.showFavoritesOnly = false;
    persist();
    updateSegments();
    updateStatus();
  });

  categorySegment.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const c = t.getAttribute("data-category");
    if (!c) return;
    state.category = c;
    state.showFavoritesOnly = false;
    persist();
    updateSegments();
    updateStatus();
  });

  audioToggle.addEventListener("change", () => {
    state.audioOn = audioToggle.checked;
    persist();
    updateStatus();
  });

  // Main actions.
  missionNowButton.addEventListener("click", () => {
    if (state.audioOn) playSound("tap");
    state.showFavoritesOnly = false;
    const m = randomMission();
    if (!m) return showWelcome();
    showMission(m);
  });

  twoChoicesButton.addEventListener("click", () => {
    if (state.audioOn) playSound("tap");
    state.showFavoritesOnly = false;
    showChoicesList();
  });

  document.querySelectorAll("[data-quick-category]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const t = e.currentTarget;
      if (!(t instanceof HTMLElement)) return;
      const cat = t.getAttribute("data-quick-category");
      if (!cat) return;
      state.category = cat;
      state.showFavoritesOnly = false;
      persist();
      updateSegments();
      showChoicesList();
    });
  });

  shuffleChoicesButton.addEventListener("click", () => showChoicesList());
  backToHomeFromChoices.addEventListener("click", () => showWelcome());

  function pickFromChoice(which) {
    if (!currentChoices) return;
    const m = which === "a" ? currentChoices.a : currentChoices.b;
    if (!m) return;
    if (state.audioOn) playSound("tap");
    showMission(m);
  }
  choiceA.addEventListener("click", () => pickFromChoice("a"));
  choiceB.addEventListener("click", () => pickFromChoice("b"));

  newMissionButton.addEventListener("click", () => {
    state.showFavoritesOnly = false;
    const m = randomMission();
    if (!m) return showWelcome();
    showMission(m);
  });

  doneForNowButton.addEventListener("click", () => {
    showWelcome();
    statusText.textContent = "Done for now counts. Come back when it feels fun again.";
  });

  swapMissionButton.addEventListener("click", () => {
    state.showFavoritesOnly = false;
    const filtered = effectiveFilteredMissions();
    if (!filtered.length) return showWelcome();
    if (!current) return showMission(pickOne(filtered));
    let m = pickOne(filtered);
    let guard = 0;
    while (m && current && m.id === current.raw.id && guard < 25) {
      m = pickOne(filtered);
      guard++;
    }
    if (m) showMission(m);
  });

  tryAgainEasierButton.addEventListener("click", () => {
    if (!current) return;
    // If mission has a specific easier twist, prefer it
    if (current.raw.twists && current.raw.twists.easier) {
      const targetDiff = easierDifficulty(current.raw.difficulty);
      const sameCat = missions.filter((m) => m.category === current.raw.category);
      const candidates = sameCat.filter((m) => difficultyRank(m.difficulty) <= difficultyRank(targetDiff));
      const pick = candidates.length ? pickOne(candidates) : null;
      if (pick) {
        showMission(pick, { note: "(Easier try)" });
      } else {
        showMission(current.raw, { templateMode: "min", note: current.raw.twists.easier });
      }
      return;
    }
    const targetDiff = easierDifficulty(current.raw.difficulty);
    const sameCat = missions.filter((m) => m.category === current.raw.category);
    const candidates = sameCat.filter((m) => difficultyRank(m.difficulty) <= difficultyRank(targetDiff));
    const pick = candidates.length ? pickOne(candidates) : null;
    if (pick) {
      showMission(pick, { note: " (Easier try)" });
      return;
    }
    // Fallback: use the same mission but with “min” template vars and fewer steps.
    const note = " (Easier try: do just Step 1–2, then stop.)";
    showMission(current.raw, { templateMode: "min", note });
    // Trim steps visually to 2 (we keep data intact).
    const rendered = current.rendered;
    const trimmed = (rendered.steps ?? []).slice(0, 2);
    fillList(missionSteps, trimmed);
  });

  speakButton.addEventListener("click", () => {
    if (!current) return;
    speakMission(current.rendered);
  });

  async function generateIllustration() {
    if (!current) return;

    // If already cached, just reveal it.
    const cached = imageCache.get(current.raw.id);
    if (cached?.src) {
      missionImage.src = cached.src;
      missionImageHint.textContent = cached.hint || "Illustration (cached for this session).";
      setHidden("missionImageWrap", false);
      return;
    }

    imageButton.disabled = true;
    missionImageHint.textContent = "Generating illustration… (this uses the local server and an API key)";
    setHidden("missionImageWrap", false);

    try {
      const r = current.rendered;
      const promptParts = [
        `Mission title: ${r.title}`,
        `Mission: ${r.prompt}`,
        Array.isArray(r.materials) && r.materials.length ? `Materials: ${r.materials.slice(0, 6).join(", ")}` : "",
        "Make it concrete and action-focused."
      ].filter(Boolean);

      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: promptParts.join("\n") })
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || `Server error (${res.status})`);
      }

      const src = json?.dataUrl || json?.url;
      if (typeof src !== "string" || !src) throw new Error("No image returned.");

      missionImage.src = src;
      missionImageHint.textContent = "Illustration (generated).";
      imageCache.set(current.raw.id, { src, hint: "Illustration (cached for this session)." });
      setHidden("missionImageWrap", false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      missionImageHint.textContent =
        "Couldn’t generate an image. If you want this feature, run the app via `mighty-mini-missions/server/` and set OPENAI_API_KEY. (" +
        msg +
        ")";
      missionImage.removeAttribute("src");
      setHidden("missionImageWrap", false);
    } finally {
      imageButton.disabled = false;
    }
  }

  imageButton.addEventListener("click", () => {
    generateIllustration();
  });

  favoriteButton.addEventListener("click", () => {
    if (!current) return;
    if (state.favorites.has(current.raw.id)) state.favorites.delete(current.raw.id);
    else state.favorites.add(current.raw.id);
    persist();
    updateFavoriteStar(current.raw.id);
    updateStatus();
  });

  let selectedRating = null;
  missionCompleteButton.addEventListener("click", () => {
    if (!current) return;
    selectedRating = null;
    completionNoteInput.value = "";
    completionDoneButton.disabled = true;
    completionRatings.querySelectorAll(".completion-rating").forEach((b) => b.classList.remove("selected"));
    setHidden("completionModal", false);
  });

  completionRatings.querySelectorAll(".completion-rating").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedRating = btn.getAttribute("data-rating");
      completionRatings.querySelectorAll(".completion-rating").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      completionDoneButton.disabled = false;
    });
  });

  function closeCompletionModalHandler() {
    setHidden("completionModal", true);
  }

  completionDoneButton.addEventListener("click", () => {
    if (!current || !selectedRating) return;
    const completion = {
      missionId: current.raw.id,
      missionTitle: current.rendered.title,
      date: new Date().toISOString().slice(0, 10),
      rating: selectedRating,
      note: completionNoteInput.value.trim()
    };
    saveCompletion(state.activeProfileId, completion);
    window.MightyProgress?.log({
      game: "missions",
      skill: `Missions: ${current.raw.category}`,
      item: completion.missionTitle,
      correct: null,
      extra: { rating: completion.rating, difficulty: current.raw.difficulty, note: completion.note.slice(0, 500) || undefined }
    });
    closeCompletionModalHandler();
    showRewardReveal(current.raw, current.rendered);
  });

  if (closeCompletionModal) {
    closeCompletionModal.addEventListener("click", closeCompletionModalHandler);
  }
  completionModal.addEventListener("click", (e) => {
    if (e.target === completionModal) closeCompletionModalHandler();
  });

  function createConfetti() {
    if (!confetti) return;
    const colors = ["#78a6ff", "#9affc8", "#ff6b6b", "#ffd93d", "#6bcb77", "#ec4899", "#8b5cf6"];
    const shapes = ["", "confetti-circle", "confetti-star"];
    for (let i = 0; i < 50; i++) {
      const piece = document.createElement("div");
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      piece.className = "confetti-piece" + (shape ? " " + shape : "");
      piece.style.left = Math.random() * 100 + "%";
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = Math.random() * 0.8 + "s";
      piece.style.animationDuration = 1.5 + Math.random() * 1 + "s";
      piece.style.width = (6 + Math.random() * 10) + "px";
      piece.style.height = (6 + Math.random() * 10) + "px";
      confetti.appendChild(piece);
      setTimeout(() => piece.remove(), 3500);
    }
  }

  function getThisWeekCount(profileId) {
    const completions = loadCompletions(profileId);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return completions.filter((c) => new Date(c.date) >= startOfWeek).length;
  }

  function showRewardReveal(mission, rendered) {
    if (!rewardOverlay || !rewardPresent || !rewardBadge) {
      showWelcome();
      statusText.textContent = "Mission complete! Badge earned.";
      return;
    }
    rewardPresent.classList.remove("opened");
    rewardPresent.classList.remove("hidden");
    rewardBadge.classList.add("hidden");
    badgeTitle.textContent = rendered.title;
    badgeCircle.textContent = CATEGORY_EMOJI[mission.category] ?? "⭐";
    const weekCount = getThisWeekCount(state.activeProfileId);
    const streakEl = document.getElementById("rewardStreak");
    if (streakEl) {
      streakEl.textContent = weekCount > 1 ? `${weekCount} missions this week!` : "";
      streakEl.classList.toggle("hidden", weekCount <= 1);
    }
    if (confetti) confetti.innerHTML = "";

    rewardOverlay.classList.remove("hidden");

    const onPresentTap = () => {
      rewardPresent.removeEventListener("click", onPresentTap);
      rewardPresent.classList.add("opened");
      if (state.audioOn) playSound("celebrate");
      setTimeout(() => {
        rewardPresent.classList.add("hidden");
        rewardBadge.classList.remove("hidden");
        createConfetti();
      }, 400);
    };
    rewardPresent.addEventListener("click", onPresentTap);
  }

  collectBadgeButton.addEventListener("click", () => {
    rewardOverlay.classList.add("hidden");
    showWelcome();
    statusText.textContent = "Badge collected! Great job.";
    renderProfileCards();
  });

  viewBadgesButton.addEventListener("click", () => {
    renderBadgesGrid();
    showOnly("badgesPanel", ids);
  });

  closeBadgesButton.addEventListener("click", () => {
    ensureProfilePickerPanel();
  });

  let badgesSelectedProfileId = null;
  function renderBadgesGrid() {
    badgesSelectedProfileId = badgesSelectedProfileId ?? state.activeProfileId;
    badgesProfileTabs.innerHTML = "";
    for (const p of state.profiles) {
      const tab = document.createElement("button");
      tab.className = "mission-log-tab" + (p.id === badgesSelectedProfileId ? " selected" : "");
      tab.type = "button";
      const completions = loadCompletions(p.id);
      const byMission = {};
      for (const c of completions) {
        byMission[c.missionId] = (byMission[c.missionId] || 0) + 1;
      }
      const badgeCount = Object.keys(byMission).length;
      tab.innerHTML = `${AVATAR_EMOJI[p.avatar] ?? "👤"} ${escapeHtml(p.name)}${badgeCount ? ` (${badgeCount})` : ""}`;
      tab.addEventListener("click", () => {
        badgesSelectedProfileId = p.id;
        renderBadgesGrid();
      });
      badgesProfileTabs.appendChild(tab);
    }
    const completions = loadCompletions(badgesSelectedProfileId);
    const byMission = {};
    for (const c of completions) {
      if (!byMission[c.missionId]) byMission[c.missionId] = { title: c.missionTitle, count: 0 };
      byMission[c.missionId].count++;
    }
    badgesGrid.innerHTML = "";
    const missionIds = Object.keys(byMission);
    const missionMap = new Map(missions.map((m) => [m.id, m]));
    for (const mid of missionIds) {
      const { title, count } = byMission[mid];
      const mission = missionMap.get(mid);
      const emoji = mission ? CATEGORY_EMOJI[mission.category] ?? "⭐" : "⭐";
      const item = document.createElement("div");
      item.className = "badge-item";
      item.title = title;
      item.innerHTML = `
        <span class="badge-item-emoji">${emoji}</span>
        ${count > 1 ? `<span class="badge-item-count">×${count}</span>` : ""}
      `;
      badgesGrid.appendChild(item);
    }
    if (missionIds.length === 0) {
      badgesGrid.innerHTML = '<p class="muted">No badges yet. Complete a mission to earn one!</p>';
    }
  }

  missionLogButton.addEventListener("click", () => {
    renderMissionLog();
    showOnly("missionLogPanel", ids);
  });

  closeMissionLogButton.addEventListener("click", () => {
    ensureSettingsPanel();
  });

  let missionLogSelectedProfileId = null;
  function renderMissionLog() {
    missionLogSelectedProfileId = missionLogSelectedProfileId ?? state.activeProfileId;
    missionLogProfileTabs.innerHTML = "";
    for (const p of state.profiles) {
      const tab = document.createElement("button");
      tab.className = "mission-log-tab" + (p.id === missionLogSelectedProfileId ? " selected" : "");
      tab.type = "button";
      const count = loadCompletions(p.id).length;
      tab.innerHTML = `${AVATAR_EMOJI[p.avatar] ?? "👤"} ${escapeHtml(p.name)}${count ? ` (${count})` : ""}`;
      tab.addEventListener("click", () => {
        missionLogSelectedProfileId = p.id;
        renderMissionLog();
      });
      missionLogProfileTabs.appendChild(tab);
    }
    const completions = loadCompletions(missionLogSelectedProfileId);
    missionLogList.innerHTML = "";
    const RATING_LABELS = { "too-easy": "Too Easy", "just-right": "Just Right", "too-hard": "Too Hard" };
    if (completions.length === 0) {
      missionLogList.innerHTML = '<p class="muted">No missions completed yet.</p>';
    } else {
      for (const c of completions) {
        const item = document.createElement("div");
        item.className = "mission-log-item";
        item.innerHTML = `
          <div class="mission-log-item-title">${escapeHtml(c.missionTitle || c.missionId)}</div>
          <div class="mission-log-item-meta">${escapeHtml(c.date)} • ${RATING_LABELS[c.rating] ?? c.rating}${c.note ? ` • ${escapeHtml(c.note)}` : ""}</div>
        `;
        missionLogList.appendChild(item);
      }
    }
  }

  function openSkillsModal() {
    if (!current) return;
    const skills = current.raw.skills;
    if (skills) {
      skillsForMax.textContent = skills.forMax || "This mission builds important skills through play!";
      skillsForParent.textContent = skills.forParent || "";
    } else {
      skillsForMax.textContent = "This mission builds important skills through play!";
      skillsForParent.textContent = "";
    }
    setHidden("skillsModal", false);
  }

  function closeSkillsModalHandler() {
    setHidden("skillsModal", true);
  }

  whyButton.addEventListener("click", () => {
    openSkillsModal();
  });

  closeSkillsModal.addEventListener("click", () => {
    closeSkillsModalHandler();
  });

  skillsModal.addEventListener("click", (e) => {
    if (e.target === skillsModal) {
      closeSkillsModalHandler();
    }
  });

  backToGamesButton.addEventListener("click", () => openHub());

  // Profile indicator - switch profile
  profileIndicator.addEventListener("click", () => {
    ensureProfilePickerPanel();
  });

  manageProfilesButton.addEventListener("click", () => {
    ensureManageProfilesPanel();
  });

  if (manageProfilesSettingsButton) {
    manageProfilesSettingsButton.addEventListener("click", () => {
      ensureManageProfilesPanel();
    });
  }

  closeManageProfilesButton.addEventListener("click", () => {
    if (lastPanelBeforeManage === "settingsPanel") ensureSettingsPanel();
    else ensureProfilePickerPanel();
  });

  addProfileButton.addEventListener("click", () => {
    const name = prompt("Name for new profile?") || "New Kid";
    const id = "profile-" + Date.now();
    const newProfile = {
      id,
      name: name.trim() || "New Kid",
      avatar: "heart",
      levels: { ...DEFAULT_LEVELS }
    };
    state.profiles.push(newProfile);
    persistProfiles();
    renderManageProfilesList();
  });

  // Settings panel.
  settingsButton.addEventListener("click", () => {
    ensureSettingsPanel();
    updateSegments();
  });
  closeSettingsButton.addEventListener("click", () => {
    returnFromOverlay();
  });

  resetFiltersButton.addEventListener("click", () => {
    state.difficulty = "any";
    state.category = "any";
    state.showFavoritesOnly = false;
    persist();
    updateSegments();
    updateStatus();
    statusText.textContent = "Filters reset.";
  });

  showFavoritesButton.addEventListener("click", () => {
    state.showFavoritesOnly = true;
    ensureMainPanel();
    showChoicesList();
    statusText.textContent = state.favorites.size ? "Favorites (pick one)" : "No favorites yet. Tap ☆ on a mission.";
  });

  clearFavoritesButton.addEventListener("click", () => {
    state.favorites.clear();
    persist();
    updateStatus();
    statusText.textContent = "Favorites cleared.";
  });

  // Print deck.
  printButton.addEventListener("click", () => window.print());
  backFromPrint.addEventListener("click", () => {
    window.location.hash = "";
  });

  window.addEventListener("hashchange", route);

  // Initialize.
  updateProfileHeader();
  updateSegments();
  ensureProfilePickerPanel();
  route();

  // Small sanity check for extremely small libraries.
  if (missions.length < 10) {
    statusText.textContent = `${statusText.textContent} • (Consider adding more missions for variety)`;
  }
}

main().catch((err) => {
  // Keep it readable for non-technical users.
  const msg = err instanceof Error ? err.message : String(err);
  const el = document.getElementById("statusText");
  if (el) el.textContent = `App error: ${msg}`;
  // Also log for debugging.
  // eslint-disable-next-line no-console
  console.error(err);
});

