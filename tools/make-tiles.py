#!/usr/bin/env python3
"""Make the small pictures the home screen and Missions show.

The home screen shows each game as a ~150px tile, but most game icons are 1024px
originals of 300-500 KB (The Moon Path's is a 2.8 MB scene). This writes a 320px
WebP copy of each icon to shared/tiles/, a small header logo, and 768px JPEG
copies of the mission illustrations to illustrations/web/. Originals stay where
they are for the games' own pages and install icons.

Run from the repository root after adding a game or changing an icon:

    python3 tools/make-tiles.py

Then give that game `tile: "./shared/tiles/<game id>.webp"` in games.js.
Needs Pillow (pip install pillow).
"""
import pathlib
import re
import sys

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
TILES = ROOT / "shared" / "tiles"
TILE_EDGE = 320  # short side, px: sharp on a 2x tablet at the tile's ~150px size


def shrink(img, short_side):
    w, h = img.size
    scale = short_side / min(w, h)
    if scale >= 1:
        return img.copy()
    return img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)


def tile(src, dest):
    img = Image.open(src)
    img = img.convert("RGBA") if img.mode in ("RGBA", "LA", "P") else img.convert("RGB")
    shrink(img, TILE_EDGE).save(dest, "WEBP", quality=82, method=6)
    return dest


def originals_from_games_js():
    """Map game id -> original icon path, from each entry's `icon` in games.js."""
    text = (ROOT / "games.js").read_text()
    out = {}
    entries = list(re.finditer(r"\bid:\s*\"([^\"]+)\"", text))
    for i, entry in enumerate(entries):
        end = entries[i + 1].start() if i + 1 < len(entries) else len(text)
        src = re.search(r"\bicon:\s*\"\./([^\"?]+)", text[entry.end():end])
        if src:
            out[entry.group(1)] = ROOT / src.group(1)
    return out


def main():
    TILES.mkdir(parents=True, exist_ok=True)
    made = 0
    for gid, src in originals_from_games_js().items():
        if src.suffix == ".svg" or not src.exists():
            continue
        tile(src, TILES / f"{gid}.webp")
        made += 1

    # Header logo (shown at ~28px) and the favicon.
    logo = Image.open(ROOT / "logo.png").convert("RGBA")
    logo.resize((96, 96), Image.LANCZOS).save(TILES / "logo-96.png", optimize=True)
    tile(ROOT / "logo.png", TILES / "missions.webp")

    # Mission illustrations: 1024px PNGs of ~1.6 MB each -> 768px JPEGs.
    web = ROOT / "illustrations" / "web"
    web.mkdir(exist_ok=True)
    for png in sorted((ROOT / "illustrations").glob("*.png")):
        img = Image.open(png).convert("RGB")
        img.thumbnail((768, 768), Image.LANCZOS)
        img.save(web / f"{png.stem}.jpg", "JPEG", quality=82, optimize=True, progressive=True)
        made += 1
    print(f"wrote {made} pictures", file=sys.stderr)


if __name__ == "__main__":
    main()
