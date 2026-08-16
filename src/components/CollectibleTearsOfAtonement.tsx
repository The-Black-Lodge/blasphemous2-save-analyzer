import tearsOfAtonementData from "../data/tears-of-atonement.json"
import { useSave } from "./SaveContext"
import {
  isTearsOfAtonementCollected,
  TEARS_OF_ATONEMENT_OTHERS,
  TEARS_OF_ATONEMENT_URNS,
  type TearsOfAtonementLocation,
} from "../utils/tearsOfAtonement"

function TearCell({
  location,
  save,
}: {
  location: TearsOfAtonementLocation
  save: ReturnType<typeof useSave>["save"]
}) {
  const collected = isTearsOfAtonementCollected(save, location)
  const amount = location.amount.toLocaleString()
  return (
    <div
      className={`collectible-cell tears-cell${collected ? " collected" : ""}`}
      title={
        collected
          ? `${location.sceneFile} - ${amount} collected`
          : `${location.sceneFile} - ${location.label} (${amount})`
      }
    >
      <span>
        #{location.id} ({amount})
      </span>
      {location.url ? (
        <a href={location.url} target="_blank" rel="noopener noreferrer">
          <i className="fa-solid fa-link" />
        </a>
      ) : null}
    </div>
  )
}

export default function CollectibleTearsOfAtonement() {
  const { save } = useSave()

  return (
    <section className="collectible-quest-group">
      <h3>{tearsOfAtonementData.title}</h3>
      <h4 className="collectible-summary">
        Urns containing Tears of Atonement. Tear pickups in other forms are listed separately.
      </h4>

      <div className="collectible-grid tears-of-atonement-grid">
        <p className="collectible-grid-section-label">Urns</p>
        {TEARS_OF_ATONEMENT_URNS.map((location) => (
          <TearCell
            key={`urn-${location.id}-${location.sceneFile}-${location.elementKey}`}
            location={location}
            save={save}
          />
        ))}

        <hr className="collectible-grid-divider" aria-hidden="true" />

        <p className="collectible-grid-section-label">Others</p>
        {TEARS_OF_ATONEMENT_OTHERS.map((location) => (
          <TearCell
            key={`other-${location.id}-${location.sceneFile}-${location.elementKey}`}
            location={location}
            save={save}
          />
        ))}
      </div>
    </section>
  )
}
