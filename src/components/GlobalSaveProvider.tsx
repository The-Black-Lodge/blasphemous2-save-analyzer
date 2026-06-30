import { useRef, useState, type ReactNode } from "react"
import GlobalSaveContext, { useGlobalSave } from "./GlobalSaveContext"
import {
  parseGlobalSaveFile,
  type ReadableGlobalSaveJson,
} from "../utils/globalSaveParser"

export function OpenGlobalDataButton() {
  const { openGlobalDataFile, fileName } = useGlobalSave()

  return (
    <div className="app-open-save-group">
      <button
        type="button"
        className="app-open-save app-open-save--accent"
        onClick={openGlobalDataFile}
      >
        Open Global Data (.data)
      </button>
      {fileName ? (
        <span className="global-save-filename">{fileName}</span>
      ) : (
        <span className="app-save-location-hint" tabIndex={0}>
          Where is my global save?
          <span className="app-save-location-tooltip" role="tooltip">
            <span className="app-save-location-tooltip-label">
              <i className="fa-brands fa-windows" aria-hidden="true" />
              <i className="fa-brands fa-steam" aria-hidden="true" />
              Windows/Steam:
            </span>
            <code className="app-save-location-tooltip-path">
              C:\Users\(Username)\AppData\LocalLow\The Game Kitchen\Blasphemous
              2\SteamUser_(id)\GlobalData.data
            </code>
          </span>
        </span>
      )}
    </div>
  )
}

export default function GlobalSaveProvider({
  children,
}: {
  children?: ReactNode
}) {
  const [globalSave, setGlobalSave] = useState<ReadableGlobalSaveJson | null>(
    null,
  )
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const onFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    try {
      const parsed = await parseGlobalSaveFile(file)
      console.log(parsed)
      setGlobalSave(parsed)
      setFileName(file.name)
    } catch (err) {
      setGlobalSave(null)
      setFileName(null)
      console.error(err)
    }
  }

  return (
    <GlobalSaveContext.Provider
      value={{
        globalSave,
        setGlobalSave,
        openGlobalDataFile: () => inputRef.current?.click(),
        fileName,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".data"
        hidden
        onChange={onFileSelected}
      />
      {children}
    </GlobalSaveContext.Provider>
  )
}
