import { createContext, useContext } from "react"
import type { GlobalSaveContextType } from "../types/globalSave"

const GlobalSaveContext = createContext<GlobalSaveContextType>({
  globalSave: null,
  setGlobalSave: () => {},
  openGlobalDataFile: () => {},
  fileName: null,
})

export default GlobalSaveContext

export function useGlobalSave(): GlobalSaveContextType {
  return useContext(GlobalSaveContext)
}
