"""Build Christmas Word Run icons from the raster Snowy art."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SNOWY = ROOT / "assets" / "christmas" / "snowman_normal.png"


def background(size):
    image = Image.new("RGB", (size, size), "#123e42")
    draw = ImageDraw.Draw(image)
    top = (37, 104, 95)
    bottom = (15, 54, 62)
    for y in range(size):
        t = y / (size - 1)
        color = tuple(round(a + (b - a) * t) for a, b in zip(top, bottom))
        draw.line((0, y, size, y), fill=color)
    return image


def draw_icon(size, maskable=False):
    # Draw large, then shrink, so Snowy's edges stay smooth on the tile.
    scale = 4
    canvas_size = size * scale
    canvas = background(canvas_size).convert("RGBA")
    snowy = Image.open(SNOWY).convert("RGBA")
    snowy = snowy.crop(snowy.getbbox())
    # Maskable icons keep the whole snowman inside the center safe circle.
    fit = 0.72 if maskable else 0.9
    limit = int(canvas_size * fit)
    width, height = snowy.size
    ratio = min(limit / width, limit / height)
    snowy = snowy.resize(
        (max(1, round(width * ratio)), max(1, round(height * ratio))),
        Image.Resampling.LANCZOS,
    )
    x = (canvas_size - snowy.width) // 2
    y = (canvas_size - snowy.height) // 2
    canvas.alpha_composite(snowy, (x, y))
    return canvas.convert("RGB").resize((size, size), Image.Resampling.LANCZOS)


def main():
    out = ROOT / "icons"
    out.mkdir(exist_ok=True)
    for size in (192, 512):
        draw_icon(size).save(out / f"icon-{size}.png")
    draw_icon(512, True).save(out / "icon-maskable-512.png")


if __name__ == "__main__":
    main()
