import sculptorToolsData from "../data/sculptor-tools.json"
import type { ReadableSaveJson } from "./saveParser"
import {
  getActiveRoomTriggerKeys,
  getQuestItemAcquisition,
  getQuestItemStatus,
  type QuestItemStatus,
} from "./inventoryQuests"

export const SCULPTOR_TOOL_PROGRESSION = sculptorToolsData.progression as readonly string[]

export interface SculptorToolPickup {
  id: number
  elementKey: number
  sceneFile: string
  url: string | null
}

export const SCULPTOR_TOOL_PICKUPS = sculptorToolsData.pickups as SculptorToolPickup[]

const pickupKeys = new Set(SCULPTOR_TOOL_PICKUPS.map((p) => p.elementKey))

/** World pickup slots collected (room trigger active). */
export function getCollectedSculptorToolPickups(
  save: ReadableSaveJson | null,
): Set<number> {
  const collected = new Set<number>()
  for (const key of getActiveRoomTriggerKeys(save)) {
    if (pickupKeys.has(key)) collected.add(key)
  }
  return collected
}

function highestAcquiredProgressionIndex(status: QuestItemStatus): number {
  let highest = -1
  for (let i = 0; i < SCULPTOR_TOOL_PROGRESSION.length; i++) {
    const itemName = SCULPTOR_TOOL_PROGRESSION[i]
    if (getQuestItemAcquisition(itemName, status) !== "missing") {
      highest = i
    }
  }
  return highest
}

/** Whether a progression-slot tool has been obtained (pickup order, not world slot). */
export function isSculptorToolProgressionAcquired(
  itemName: string,
  save: ReadableSaveJson | null,
): boolean {
  const index = SCULPTOR_TOOL_PROGRESSION.indexOf(itemName)
  if (index < 0) return false

  const status = getQuestItemStatus(save)
  if (getQuestItemAcquisition(itemName, status) !== "missing") return true

  if (index <= highestAcquiredProgressionIndex(status)) return true

  const collectedCount = getCollectedSculptorToolPickups(save).size
  return index < collectedCount
}
