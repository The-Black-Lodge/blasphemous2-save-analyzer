import sculptorToolsData from "../data/sculptor-tools.json"
import type { ReadableSaveJson } from "./saveParser"
import { unityStringHash } from "./unityStringHash"
import {
  getActiveRoomTriggerKeys,
  getQuestItemAcquisition,
  getQuestItemStatus,
  type QuestItemStatus,
} from "./inventoryQuests"

export const SCULPTOR_TOOL_PROGRESSION = sculptorToolsData.progression as readonly string[]

/** ST05 — Imaginero / Sculptor's Tools (Montañés). */
export const ST05_QUEST_ID = unityStringHash("ST05")

const SCULPTOR_TOOL_OFFERED_VARS: Record<string, number> = {
  QI12: unityStringHash("QI12_OFFERED"),
  QI02: unityStringHash("QI02_OFFERED"),
  QI11: unityStringHash("QI11_OFFERED"),
  QI03: unityStringHash("QI03_OFFERED"),
  QI01: unityStringHash("QI01_OFFERED"),
}

function getSt05QuestVariables(
  save: ReadableSaveJson | null,
): Record<number, number> | null {
  const fromPlayer = save?.player?.questPersistence as
    | { quests?: { questID: number; variables: Record<number, number> }[] }
    | undefined
  const quests = fromPlayer?.quests
  if (quests?.length) {
    const quest = quests.find((entry) => entry.questID === ST05_QUEST_ID)
    if (quest) return quest.variables
  }

  const fromCommon = save?.commonElements?.ID_QUEST_MANAGER as
    | { data?: { quests?: { questID: number; variables: Record<number, number> }[] } }
    | undefined
  const commonQuest = fromCommon?.data?.quests?.find(
    (entry) => entry.questID === ST05_QUEST_ID,
  )
  return commonQuest?.variables ?? null
}

function questVarActive(value: number | undefined): boolean {
  return typeof value === "number" && value >= 0.5
}

export function isSculptorToolDelivered(
  save: ReadableSaveJson | null,
  itemName: string,
): boolean {
  const varId = SCULPTOR_TOOL_OFFERED_VARS[itemName]
  if (varId === undefined) return false

  const variables = getSt05QuestVariables(save)
  if (!variables) return false
  return questVarActive(variables[varId])
}

export function inferDeliveredSculptorTools(
  save: ReadableSaveJson | null,
): string[] {
  const variables = getSt05QuestVariables(save)
  if (!variables) return []

  const delivered: string[] = []
  for (const itemName of SCULPTOR_TOOL_PROGRESSION) {
    const varId = SCULPTOR_TOOL_OFFERED_VARS[itemName]
    if (questVarActive(variables[varId])) delivered.push(itemName)
  }
  return delivered
}

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

  if (isSculptorToolDelivered(save, itemName)) return true

  const status = getQuestItemStatus(save)
  if (getQuestItemAcquisition(itemName, status) !== "missing") return true

  if (index <= highestAcquiredProgressionIndex(status)) return true

  const collectedCount = getCollectedSculptorToolPickups(save).size
  return index < collectedCount
}
