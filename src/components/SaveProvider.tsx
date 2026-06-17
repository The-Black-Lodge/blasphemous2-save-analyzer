import { useRef, useState, type ReactNode } from "react"
import SaveContext from "./SaveContext"
import { parseSaveFile, type ReadableSaveJson } from "../utils/saveParser"

export default function SaveProvider({ children }: { children?: ReactNode }) {
  const [save, setSave] = useState<ReadableSaveJson | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const onFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    try {
      const parsed = await parseSaveFile(file)
      console.log(parsed)
      setSave(parsed)
    } catch (err) {
      setSave(null)
      console.error(err)
    }
  }

  return (
    <SaveContext.Provider value={{ save, setSave }}>
      <input
        ref={inputRef}
        type="file"
        accept=".bin"
        hidden
        onChange={onFileSelected}
      />
      <button type="button" onClick={() => inputRef.current?.click()}>
        Open save file (.bin)
      </button>
      {children}
    </SaveContext.Provider>
  )
}
