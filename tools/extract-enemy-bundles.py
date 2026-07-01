"""Extract enemy sprite PNGs from Unity addressable bundles when available.

Usage:
  python tools/extract-enemy-bundles.py [path/to/StandaloneWindows64]

Defaults to the Blasphemous 2 Steam install StreamingAssets folder if found.
Requires: pip install UnityPy
"""
from __future__ import annotations

import os
import re
import sys
from pathlib import Path

try:
    import UnityPy
except ImportError as exc:  # pragma: no cover
    raise SystemExit("UnityPy is required: pip install UnityPy") from exc

ANALYZER = Path(__file__).resolve().parents[1]
OUT_SPRITES = ANALYZER / "public/sprites/enemies"
MISSING = ["EN12", "EN17", "EN25", "EN35", "EN52", "EN56", "EN61"]

DEFAULT_GAME_ROOTS = [
    Path(r"C:/Program Files (x86)/Steam/steamapps/common/Blasphemous 2"),
    Path(os.environ.get("ProgramFiles(x86)", "")) / "Steam/steamapps/common/Blasphemous 2",
]


def find_bundle_dir(explicit: str | None) -> Path | None:
    if explicit:
        path = Path(explicit)
        return path if path.exists() else None

    for root in DEFAULT_GAME_ROOTS:
        candidate = (
            root
            / "Blasphemous2_Data/StreamingAssets/aa/StandaloneWindows64"
        )
        if candidate.exists():
            return candidate
    return None


def main() -> int:
    bundle_dir = find_bundle_dir(sys.argv[1] if len(sys.argv) > 1 else None)
    if not bundle_dir:
        print("Bundle directory not found. Pass path to StandaloneWindows64.")
        return 1

    targets = {code.lower(): code for code in MISSING}
    OUT_SPRITES.mkdir(parents=True, exist_ok=True)
    found: dict[str, list[str]] = {code: [] for code in MISSING}

    for bundle_path in sorted(bundle_dir.glob("*.bundle")):
        bundle_key = bundle_path.stem.lower()
        if not any(code in bundle_key for code in targets):
            continue

        print(f"Reading {bundle_path.name}...")
        env = UnityPy.load(str(bundle_path))
        for obj in env.objects:
            if obj.type.name != "Texture2D":
                continue
            data = obj.read()
            name = str(getattr(data, "m_Name", "") or getattr(data, "name", ""))
            lower = name.lower()
            for key, code in targets.items():
                if key not in bundle_key and key not in lower:
                    continue
                if "idle" not in lower and "spr" not in lower and "texture" not in lower:
                    continue
                out_name = f"{code}__{name}.png"
                out_path = OUT_SPRITES / out_name
                data.image.save(out_path)
                found[code].append(out_name)

    print("\nExtracted candidates:")
    for code in MISSING:
        names = found[code]
        print(f"  {code}: {len(names)}")
        for name in names[:5]:
            print(f"    - {name}")

    if not any(found.values()):
        print("\nNo matching textures found in available bundles.")
        return 2

    print("\nReview extracted files and copy/rename the best frame to EN##.png")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
