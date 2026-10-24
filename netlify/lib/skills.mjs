// One skill map per child. Academic steps come from Today with Joyce.
// Essential steps are Universal Framework 2.0 (Skills Builder Partnership). The educator
// toolkit is netlify/skills/UF2.0-Toolkit-Educators.pdf. This map keeps steps 1–6:
// Getting started (steps 1–4, the ages 5–9 band) plus the first two Intermediate steps.
// Steps 7–16 stay in the toolkit. Step names and "I can" lines are theirs.
// CC BY-NC-ND: https://creativecommons.org/licenses/by-nc-nd/4.0/

export const FRAMEWORK = "Skills Builder Universal Framework 2.0";
export const FRAMEWORK_URL = "https://www.skillsbuilder.org/global/universal-framework";
export const FRAMEWORK_TOOLKIT = "netlify/skills/UF2.0-Toolkit-Educators.pdf";

export const PERSIST_STEP = "adapting-3";
export const HELP_STEP = "problem-solving-2";

const AUTO = new Set(["persist", "help"]);

function skill(id, name, group, about, steps) {
  return {
    id,
    name,
    group,
    about,
    steps: steps.map(([title, statement, invite], index) => ({
      n: index + 1,
      id: `${id}-${index + 1}`,
      name: title,
      statement,
      invite
    }))
  };
}

