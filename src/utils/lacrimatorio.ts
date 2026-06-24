import lacrimatorioData from "../data/lacrimatorio.json"
import type { ReadableSaveJson } from "./saveParser"
import {
  getQuestItemAcquisition,
  getQuestItemStatus,
} from "./inventoryQuests"
import { isRoomTriggerCleared } from "./roomTriggers"

/** Shrine placement order; later rewards imply earlier steps are done. */
export const LACRIMATORIO_PROGRESSION = [
  "QI106",
  "QI107",
  "QI108",
  "QI109",
  "QI110",
  "QI111",
] as const

export interface LacrimatorioShrine {
  id: number
  sceneFile: string
  roomHash: number
  elementKey: number
  itemName: string
  caption: string
  url: string | null
}

export const LACRIMATORIO_SHRINES =
  lacrimatorioData.shrines as LacrimatorioShrine[]

function isProgressionRewardCollected(
  itemName: string,
  status: ReturnType<typeof getQuestItemStatus>,
): boolean {
  if (getQuestItemAcquisition(itemName, status) !== "missing") return true

  const index = LACRIMATORIO_PROGRESSION.indexOf(
    itemName as (typeof LACRIMATORIO_PROGRESSION)[number],
  )
  if (index < 0) return false

  for (let i = index + 1; i < LACRIMATORIO_PROGRESSION.length; i++) {
    if (status.pickedUp.has(LACRIMATORIO_PROGRESSION[i])) return true
  }

  return false
}

/** Imperfectus piece placed at this shrine. */
export function isLacrimatorioShrineCollected(
  save: ReadableSaveJson | null,
  shrine: LacrimatorioShrine,
): boolean {
  const status = getQuestItemStatus(save)
  if (isProgressionRewardCollected(shrine.itemName, status)) return true

  return isRoomTriggerCleared(save, shrine.roomHash, shrine.elementKey)
}

export type GoldenFlaskProgress = "completed" | "in-progress" | "not-started"

export function getGoldenFlaskProgress(
  save: ReadableSaveJson | null,
  goldFlaskActive: boolean,
): GoldenFlaskProgress {
  if (goldFlaskActive) return "completed"
  const placed = LACRIMATORIO_SHRINES.filter((shrine) =>
    isLacrimatorioShrineCollected(save, shrine),
  ).length
  if (placed > 0) return "in-progress"
  return "not-started"
}

const GOLDEN_FLASK_PROGRESS_LABEL: Record<GoldenFlaskProgress, string> = {
  completed: "Completed",
  "in-progress": "In progress",
  "not-started": "Not started",
}

export function formatGoldenFlaskProgress(progress: GoldenFlaskProgress): string {
  return GOLDEN_FLASK_PROGRESS_LABEL[progress]
}
