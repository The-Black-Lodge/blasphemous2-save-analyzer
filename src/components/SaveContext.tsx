import { createContext } from "react"
import type { SaveContextType } from "../types/save"

const SaveContext = createContext<SaveContextType>({
  save: null,
  setSave: () => {},
})

export default SaveContext
