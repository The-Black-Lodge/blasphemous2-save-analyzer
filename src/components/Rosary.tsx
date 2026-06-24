import b2data from "../data/b2data.json"
import rosaryBeadUrls from "../data/rosary-beads.json"
import { useSave } from "./SaveContext"
import { useContext } from "react"
import { TabContext } from "../App"
import { findStat } from "../utils/playerDecoders"
import { getEquippedRosaryBeads } from "../utils/inventoryEquipped"

function useTab() {
  const tab = useContext(TabContext)
  return tab
}

interface BeadItem {
  item?: {
    name?: string
  }
}

const beadUrls = rosaryBeadUrls.urls as Record<string, string>

function RosaryBeadCell({
  source,
  caption,
  acquired,
}: {
  source: string
  caption: string
  acquired: boolean
}) {
  const url = beadUrls[source]

  return (
    <div
      className={`collectible-cell rosary-bead-cell${acquired ? "" : " rosary-bead-cell--missing"}`}
      title={caption}
    >
      <div className="rosary-bead-cell-icon-slot">
        <span className={`rb-sprite rb-sprite--${source}`} aria-hidden="true" />
      </div>
      <span className="rosary-bead-cell-label">{caption}</span>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <i className="fa-solid fa-link" />
        </a>
      ) : null}
    </div>
  )
}

export default function Rosary() {
  const { save } = useSave()
  const tab = useTab()

  const rosaryBeadUnlockedSlots = findStat(
    (save?.player?.stats as Record<string, unknown> | undefined) ?? undefined,
    ["RosaryBeadUnlockedSlots"],
  )

  const acquired = new Set(
    (
      save?.player?.inventory as
        | { rosaryBeads?: { items?: BeadItem[] } }
        | undefined
    )?.rosaryBeads?.items
      ?.map((entry) => entry.item?.name)
      .filter((name): name is string => typeof name === "string") ?? [],
  )

  const equipped = getEquippedRosaryBeads(save)
  const beadsBySource = new Map(b2data.beads.map((bead) => [bead.source, bead]))

  return (
    <section className="rosary">
      {tab === "all" && <h2>Rosary Beads</h2>}
      {rosaryBeadUnlockedSlots && (
        <p>Rosary Bead Unlocked Slots: {rosaryBeadUnlockedSlots.value}</p>
      )}
      {equipped.length > 0 && (
        <div className="rosary-equipped">
          <h3>Equipped</h3>
          <div className="collectible-grid">
            {equipped.map(({ slot, source }) => {
              const bead = beadsBySource.get(source)
              return (
                <RosaryBeadCell
                  key={`equipped-${slot}-${source}`}
                  source={source}
                  caption={bead?.caption.en ?? source}
                  acquired
                />
              )
            })}
          </div>
        </div>
      )}
      <div className="collectible-grid">
        {b2data.beads.map((bead) => (
          <RosaryBeadCell
            key={bead.source}
            source={bead.source}
            caption={bead.caption.en}
            acquired={acquired.has(bead.source)}
          />
        ))}
      </div>
    </section>
  )
}
