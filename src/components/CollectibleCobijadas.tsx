import cobijadasData from "../data/cobijadas.json"
import { useSave } from "./SaveContext"
import {
  COBIJADA_LOCATIONS,
  isCobijadaReleased,
} from "../utils/cobijadas"

const MAPGENIE =
  "https://mapgenie.io/blasphemous-2/maps/cvstodia?locationIds="

export default function CollectibleCobijadas() {
  const { save } = useSave()

  return (
    <section className="collectible-quest-group">
      <span className="npc-sprite-slot npc-sprite-slot--cobijada float-left" aria-hidden="true">
        <span className="npc-sprite npc-sprite--cobijada" />
      </span>
      <h3 className="leading-icon">{cobijadasData.title}</h3>
      <h4 className="collectible-summary">
        Return to the{" "}
        <a href={`${MAPGENIE}520762`} target="_blank" rel="noopener noreferrer">
          Lady of the Cobijo
        </a>{" "}
        in the <em>City of the Blessed Name</em> for upgrades as you locate <em>Cobijadas</em>.
      </h4>

      <dl className="collectible-reward-list">
        <div className="collectible-reward-entry">
          <dt>2 Sisters, 1500 Tears:</dt>
          <dd>Prie Dieu allows travel to the City</dd>
        </div>
        <div className="collectible-reward-entry">
          <dt>4 Sisters, 3000 Tears:</dt>
          <dd>Prie Dieu refills Fervour</dd>
        </div>
        <div className="collectible-reward-entry">
          <dt>6 Sisters, 6000 Tears:</dt>
          <dd>Prie Dieu fast travel</dd>
        </div>
        <div className="collectible-reward-entry">
          <dt>9 Sisters, 12500 Tears:</dt>
          <dd>Cobijada Mayor (figure)</dd>
        </div>
      </dl>

      <div className="collectible-grid">
        {COBIJADA_LOCATIONS.map((location) => {
          const released = isCobijadaReleased(save, location)
          return (
            <div
              key={location.sceneFile}
              className={`collectible-cell${released ? " collected" : ""}`}
              title={released ? "Released" : "Not yet released"}
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
