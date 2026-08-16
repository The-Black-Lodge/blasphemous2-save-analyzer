import mementosData from "../data/mementos.json"
import { useSave } from "./SaveContext"
import { collectibleCollectionSummaries } from "./collectibleCollectionSummaries"
import { isRemembranceCollected } from "../utils/remembrances"
import type { CollectibleLocation } from "../utils/collectibleLocations"

const REMEMBRANCE_LOCATIONS =
  mementosData.locations as CollectibleLocation[]

export default function CollectibleRemembrances() {
  const { save } = useSave()

  return (
    <section className="collectible-quest-group collectible-remembrances">
      <span
        className={`qi-sprite qi-sprite--${mementosData.sprite} float-left`}
        aria-hidden="true"
      />
      <h3 className="leading-icon">{mementosData.title}</h3>
      <h4 className="collectible-summary">
        {collectibleCollectionSummaries.mementos}
      </h4>

      <div className="collectible-grid">
        {REMEMBRANCE_LOCATIONS.map((location) => {
          const collected = isRemembranceCollected(save, location)
          const caption = location.caption ?? location.itemName ?? "Remembrance"
          return (
            <div
              key={`${location.id}-${location.itemName ?? location.sceneFile}`}
              className={`collectible-cell${collected ? " collected" : ""}`}
              title={
                collected
                  ? caption
                  : `${caption} - not yet collected`
              }
            >
              <div className="collectible-cell-icon-slot">
                {location.itemName ? (
                  <span
                    className={`qi-sprite qi-sprite--${location.itemName}`}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
              <span className="collectible-cell-label">{caption}</span>
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
