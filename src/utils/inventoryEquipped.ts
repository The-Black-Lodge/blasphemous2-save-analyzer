import type { ReadableSaveJson } from "./saveParser"

interface InventoryItem {
  item?: {
    name?: string
  }
  slot?: number
  internalValue?: number
}

type InventorySections = {
  figures?: { items?: InventoryItem[] }
  rosaryBeads?: { items?: InventoryItem[] }
  prayers?: { items?: InventoryItem[] }
  collectibles?: { items?: InventoryItem[] }
}

function getInventory(save: ReadableSaveJson | null): InventorySections | undefined {
  return save?.player?.inventory as InventorySections | undefined
}

export interface EquippedRosaryBead {
  slot: number
  source: string
}

export interface EquippedPrayer {
  /** 0 = quick/fast (InventoryComponent.FAST_PRAYER_SLOT), 1 = full (FULL_PRAYER_SLOT) */
  slot: 0 | 1
  source: string
}

const EQUIPPED_PRAYER_SLOTS = new Set<number>([0, 1])

export interface EquippedFigure {
  slot: number
  source: string
}

export function getEquippedFigures(
  save: ReadableSaveJson | null,
): EquippedFigure[] {
  return (
    getInventory(save)?.figures?.items
      ?.flatMap((entry) => {
        const source = entry.item?.name
        const slot = entry.slot
        if (
          typeof source !== "string" ||
          !/^FG\d+$/.test(source) ||
          typeof slot !== "number" ||
          slot < 0
        ) {
          return []
        }
        return [{ slot, source }]
      }) ?? []
  ).sort((a, b) => a.slot - b.slot)
}

export function getEquippedRosaryBeads(
  save: ReadableSaveJson | null,
): EquippedRosaryBead[] {
  const fromInventory =
    getInventory(save)?.rosaryBeads?.items
      ?.flatMap((entry) => {
        const source = entry.item?.name
        const slot = entry.slot
        if (typeof source !== "string" || typeof slot !== "number" || slot < 0) {
          return []
        }
        return [{ slot, source }]
      }) ?? []

  if (fromInventory.length > 0) {
    return fromInventory.sort((a, b) => a.slot - b.slot)
  }

  const summary = (
    save?.player as { inventorySummary?: { wearBeads?: EquippedRosaryBead[] } }
  )?.inventorySummary?.wearBeads

  if (!summary?.length) return []
  return [...summary].sort((a, b) => a.slot - b.slot)
}

export function getEquippedPrayers(
  save: ReadableSaveJson | null,
): EquippedPrayer[] {
  const equipped: EquippedPrayer[] = []

  for (const section of ["prayers", "collectibles"] as const) {
    for (const entry of getInventory(save)?.[section]?.items ?? []) {
      const source = entry.item?.name
      if (typeof source !== "string" || !source.startsWith("PR")) continue

      const rawSlot = entry.slot ?? entry.internalValue
      if (typeof rawSlot !== "number" || !EQUIPPED_PRAYER_SLOTS.has(rawSlot)) {
        continue
      }
      equipped.push({ slot: rawSlot as 0 | 1, source })
    }
  }

  return equipped.sort((a, b) => a.slot - b.slot)
}
