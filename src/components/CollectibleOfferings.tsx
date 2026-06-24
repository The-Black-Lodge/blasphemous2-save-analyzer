import offeringsData from "../data/offerings.json"
import { useSave } from "./SaveContext"
import { collectibleCollectionSummaries } from "./collectibleCollectionSummaries"
import type { CollectibleLocation } from "./collectibleLocations"
import {
  getOfferingRowCaption,
  isOfferingPieceCollected,
  isOfferingRowComplete,
  OFFERING_ROWS,
} from "../utils/offerings"

function OfferingPieceCell({
  location,
  collected,
}: {
  location: CollectibleLocation
  collected: boolean
}) {
  return (
    <div
      className={`collectible-cell${collected ? " collected" : ""}`}
      title={collected ? "Collected" : "Not yet collected"}
    >
      <span>#{location.id}</span>
      {location.url ? (
        <a href={location.url} target="_blank" rel="noopener noreferrer">
          <i className="fa-solid fa-link" />
        </a>
      ) : null}
    </div>
  )
}

export default function CollectibleOfferings() {
  const { save } = useSave()

  return (
    <section className="collectible-quest-group collectible-offerings">
      <span
        className={`qi-sprite qi-sprite--${offeringsData.sprite} float-left`}
        aria-hidden="true"
      />
      <h3 className="leading-icon">{offeringsData.title}</h3>
      <h4 className="collectible-summary">
        {collectibleCollectionSummaries.offerings}
      </h4>

      <div className="collectible-offerings-rows">
        {OFFERING_ROWS.map((row) => {
          const rowComplete = isOfferingRowComplete(save, row)
          const caption = getOfferingRowCaption(row)
          return (
            <div
              key={row.pieceItem}
              className="collectible-offerings-row"
              aria-label={caption}
            >
              <div
                className={`collectible-cell collectible-offerings-row-icon${rowComplete ? " collected" : ""}`}
                title={
                  rowComplete
                    ? caption
                    : `${caption} — not yet completed`
                }
              >
                <div className="collectible-cell-icon-slot">
                  <span
                    className={`qi-sprite qi-sprite--${row.completedItem}`}
                    aria-hidden="true"
                  />
                </div>
              </div>
              {row.locations.map((location) => (
                <OfferingPieceCell
                  key={`${location.id}-${location.elementKey}`}
                  location={location}
                  collected={isOfferingPieceCollected(save, location)}
                />
              ))}
            </div>
          )
        })}
      </div>
    </section>
  )
}
