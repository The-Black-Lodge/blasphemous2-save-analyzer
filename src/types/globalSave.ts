import type { ReadableGlobalSaveJson } from "../utils/globalSaveParser"

export interface GlobalSaveContextType {
  globalSave: ReadableGlobalSaveJson | null
  setGlobalSave: (save: ReadableGlobalSaveJson | null) => void
  openGlobalDataFile: () => void
  fileName: string | null
}
