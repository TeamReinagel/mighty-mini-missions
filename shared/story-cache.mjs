// Episode pictures and voice files stay on the tablet. Bump this when a file
// under moon-path/assets, apple-catcher/assets, or bag-at-the-door/assets changes
// so the new file has a new address.
export const STORY_ASSET_REV = "1";

export function storyAsset(href) {
  const hashAt = href.indexOf("#");
  const base = hashAt < 0 ? href : href.slice(0, hashAt);
  const hash = hashAt < 0 ? "" : href.slice(hashAt);
  return `${base}${base.includes("?") ? "&" : "?"}v=${STORY_ASSET_REV}${hash}`;
}

export function openingPictures(episode, names) {
  return names.map((name) => storyAsset(`../${episode}/assets/${name}.png`));
}
