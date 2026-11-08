#!/usr/bin/env python3
"""Generate Capacitor Android launcher icons from the approved KEKS emblem.

This script runs after `npx cap add android`, which recreates the native
resources directory in CI. No separate robot drawing or default K icon is used.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "keks-brand-navy-icon.webp"
ANDROID = ROOT / "android" / "app" / "src" / "main" / "res"
DENSITIES = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}
BACKGROUND = "#071a30"


def create_icons() -> None:
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Approved KEKS brand image not found: {SOURCE}")
    if not ANDROID.is_dir():
        raise RuntimeError("Create the Android project with 'npx cap add android' first.")
    with Image.open(SOURCE) as original:
        image = original.convert("RGBA")
        for density, factor in DENSITIES.items():
            folder = ANDROID / f"mipmap-{density}"
            folder.mkdir(parents=True, exist_ok=True)
            px = round(48 * factor)
            legacy = image.resize((px, px), Image.Resampling.LANCZOS)
            legacy.save(folder / "ic_launcher.png")
            legacy.save(folder / "ic_launcher_round.png")

            # Adaptive icon safe zone: image stays within the central 72 of
            # the 108 density-independent pixels; Android may mask the edges.
            adaptive_px = round(108 * factor)
            safe_px = round(72 * factor)
            foreground = Image.new("RGBA", (adaptive_px, adaptive_px), (0, 0, 0, 0))
            safe = image.resize((safe_px, safe_px), Image.Resampling.LANCZOS)
            margin = (adaptive_px - safe_px) // 2
            foreground.alpha_composite(safe, (margin, margin))
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

    # A full-size master for later signed/store builds, generated from the
    # same user-approved image (not an alternate design).
    resource = ROOT / "resources"
    resource.mkdir(exist_ok=True)
    image.resize((512, 512), Image.Resampling.LANCZOS).save(resource / "icon.png")
    print("KEKS Akademi Android icon resources generated from approved navy logo.")


if __name__ == "__main__":
    create_icons()
