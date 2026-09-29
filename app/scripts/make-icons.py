"""Generates the Labmate icon set in assets/: python3 scripts/make-icons.py (needs Pillow)."""
from __future__ import annotations
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ASSETS = Path(__file__).resolve().parent.parent / "assets"
BLUE, WHITE, GREEN, GREEN_DARK = "#1F6FEB", "#FFFFFF", "#34C77B", "#0E8A4F"
S = 4096  # draw big, downsample for smooth edges


def rounded(poly, radius: float) -> Image.Image:
    """Mask of a polygon with its corners rounded (blur + threshold)."""
    m = Image.new("L", (S, S), 0)
    ImageDraw.Draw(m).polygon(poly, fill=255)
    return m.filter(ImageFilter.GaussianBlur(radius)).point(lambda v: 255 if v >= 128 else 0)


def flask(img: Image.Image, cx: float, cy: float, h: float, body: str, liquid: str | None, bubbles: str | None):
    """Erlenmeyer flask centered at (cx, cy), total height h."""
    u = h / 100
    top, neck_w, rim_w = cy - 50 * u, 22 * u, 36 * u
    neck_bottom, bottom, base_w = cy - 8 * u, cy + 50 * u, 88 * u
    half_at = lambda y: neck_w / 2 + (base_w / 2 - neck_w / 2) * (y - neck_bottom) / (bottom - neck_bottom)
    glass = [
        (cx - rim_w / 2, top), (cx + rim_w / 2, top), (cx + rim_w / 2, top + 9 * u),
        (cx + neck_w / 2, top + 9 * u), (cx + neck_w / 2, neck_bottom), (cx + base_w / 2, bottom),
        (cx - base_w / 2, bottom), (cx - neck_w / 2, neck_bottom), (cx - neck_w / 2, top + 9 * u),
        (cx - rim_w / 2, top + 9 * u),
    ]
    img.paste(body, mask=rounded(glass, 3 * u))
    if liquid:
        wall, level = 8 * u, cy + 12 * u
        lb = bottom - wall
        juice = [(cx - half_at(level) + wall * 1.3, level), (cx + half_at(level) - wall * 1.3, level),
                 (cx + half_at(lb) - wall * 1.6, lb), (cx - half_at(lb) + wall * 1.6, lb)]
        img.paste(liquid, mask=rounded(juice, 2.5 * u))
        if bubbles:
            d = ImageDraw.Draw(img)
            for bx, by, br in [(-9, 30, 4.4), (9, 35, 3.2), (1, 22, 2.5)]:
                d.ellipse([cx + (bx - br) * u, cy + (by - br) * u, cx + (bx + br) * u, cy + (by + br) * u], fill=bubbles)


def spark(draw, cx, cy, size, fill):
    """Four-point sparkle: the 'fresh grant' signal."""
    s, t = size, size * 0.28
    draw.polygon([(cx, cy - s), (cx + t, cy - t), (cx + s, cy), (cx + t, cy + t),
                  (cx, cy + s), (cx - t, cy + t), (cx - s, cy), (cx - t, cy - t)], fill=fill)


def canvas(bg=(0, 0, 0, 0)):
    return Image.new("RGBA", (S, S), bg)


def mark(img, scale=1.0, body=WHITE, liquid=GREEN, bubbles=WHITE, spark_fill=WHITE):
    h = S * 0.56 * scale
    flask(img, S * 0.48, S * 0.52, h, body, liquid, bubbles)
    spark(ImageDraw.Draw(img), S / 2 + h * 0.42, S / 2 - h * 0.36, h * 0.13, spark_fill)


def save(img: Image.Image, name: str, size: int, rgb=False):
    out = img.resize((size, size), Image.LANCZOS)
    (out.convert("RGB") if rgb else out).save(ASSETS / name, optimize=True)
    print("wrote", name, size)


# iOS / store icon: full-bleed square (iOS masks the corners)
img = canvas(BLUE)
mark(img)
save(img, "icon.png", 1024, rgb=True)
save(img, "favicon.png", 48, rgb=True)

# Android adaptive icon: mark inside the 66% safe zone on a solid background
img = canvas()
mark(img, scale=0.72)
save(img, "android-icon-foreground.png", 512)
img = canvas(BLUE)
save(img, "android-icon-background.png", 512, rgb=True)
img = canvas()
mark(img, scale=0.72, liquid=None, bubbles=None)
save(img, "android-icon-monochrome.png", 432)

# Splash: blue mark on the app background color (set in app.json)
img = canvas()
mark(img, scale=1.25, body=BLUE, liquid=GREEN, bubbles=WHITE, spark_fill=GREEN_DARK)
save(img, "splash-icon.png", 1024)
