import { useMemo } from "react"

import {
  getSpanishInquisitionBestiary,
  getSpanishInquisitionStatus,
  SPANISH_INQUISITION_TITLE,
} from "../utils/spanishInquisition"
import {
  getEnemyDisplayName,
  getEnemySpriteUrl,
} from "../utils/enemyDisplay"
import type { ReadableGlobalSaveJson } from "../utils/globalSaveParser"

interface GlobalAchievementEnemyKillsProps {
  globalSave: ReadableGlobalSaveJson | null
  saveSlot: number
}

export default function GlobalAchievementEnemyKills({
  globalSave,
  saveSlot,
}: GlobalAchievementEnemyKillsProps) {
  const inquisition = useMemo(() => {
    if (!globalSave) return getSpanishInquisitionBestiary()

    return getSpanishInquisitionStatus(
      globalSave.achievementProgress,
      saveSlot,
    )
  }, [globalSave, saveSlot])

  return (
    <>
      <h3 className="global-analyzer-section-title">
        {SPANISH_INQUISITION_TITLE}
      </h3>

      {globalSave ? (
        <p className="global-analyzer-progress">
          {inquisition.killedCount} / {inquisition.trackedTotal} enemy types
          killed
        </p>
      ) : null}

<p>Still working out the correct sprites/enemies for this - may be inaccurate! Feel free to <a href="https://github.com/The-Black-Lodge/blasphemous2-save-analyzer/issues/2" target="_blank" rel="noopener noreferrer">discuss the issue on GitHub</a>.</p>

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
    </>
  )
}
