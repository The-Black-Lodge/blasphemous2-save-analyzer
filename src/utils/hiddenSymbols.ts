import hiddenSymbolsData from "../data/hidden-symbols.json"
import type { ReadableSaveJson } from "./saveParser"

export const HIDDEN_SYMBOL_QUEST_ID = -1999729740

export interface HiddenSymbolLocation {
  id: number
  sceneFile: string
  roomHash: number
  url: string | null
  questVarID: number
}

export const HIDDEN_SYMBOL_LOCATIONS =
  hiddenSymbolsData.locations as HiddenSymbolLocation[]

function getQuestVariables(save: ReadableSaveJson | null): Record<number, number> {
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

/** Symbol revealed via PR03 (Chime of the Twisted One) — quest var set on first chime. */
export function isHiddenSymbolCollected(
  save: ReadableSaveJson | null,
  location: HiddenSymbolLocation,
): boolean {
  const value = getQuestVariables(save)[location.questVarID]
  return typeof value === "number" && value >= 0.5
}

export function getHiddenSymbolsCollectedCount(
  save: ReadableSaveJson | null,
): number | null {
  if (!save?.player?.questPersistence) return null

  return HIDDEN_SYMBOL_LOCATIONS.filter((location) =>
    isHiddenSymbolCollected(save, location),
  ).length
}
