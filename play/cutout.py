#!/usr/bin/env python3
"""Cut a painted sprite off its cream backdrop and save a trimmed transparent PNG.

usage: cutout.py SRC.jpg DEST.png [max_px] [tolerance]

The backdrop is found by flooding in from the image edges, so cream inside the sprite
(a white scoop, a glass dish) stays put.
"""
import sys
from collections import deque
from PIL import Image, ImageFilter

src, dest = sys.argv[1], sys.argv[2]
max_px = int(sys.argv[3]) if len(sys.argv) > 3 else 512
tol = int(sys.argv[4]) if len(sys.argv) > 4 else 22

img = Image.open(src).convert("RGB")
w, h = img.size
px = img.load()

corners = [px[2, 2], px[w - 3, 2], px[2, h - 3], px[w - 3, h - 3]]
bg = tuple(sorted(c[i] for c in corners)[1] for i in range(3))


def near(c):
    return max(abs(c[0] - bg[0]), abs(c[1] - bg[1]), abs(c[2] - bg[2])) <= tol


seen = bytearray(w * h)
queue = deque()
for x in range(w):
    for y in (0, h - 1):
        queue.append((x, y))
for y in range(h):
    for x in (0, w - 1):
        queue.append((x, y))
while queue:
    x, y = queue.popleft()
    if x < 0 or y < 0 or x >= w or y >= h:
        continue
    i = y * w + x
    if seen[i] or not near(px[x, y]):
        continue
    seen[i] = 1
    queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

alpha = Image.new("L", (w, h), 255)
ap = alpha.load()
for y in range(h):
    row = y * w
    for x in range(w):
        if seen[row + x]:
            ap[x, y] = 0

# pull the edge in a hair so no cream halo survives, then soften it
alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
out = img.convert("RGBA")
out.putalpha(alpha)
box = alpha.point(lambda v: 255 if v > 40 else 0).getbbox()
if box:
    out = out.crop(box)
scale = max_px / max(out.size)
if scale < 1:
    out = out.resize((round(out.width * scale), round(out.height * scale)), Image.LANCZOS)
out.save(dest, optimize=True)
print(dest, out.size)
