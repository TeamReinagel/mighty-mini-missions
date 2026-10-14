"""Cut generated art out of its flat magenta/green backgrounds and export web-sized files,
then build the app icons.

Usage (from otter-slide/): python3 tools/process_art.py
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
    "pip_sit": (520, "magenta-shadow"),
    "pip_slide": (520, "magenta-shadow"),
    "pip_cheer": (520, "magenta-shadow"),
    "lilypad": (420, "magenta"),
    "icon_chest": (200, "green"),
}

# Sticker sheets: four pictures in a 2x2 grid, named top-left, top-right, bottom-left, bottom-right.
# None skips a cell.
SHEETS = {
    "sheet1": ("magenta", ["cat", "cap", "bat", "map"]),
    "sheet2": ("green", ["hat", "fan", "van", "rat"]),
    "sheet3": ("magenta", ["bag", "jam", "can", "dog"]),
    "sheet4": ("magenta", ["log", "fox", "box", "mop"]),
    "sheet5": ("green", ["pot", "top", "pig", "wig"]),
    "sheet6": ("green", ["fin", "six", "bib", "lip"]),
    "sheet7": ("magenta", ["zip", "sun", "bug", "rug"]),
    "sheet8": ("magenta", ["cup", "bus", "nut", "jug"]),
    "sheet9": ("green", ["bed", "hen", "pen", "ten"]),
    "sheet10": ("green", ["net", "jet", "web", None]),
    "sheet_friends": ("magenta", ["friend_frog", "friend_duck", "friend_turtle", "friend_dragonfly"]),
}
SHEET_SIZE = 320

# name -> max width, saved as JPEG without cutting out
BACKDROPS = {"bg_pond": 1600, "splash": 1600}


def key_score(rgb, key):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    if key == "magenta":
        return np.minimum(r, b) - g
    if key == "magenta-shadow":
        # Relative to brightness, so the darker magenta of a floor shadow keys out too.
        bright = np.maximum(np.maximum(r, b), 1)
        return np.where(bright > 40, (np.minimum(r, b) - g) / bright * 255, 0)
    return g - np.maximum(r, b)


def key_out(img, key):
    """Return an RGBA image the same size as img with the key color made transparent."""
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
    return Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), "RGBA")


def crop_to_content(im, pad=6):
    bbox = im.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox()
    if not bbox:
        return im
    return im.crop((max(0, bbox[0] - pad), max(0, bbox[1] - pad),
                    min(im.width, bbox[2] + pad), min(im.height, bbox[3] + pad)))


def fit(im, max_side):
    scale = max_side / max(im.size)
    if scale < 1:
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    return im


def emptiest(profile, lo, hi):
    """Index of the emptiest line between fractions lo and hi of the profile."""
    n = len(profile)
    a, b = int(n * lo), int(n * hi)
    return a + int(np.argmin(profile[a:b]))


def split_sheet(im):
    """Split a 2x2 sticker sheet along the emptiest row and columns near the middle."""
    alpha = np.asarray(im.getchannel("A")).astype(np.float32)
    y = emptiest(alpha.sum(1), 0.35, 0.65)
    cells = []
    for top, bottom in ((0, y), (y, im.height)):
        x = emptiest(alpha[top:bottom].sum(0), 0.35, 0.65)
        cells.append((0, top, x, bottom))
        cells.append((x, top, im.width, bottom))
    return [crop_to_content(im.crop(c)) for c in cells]


def make_icon(size, pad, bg=(178, 232, 236, 255)):
    pad_im = Image.open(OUT / "lilypad.png").convert("RGBA")
    pip = Image.open(OUT / "pip_sit.png").convert("RGBA")
    canvas = Image.new("RGBA", (size, size), bg)
    inner = int(size * (1 - 2 * pad))
    p = pad_im.copy()
    p.thumbnail((inner, inner), Image.LANCZOS)
    canvas.alpha_composite(p, ((size - p.width) // 2, size - int(size * pad) - p.height))
    o = pip.copy()
    o.thumbnail((int(inner * 0.86), int(inner * 0.86)), Image.LANCZOS)
    canvas.alpha_composite(o, ((size - o.width) // 2, size - int(size * pad) - int(p.height * 0.35) - o.height))
    return canvas.convert("RGB")


def main():
    OUT.mkdir(exist_ok=True)
    ICONS.mkdir(exist_ok=True)
    for name, (size, key) in CUTOUTS.items():
        im = fit(crop_to_content(key_out(Image.open(SRC / f"{name}.jpg"), key)), size)
        im.save(OUT / f"{name}.png", optimize=True)
        print(f"{name}.png {im.size}")

    for sheet, (key, names) in SHEETS.items():
        parts = split_sheet(key_out(Image.open(SRC / f"{sheet}.jpg"), key))
        for name, part in zip(names, parts):
            if not name:
                continue
            im = fit(part, SHEET_SIZE)
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
