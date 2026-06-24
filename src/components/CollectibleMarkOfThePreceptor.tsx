import markOfThePreceptorData from "../data/mark-of-the-preceptor.json"
import { useSave } from "./SaveContext"
import {
  isPreceptorMarkCollected,
  PRECEPTOR_LOCATIONS,
} from "../utils/markOfThePreceptor"

export default function CollectibleMarkOfThePreceptor() {
  const { save } = useSave()

  return (
    <section className="collectible-quest-group">
      <span
        className={`qi-sprite qi-sprite--${markOfThePreceptorData.sprite} float-left`}
        aria-hidden="true"
      />
      <h3 className="leading-icon">{markOfThePreceptorData.title}</h3>
      <h4 className="collectible-summary">
        Use <em>Marks</em> to unlock Mea Culpa's <em>Weapon Memories</em>.
      </h4>

      <div className="collectible-grid">
        {PRECEPTOR_LOCATIONS.map((location) => {
          const collected = isPreceptorMarkCollected(save, location)
          return (
            <div
              key={`${location.id}-${location.elementKey}`}
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
        })}
      </div>
    </section>
  )
}
