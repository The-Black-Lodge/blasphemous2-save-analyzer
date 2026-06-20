import type { ReadableSaveJson } from "./saveParser"

interface InventoryItem {
  item?: {
    name?: string
  }
}

/** Prayer sources (PR##) owned by the player — same logic as the Prayers tab. */
export function getAcquiredPrayerSources(
  save: ReadableSaveJson | null,
): Set<string> {
  const acquired = new Set<string>()
  const inventory = save?.player?.inventory as
    | {
        prayers?: { items?: InventoryItem[] }
        collectibles?: { items?: InventoryItem[] }
      }
    | undefined

  for (const section of ["prayers", "collectibles"] as const) {
    for (const entry of inventory?.[section]?.items ?? []) {
      const name = entry.item?.name
      if (typeof name === "string" && name.startsWith("PR")) {
        acquired.add(name)
      }
    }
  }

  return acquired
}
