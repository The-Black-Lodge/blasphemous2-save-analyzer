import lacrimatorioData from "../data/lacrimatorio.json"
import { useSave } from "./SaveContext"
import { collectibleCollectionSummaries } from "./collectibleCollectionSummaries"
import {
  isLacrimatorioShrineCollected,
  LACRIMATORIO_SHRINES,
} from "../utils/lacrimatorio"

export default function CollectibleLacrimatorio() {
  const { save } = useSave()

  return (
    <section className="collectible-quest-group">
      <span
        className={`qi-sprite qi-sprite--${lacrimatorioData.sprite} float-left`}
        aria-hidden="true"
      />
      <h3 className="leading-icon">{lacrimatorioData.title}</h3>
      <h4 className="collectible-summary">
        {collectibleCollectionSummaries.lacrimatorio}
      </h4>

      <div className="collectible-grid">
        {LACRIMATORIO_SHRINES.map((shrine) => {
          const collected = isLacrimatorioShrineCollected(save, shrine)
          return (
            <div
              key={`${shrine.id}-${shrine.elementKey}`}
              className={`collectible-cell${collected ? " collected" : ""}`}
              title={
                collected
                  ? shrine.caption
                  : `${shrine.caption} - not yet placed`
              }
            >
              <span>#{shrine.id}</span>
              {shrine.url ? (
                <a href={shrine.url} target="_blank" rel="noopener noreferrer">
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
