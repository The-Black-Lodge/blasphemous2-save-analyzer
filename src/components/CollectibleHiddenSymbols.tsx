import hiddenSymbolsData from "../data/hidden-symbols.json"
import { useSave } from "./SaveContext"
import {
  HIDDEN_SYMBOL_LOCATIONS,
  isHiddenSymbolCollected,
} from "../utils/hiddenSymbols"

const REWARDS: { count: number; tears: number }[] = [
  { count: 1, tears: 500 },
  { count: 2, tears: 600 },
  { count: 3, tears: 1000 },
  { count: 4, tears: 1500 },
  { count: 5, tears: 3000 },
  { count: 6, tears: 5000 },
  { count: 7, tears: 7500 },
  { count: 8, tears: 10000 },
  { count: 9, tears: 15000 },
  { count: 10, tears: 25000 },
]

export default function CollectibleHiddenSymbols() {
  const { save } = useSave()

  return (
    <section className="collectible-quest-group">
      <span
        className="symbol-sprite-slot symbol-sprite-slot--hidden-symbol float-left"
        aria-hidden="true"
      >
        <span className="symbol-sprite" />
      </span>
      <h3 className="leading-icon">{hiddenSymbolsData.title}</h3>
      <h4 className="collectible-summary">
        Use the <em>Chime of the Twisted One</em> chant near the symbol to gain{" "}
        <em>Tears of Atonement</em>.
      </h4>

      <dl className="collectible-reward-list">
        {REWARDS.map((reward) => (
          <div key={reward.count} className="collectible-reward-entry">
            <dt>{reward.count}:</dt>
            <dd>
              {reward.tears.toLocaleString()}× Tears of Atonement
              {reward.count === 10 ? (
                <>
                  {" "}
                  + Upgrade to <em>Chime of the Twisted One</em> chant
                </>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>

      <div className="collectible-grid">
        {HIDDEN_SYMBOL_LOCATIONS.map((location) => {
          const collected = isHiddenSymbolCollected(save, location)
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
