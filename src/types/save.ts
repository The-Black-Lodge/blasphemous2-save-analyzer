import type { ReadableSaveJson } from "../utils/saveParser"

export interface SaveContextType {
  save: ReadableSaveJson | null
  setSave: (save: ReadableSaveJson | null) => void
  openSaveFile: () => void
}
