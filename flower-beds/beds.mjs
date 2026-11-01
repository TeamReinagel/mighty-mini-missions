/** Two beds of ten. The first fills before the second starts. */
export function splitBeds(count) {
  const n = Math.max(0, Math.min(20, count));
  return { first: Math.min(10, n), second: Math.max(0, n - 10) };
}

/** The two nearest amounts, so the gardens differ by one pot. */
export function nearby(count) {
  const picks = [count - 1, count + 1, count - 2, count + 2]
    .filter((n) => n >= 1 && n <= 20 && n !== count);
  return [count, picks[0], picks[1]];
}

/** The card stays the thing to count. These lines never say how many flowers are already planted. */
export function gardenPrompt(count, say) {
  return `The card says ${say(count)}. A full bed holds ten. Count the flowers, then tap the watering can.`;
}

export function gardenMiss(verdict, count, say) {
  const why = verdict === "short" ? "Not enough" : "Too many";
  return `${why}. Count the flowers, then tap Try again. A full bed holds ten. The card says ${say(count)}.`;
}

export function gardenEmpty(count, say) {
  return `The beds are empty. The card says ${say(count)}. A full bed holds ten. Count as you plant.`;
}

export function gardenRemind(count, say) {
  return `Count the flowers. A full bed holds ten. The card says ${say(count)}.`;
}

/** What the beds show, in words. `say` turns a number into a spoken word. */
export function shape(count, say = (n) => String(n)) {
  const n = Math.max(0, Math.min(20, count));
  if (n === 20) return "Both beds are full.";
  if (n === 10) return "This bed is full.";
  if (n > 10) return `One full bed and ${say(n - 10)} more.`;
  if (n === 0) return "Both beds are empty.";
  return `${say(n)} in the first bed.`;
}
