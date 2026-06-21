import b2data from "../data/b2data.json"
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
          <div className="rosary-grid">
            {equipped.map(({ slot, source }) => {
              const bead = beadsBySource.get(source)
              return (
                <div
                  key={`equipped-${slot}-${source}`}
                  className="rosary-bead"
                  title={`${slot}: ${bead?.caption.en ?? source}`}
                >
                  <span
                    className={`rb-sprite rb-sprite--${source}`}
                    aria-hidden="true"
                  />
                  <div className="bead-label">{bead?.caption.en ?? source}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      <div className="rosary-grid">
        {b2data.beads.map((bead) => {
          const isAcquired = acquired.has(bead.source)
          return (
            <div
              key={bead.source}
              className={`rosary-bead${isAcquired ? "" : " rosary-bead--missing"}`}
            >
              <span
                className={`rb-sprite rb-sprite--${bead.source}`}
                aria-hidden="true"
              />
              <div className="bead-label">{bead.caption.en}</div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
