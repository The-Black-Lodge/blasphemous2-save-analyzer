import { useState, type ReactNode } from "react"
import SaveContext from "./SaveContext"

export default function SaveProvider({ children }: { children?: ReactNode }) {
  const [save, setSave] = useState<unknown | null>(null)

  return (
    <SaveContext.Provider value={{ save, setSave }}>
      {children}
    </SaveContext.Provider>
  )
}
