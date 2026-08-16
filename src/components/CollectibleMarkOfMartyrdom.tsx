import markOfMartyrdomData from "../data/mark-of-martyrdom.json"
import { useSave } from "./SaveContext"
import {
  getKillBarMarksEarned,
  isMartyrdomMarkCollected,
  KILL_BAR_MAX,
  MARTYRDOM_LOCATIONS,
} from "../utils/markOfMartyrdom"

export default function CollectibleMarkOfMartyrdom() {
  const { save } = useSave()
  const killBarEarned = getKillBarMarksEarned(save)
  const killBarPercent =
    killBarEarned !== null
      ? Math.min(100, Math.round((killBarEarned / KILL_BAR_MAX) * 100))
      : 0

  return (
    <section className="collectible-quest-group">
      <span
        className={`qi-sprite qi-sprite--${markOfMartyrdomData.sprite} float-left`}
        aria-hidden="true"
      />
      <h3 className="leading-icon">{markOfMartyrdomData.title}</h3>
      <h4 className="collectible-summary">
        Use <em>Marks</em> to unlock <em>Weapon Memories</em> and slots in the {" "}
        <em>Altarpiece of Favours</em>.
      </h4>

      <div className="collectible-grid martyrdom-pin-grid">
        <div className="martyrdom-kill-bar-block">
          <div className="martyrdom-kill-bar-header">
            <span><em>Marks</em> earned from enemy kills</span>
            <span className="martyrdom-kill-bar-count">
              {killBarEarned !== null ? `${killBarEarned} / ${KILL_BAR_MAX}` : "-"}
            </span>
          </div>
          <div
            className="martyrdom-kill-bar-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={KILL_BAR_MAX}
            aria-valuenow={killBarEarned ?? 0}
            aria-label="Kill bar marks earned from enemy kills"
          >
            <div
              className="martyrdom-kill-bar-fill"
              style={{ width: `${killBarPercent}%` }}
            />
          </div>
        </div>

        <hr className="collectible-grid-divider" aria-hidden="true" />

        {MARTYRDOM_LOCATIONS.map((location) => {
          const collected = isMartyrdomMarkCollected(save, location)
          return (
            <div
              key={`${location.id}-${location.tracking?.type ?? location.source}-${location.elementKey ?? location.label}`}
              className={`collectible-cell${collected ? " collected" : ""}`}
              title={
                collected
                  ? "Collected"
                  : location.label || "Not yet collected"
              }
            >
              <span>#{location.id}</span>
              {location.url ? (
                <a href={location.url} target="_blank" rel="noopener noreferrer">
                  <i className="fa-solid fa-link" />
                </a>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
