"""Generate enemies-display.json and best-guess cropped enemy sprites."""
from __future__ import annotations

import json
import re
import shutil
import sys
from collections import defaultdict
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path

try:
    from PIL import Image
except ImportError as exc:  # pragma: no cover
    raise SystemExit("Pillow is required: pip install pillow") from exc

ROOT = Path(__file__).resolve().parents[2]
ANALYZER = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "AssetRipper_export_20260621_154214/ExportedProject/Assets"
ANIM_DIR = ASSETS / "#Art/Animations/Enemies"
SPR_ROOT = ASSETS / "#Art/Sprites/enemies"
PREFAB_DIR = ASSETS / "#Prefabs/Enemies"
LOOSE_SPRITE_DIR = ASSETS / "Sprite"
EXTRA_NAME_DIRS = (
    ASSETS / "#Data/Attacks/Enemies",
    ASSETS / "#Audio/Enemies",
    ASSETS / "#Data/StatSystem/Parameters/Enemies",
)

AC32_JSON = ANALYZER / "src/data/ac32-enemies.json"
OUT_JSON = ANALYZER / "src/data/enemies-display.json"
OUT_SPRITES = ANALYZER / "public/sprites/enemies"

ANIM_PATTERN = re.compile(r"^(EN\d+\w*)\s+-\s+(.+?)\s+-\s+Anims$")
PREFAB_PATTERN = re.compile(r"^(EN\d+\w*)\s+-\s+(.+?)\s+-\s+Prefabs$")
EXTRA_NAME_PATTERN = re.compile(r"^(EN\d+\w*)\s+-\s+(.+?)\s+-\s+(?:Atk|Audio|Stats|Rewards)$")
FRAME_SUFFIX = re.compile(r"^(.*)_(\d+)$")
NUM = r"[\d.]+"
RECT_PATTERNS = (
    re.compile(
        rf"textureRect:\s*\n\s*x:\s*({NUM})\s*\n\s*y:\s*({NUM})\s*\n\s*width:\s*({NUM})\s*\n\s*height:\s*({NUM})",
    ),
    re.compile(
        rf"m_Rect:\s*\n(?:\s*\S+:\s*\S+\s*\n)*?\s*x:\s*({NUM})\s*\n\s*y:\s*({NUM})\s*\n\s*width:\s*({NUM})\s*\n\s*height:\s*({NUM})",
        re.S,
    ),
)
TEXTURE_GUID_PATTERN = re.compile(
    r"texture: \{fileID: \d+, guid: ([a-f0-9]+), type: 3\}"
)

PREFIX_SCORES = (
    ("idle", 100),
    ("stun", 90),
    ("stop", 85),
    ("run", 70),
    ("walk", 65),
    ("hang", 60),
    ("attack", 40),
)
PENALTY_TERMS = (
    ("execution", -100),
    ("death", -60),
    ("knockdown", -40),
    ("projectile", -20),
    ("impact", -20),
    ("grabbed", -20),
    ("effect", -25),
    ("particle", -25),
    ("wing", -30),
)

# Palette/variant enemies (EN11+) share art with EN(ones digit) in the same column.
def infer_variant_proxy(code: str) -> str | None:
    num = int(code[2:])
    if num < 11:
        return None
    ones = num % 10
    if ones == 0:
        return None
    return f"EN{ones:02d}"


# Hand-picked sprite frames (sheet + _0 frame unless noted in asset name).
MANUAL_SPRITE_PICKS: dict[str, dict[str, str]] = {
    "EN15": {
        "spriteDir": "EN15 - RottenSkull - Spr",
        "animationPrefix": "EN15-RottenSkull",
        "asset": "EN15-RottenSkull_0.asset",
        "sheet": "EN15-RottenSkull.png",
    },
    "EN16": {
        "spriteDir": "EN16 - Stonehands",
        "animationPrefix": "EN16 Stonehands Attack",
        "asset": "EN16 Stonehands Attack_4.asset",
        "sheet": "EN16 Stonehands Attack.png",
    },
    "EN27": {
        "spriteDir": "EN27 - HeavyMelee - Spr",
        "animationPrefix": "EN27 HeavyMelee Walk",
        "asset": "EN27 HeavyMelee Walk_0.asset",
        "sheet": "EN27 HeavyMelee Walk.png",
    },
    "EN75": {
        "spriteDir": "EN75 - Ligthning Heavy Melee - Spr",
        "animationPrefix": "EN75 LightningHeavyMelee Turnaround",
        "asset": "EN75 LightningHeavyMelee Turnaround_0.asset",
        "sheet": "EN75 LightningHeavyMelee Turnaround.png",
    },
    "EN55": {
        "spriteDir": "EN55 - Wax Crawler - Spr",
        "animationPrefix": "waxcrawler_crawling_anim",
        "asset": "waxcrawler_crawling_anim_0.asset",
        "sheet": "waxcrawler_crawling_anim.png",
    },
}


