import { useSave } from "./SaveContext"

import cherubsData from "../data/cherubs.json"



const MAPGENIE =

  "https://mapgenie.io/blasphemous-2/maps/cvstodia?locationIds="



export default function CollectibleChildren() {

  const { save } = useSave()

  const player = save?.player as Record<string, unknown> | undefined

  const cherubs = player?.cherubs as { tokenHex?: string[] } | undefined



  const collected = new Set(

    cherubs?.tokenHex?.map((h) => parseInt(h, 16)) ?? [],

  )



  return (

    <section className="collectible-children">

      <span

        className="hud-sprite hud-sprite--cherub float-left"

        aria-hidden="true"

      />

      <h3 className="leading-icon">Children of Moonlight</h3>

      <h4 className="collectible-summary">

        Return to{" "}

        <a href={`${MAPGENIE}522643`} target="_blank" rel="noopener noreferrer">

          Proximo

        </a>{" "}

        in the <em>Garden of the High Choirs</em> as you locate{" "}

        <em>Children</em>.

      </h4>

      <dl className="collectible-reward-list">

        <div className="collectible-reward-entry">

          <dt>10:</dt>

          <dd>1× Mark of Martyrdom</dd>

        </div>

        <div className="collectible-reward-entry">

          <dt>17:</dt>

          <dd>2× Mark of Martyrdom</dd>

        </div>

        <div className="collectible-reward-entry">

          <dt>25:</dt>

          <dd>

            Opens a path to{" "}

            <a

              href={`${MAPGENIE}523441`}

              target="_blank"

              rel="noopener noreferrer"

            >

              Obolus of Proximo

            </a>

          </dd>

        </div>

        <div className="collectible-reward-entry">

          <dt>29:</dt>

          <dd>3× Mark of Martyrdom</dd>

        </div>

        <div className="collectible-reward-entry">

          <dt>32:</dt>

          <dd>

            Opens access to the top of the tower, containing:

            <ul className="collectible-reward-sublist">

              <li>4× Mark of Martyrdom</li>

              <li>Giant Rattle (return to Proximo)</li>

              <li>Gregal (figure)</li>

            </ul>

          </dd>

        </div>

        <div className="collectible-reward-entry">

          <dt>33:</dt>

          <dd>Achievement + Completion %</dd>

        </div>

      </dl>

      <div className="collectible-grid">

        {cherubsData.map((entry) => (

          <div

            key={entry.hex}

            className={`collectible-cell${collected.has(parseInt(entry.hex, 16)) ? " collected" : ""}`}

          >

            <span>#{entry.id}</span>

            {entry.url && (

              <a href={entry.url} target="_blank" rel="noopener noreferrer">

                <i className="fa-solid fa-link" />

              </a>

            )}

          </div>

        ))}

      </div>

    </section>

  )

}

