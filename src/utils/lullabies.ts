import lullabiesData from "../data/lullabies.json"
import type { ReadableSaveJson } from "./saveParser"
import {
  getQuestItemAcquisition,
  getQuestItemStatus,
} from "./inventoryQuests"
import { getAcquiredPrayerSources } from "./inventoryPrayers"
import { isRoomTriggerCollected } from "./roomTriggers"
import type { CollectibleLocation } from "./collectibleLocations"

/** Page pickup order; later rewards imply earlier steps are done. */
export const LULLABY_PROGRESSION = [
  "QI23",
  "QI24",
  "QI25",
  "QI26",
  "QI27",
] as const

export const LULLABY_LOCATIONS =
  lullabiesData.locations as CollectibleLocation[]

function isProgressionRewardCollected(
  itemName: string,
  status: ReturnType<typeof getQuestItemStatus>,
): boolean {
  if (getQuestItemAcquisition(itemName, status) !== "missing") return true

  const index = LULLABY_PROGRESSION.indexOf(
    itemName as (typeof LULLABY_PROGRESSION)[number],
  )
  if (index < 0) return false

  for (let i = index + 1; i < LULLABY_PROGRESSION.length; i++) {
    if (status.pickedUp.has(LULLABY_PROGRESSION[i])) return true
  }

  return false
}

export function isLullabyCollected(
  save: ReadableSaveJson | null,
  location: CollectibleLocation,
): boolean {
  if (!location.itemName) return false

  if (getAcquiredPrayerSources(save).has("PR16")) return true

  const status = getQuestItemStatus(save)
  if (isProgressionRewardCollected(location.itemName, status)) return true

  if (location.elementKey !== undefined) {
    return isRoomTriggerCollected(
      save,
      location.roomHash,
      location.elementKey,
    )
  }

  return false
}