@lru_cache(maxsize=1)
def build_guid_map() -> dict[str, Path]:
    guid_map: dict[str, Path] = {}
    for meta_path in ASSETS.rglob("*.meta"):
        try:
            text = meta_path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        match = re.search(r"^guid: ([a-f0-9]+)", text, re.M)
        if not match:
            continue
        asset_path = meta_path.with_suffix("")
        if asset_path.suffix.lower() != ".png" or not asset_path.exists():
            continue
        guid_map[match.group(1)] = asset_path
    return guid_map


def parse_folder_name(pattern: re.Pattern[str], folders: list[Path]) -> dict[str, str]:
    names: dict[str, str] = {}
    for folder in folders:
        match = pattern.match(folder.name)
        if not match:
            continue
        code, label = match.group(1), match.group(2)
        if "v1" in code:
            continue
        names.setdefault(code, label)
    return names


def collect_dev_names() -> dict[str, str]:
    names = parse_folder_name(ANIM_PATTERN, list(ANIM_DIR.iterdir()))
    names.update(parse_folder_name(PREFAB_PATTERN, list(PREFAB_DIR.iterdir())))
    for base in EXTRA_NAME_DIRS:
        if base.exists():
            names.update(parse_folder_name(EXTRA_NAME_PATTERN, list(base.iterdir())))
    return names


def asset_matches_code(stem: str, code: str) -> bool:
    return bool(re.match(rf"^{re.escape(code)}([^0-9]|_|$|-|\s)", stem, re.I))


def find_sprite_dir(code: str) -> Path | None:
    prefix_dash = f"{code} - "
    prefix_space = f"{code} "
    candidates: list[tuple[int, Path]] = []

    for folder in SPR_ROOT.iterdir():
        if not folder.is_dir():
            continue
        name = folder.name
        if not (name.startswith(prefix_dash) or name.startswith(prefix_space)):
            continue
        head = name.split()[0]
        if head != code or "v1" in head:
            continue
        score = 0
        if name.endswith(" - Spr") or name.endswith(" - spr"):
            score += 2
        if " - Spr" in name or " - spr" in name:
            score += 1
        candidates.append((score, folder))

    if not candidates:
        return None
    candidates.sort(key=lambda item: (-item[0], item[1].name))
    return candidates[0][1]


def find_nested_assets(code: str) -> tuple[list[Path], str | None]:
    prefix = code.lower()
    assets: list[Path] = []
    source_dir: str | None = None

    for folder in SPR_ROOT.iterdir():
        if not folder.is_dir():
            continue
        folder_assets = [
            asset_path
            for asset_path in folder.rglob("*.asset")
            if asset_path.stem.lower().startswith(f"{prefix}_")
            or asset_path.stem.lower() == prefix
        ]
        if folder_assets:
            assets.extend(folder_assets)
            source_dir = folder.name

    return assets, source_dir


def parse_sprite_asset(asset_path: Path) -> dict[str, int | str] | None:
    text = asset_path.read_text(encoding="utf-8", errors="replace")
    name_match = re.search(r"^\s*m_Name:\s*(.+)$", text, re.M)
    rect_match = None
    for pattern in RECT_PATTERNS:
        rect_match = pattern.search(text)
        if rect_match:
            break
    if not rect_match:
        return None

    x, y, w, h = (float(rect_match.group(i)) for i in range(1, 5))
    if w <= 0 or h <= 0:
        return None

    guid_match = TEXTURE_GUID_PATTERN.search(text)
    return {
        "name": name_match.group(1).strip() if name_match else asset_path.stem,
        "x": int(round(x)),
        "y": int(round(y)),
        "w": int(round(w)),
        "h": int(round(h)),
        "textureGuid": guid_match.group(1) if guid_match else None,
    }


