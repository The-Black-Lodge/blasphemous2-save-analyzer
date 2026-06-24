import type { ReactNode } from "react"
import { useSave } from "./SaveContext"
import {
  isCollectibleLocationCollected,
  type CollectibleLocation,
  type CollectibleLocationData,
} from "../utils/collectibleLocations"
import type { ReadableSaveJson } from "../utils/saveParser"

interface CollectibleLocationCollectionProps {
  collection: CollectibleLocationData
  summary?: ReactNode
  isCollected?: (
    save: ReadableSaveJson | null,
    location: CollectibleLocation,
  ) => boolean
}

export default function CollectibleLocationCollection({
  collection,
  summary,
  isCollected,
}: CollectibleLocationCollectionProps) {
  const { save } = useSave()

  return (
    <section className="collectible-quest-group">
      {collection.sprite ? (
        <span
          className={`qi-sprite qi-sprite--${collection.sprite} float-left`}
          aria-hidden="true"
        />
      ) : null}
      <h3 className={collection.sprite ? "leading-icon" : undefined}>
        {collection.title}
      </h3>
      {summary ? <h4 className="collectible-summary">{summary}</h4> : null}
      <div className="collectible-grid">
        {collection.locations.map((location) => {
          const collected = isCollected
            ? isCollected(save, location)
            : isCollectibleLocationCollected(
                save,
                location,
                collection.tracking,
              )
          return (
            <div
              key={`${location.id}-${location.itemName ?? location.elementKey ?? location.sceneFile}`}
              className={`collectible-cell${collected ? " collected" : ""}`}
              title={
                collected
                  ? location.caption ?? "Collected"
                  : location.caption
                    ? `${location.caption} — not yet collected`
                    : "Not yet collected"
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
