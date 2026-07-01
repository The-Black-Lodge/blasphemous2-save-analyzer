import { useContext, useState } from "react"

import { TabContext } from "../App"

import { useGlobalSave } from "./GlobalSaveContext"
import GlobalAchievementEnemyKills from "./GlobalAchievementEnemyKills"

function useTab() {
  return useContext(TabContext)
}

export default function GlobalAnalyzer() {
  const tab = useTab()
  const { globalSave } = useGlobalSave()
  const [saveSlot, setSaveSlot] = useState(0)

  return (
    <section className="global-analyzer">
      {tab === "all" && <h2>Global Analyzer</h2>}

      {!globalSave ? (
        <p className="global-analyzer-hint">
          Load <code>GlobalData.data</code> to track kill progress per save slot. Please note that this is a work in progress.
        </p>
      ) : (
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
      )}

      <GlobalAchievementEnemyKills
        globalSave={globalSave}
        saveSlot={saveSlot}
      />
    </section>
  )
}
