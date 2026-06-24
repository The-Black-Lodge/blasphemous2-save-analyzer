import markOfTheEmbrujoData from "../data/mark-of-the-embrujo.json"
import { useSave } from "./SaveContext"
import {
  EMBRUJO_LOCATIONS,
  isEmbrujoMarkCollected,
} from "../utils/markOfTheEmbrujo"

export default function CollectibleMarkOfTheEmbrujo() {
  const { save } = useSave()

  return (
    <section className="collectible-quest-group">
      <span
        className="qi-sprite qi-sprite--QI99 float-left"
        aria-hidden="true"
      />
      <h3 className="leading-icon">{markOfTheEmbrujoData.title}</h3>
      <h4 className="collectible-summary">
        Use <em>Marks</em> to unlock <em>Weapon Memories</em>.
      </h4>

      <div className="collectible-grid">
        {EMBRUJO_LOCATIONS.map((location) => {
          const collected = isEmbrujoMarkCollected(save, location)
          return (
            <div
              key={location.id}
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
