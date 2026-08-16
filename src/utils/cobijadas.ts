import cobijadasData from "../data/cobijadas.json"
import type { ReadableSaveJson } from "./saveParser"

export interface CobijadaLocation {
  id: number
  sceneFile: string
  roomHash: number
  elementKey: number
  /** 0-based index into COBIJADA_SISTERS (COBIJADA1_ENABLED … COBIJADA9_ENABLED). */
  sisterIndex: number
  url: string | null
}

export const COBIJADA_LOCATIONS = cobijadasData.locations as CobijadaLocation[]

const ST25_QUEST_ID = -1240214856
const COBIJADAS_RELEASED_VAR = -834360518

/** ST25 COBIJADA1_ENABLED … COBIJADA9_ENABLED (set when a sister is released). */
const COBIJADA_ENABLED_VARS = [
  2134713504,
  2126625629,
  2127745950,
  2138058075,
  2139169948,
  2131082073,
  2132202394,
  2124114791,
  2125226664,
] as const

interface QuestRecord {
  questID: number
  variables: Record<number, number>
}

interface QuestPersistenceData {
  type?: string
  quests?: QuestRecord[]
}

function getQuestPersistence(
  save: ReadableSaveJson | null,
): QuestPersistenceData | null {
  const fromPlayer = save?.player?.questPersistence as
    | QuestPersistenceData
    | undefined
  if (fromPlayer?.quests?.length) return fromPlayer

  const fromCommon = save?.commonElements?.ID_QUEST_MANAGER as
    | { data?: QuestPersistenceData }
    | undefined
  if (fromCommon?.data?.type === "QuestPersistenceData") return fromCommon.data

  return null
}

function getSt25Quest(save: ReadableSaveJson | null): QuestRecord | null {
  return (
    getQuestPersistence(save)?.quests?.find(
      (q) => q.questID === ST25_QUEST_ID,
    ) ?? null
  )
}

function isQuestVarEnabled(
  variables: Record<number, number> | undefined,
  varId: number,
): boolean {
  const value = variables?.[varId]
  return typeof value === "number" && value >= 1
}

function getRoomTriggerActive(
  save: ReadableSaveJson | null,
  roomHash: number,
  elementKey: number,
): boolean | null {
  const room = save?.roomElements?.[`room_${roomHash}`] as
    | {
        elements?: Record<
          string,
          {
            elementId?: number
            data?: { type?: string; isActive?: boolean }
          }
        >
      }
    | undefined

  if (!room?.elements) return null

  for (const element of Object.values(room.elements)) {
    if (element.elementId !== elementKey) continue
    if (element.data?.type !== "TriggerData") return false
    return element.data.isActive === true
  }

  return null
}

function isCobijadaReleasedByQuest(
  save: ReadableSaveJson | null,
  location: CobijadaLocation,
): boolean {
  const quest = getSt25Quest(save)
  if (!quest) return false

  const enabledVar = COBIJADA_ENABLED_VARS[location.sisterIndex]
  return isQuestVarEnabled(quest.variables, enabledVar)
}

/** Sister released back to Albero at this world location. */
export function isCobijadaReleased(
  save: ReadableSaveJson | null,
  location: CobijadaLocation,
): boolean {
  if (isCobijadaReleasedByQuest(save, location)) return true

  const triggerActive = getRoomTriggerActive(
    save,
    location.roomHash,
    location.elementKey,
  )
  return triggerActive === true
}

/** ST25 total sisters released (0-9), or null if quest data unavailable. */
export function getCobijadasReleasedCount(
  save: ReadableSaveJson | null,
): number | null {
  const quest = getSt25Quest(save)
  if (!quest) return null

  const value = quest.variables[COBIJADAS_RELEASED_VAR]
  return typeof value === "number" ? Math.round(value) : null
}
