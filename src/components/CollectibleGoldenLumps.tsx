import goldenLumpsData from "../data/golden-lumps.json"
import { useSave } from "./SaveContext"
import {
  GOLDEN_LUMP_BASE,
  GOLDEN_LUMP_DLC,
  type GoldenLumpLocation,
  isGoldenLumpCollected,
} from "../utils/goldenLumps"

const MAPGENIE =
  "https://mapgenie.io/blasphemous-2/maps/cvstodia?locationIds="

function LumpCell({
  location,
  save,
}: {
  location: GoldenLumpLocation
  save: ReturnType<typeof useSave>["save"]
}) {
  const collected = isGoldenLumpCollected(save, location)
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

export default function CollectibleGoldenLumps() {
  const { save } = useSave()

  return (
    <section className="collectible-quest-group">
      <span
        className={`qi-sprite qi-sprite--${goldenLumpsData.sprite} float-left`}
        aria-hidden="true"
      />
      <h3 className="leading-icon">{goldenLumpsData.title}</h3>
      <h4 className="collectible-summary">
        Deliver to the{" "}
        <a href={`${MAPGENIE}521026`} target="_blank" rel="noopener noreferrer">
          Golden Tree
        </a>{" "}
        in the <em>Labyrinth of Tides</em>.
      </h4>

      <dl className="collectible-reward-list">
        <div className="collectible-reward-entry">
          <dt>10:</dt>
          <dd>Traitor&apos;s Gaze (Rosary Bead)</dd>
        </div>
        <div className="collectible-reward-entry">
          <dt>20:</dt>
          <dd>The Liberated (figure)</dd>
        </div>
      </dl>

      <div className="collectible-grid">
        <p className="collectible-grid-section-label">Base game</p>
        {GOLDEN_LUMP_BASE.map((location) => (
          <LumpCell
            key={`base-${location.id}-${location.elementKey}`}
            location={location}
            save={save}
          />
        ))}

        <hr className="collectible-grid-divider" aria-hidden="true" />

        <p className="collectible-grid-section-label">Mea Culpa DLC</p>
        {GOLDEN_LUMP_DLC.map((location) => (
          <LumpCell
            key={`dlc-${location.id}-${location.elementKey}`}
            location={location}
            save={save}
          />
        ))}
      </div>
    </section>
  )
}
