"""Cut generated art out of its flat magenta/green backgrounds and export web-sized files,
then build the app icons.

Usage (from hatch-match/): python3 tools/process_art.py
Reads tools/source/*.jpg, writes art/*.png|jpg and icons/*.png.
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "source"
OUT = ROOT / "art"
ICONS = ROOT / "icons"

# name -> (max output size in px, key color: "magenta" | "green")
CUTOUTS = {
    "mama_blue": (560, "magenta"),
    "mama_pink": (560, "green"),
    "mama_yellow": (560, "magenta"),
    "mama_green": (560, "magenta"),
    "egg_blue": (300, "magenta"),
    "egg_pink": (300, "green"),
    "egg_yellow": (300, "magenta"),
    "egg_mint": (300, "magenta"),
    "baby_yellow": (360, "magenta"),
    "baby_blue": (360, "magenta"),
    "baby_pink": (360, "green"),
    "baby_green": (360, "magenta"),
    "baby_owl": (360, "magenta"),
    "baby_penguin": (360, "magenta"),
    "baby_rainbow": (360, "magenta"),
    "shell_top": (240, "magenta"),
    "nest_empty": (320, "magenta"),
    "icon_tree": (200, "magenta"),
    "icon_speaker": (200, "magenta"),
    "icon_play": (260, "magenta"),
}
# One generated image holding several icons side by side: name -> (left, right) as fractions of width.
ROW = {"icon_gear": (0.0, 0.36), "icon_star": (0.36, 0.66), "icon_heart": (0.66, 1.0)}
ROW_SOURCE, ROW_KEY, ROW_SIZE = "icons_row", "green", 180

# name -> max width, saved as JPEG without cutting out
BACKDROPS = {"bg_meadow": 1600, "bg_tree": 1600, "splash": 1600}


def key_score(rgb, key):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    if key == "magenta":
        return np.minimum(r, b) - g
    return g - np.maximum(r, b)


def cut_out(img, key):
    rgb = np.asarray(img.convert("RGB")).astype(np.float32)
    border = np.concatenate([rgb[:8].reshape(-1, 3), rgb[-8:].reshape(-1, 3),
                             rgb[:, :8].reshape(-1, 3), rgb[:, -8:].reshape(-1, 3)])
    key_rgb = np.median(border, axis=0)
    key_strength = float(key_score(key_rgb[None, None, :], key)[0, 0])
    lo, hi = 0.3 * key_strength, 0.75 * key_strength
    score = key_score(rgb, key)
    alpha = 1.0 - np.clip((score - lo) / (hi - lo), 0, 1)
    alpha[alpha < 0.06] = 0

    # Un-mix the key color from semi-transparent edge pixels.
    a = np.maximum(alpha, 1e-3)[..., None]
    rgb = np.clip((rgb - (1 - a) * key_rgb) / a, 0, 255)

    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    im = Image.fromarray(out, "RGBA")
    bbox = im.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox()
    if bbox:
        pad = 6
        im = im.crop((max(0, bbox[0] - pad), max(0, bbox[1] - pad),
                      min(im.width, bbox[2] + pad), min(im.height, bbox[3] + pad)))
    return im


def fit(im, max_side):
    scale = max_side / max(im.size)
    if scale < 1:
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    return im


def make_icon(size, pad, bg=(255, 236, 170, 255)):
    mama = Image.open(OUT / "mama_yellow.png").convert("RGBA")
    baby = Image.open(OUT / "baby_pink.png").convert("RGBA")
    canvas = Image.new("RGBA", (size, size), bg)
    inner = int(size * (1 - 2 * pad))
    m = mama.copy()
    m.thumbnail((inner, inner), Image.LANCZOS)
    canvas.alpha_composite(m, ((size - m.width) // 2, (size - m.height) // 2))
    b = baby.copy()
    b.thumbnail((int(inner * 0.42), int(inner * 0.42)), Image.LANCZOS)
    canvas.alpha_composite(b, (size - int(size * pad) - b.width, size - int(size * pad) - b.height))
    return canvas.convert("RGB")


def main():
    OUT.mkdir(exist_ok=True)
    ICONS.mkdir(exist_ok=True)
    for name, (size, key) in CUTOUTS.items():
        im = fit(cut_out(Image.open(SRC / f"{name}.jpg"), key), size)
        im.save(OUT / f"{name}.png", optimize=True)
        print(f"{name}.png {im.size}")

    row = Image.open(SRC / f"{ROW_SOURCE}.jpg").convert("RGB")
    for name, (l, r) in ROW.items():
        part = row.crop((round(l * row.width), 0, round(r * row.width), row.height))
        im = fit(cut_out(part, ROW_KEY), ROW_SIZE)
        im.save(OUT / f"{name}.png", optimize=True)
        print(f"{name}.png {im.size}")

    for name, width in BACKDROPS.items():
        im = fit(Image.open(SRC / f"{name}.jpg").convert("RGB"), width)
        im.save(OUT / f"{name}.jpg", quality=84, optimize=True)
        print(f"{name}.jpg {im.size}")

    make_icon(192, 0.05).save(ICONS / "icon-192.png")
    make_icon(512, 0.05).save(ICONS / "icon-512.png")
    make_icon(512, 0.16).save(ICONS / "icon-maskable-512.png")
    print("icons written")


if __name__ == "__main__":
    main()
