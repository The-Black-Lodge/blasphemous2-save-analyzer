import { useContext, useMemo, useState } from "react"

import { TabContext } from "../App"

import { useGlobalSave } from "./GlobalSaveContext"

import {

  getSpanishInquisitionBestiary,

  getSpanishInquisitionStatus,

  SPANISH_INQUISITION_TITLE,

} from "../utils/spanishInquisition"

import {
  getEnemyDisplayName,
  getEnemySpriteUrl,
} from "../utils/enemyDisplay"



function useTab() {

  return useContext(TabContext)

}



export default function GlobalAnalyzer() {

  const tab = useTab()

  const { globalSave } = useGlobalSave()

  const [saveSlot, setSaveSlot] = useState(0)



  const inquisition = useMemo(() => {

    if (!globalSave) return getSpanishInquisitionBestiary()

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

          Load <code>GlobalData.data</code> to track kill progress per save slot. Please note that this is a work in progress, and some information may be inaccurate!

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



      <h3 className="global-analyzer-section-title">

        {SPANISH_INQUISITION_TITLE}

      </h3>

      {globalSave ? (

        <p className="global-analyzer-progress">

          {inquisition.killedCount} / {inquisition.trackedTotal} enemy types

          killed

          <span className="global-analyzer-progress-note">

            {" "}

            ({inquisition.enemies.length} types in bestiary list)

          </span>

        </p>

      ) : null}

      <div className="global-enemy-grid">

        {inquisition.enemies.map((enemy) => {

          const spriteUrl = getEnemySpriteUrl(enemy.code)

          const label = getEnemyDisplayName(enemy.code)



          return (

            <div

              key={enemy.code}

              className={`global-enemy-cell${globalSave && enemy.killed ? " global-enemy-cell--killed" : ""}`}

              title={`${label} (${enemy.code})`}

            >

              <div className="global-enemy-cell-icon">

                {spriteUrl ? (

                  <img

                    className="global-enemy-sprite"

                    src={spriteUrl}

                    alt=""

                    aria-hidden="true"

                  />

                ) : (

                  <span className="global-enemy-sprite-placeholder">

                    {enemy.code}

                  </span>

                )}

              </div>

              <span className="global-enemy-name">{label}</span>

            </div>

          )

        })}

      </div>

    </section>

  )

}


