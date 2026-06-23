import hiddenSymbolsData from "../data/hidden-symbols.json"

export interface HiddenSymbolLocation {
  id: number
  sceneFile: string
  roomHash: number
  url: string | null
  elementKey?: number
}

export const HIDDEN_SYMBOL_LOCATIONS =
  hiddenSymbolsData.locations as HiddenSymbolLocation[]
