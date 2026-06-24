import b2data from "../data/b2data.json"
import rosaryBeadUrls from "../data/rosary-beads.json"
import { TabContext, useAppNavigation } from "../App"
import { useSave } from "./SaveContext"
import { useContext } from "react"
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
const MAX_ROSARY_SLOTS = 5
const DEFAULT_UNLOCKED_SLOTS = 1
const ROSARY_KNOT_COLLECTION_ID = "abandoned-rosary-knot"

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

function getUnlockedRosarySlotCount(
  stat: ReturnType<typeof findStat>,
): number {
  if (!stat) return DEFAULT_UNLOCKED_SLOTS
  const value = Math.round(stat.value)
  return Math.min(
    MAX_ROSARY_SLOTS,
    Math.max(DEFAULT_UNLOCKED_SLOTS, Number.isFinite(value) ? value : 1),
  )
}

export default function Rosary() {
  const { save } = useSave()
  const tab = useTab()
  const { scrollToCollectible } = useAppNavigation()

  const unlockedSlotCount = getUnlockedRosarySlotCount(
    findStat(
      (save?.player?.stats as Record<string, unknown> | undefined) ?? undefined,
      ["RosaryBeadUnlockedSlots"],
    ),
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

  const equippedBySlot = new Map(
    getEquippedRosaryBeads(save).map(({ slot, source }) => [slot, source]),
  )
  const beadsBySource = new Map(b2data.beads.map((bead) => [bead.source, bead]))

  return (
    <section className="rosary">
      {tab === "all" && <h2>Rosary Beads</h2>}
      <div className="collectible-grid">
        <h3 className="rosary-equipped-heading collectible-grid-section-label">
          Equipped
          <span className="rosary-equipped-note">
            (For slot locations, see the{" "}
            <button
              type="button"
              className="rosary-collectible-link"
              onClick={() => scrollToCollectible(ROSARY_KNOT_COLLECTION_ID)}
            >
              <em>Abandoned Rosary Knot</em> Collection
            </button>
            )
          </span>
        </h3>
        <div className="rosary-equipped-slots">
          {Array.from({ length: MAX_ROSARY_SLOTS }, (_, slot) => {
            const unlocked = slot < unlockedSlotCount
            const source = equippedBySlot.get(slot)
            const bead = source ? beadsBySource.get(source) : undefined

            return (
              <div
                key={`equipped-slot-${slot}`}
                className={`rosary-equipped-slot${unlocked ? " rosary-equipped-slot--unlocked" : " rosary-equipped-slot--locked"}`}
              >
                {source && bead ? (
                  <RosaryBeadCell
                    source={source}
                    caption={bead.caption.en}
                    acquired
                  />
                ) : (
                  <div
                    className="rosary-equipped-slot-empty"
                    title={
                      unlocked
                        ? `Empty equipped slot ${slot + 1}`
                        : `Locked slot ${slot + 1}`
                    }
                  >
                    <span>{slot + 1}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <hr className="collectible-grid-divider" aria-hidden="true" />

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
