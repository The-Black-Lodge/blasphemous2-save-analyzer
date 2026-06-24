import b2data from "../data/b2data.json"
import { useSave } from "./SaveContext"
import { getAcquiredPrayerSources } from "../utils/inventoryPrayers"
import { getEquippedPrayers } from "../utils/inventoryEquipped"
import { getPrayerKind } from "../utils/prayerKinds"
import { useContext } from "react"
import { TabContext } from "../App"

function useTab() {
  const tab = useContext(TabContext)
  return tab
}

const PRAYER_SLOT_LABELS: Record<0 | 1, string> = {
  0: "Quick Prayer",
  1: "Full Prayer",
}

function PrayerGrid({
  label,
  sources,
  acquired,
}: {
  label: string
  sources: string[]
  acquired: Set<string>
}) {
  const prayersBySource = new Map(
    b2data.prayers.map((prayer) => [prayer.source, prayer]),
  )

  return (
    <div className="prayer-column">
      <h3>{label}</h3>
      <div className="prayer-grid">
        {sources.map((source) => {
          const prayer = prayersBySource.get(source)
          if (!prayer) return null

          const isAcquired = acquired.has(source)
          return (
            <div
              key={source}
              className={`prayer-item${isAcquired ? "" : " prayer-item--missing"}`}
            >
              <span
                className={`pr-sprite pr-sprite--${source}`}
                aria-hidden="true"
              />
              <div className="prayer-label">{prayer.caption.en}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Prayer() {
  const { save } = useSave()
  const tab = useTab()
  const acquired = getAcquiredPrayerSources(save)
  const equipped = getEquippedPrayers(save)
  const prayersBySource = new Map(
    b2data.prayers.map((prayer) => [prayer.source, prayer]),
  )

  const chants: string[] = []
  const verses: string[] = []
  const unclassified: string[] = []

  for (const prayer of b2data.prayers) {
    const kind = getPrayerKind(prayer.source)
    if (kind === "chant") {
      chants.push(prayer.source)
    } else if (kind === "verse") {
      verses.push(prayer.source)
    } else {
      unclassified.push(prayer.source)
    }
  }

  return (
    <section className="prayer">
      {tab === "all" && <h2>Prayers</h2>}
      {equipped.length > 0 && (
        <div className="prayer-equipped">
          <h3>Equipped</h3>
          <div className="prayer-equipped-grid">
            {equipped.map(({ slot, source }) => {
              const prayer = prayersBySource.get(source)
              return (
                <div key={`equipped-${slot}-${source}`} className="prayer-item">
                  <span
                    className={`pr-sprite pr-sprite--${source}`}
                    aria-hidden="true"
                  />
                  <div className="prayer-label">
                    {PRAYER_SLOT_LABELS[slot]}: {prayer?.caption.en ?? source}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      <div className="prayer-columns">
        <PrayerGrid label="Chants" sources={chants} acquired={acquired} />
        <PrayerGrid label="Quick Verses" sources={verses} acquired={acquired} />
      </div>
      {unclassified.length > 0 ? (
        <div className="prayer-section-other">
          <PrayerGrid
            label="Other"
            sources={unclassified}
            acquired={acquired}
          />
        </div>
      ) : null}
    </section>
  )
}
