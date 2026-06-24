import { useRef, useState, type ReactNode } from "react"
import SaveContext, { useSave } from "./SaveContext"
import { parseSaveFile, type ReadableSaveJson } from "../utils/saveParser"

export function OpenSaveButton() {
  const { openSaveFile } = useSave()

  return (
    <div className="app-open-save-group">
      <button
        type="button"
        className="app-open-save"
        onClick={openSaveFile}
      >
        Open save file (.bin)
      </button>
      <span className="app-save-location-hint" tabIndex={0}>
        Where is my save?
        <span className="app-save-location-tooltip" role="tooltip">
          <span className="app-save-location-tooltip-label">
            <i className="fa-brands fa-windows" aria-hidden="true" />
            <i className="fa-brands fa-steam" aria-hidden="true" />
            Windows/Steam:
          </span>
          <code className="app-save-location-tooltip-path">
            C:\Users\(Username)\AppData\LocalLow\The Game Kitchen\Blasphemous
            2\SteamUser_(id)\Savegames\savegame_(0|1|2).bin
          </code>
        </span>
      </span>
    </div>
  )
}

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
    <SaveContext.Provider
      value={{
        save,
        setSave,
        openSaveFile: () => inputRef.current?.click(),
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".bin"
        hidden
        onChange={onFileSelected}
      />
      {children}
    </SaveContext.Provider>
  )
}
