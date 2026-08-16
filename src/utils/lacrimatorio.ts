import lacrimatorioData from "../data/lacrimatorio.json"
import type { ReadableSaveJson } from "./saveParser"

/** ST105 - tomb shrines for Imperfectus Lacrimatorio. */
export const ST105_QUEST_ID = -1455898281

export interface LacrimatorioShrine {
  id: number
  sceneFile: string
  roomHash: number
  elementKey: number
  questVarID: number
  itemName: string
  caption: string
  url: string | null
}

export const LACRIMATORIO_SHRINES =
  lacrimatorioData.shrines as LacrimatorioShrine[]

function getQuestVariables(
  save: ReadableSaveJson | null,
): Record<number, number> {
  const raw = (
    save?.player?.questPersistence as
      | { variables?: Record<string | number, number> }
      | undefined
  )?.variables
  if (!raw) return {}

  const out: Record<number, number> = {}
  for (const [key, value] of Object.entries(raw)) {
    out[Number(key)] = value
  }
  return out
}

/** Shrine used - ST105 TOMB*_FINISHED, not the room trigger (inactive on visit). */
export function isLacrimatorioShrineCollected(
  save: ReadableSaveJson | null,
  shrine: LacrimatorioShrine,
): boolean {
  const value = getQuestVariables(save)[shrine.questVarID]
  return typeof value === "number" && value >= 0.5
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
