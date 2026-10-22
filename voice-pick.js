// One voice choice for every game. Browsers hand a page the oldest, most robotic voice first,
// so this ranks what the device offers: Siri, Premium, Enhanced, and Natural voices ahead of
// Samantha and the other compact ones. Novelty voices like Bells and Zarvox are never picked.
// A grown-up can override the pick: open any new game with ?voice=pick and choose from the list.
(function () {
  const KEY = "mightyMini.voice";
  const NOVELTY = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley)\b/i;

  function english() {
    if (!("speechSynthesis" in window)) return [];
    return speechSynthesis.getVoices().filter((v) => /^en([-_]|$)/i.test(v.lang) && !NOVELTY.test(v.name));
  }

  function score(v) {
    const name = v.name;
    let s = 0;
    if (/siri/i.test(name)) s += 120;
    if (/premium/i.test(name)) s += 100;
    if (/natural|neural/i.test(name)) s += 90;
    if (/enhanced/i.test(name)) s += 80;
    if (/google/i.test(name)) s += 60;
    if (/\b(ava|zoe|allison|susan|evan|nathan|joelle|noelle|aria|jenny)\b/i.test(name)) s += 20;
    if (/\bsamantha\b/i.test(name)) s += 10;
    if (/^en[-_]us/i.test(v.lang)) s += 15;
    if (v.localService) s += 5;
    return s;
  }

  function saved() {
    try { return localStorage.getItem(KEY) || ""; } catch { return ""; }
  }

  function list() {
    return english().sort((a, b) => score(b) - score(a));
  }

  function pick() {
    const voices = list();
    const name = saved();
    return voices.find((v) => v.name === name) || voices[0] || null;
  }

  function choose(name) {
    try {
      if (name) localStorage.setItem(KEY, name);
      else localStorage.removeItem(KEY);
    } catch { /* private mode: the ranked pick still works */ }
  }

  window.MightyVoice = { pick, list, choose, saved };
})();
