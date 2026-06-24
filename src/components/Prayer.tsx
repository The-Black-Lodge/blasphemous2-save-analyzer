import b2data from "../data/b2data.json"
import prayerUrls from "../data/prayers.json"
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

/** Soleá of Excommunication — always last chant slot. */
const CHANT_LAST_SOURCE = "PR103"
/** Bleeding Chalice — always last quick verse slot. */
const VERSE_LAST_SOURCE = "PR108"

function sortPrayerSources(
  sources: string[],
  captionBySource: Map<string, string>,
  pinLast?: string,
): string[] {
  const sorted = [...sources].sort((a, b) =>
    (captionBySource.get(a) ?? a).localeCompare(captionBySource.get(b) ?? b),
  )
  if (pinLast) {
    const index = sorted.indexOf(pinLast)
    if (index >= 0) {
      sorted.splice(index, 1)
      sorted.push(pinLast)
    }
  }
  return sorted
}

const prayerUrlBySource = prayerUrls.urls as Record<string, string>

function PrayerCell({
  source,
  caption,
  acquired,
  equipped = false,
}: {
  source: string
  caption: string
  acquired: boolean
  equipped?: boolean
}) {
  const url = prayerUrlBySource[source]

  return (
    <div
      className={`collectible-cell prayer-cell${acquired ? "" : " prayer-cell--missing"}${equipped ? " prayer-cell--equipped" : ""}`}
      title={equipped ? `${caption} (equipped)` : caption}
    >
      <div className="prayer-cell-icon-slot">
        <span className={`pr-sprite pr-sprite--${source}`} aria-hidden="true" />
      </div>
      <span className="prayer-cell-label">{caption}</span>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <i className="fa-solid fa-link" />
        </a>
      ) : null}
    </div>
  )
}

function PrayerColumn({
  label,
  sources,
  acquired,
  equippedSource,
}: {
  label: string
  sources: string[]
  acquired: Set<string>
  equippedSource?: string
}) {
  const prayersBySource = new Map(
    b2data.prayers.map((prayer) => [prayer.source, prayer]),
  )
  const equippedPrayer = equippedSource
    ? prayersBySource.get(equippedSource)
    : undefined

  return (
    <div className="prayer-column">
      <h3 className="collectible-grid-section-label">{label}</h3>
      <div className="prayer-column-grid">
        {equippedPrayer ? (
          <>
            <PrayerCell
              source={equippedSource!}
              caption={equippedPrayer.caption.en}
              acquired={acquired.has(equippedSource!)}
              equipped
            />
            <hr className="collectible-grid-divider" aria-hidden="true" />
          </>
        ) : null}
        {sources
          .filter((source) => source !== equippedSource)
          .map((source) => {
            const prayer = prayersBySource.get(source)
            if (!prayer) return null

            return (
              <PrayerCell
                key={source}
                source={source}
                caption={prayer.caption.en}
                acquired={acquired.has(source)}
              />
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
  const captionBySource = new Map(
    b2data.prayers.map((prayer) => [prayer.source, prayer.caption.en]),
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

  const sortedChants = sortPrayerSources(chants, captionBySource, CHANT_LAST_SOURCE)
  const sortedVerses = sortPrayerSources(verses, captionBySource, VERSE_LAST_SOURCE)
  const sortedUnclassified = sortPrayerSources(unclassified, captionBySource)

  const equippedBySlot = new Map(
    equipped.map(({ slot, source }) => [slot, source]),
  )

  return (
    <section className="prayer">
      {tab === "all" && <h2>Prayers</h2>}
      <div className="prayer-panel">
        <PrayerColumn
          label="Quick Verses"
          sources={sortedVerses}
          acquired={acquired}
          equippedSource={equippedBySlot.get(0)}
        />
        <div className="prayer-panel-divider" aria-hidden="true" />
        <PrayerColumn
          label="Chants"
          sources={sortedChants}
          acquired={acquired}
          equippedSource={equippedBySlot.get(1)}
        />
      </div>
      {unclassified.length > 0 ? (
        <div className="prayer-section-other">
          <div className="collectible-grid">
            <h3 className="collectible-grid-section-label">Other</h3>
            {sortedUnclassified.map((source) => {
              const prayer = prayersBySource.get(source)
              if (!prayer) return null
              return (
                <PrayerCell
                  key={source}
                  source={source}
                  caption={prayer.caption.en}
                  acquired={acquired.has(source)}
                />
              )
            })}
          </div>
        </div>
      ) : null}
    </section>
  )
}
