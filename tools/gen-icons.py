"""Generates the PWA icons: a washing-machine porthole, half full of water,
on the app's accent teal. Run from the project root:  python tools/gen-icons.py
Needs Pillow."""

import math, os
from PIL import Image, ImageDraw

TEAL = (10, 124, 137, 255)      # --accent
WHITE = (255, 255, 255, 255)
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "icons")


def porthole(size, inset):
    """inset = porthole diameter as a fraction of the canvas."""
    S = size * 4                      # supersample, then downscale
    im = Image.new("RGBA", (S, S), TEAL)
    d = ImageDraw.Draw(im)
    c = S / 2
    R = S * inset / 2
    ring = max(2, S * 0.05)
    d.ellipse([c - R, c - R, c + R, c + R], outline=WHITE, width=int(ring))

    r = R - ring * 0.5 - S * 0.014    # water sits inside the ring
    water = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    wd = ImageDraw.Draw(water)
    amp, base, n = r * 0.085, c + r * 0.30, 240
    pts = [(c - r + 2 * r * i / n,
            base + amp * math.sin(i / n * 2 * math.pi * 2.2 + math.pi / 2))
           for i in range(n + 1)]
    pts += [(c + r, c + r + 8), (c - r, c + r + 8)]
    wd.polygon(pts, fill=WHITE)

    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).ellipse([c - r, c - r, c + r, c + r], fill=255)
    clipped = Image.composite(water, Image.new("RGBA", (S, S), (0, 0, 0, 0)), mask)

    return Image.alpha_composite(im, clipped).resize((size, size), Image.LANCZOS)


os.makedirs(OUT, exist_ok=True)
for name, size, inset in [
    ("icon-192.png", 192, 0.72),
    ("icon-512.png", 512, 0.72),
    ("icon-maskable-512.png", 512, 0.52),   # content inside the 80% safe zone
    ("apple-touch-icon.png", 180, 0.72),
]:
    porthole(size, inset).convert("RGB").save(os.path.join(OUT, name))
    print("wrote", name)
