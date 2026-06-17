import { createContext, useContext } from "react"
import type { SaveContextType } from "../types/save"

const SaveContext = createContext<SaveContextType>({
  save: null,
  setSave: () => {},
})

export default SaveContext

export function useSave(): SaveContextType {
  return useContext(SaveContext)
}
