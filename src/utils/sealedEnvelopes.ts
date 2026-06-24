import sealedEnvelopesData from "../data/sealed-envelopes.json"
import type { ReadableSaveJson } from "./saveParser"
import {
  getQuestItemAcquisition,
  getQuestItemStatus,
} from "./inventoryQuests"
import { isRoomTriggerCollected } from "./roomTriggers"
import type { CollectibleLocation } from "./collectibleLocations"

/** Sealed pickup → opened letter (consumed on read). */
export const SEALED_TO_READ: Record<string, string> = {
  QI13: "QI14",
  QI15: "QI16",
  QI17: "QI18",
  QI19: "QI20",
  QI21: "QI22",
}

export const SEALED_ENVELOPE_LOCATIONS =
  sealedEnvelopesData.locations as CollectibleLocation[]

export function isSealedEnvelopeCollected(
  save: ReadableSaveJson | null,
  location: CollectibleLocation,
): boolean {
  if (!location.itemName) return false

  const status = getQuestItemStatus(save)
  const sealed = location.itemName

  if (getQuestItemAcquisition(sealed, status) !== "missing") return true

  const read = SEALED_TO_READ[sealed]
  if (read && getQuestItemAcquisition(read, status) !== "missing") return true

  if (location.elementKey !== undefined) {
    return isRoomTriggerCollected(
      save,
      location.roomHash,
      location.elementKey,
    )
  }

  return false
}
