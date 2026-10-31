/** Scoops always land. The stand never refuses one, so the next tap is not the answer. */
export function placeScoops(made, size = 1) {
  const n = Number(size);
  const add = Number.isFinite(n) && n > 0 ? n : 1;
  return made + add;
}

/** Compared only when the child serves. */
export function checkOrder(made, count) {
  if (made === count) return "exact";
  return made < count ? "short" : "over";
}

function scoopsWord(count) {
  return count === 1 ? "scoop" : "scoops";
}

function askedFor({ count, names, holder, say }) {
  if (names) return `The card says ${say(count)}.`;
  return `The bunny wants ${say(count)} ${scoopsWord(count)} ${holder}.`;
}

export function orderPrompt({ count, names = false, holder = "", party = false, say }) {
  if (party) {
    return `Party order! The bunny wants ${count} scoops. A full dish holds ten. Count them, then tap the bunny.`;
  }
  if (names) {
    return `This card says ${say(count)}. Put that many scoops ${holder}. Count them, then tap the bunny.`;
  }
  return `The bunny wants ${say(count)} ${scoopsWord(count)} ${holder}. Count them, then tap the bunny.`;
}

/** A miss names too many or not enough, and never how many scoops are sitting there. */
export function missPrompt({ verdict, count, names = false, holder = "", party = false, say }) {
  const why = verdict === "short" ? "Not enough" : "Too many";
  if (party) {
    return `${why}. Count the dishes, then tap Try again. A full dish holds ten. The order is ${count}.`;
  }
  return `${why}. Count these scoops, then tap Try again. ${askedFor({ count, names, holder, say })}`;
}

export function emptyPrompt({ count, names = false, holder = "", party = false, say }) {
  if (party) return `The tray is empty. The order is ${count}. A full dish holds ten. Count as you add them.`;
  return `Nothing there yet. ${askedFor({ count, names, holder, say })} Count as you add them.`;
}
