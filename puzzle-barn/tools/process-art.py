#!/usr/bin/env python3
"""Size The Gem Gym's painted art (puzzle-barn) for the web.

Reads puzzle-barn/tools/source/<name>.png (from codex-art.mjs, make-art.mjs, or any image tool)
and writes puzzle-barn/assets/. Sprites painted on a flat backdrop are cut out with
play/cutout.py; sprites that already have transparency are just trimmed.
Usage (from the repo): python3 puzzle-barn/tools/process-art.py
"""
import subprocess
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "source"
OUT = ROOT / "assets"
CUTOUT = ROOT.parent / "play" / "cutout.py"
TOLERANCE = "48"

# name -> (output file, longest side in px)
JOBS = {
    "block": ("block.png", 360),
    "gem": ("gem.png", 120),
    "plank": ("plank.png", 900),
    "pan": ("pan.png", 520),
    "stand": ("stand.png", 200),
}

# The icon is built from art the site already has: a Word Monsters monster in front of the
# crystal cave, standing on a little tower of this game's blocks.
WM = ROOT.parent / "word-monsters" / "images"
ICON_SPECIES, ICON_STAGE, ICON_FUR = 2, 3, (52, 124, 236)  # monster m2, blue, like monster.mjs


def fit(img, longest):
    w, h = img.size
    scale = longest / max(w, h)
    if scale < 1:
        img = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    return img


def main():
    OUT.mkdir(exist_ok=True)
    missing = []
    for name, (dest, longest) in JOBS.items():
        src = SRC / f"{name}.png"
        if not src.exists():
            missing.append(name)
            continue
        img = Image.open(src)
        if dest.endswith(".jpg"):
            fit(img.convert("RGB"), longest).save(OUT / dest, quality=82, optimize=True, progressive=True)
        else:
            img = img.convert("RGBA")
            w, h = img.size
            if min(img.getpixel(p)[3] for p in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1))) > 0:
                subprocess.run([sys.executable, str(CUTOUT), str(src), str(OUT / dest), str(longest), TOLERANCE],
                               check=True, stdout=subprocess.DEVNULL)
                print(f"{dest}: {(OUT / dest).stat().st_size // 1024} KB (cut out)")
                continue
            box = img.getchannel("A").point(lambda a: 255 if a > 12 else 0).getbbox()
            if box:
                img = img.crop(box)
            fit(img, longest).save(OUT / dest, optimize=True)
        print(f"{dest}: {(OUT / dest).stat().st_size // 1024} KB")
    if missing:
        print("missing source art:", ", ".join(missing))
        raise SystemExit(1)
    make_icon()


def tinted_monster(species, stage, fur):
    base = Image.open(WM / "monsters" / f"m{species}-{stage}b.webp").convert("RGBA")
    top = Image.open(WM / "monsters" / f"m{species}-{stage}f.webp").convert("RGBA")
    r, g, b, a = base.split()
    gray = r  # the fur layer is gray, so any channel is its brightness
    scale = [c / 255 / 0.82 for c in fur]
    chans = [gray.point(lambda v, k=k: min(255, round(v * k))) for k in scale]
    out = Image.merge("RGBA", (*chans, a))
    out.alpha_composite(top)
    return out


def make_icon():
    size = 512
    bg = Image.open(WM / "bg-cave.webp").convert("RGBA")
    side = bg.height
    bg = bg.crop(((bg.width - side) // 2, 0, (bg.width + side) // 2, side)).resize((size, size), Image.LANCZOS)
    block = Image.open(OUT / "block.png").convert("RGBA")
    bw = 150
    block = block.resize((bw, round(block.height * bw / block.width)), Image.LANCZOS)
    bh = block.height
    floor = size - 22
    for col in range(3):
        bg.alpha_composite(block, (size // 2 - round(1.5 * bw) + col * bw, floor - bh))
    for col in range(2):
        bg.alpha_composite(block, (size // 2 - bw + col * bw, floor - 2 * bh + 6))
    mon = tinted_monster(ICON_SPECIES, ICON_STAGE, ICON_FUR)
    mh = floor - 2 * bh - 6
    mon = mon.resize((round(mon.width * mh / mon.height), mh), Image.LANCZOS)
    bg.alpha_composite(mon, ((size - mon.width) // 2, floor - 2 * bh + 14 - mh))
    bg.convert("RGB").save(OUT / "icon.jpg", quality=86, optimize=True)
    print(f"icon.jpg: {(OUT / 'icon.jpg').stat().st_size // 1024} KB (built)")


if __name__ == "__main__":
    main()
