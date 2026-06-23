import cobijadasData from "../data/cobijadas.json"
import type { ReadableSaveJson } from "./saveParser"

export const COBIJADA_ELEMENT_KEY = cobijadasData.elementKey as number

export interface CobijadaLocation {
  id: number
  sceneFile: string
  roomHash: number
  url: string | null
}

export const COBIJADA_LOCATIONS = cobijadasData.locations as CobijadaLocation[]

const ST25_QUEST_ID = -1240214856
const COBIJADAS_RELEASED_VAR = -834360518

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

  return false
}

/** Sister released at this world location (room trigger active). */
export function isCobijadaReleased(
  save: ReadableSaveJson | null,
  location: CobijadaLocation,
): boolean {
  return (
    getRoomTriggerActive(save, location.roomHash, COBIJADA_ELEMENT_KEY) === true
  )
}

/** ST25 total sisters released (0–9), or null if quest data unavailable. */
export function getCobijadasReleasedCount(
  save: ReadableSaveJson | null,
): number | null {
  const quest = getQuestPersistence(save)?.quests?.find(
    (q) => q.questID === ST25_QUEST_ID,
  )
  if (!quest) return null

  const value = quest.variables[COBIJADAS_RELEASED_VAR]
  return typeof value === "number" ? Math.round(value) : null
}
