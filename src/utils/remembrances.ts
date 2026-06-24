import { formatItemRef } from "./catalogs"
import type { CollectibleLocation } from "./collectibleLocations"
import {
  getQuestItemAcquisition,
  getQuestItemStatus,
  type QuestItemAcquisition,
  type QuestItemStatus,
} from "./inventoryQuests"
import { hasMeaCulpaUnlocked, MEA_CULPA_HILT } from "./meaCulpa"
import type { ReadableSaveJson } from "./saveParser"

/** Remembrance quest item → altar figure granted by Montañés. */
export const REMEMBRANCE_REWARD_FIGURES: Record<string, string> = {
  QI04: "FG19",
  QI06: "FG09",
  QI09: "FG23",
  QI10: "FG20",
  QI55: "FG29",
  QI62: "FG10",
  QI71: "FG44",
}

/** Item turned in to Montañés to receive a remembrance. */
export const REMEMBRANCE_INPUT_ITEMS: Record<string, string> = {
  QI05: "QI06",
  QI07: "QI10",
  QI08: "QI09",
}

export const REMEMBRANCE_ITEM_NAMES = new Set(
  Object.keys(REMEMBRANCE_REWARD_FIGURES),
)

export const PROXIMO_RATTLE = "QI54"
export const PROXIMO_REMEMBRANCE = "QI55"

export function isRemembranceItem(source: string): boolean {
  return REMEMBRANCE_ITEM_NAMES.has(source)
}

function parseSignedInt32FromIdHex(idHex: string): number | null {
  const trimmed = idHex.trim()
  const hex = /^0x/i.test(trimmed) ? trimmed.slice(2) : trimmed
  const unsigned = Number.parseInt(hex, 16)
  if (!Number.isFinite(unsigned)) return null
  return unsigned > 0x7fffffff ? unsigned - 0x100000000 : unsigned
}

export function getAcquiredFigureSources(
  save: ReadableSaveJson | null,
): Set<string> {
  const acquired = new Set<string>()

  const inventoryFigures = (
    save?.player?.inventory as
      | { figures?: { items?: { item?: { name?: string } }[] } }
      | undefined
  )?.figures?.items

  for (const entry of inventoryFigures ?? []) {
    const name = entry?.item?.name
    if (typeof name === "string") acquired.add(name)
  }

  const ownFigures = (
    save?.player as
      | { inventorySummary?: { ownFigures?: Array<string | number> } }
      | undefined
  )?.inventorySummary?.ownFigures

  if (Array.isArray(ownFigures)) {
    for (const code of ownFigures) {
      if (typeof code === "number") {
        const ref = formatItemRef(code)
        if (ref?.name) acquired.add(ref.name)
      } else if (typeof code === "string") {
        const parsed = parseSignedInt32FromIdHex(code)
        if (parsed === null) continue
        const ref = formatItemRef(parsed)
        if (ref?.name) acquired.add(ref.name)
      }
    }
  }

  return acquired
}

export function isRemembranceDelivered(
  save: ReadableSaveJson | null,
  source: string,
): boolean {
  const rewardFigure = REMEMBRANCE_REWARD_FIGURES[source]
  if (!rewardFigure) return false
  return getAcquiredFigureSources(save).has(rewardFigure)
}

export function isRemembranceInputConsumed(
  save: ReadableSaveJson | null,
  inputSource: string,
  status: QuestItemStatus,
): boolean {
  const remembrance = REMEMBRANCE_INPUT_ITEMS[inputSource]
  if (!remembrance) return false
  if (isRemembranceDelivered(save, remembrance)) return true
  return getQuestItemAcquisition(remembrance, status) !== "missing"
}

export function shouldHideProximoRattle(
  save: ReadableSaveJson | null,
  status: QuestItemStatus,
): boolean {
  if (status.owned.has(PROXIMO_REMEMBRANCE)) return true
  if (status.pickedUp.has(PROXIMO_REMEMBRANCE)) return true
  return isRemembranceDelivered(save, PROXIMO_REMEMBRANCE)
}

export function resolveQuestItemAcquisition(
  save: ReadableSaveJson | null,
  source: string,
  status: QuestItemStatus,
): QuestItemAcquisition {
  if (isRemembranceDelivered(save, source)) return "handed-in"
  if (isRemembranceInputConsumed(save, source, status)) return "handed-in"
  if (source === MEA_CULPA_HILT && hasMeaCulpaUnlocked(save)) return "handed-in"
  return getQuestItemAcquisition(source, status)
}

export function isRemembranceCollected(
  save: ReadableSaveJson | null,
  location: CollectibleLocation,
): boolean {
  if (!location.itemName) return false
  return resolveQuestItemAcquisition(save, location.itemName, getQuestItemStatus(save)) !== "missing"
}
