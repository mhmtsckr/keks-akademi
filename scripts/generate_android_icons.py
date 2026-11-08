#!/usr/bin/env python3
"""Build Android launcher icons with the user's exact KEKS logo cut out, not a navy rectangle."""
from io import BytesIO
from pathlib import Path

import cairosvg
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "keks-official-2026.webp"
SILHOUETTE = ROOT / "public" / "keks-logo-mask.svg"
ANDROID = ROOT / "android" / "app" / "src" / "main" / "res"
DENSITIES = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}
BACKGROUND = "#071a30"


def cut_out_logo():
    """Use the same scalable contour mask used by the website's transparent header."""
    with Image.open(SOURCE) as original:
        artwork = original.convert("RGBA")
    rendered = cairosvg.svg2png(url=str(SILHOUETTE), output_width=artwork.width,
                                output_height=artwork.height)
    alpha = Image.open(BytesIO(rendered)).convert("RGBA").getchannel("A")
    artwork.putalpha(alpha)
    bounds = artwork.getbbox()
    if not bounds:
        raise ValueError("The approved KEKS logo mask is empty.")
    return artwork.crop(bounds)


def paste_contained(canvas, artwork, safe_fraction):
    safe = round(canvas.width * safe_fraction)
    resized = ImageOps.contain(artwork, (safe, safe), method=Image.Resampling.LANCZOS)
    at = ((canvas.width - resized.width) // 2, (canvas.height - resized.height) // 2)
    canvas.alpha_composite(resized, at)


def create_icons():
    if not SOURCE.is_file() or not SILHOUETTE.is_file():
        raise FileNotFoundError("The original approved KEKS emblem or contour mask is missing.")
    if not ANDROID.is_dir():
        raise RuntimeError("First create the native Android project using 'npx cap add android'.")
    image = cut_out_logo()
    for density, factor in DENSITIES.items():
        folder = ANDROID / f"mipmap-{density}"
        folder.mkdir(parents=True, exist_ok=True)
        px = round(48 * factor)
        legacy = Image.new("RGBA", (px, px), BACKGROUND)
        paste_contained(legacy, image, 0.90)
        legacy.save(folder / "ic_launcher.png")
        legacy.save(folder / "ic_launcher_round.png")

        adaptive_px = round(108 * factor)
        foreground = Image.new("RGBA", (adaptive_px, adaptive_px), (0, 0, 0, 0))
        # Keep the emblem entirely inside the central 72dp safe zone.
        paste_contained(foreground, image, 72 / 108)
        foreground.save(folder / "ic_launcher_foreground.png")

    adaptive = ANDROID / "mipmap-anydpi-v26"
    adaptive.mkdir(parents=True, exist_ok=True)
    icon_xml = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
"""
    (adaptive / "ic_launcher.xml").write_text(icon_xml, encoding="utf-8")
    (adaptive / "ic_launcher_round.xml").write_text(icon_xml, encoding="utf-8")
    values = ANDROID / "values"
    values.mkdir(parents=True, exist_ok=True)
    (values / "ic_launcher_background.xml").write_text(
        f'<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
        f'    <color name="ic_launcher_background">{BACKGROUND}</color>\n'
        f'</resources>\n', encoding="utf-8"
    )
    resource = ROOT / "resources"
    resource.mkdir(exist_ok=True)
    store_icon = Image.new("RGBA", (512, 512), BACKGROUND)
    paste_contained(store_icon, image, 0.86)
    store_icon.convert("RGB").save(resource / "icon.png")
    print("KEKS Akademi Android icons: original emblem, seamless navy background.")


if __name__ == "__main__":
    create_icons()
