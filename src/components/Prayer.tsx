import b2data from "../data/b2data.json"
import { useSave } from "./SaveContext"
import { getPrayerKind } from "../utils/prayerKinds"

interface InventoryItem {
  item?: {
    name?: string
  }
}

function PrayerList({
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
      <ul>
        {sources.map((source) => {
          const prayer = prayersBySource.get(source)
          if (!prayer) return null

          return (
            <li key={source}>
              <i
                className={
                  acquired.has(source)
                    ? "fa-regular fa-square-check"
                    : "fa-regular fa-square"
                }
              ></i>{" "}
              {prayer.caption.en}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function Prayer() {
  const { save } = useSave()
  const acquired = new Set<string>()
  const inventory = save?.player?.inventory as
    | {
        prayers?: { items?: InventoryItem[] }
        collectibles?: { items?: InventoryItem[] }
      }
    | undefined

  for (const section of ["prayers", "collectibles"] as const) {
    for (const entry of inventory?.[section]?.items ?? []) {
      const name = entry.item?.name
      if (typeof name === "string" && name.startsWith("PR")) {
        acquired.add(name)
      }
    }
  }

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
      <h2>Prayers</h2>
      <div className="prayer-columns">
        <PrayerList label="Chants" sources={chants} acquired={acquired} />
        <PrayerList label="Verses" sources={verses} acquired={acquired} />
      </div>
      {unclassified.length > 0 ? (
        <PrayerList label="Other" sources={unclassified} acquired={acquired} />
      ) : null}
    </section>
  )
}