def score_prefix(prefix: str) -> int:
    lower = prefix.lower()
    score = 0
    for term, penalty in PENALTY_TERMS:
        if term in lower:
            score += penalty
    for term, bonus in PREFIX_SCORES:
        if term in lower:
            score += bonus
    return score


def group_sprite_assets(asset_paths: list[Path]) -> dict[str, list[tuple[int, Path]]]:
    grouped: dict[str, list[tuple[int, Path]]] = defaultdict(list)
    for asset_path in asset_paths:
        frame_match = FRAME_SUFFIX.match(asset_path.stem)
        if not frame_match:
            continue
        prefix, frame_index = frame_match.group(1), int(frame_match.group(2))
        grouped[prefix].append((frame_index, asset_path))
    return grouped


def pick_sprite_frame(asset_paths: list[Path]) -> tuple[Path, dict, str] | None:
    grouped = group_sprite_assets(asset_paths)
    if not grouped:
        return None

    ranked_prefixes = sorted(
        grouped.keys(),
        key=lambda prefix: (score_prefix(prefix), len(grouped[prefix])),
        reverse=True,
    )
    prefix = ranked_prefixes[0]
    frames = sorted(grouped[prefix], key=lambda item: item[0])
    _, asset_path = frames[len(frames) // 2]
    parsed = parse_sprite_asset(asset_path)
    if not parsed:
        return None
    return asset_path, parsed, prefix


def resolve_sheet_path(
    sprite_dir: Path | None,
    prefix: str,
    asset_path: Path,
    parsed: dict,
) -> Path | None:
    guid_map = build_guid_map()
    texture_guid = parsed.get("textureGuid")
    if texture_guid and texture_guid in guid_map:
        return guid_map[texture_guid]

    search_dirs: list[Path] = []
    if sprite_dir:
        search_dirs.append(sprite_dir)
    search_dirs.extend({asset_path.parent, LOOSE_SPRITE_DIR, ASSETS / "Texture2D"})

    normalized_prefix = prefix.lower().replace(" ", "")
    for directory in search_dirs:
        if not directory.exists():
            continue
        direct = directory / f"{prefix}.png"
        if direct.exists():
            return direct
        for candidate in directory.glob("*.png"):
            stem = candidate.stem.lower().replace(" ", "")
            if stem == normalized_prefix or normalized_prefix in stem or stem in normalized_prefix:
                if "idle" in stem or stem == normalized_prefix:
                    return candidate

    if sprite_dir:
        idle_candidates = [
            png
            for png in sprite_dir.glob("*.png")
            if "idle" in png.stem.lower() and "spin" not in png.stem.lower()
        ]
        if idle_candidates:
            return sorted(idle_candidates, key=lambda path: path.name)[0]

    return None


def slugify_dev_name(name: str) -> str:
    if name == name.upper() and name.startswith("EN"):
        return ""
    spaced = humanize_dev_name(name)
    return re.sub(r"[^a-z0-9]", "", spaced.lower())


# Dev names whose loose Sprite/ folder spelling differs from the slug.
DEV_NAME_SPRITE_SLUGS: dict[str, list[str]] = {
    "Flagelant": ["flagellant"],
}


def dev_name_sprite_slugs(dev_name: str) -> list[str]:
    slugs = [slugify_dev_name(dev_name)]
    slugs.extend(DEV_NAME_SPRITE_SLUGS.get(dev_name, []))
    return [slug for slug in slugs if slug]


def loose_sprite_assets_for(code: str, dev_name: str) -> list[Path]:
    if not LOOSE_SPRITE_DIR.exists():
        return []

    slug = slugify_dev_name(dev_name)
    slugs = dev_name_sprite_slugs(dev_name)
    assets: list[Path] = []

    for asset_path in LOOSE_SPRITE_DIR.glob("*.asset"):
        stem = asset_path.stem
        stem_lower = stem.lower()
        if any(s in stem_lower for s in slugs):
            assets.append(asset_path)
        elif asset_matches_code(stem, code):
            assets.append(asset_path)

    return assets


def collect_asset_paths(code: str, dev_name: str) -> tuple[list[Path], str | None, Path | None]:
    sprite_dir = find_sprite_dir(code)
    if sprite_dir:
        assets = list(sprite_dir.rglob("*.asset"))
        if assets:
            return assets, sprite_dir.name, sprite_dir

    nested_assets, nested_source = find_nested_assets(code)
    if nested_assets:
        nested_dir = nested_assets[0].parent
        return nested_assets, nested_source, nested_dir

    loose_assets = loose_sprite_assets_for(code, dev_name)
    if loose_assets:
        return loose_assets, "Sprite", None

    return [], None, None


def crop_sprite(sheet_path: Path, rect: dict[str, int | str]) -> Image.Image:
    image = Image.open(sheet_path).convert("RGBA")
    width, height = image.size
    x = int(rect["x"])
    y = int(rect["y"])
    w = int(rect["w"])
    h = int(rect["h"])
    top = height - y - h
    left = x
    return image.crop((left, top, left + w, top + h))


def humanize_dev_name(name: str) -> str:
    spaced = re.sub(r"([a-z])([A-Z])", r"\1 \2", name)
    spaced = spaced.replace("_", " ").replace("-", " ")
    return re.sub(r"\s+", " ", spaced).strip()


def generate_sprite(
    code: str,
    dev_name: str,
) -> tuple[dict | None, str | None]:
    sprite_dir = find_sprite_dir(code)
    asset_paths, source_label, resolved_dir = collect_asset_paths(code, dev_name)
    if not asset_paths:
        return None, None

    picked = pick_sprite_frame(asset_paths)
    if not picked:
        return None, None

    asset_path, rect, prefix = picked
    sheet_path = resolve_sheet_path(resolved_dir or sprite_dir, prefix, asset_path, rect)
    if not sheet_path:
        return None, None

    cropped = crop_sprite(sheet_path, rect)
    out_file = OUT_SPRITES / f"{code}.png"
    cropped.save(out_file)

    return {
        "spriteFile": f"{code}.png",
        "spriteStatus": "generated",
        "spritePick": {
            "source": source_label,
            "spriteDir": (resolved_dir or sprite_dir).name if (resolved_dir or sprite_dir) else None,
            "animationPrefix": prefix,
            "asset": asset_path.name,
            "sheet": sheet_path.name,
            "sheetPath": str(sheet_path.relative_to(ASSETS)).replace("\\", "/"),
            "x": rect["x"],
            "y": rect["y"],
            "w": rect["w"],
            "h": rect["h"],
        },
    }, sprite_dir.name if sprite_dir else source_label


def apply_variant_proxy(
    code: str,
    proxy_code: str,
    generated: dict[str, dict | None],
) -> dict | None:
    proxy_sprite = OUT_SPRITES / f"{proxy_code}.png"
    if not proxy_sprite.exists():
        return None

    shutil.copy2(proxy_sprite, OUT_SPRITES / f"{code}.png")
    proxy_meta = generated.get(proxy_code)
    proxy_pick = proxy_meta.get("spritePick") if proxy_meta else None

    return {
        "spriteFile": f"{code}.png",
        "spriteStatus": "variant-proxy",
        "spritePick": {
            "source": "variant-proxy",
            "proxyCode": proxy_code,
            "note": "Shares art with base enemy type; separate ScriptableID for kill tracking.",
            "basePick": proxy_pick,
        },
    }


def apply_manual_sprite_pick(code: str, pick: dict[str, str]) -> dict | None:
    sprite_dir = SPR_ROOT / pick["spriteDir"]
    asset_path = sprite_dir / pick["asset"]
    sheet_path = sprite_dir / pick["sheet"]
    if not asset_path.exists() or not sheet_path.exists():
        return None

    parsed = parse_sprite_asset(asset_path)
    if not parsed:
        return None

    cropped = crop_sprite(sheet_path, parsed)
    out_file = OUT_SPRITES / f"{code}.png"
    cropped.save(out_file)

    return {
        "spriteFile": f"{code}.png",
        "spriteStatus": "manual-pick",
        "spritePick": {
            "source": pick["spriteDir"],
            "spriteDir": pick["spriteDir"],
            "animationPrefix": pick["animationPrefix"],
            "asset": pick["asset"],
            "sheet": pick["sheet"],
            "sheetPath": str(sheet_path.relative_to(ASSETS)).replace("\\", "/"),
            "x": parsed["x"],
            "y": parsed["y"],
            "w": parsed["w"],
            "h": parsed["h"],
        },
    }


def resolve_proxy_code(code: str) -> str | None:
    return infer_variant_proxy(code)


def is_generic_enemy_name(code: str, name: str) -> bool:
    return name == code or bool(re.fullmatch(r"EN\d+", name, re.I))


def variant_index(code: str) -> int | None:
    num = int(code[2:])
    if num < 11:
        return None
    ones = num % 10
    if ones == 0:
        return None
    return num // 10


def apply_variant_display_names(enemies: dict[str, dict]) -> None:
    def display_name_for(code: str) -> str:
        entry = enemies[code]
        proxy = infer_variant_proxy(code)
        index = variant_index(code)
        if not proxy or index is None:
            return entry["displayName"]

        is_variant_proxy = entry.get("spriteStatus") == "variant-proxy"
        is_generic = is_generic_enemy_name(code, entry.get("displayName", code)) or is_generic_enemy_name(
            code, entry.get("devName", code)
        )
        if not is_variant_proxy and not is_generic:
            return entry["displayName"]

        parent_name = display_name_for(proxy)
        if is_generic_enemy_name(proxy, parent_name):
            return entry["displayName"]

        return f"{parent_name} Variant {index}"

    for code in enemies:
        if not infer_variant_proxy(code):
            continue
        entry = enemies[code]
        is_variant_proxy = entry.get("spriteStatus") == "variant-proxy"
        is_generic = is_generic_enemy_name(code, entry.get("displayName", code)) or is_generic_enemy_name(
            code, entry.get("devName", code)
        )
        if is_variant_proxy or is_generic:
            enemies[code]["displayName"] = display_name_for(code)


def main() -> int:
    ac32 = json.loads(AC32_JSON.read_text(encoding="utf-8"))["enemies"]
    ac32_codes = [entry["code"] for entry in ac32]
    dev_names = collect_dev_names()
    build_guid_map()
    OUT_SPRITES.mkdir(parents=True, exist_ok=True)

    enemies: dict[str, dict] = {}
    generated: dict[str, dict | None] = {}
    stats = {"ok": 0, "proxy": 0, "missing": 0}

    for entry in ac32:
        code = entry["code"]
        dev_name = dev_names.get(code, code)
        display_name = humanize_dev_name(dev_name)

        sprite_data, _ = generate_sprite(code, dev_name)
        generated[code] = sprite_data

        if sprite_data:
            stats["ok"] += 1
            enemies[code] = {
                "devName": dev_name,
                "displayName": display_name,
                **sprite_data,
            }
        else:
            enemies[code] = {
                "devName": dev_name,
                "displayName": display_name,
                "spriteFile": None,
                "spriteStatus": "missing-export",
                "spritePick": None,
            }

    for entry in ac32:
        code = entry["code"]
        if generated.get(code):
            continue

        proxy_code = resolve_proxy_code(code)
        if not proxy_code:
            stats["missing"] += 1
            continue

        proxy_data = apply_variant_proxy(code, proxy_code, generated)
        if not proxy_data:
            stats["missing"] += 1
            continue

        generated[code] = proxy_data
        stats["proxy"] += 1
        enemies[code].update(proxy_data)

    for code, pick in MANUAL_SPRITE_PICKS.items():
        manual = apply_manual_sprite_pick(code, pick)
        if not manual:
            continue
        generated[code] = manual
        if code in enemies:
            enemies[code].update(manual)
        else:
            dev_name = dev_names.get(code, code)
            enemies[code] = {
                "devName": dev_name,
                "displayName": humanize_dev_name(dev_name),
                **manual,
            }

    apply_variant_display_names(enemies)

    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "spriteScale": 2,
        "spriteHeight": 48,
        "enemies": enemies,
        "stats": stats,
    }
    OUT_JSON.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    print(
        f"Generated {stats['ok']} sprites, {stats['proxy']} variant proxies, "
        f"{stats['missing']} missing -> {OUT_JSON.relative_to(ANALYZER)}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
