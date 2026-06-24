import type { ReadableSaveJson } from "./saveParser"
import {
  getQuestItemAcquisition,
  getQuestItemStatus,
} from "./inventoryQuests"
import {
  isRoomTriggerCleared,
  isRoomTriggerCollected,
} from "./roomTriggers"

export type CollectibleTracking =
  | { type: "questItem" }
  | { type: "roomTrigger" }
  | { type: "roomTriggerCleared" }

export interface CollectibleLocation {
  id: number
  sceneFile: string
  roomHash: number
  url: string | null
  itemName?: string
  caption?: string
  elementKey?: number
}

export interface CollectibleLocationData {
  title: string
  sprite?: string
  tracking?: CollectibleTracking
  locations: CollectibleLocation[]
}

function resolveTracking(
  location: CollectibleLocation,
  collectionTracking?: CollectibleTracking,
): CollectibleTracking | null {
  if (collectionTracking) return collectionTracking
  if (location.elementKey !== undefined) return { type: "roomTrigger" }
  if (location.itemName) return { type: "questItem" }
  return null
}

export function isCollectibleLocationCollected(
  save: ReadableSaveJson | null,
  location: CollectibleLocation,
  collectionTracking?: CollectibleTracking,
): boolean {
  const tracking = resolveTracking(location, collectionTracking)
  if (!tracking) return false

  if (tracking.type === "questItem") {
    if (!location.itemName) return false
    const status = getQuestItemStatus(save)
    return getQuestItemAcquisition(location.itemName, status) !== "missing"
  }

  if (location.elementKey === undefined) return false

  if (tracking.type === "roomTriggerCleared") {
    return isRoomTriggerCleared(
      save,
      location.roomHash,
      location.elementKey,
    )
  }

  return isRoomTriggerCollected(
    save,
    location.roomHash,
    location.elementKey,
  )
}