export const ESSENTIAL = [
  skill("listening", "Listening", "Communication", "Receiving, retaining and processing information", [
    ["Focusing", "I can listen for at least a short time", "At dinner, tell {name} one short thing and see if they stay with it to the end."],
    ["Recalling", "I remember simple instructions", "Give {name} two small jobs, then ask what they were."],
    ["Checking", "I ask questions if I don't understand", "When {name} looks unsure, wait and see if they ask."],
    ["Retelling", "I pass on information accurately", "Tell {name} a short message for someone else in the house."],
    ["Recognising purpose", "I know why someone is communicating with me", "Before a story, ask {name} why they think you are telling it."],
    ["Note-taking", "I record important information", "Ask {name} to draw the one thing they want to remember."]
  ]),
  skill("speaking", "Speaking", "Communication", "Transmitting information or ideas", [
    ["Sharing clearly", "I communicate clearly with someone I know", "Ask {name} to tell you one thing that happened today."],
    ["Discussing together", "I communicate clearly in a small group", "At a meal, give {name} a turn to tell the table something."],
    ["Meeting others", "I communicate with new people when I need to", "Next time you see a neighbor, let {name} say hello if they want to."],
    ["Organising thoughts", "I order my points to be understood", "Ask {name} what happened first, next, and last."],
    ["Knowing the audience", "I adapt my communication to what my audience already know", "Ask {name} to explain a game to someone who has not played it."],
    ["Choosing language", "I choose appropriate language for the situation", "Notice when {name} picks different words for a little sibling than for you."]
  ]),
  skill("problem-solving", "Problem Solving", "Creative Problem Solving", "Finding solutions to challenges", [
    ["Following instructions", "I follow instructions", "Give {name} a two-step job and let them follow it."],
    ["Seeking support", "I find help from someone if needed", "When something is hard, wait and see if {name} asks for help."],
    ["Sharing problems", "I describe problems to others", "When something goes wrong, ask {name} to tell you the problem."],
    ["Finding information", "I find information to complete a task", "Ask {name} where they could look to finish a job."],
    ["Creating options", "I create different possible solutions to a problem", "Ask {name} for two different ways to solve one small problem."],
    ["Analysing options", "I identify advantages and disadvantages of potential solutions", "Ask {name} what is good and what is hard about one of those ways."]
  ]),
  skill("creativity", "Creativity", "Creative Problem Solving", "Using imagination and generating new ideas", [
    ["Imagining", "I imagine different things", "Ask {name} to imagine what an animal would do next."],
    ["Sharing imagination", "I share what I imagine with someone", "Ask {name} to tell you the idea they just imagined."],
    ["Expressing imagination", "I share what I imagine in different ways", "Offer {name} blocks or paper so the idea can come out another way."],
    ["Generating ideas", "I create ideas to solve a problem", "Hand {name} a small problem and ask for an idea."],
    ["Suggesting improvements", "I create ideas to make something better", "Ask {name} how they would make a game they already like a little better."],
    ["Combining concepts", "I can combine ideas to make new ones", "Ask {name} to mash two ideas into one new one."]
  ]),
  skill("adapting", "Adapting", "Self-Management", "Overcoming challenges and setbacks to achieve goals", [
    ["Identifying emotions", "I can tell how I am feeling", "Ask {name} to name how they feel right now."],
    ["Recognising emotions", "I can tell how others are feeling", "Ask {name} how someone else in the room might be feeling."],
    ["Persisting", "I keep going when faced with challenges", "When a job is hard, notice if {name} keeps going."],
    ["Managing reactions", "I respond calmly when faced with challenges", "When plans change, notice if {name} can settle and try again."],
    ["Reflective learning", "I reflect and learn from challenges", "After a hard moment, ask {name} what they would try next time."],
    ["Supporting others", "I help others face challenges", "When a sibling is stuck, see if {name} stays with them."]
  ]),
  skill("planning", "Planning", "Self-Management", "Setting goals and designing routes to achieve them", [
    ["Sensing difficulty", "I know when something is too difficult", "Notice when {name} says a job is too hard."],
    ["Identifying successes", "I know what doing well looks like for me", "Before a game {name} likes, ask {name} what a great try looks like."],
    ["Working carefully", "I work with care and attention", "Give {name} a careful job, like pouring or lining things up."],
    ["Recognising strengths", "I recognise what I am good at", "Ask {name} what they are good at."],
    ["Facing challenges", "I take a positive approach to new challenges", "Offer {name} one new small challenge and see how they meet it."],
    ["Setting goals", "I set achievable goals for myself", "Ask {name} to pick one thing they want to finish today."]
  ]),
  skill("leadership", "Leadership", "Collaboration", "Supporting, encouraging and motivating others to achieve a shared goal", [
    ["Understanding reactions", "I know how an idea makes me feel", "After a family idea, ask {name} how it makes them feel."],
    ["Sharing reactions", "I explain how an idea makes me feel when appropriate", "Ask {name} if they want to say how an idea makes them feel."],
    ["Recognising reactions", "I know when others have strong feelings about something", "Ask {name} who else might feel strongly about the plan."],
    ["Organising tasks", "I divide up tasks in a fair way", "Let {name} split a job between two people in a fair way."],
    ["Managing resources", "I manage team time and resources to complete tasks", "Let {name} decide who has time for a small family job."],
    ["Mentoring", "I use my experience to support others", "When a sibling is learning something {name} already knows, see if they help."]
  ]),
  skill("teamwork", "Teamwork", "Collaboration", "Working cooperatively with others to achieve a shared goal", [
    ["Working together", "I work with others when appropriate", "Invite {name} into a job you are already doing."],
    ["Adjusting behaviour", "I behave in a way that fits the setting", "Name the place you are in and notice if {name}'s voice and body fit it."],
    ["Time keeping", "I keep to time reliably", "Give {name} a time to be ready and see if they come."],
    ["Taking responsibility", "I take responsibility for completing tasks", "Hand {name} one job that is theirs to finish."],
    ["Supporting others", "I help others as much as I can", "See if {name} helps a sibling with a job."],
    ["Being accountable", "I am accountable for my goals", "Ask {name} what they said they would do, and whether they did it."]
  ])
];

const ESSENTIAL_BY_ID = new Map();
for (const entry of ESSENTIAL) {
  for (const step of entry.steps) ESSENTIAL_BY_ID.set(step.id, { skill: entry, step });
}

