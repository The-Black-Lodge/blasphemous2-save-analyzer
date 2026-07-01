"""Set occursInGame on ac32-enemies.json from World scene spawnpoint scan."""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "AssetRipper_export_20260621_154214/ExportedProject/Assets"
WORLD = ASSETS / "#Scenes/World"
AC32_JSON = Path(__file__).resolve().parents[1] / "src/data/ac32-enemies.json"

SPAWN_NAME_RE = re.compile(r"m_Name: (EN\d+).*Spawnpoint")


def spawnpoint_codes_in_world() -> set[str]:
    found: set[str] = set()
    if not WORLD.exists():
        raise SystemExit(f"World scenes not found: {WORLD}")
    for unity in WORLD.rglob("*.unity"):
        text = unity.read_text(encoding="utf-8", errors="ignore")
        for match in SPAWN_NAME_RE.finditer(text):
            found.add(match.group(1))
    return found


def main() -> None:
    data = json.loads(AC32_JSON.read_text(encoding="utf-8"))
    spawned = spawnpoint_codes_in_world()
    in_game = 0
    for enemy in data["enemies"]:
        occurs = enemy["code"] in spawned
        enemy["occursInGame"] = occurs
        if occurs:
            in_game += 1
    data["spawnScanAt"] = datetime.now(timezone.utc).isoformat()
    data["inGameCount"] = in_game
    AC32_JSON.write_text(
        json.dumps(data, indent=2) + "\n",
        encoding="utf-8",
    )
    missing = [e["code"] for e in data["enemies"] if not e["occursInGame"]]
    print(f"Updated {AC32_JSON.name}: {in_game} in-game, {len(missing)} not spawned")
    if missing:
        print("Not in World scenes:", ", ".join(missing))


if __name__ == "__main__":
    main()
