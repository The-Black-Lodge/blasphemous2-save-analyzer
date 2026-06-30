import { useContext, useMemo, useState } from "react"
import { TabContext } from "../App"
import { useGlobalSave } from "./GlobalSaveContext"
import {
  getSpanishInquisitionStatus,
  SPANISH_INQUISITION_TITLE,
} from "../utils/spanishInquisition"

function useTab() {
  return useContext(TabContext)
}

export default function GlobalAnalyzer() {
  const tab = useTab()
  const { globalSave } = useGlobalSave()
  const [saveSlot, setSaveSlot] = useState(0)

  const inquisition = useMemo(() => {
    if (!globalSave) return null
    return getSpanishInquisitionStatus(
      globalSave.achievementProgress,
      saveSlot,
    )
  }, [globalSave, saveSlot])

  return (
    <section className="global-analyzer">
      {tab === "all" && <h2>Global Analyzer</h2>}

      {!globalSave ? (
        <p className="global-analyzer-hint">
          Load <code>GlobalData.data</code> for some other information (achievements, etc.)
        </p>
      ) : (
        <>
          <div className="global-analyzer-controls">
            <fieldset className="global-analyzer-slot">
              <legend>Save slot:</legend>
              {[0, 1, 2].map((slot) => (
                <label key={slot} className="global-analyzer-slot-option">
                  <input
                    type="radio"
                    name="global-save-slot"
                    value={slot}
                    checked={saveSlot === slot}
                    onChange={() => setSaveSlot(slot)}
                  />
                  {slot + 1}
                </label>
              ))}
            </fieldset>
            <span className="global-analyzer-meta">
              Global save v{globalSave.file.version} ·{" "}
              {globalSave.achievementProgress.length} progress entries
            </span>
          </div>

          <h3 className="global-analyzer-section-title">
            {SPANISH_INQUISITION_TITLE}
          </h3>
          {inquisition ? (
            <>
              <p className="global-analyzer-progress">
                {inquisition.killedCount} / {inquisition.trackedTotal} enemy
                types killed
                <span className="global-analyzer-progress-note">
                  {" "}
                  ({inquisition.enemies.length} types in bestiary list)
                </span>
              </p>
              <div className="global-enemy-grid">
                {inquisition.enemies.map((enemy) => (
                  <div
                    key={enemy.code}
                    className={`global-enemy-row${enemy.killed ? " global-enemy-row--killed" : ""}`}
                  >
                    <span className="global-enemy-code">{enemy.code}</span>
                    <span className="global-enemy-status">
                      {enemy.killed ? "Killed" : "Not killed"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </>
      )}
    </section>
  )
}
