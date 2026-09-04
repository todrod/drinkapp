"""
Subset the MaterialCommunityIcons font down to the glyphs this app actually
uses.

The full face is 1.3 MB for 7,448 glyphs; the app draws about fifty. On a PWA
people open on mobile data that is most of the download for none of the value.

Scans src/ for every string literal that happens to be a glyph name and keeps
those. Over-including by a few glyphs is harmless; missing one would render a
blank box, so the scan is deliberately generous.

Outputs are committed so the Vercel build needs no Python:
  assets/fonts/ShakerIcons.ttf
  src/generated/glyphmap.json

Run after adding a new icon:  python scripts/build-icon-font.py
"""
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
GLYPHMAP = (
    ROOT
    / "node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons"
    / "glyphmaps/MaterialCommunityIcons.json"
)
FONT = (
    ROOT
    / "node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons"
    / "Fonts/MaterialCommunityIcons.ttf"
)
OUT_FONT = ROOT / "assets/fonts/ShakerIcons.ttf"
OUT_MAP = ROOT / "src/generated/glyphmap.json"

full = json.loads(GLYPHMAP.read_text(encoding="utf-8"))

# Every quoted string in the source that matches a glyph name.
literals = set()
for path in list(SRC.rglob("*.ts")) + list(SRC.rglob("*.tsx")):
    if "generated" in path.parts:
        continue
    text = path.read_text(encoding="utf-8")
    literals.update(re.findall(r"['\"]([a-z0-9-]{2,40})['\"]", text))

used = sorted(literals & full.keys())
if not used:
    sys.exit("No glyph names found in src/ — refusing to build an empty font.")

subset_map = {name: full[name] for name in used}
codepoints = sorted({full[name] for name in used})

OUT_FONT.parent.mkdir(parents=True, exist_ok=True)
OUT_MAP.parent.mkdir(parents=True, exist_ok=True)

subprocess.run(
    [
        sys.executable,
        "-m",
        "fontTools.subset",
        str(FONT),
        "--unicodes=" + ",".join(f"U+{cp:04X}" for cp in codepoints),
        "--output-file=" + str(OUT_FONT),
        "--no-hinting",
        "--desubroutinize",
        "--name-IDs=*",
        "--recalc-bounds",
    ],
    check=True,
)

OUT_MAP.write_text(json.dumps(subset_map, indent=2, sort_keys=True) + "\n", encoding="utf-8")

before = FONT.stat().st_size
after = OUT_FONT.stat().st_size
print(f"glyphs kept : {len(used)}")
print(f"font        : {before/1024:.0f} KB -> {after/1024:.1f} KB")
print(f"names       : {', '.join(used[:12])}{' …' if len(used) > 12 else ''}")