export function essentialById(id) {
  return ESSENTIAL_BY_ID.get(id) || null;
}

export function isEssentialId(id) {
  return ESSENTIAL_BY_ID.has(id);
}

export function catalogText() {
  const lines = [`Essential skills (${FRAMEWORK}). Use an id only when the note clearly shows that step:`];
  for (const entry of ESSENTIAL) {
    for (const step of entry.steps) lines.push(`${step.id} ${entry.name}: ${step.name}. ${step.statement}`);
  }
  return lines.join("\n");
}

export function describeEssential(id) {
  const found = essentialById(id);
  if (!found) return "";
  const name = found.step.name.charAt(0).toLowerCase() + found.step.name.slice(1);
  return `${found.skill.name}: ${name}`;
}

export function cleanStepIds(ids, allowed) {
  const ok = allowed instanceof Set ? allowed : new Set(allowed || []);
  const out = [];
  for (const id of Array.isArray(ids) ? ids : []) {
    const key = String(id || "").trim();
    if (!key || !ok.has(key) || out.includes(key)) continue;
    out.push(key);
    if (out.length >= 2) break;
  }
  return out;
}

export function addDays(date, days) {
  const [year, month, day] = String(date).split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

export function nextSchoolDay(date) {
  let cursor = addDays(date, 1);
  for (let i = 0; i < 7; i += 1) {
    const [year, month, day] = cursor.split("-").map(Number);
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    if (weekday !== 0 && weekday !== 6) return cursor;
    cursor = addDays(cursor, 1);
  }
  return cursor;
}

/** practicing, shown, confirmed, slipping, noticed, or new. */
export function academicStatus(rec) {
  if (!rec) return "new";
  if (rec.slipping) return "slipping";
  if (rec.confirmedAt) return "confirmed";
  if (rec.mastered || rec.shownAt) return "shown";
  if (rec.graded) return "practicing";
  if (rec.sightings?.length) return "noticed";
  return "new";
}

export function addSpot(spots, spot) {
  const list = Array.isArray(spots) ? spots.slice() : [];
  const stepId = String(spot.stepId || "");
  const day = String(spot.day || "");
  const source = String(spot.source || "note");
  if (!stepId || !day) return list;
  if (list.some((entry) => entry.stepId === stepId && entry.day === day && entry.source === source)) return list;
  list.push({
    id: spot.id || `${stepId}:${day}:${source}:${list.length}`,
    stepId,
    day,
    source,
    obsId: spot.obsId || "",
    text: spot.text || "",
    at: spot.at || Date.now()
  });
  return list;
}

/**
 * Confirmed after two spots on different days, unless both are the same automatic signal.
 * Two parent notes are enough. Two "kept going" signals are not.
 */
export function essentialStatus(spots, stepId) {
  const mine = (spots || []).filter((entry) => entry.stepId === stepId);
  let confirmed = false;
  for (let i = 0; i < mine.length; i += 1) {
    for (let j = i + 1; j < mine.length; j += 1) {
      if (mine[i].day === mine[j].day) continue;
      const sameSignal = mine[i].source === mine[j].source && AUTO.has(mine[i].source);
      if (!sameSignal) confirmed = true;
    }
  }
  return { spots: mine.length, days: new Set(mine.map((entry) => entry.day)).size, confirmed };
}

export function nextToNotice(spots) {
  let best = null;
  for (const entry of ESSENTIAL) {
    const mine = (spots || []).filter((spot) => entry.steps.some((step) => step.id === spot.stepId));
    if (!mine.length) continue;
    const step = entry.steps.find((candidate) => !essentialStatus(spots, candidate.id).confirmed);
    if (!step) continue;
    const newest = mine.map((spot) => spot.day).sort().at(-1);
    if (!best || newest > best.newest || (newest === best.newest && ESSENTIAL.indexOf(entry) < ESSENTIAL.indexOf(best.skill))) {
      best = { skill: entry, step, newest };
    }
  }
  return best;
}

export function noticeLine(name, notice) {
  if (!notice) return "";
  const invite = notice.step.invite.replaceAll("{name}", name);
  return `Next to notice for ${name}: ${notice.skill.name} step ${notice.step.n}, ${notice.step.name.toLowerCase()}. ${notice.step.statement}. ${invite}`;
}

export function scoreCheck(entries) {
  const list = Array.isArray(entries) ? entries : [];
  const counted = list.filter((entry) => entry && !entry.void && entry.done !== false && (entry.correct === true || entry.correct === false));
  const right = counted.filter((entry) => entry.correct === true).length;
  return { right, counted: counted.length, of: list.length, passed: right >= 2 };
}

export function applyCheck(rec, { date, passed, right }) {
  const base = rec || {};
  const checks = [...(base.checks || []), { date, right, passed: Boolean(passed) }];
  if (!passed) {
    return {
      ...base,
      checks,
      slipping: true,
      mastered: false,
      confirmedAt: null,
      recent: [],
      nextCheck: null,
      checkMisses: (base.checkMisses || 0) + 1
    };
  }
  const priorPasses = (base.checks || []).filter((entry) => entry.passed).length;
  if (!base.confirmedAt) {
    return { ...base, checks, confirmedAt: date, slipping: false, nextCheck: addDays(date, 7), checkMisses: 0, mastered: true };
  }
  if (priorPasses >= 2) return { ...base, checks, slipping: false, nextCheck: null, checkMisses: 0 };
  return { ...base, checks, slipping: false, nextCheck: addDays(base.confirmedAt, 21), checkMisses: 0 };
}

/** The one cold check due today, if any. Confirming a shown skill comes before a review. */
export function checkDue(records, defs, date) {
  const due = [];
  for (const def of defs || []) {
    if (!def || def.activity === "story" || def.placed) continue;
    const rec = records?.[def.id];
    if (!rec?.shownAt || rec.slipping) continue;
    if (!rec.nextCheck || rec.nextCheck > date) continue;
    due.push({ def, rec, confirm: !rec.confirmedAt });
  }
  due.sort((a, b) => Number(b.confirm) - Number(a.confirm) || String(a.rec.nextCheck).localeCompare(String(b.rec.nextCheck)));
  return due[0]?.def || null;
}

export function skillMap({ stepDefs = [], records = {}, essential = {} } = {}) {
  const academic = [];
  for (const def of stepDefs) {
    const rec = records?.[def.id];
    const status = academicStatus(rec);
    if (status === "new") continue;
    academic.push({
      id: def.id,
      title: def.title,
      skill: def.skill,
      status,
      nextCheck: rec?.nextCheck || null,
      checkMisses: rec?.checkMisses || 0,
      sightings: rec?.sightings || []
    });
  }
  const spots = essential?.spots || [];
  const essentialRows = [];
  for (const entry of ESSENTIAL) {
    for (const step of entry.steps) {
      const status = essentialStatus(spots, step.id);
      if (!status.spots) continue;
      essentialRows.push({
        id: step.id,
        skill: entry.name,
        name: step.name,
        statement: step.statement,
        spots: status.spots,
        confirmed: status.confirmed
      });
    }
  }
  return { academic, essential: essentialRows, notice: nextToNotice(spots) };
}

/** What the Friday report may say. Essential skills are strengths, never a list of gaps. */
export function reportView(map) {
  const titles = (status) => map.academic.filter((entry) => entry.status === status).map((entry) => entry.title);
  return {
    confirmed: titles("confirmed"),
    shown: titles("shown"),
    slipping: titles("slipping"),
    practicing: titles("practicing"),
    noticed: titles("noticed"),
    essentialStrengths: map.essential.map((entry) => `${entry.skill}: ${entry.name}${entry.confirmed ? " (confirmed)" : " (spotted)"}`)
  };
}
