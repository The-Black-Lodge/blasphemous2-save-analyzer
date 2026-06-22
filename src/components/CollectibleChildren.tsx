import { useSave } from "./SaveContext"
import cherubsData from "../data/cherubs.json"

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
