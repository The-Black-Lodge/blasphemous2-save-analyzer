import sculptorToolsData from "../data/sculptor-tools.json"
import { Fragment } from "react"
import { useSave } from "./SaveContext"
import { getQuestItemCaption } from "../utils/questItemRegistry"
import {
  getCollectedSculptorToolPickups,
  isSculptorToolProgressionAcquired,
  SCULPTOR_TOOL_PICKUPS,
  SCULPTOR_TOOL_PROGRESSION,
} from "../utils/sculptorTools"

const MAPGENIE =
  "https://mapgenie.io/blasphemous-2/maps/cvstodia?locationIds="

export default function CollectibleSculptorTools() {
  const { save } = useSave()
  const collectedPickups = getCollectedSculptorToolPickups(save)

  return (
    <section className="collectible-quest-group collectible-sculptor-tools">
      <span
        className={`qi-sprite qi-sprite--${sculptorToolsData.sprite} float-left`}
        aria-hidden="true"
      />
      <h3 className="leading-icon">{sculptorToolsData.title}</h3>
      <h4 className="collectible-summary">
        Deliver to{" "}
        <a href={`${MAPGENIE}509092`} target="_blank" rel="noopener noreferrer">
          Montañés
        </a>{" "}
        in the <em>City of the Blessed Name</em>.
      </h4>

      <div className="collectible-grid">
        {SCULPTOR_TOOL_PICKUPS.map((pickup) => {
          const collected = collectedPickups.has(pickup.elementKey)
          return (
            <div
              key={pickup.elementKey}
              className={`collectible-cell${collected ? " collected" : ""}`}
              title="Sculptor's Tool"
            >
              <span>#{pickup.id}</span>
              {pickup.url ? (
                <a href={pickup.url} target="_blank" rel="noopener noreferrer">
                  <i className="fa-solid fa-link" />
                </a>
              ) : null}
            </div>
          )
        })}

        <div className="sculptor-tool-progression" aria-label="Tool pickup order">
          <div className="sculptor-tool-progression-row">
            {SCULPTOR_TOOL_PROGRESSION.map((itemName, index) => {
              const acquired = isSculptorToolProgressionAcquired(itemName, save)
              const caption = getQuestItemCaption(itemName)
              return (
                <Fragment key={itemName}>
                  <div
                    className={`sculptor-tool-progression-step${acquired ? "" : " sculptor-tool-progression-step--missing"}`}
                    title={
                      acquired ? caption : `${caption} - not yet obtained`
                    }
                  >
                    <div className="sculptor-tool-progression-icon-slot">
                      <span
                        className={`qi-sprite qi-sprite--${itemName}`}
                        aria-hidden="true"
                      />
                    </div>
                    <span className="sculptor-tool-progression-label">
                      {caption}
                    </span>
                  </div>
                  {index < SCULPTOR_TOOL_PROGRESSION.length - 1 ? (
                    <span
                      className="sculptor-tool-progression-arrow"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  ) : null}
                </Fragment>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
