import b2data from "../data/b2data.json"
import { useSave } from "./SaveContext"

interface BeadItem {
  item?: {
    name?: string
  }
}

export default function Rosary() {
  const { save } = useSave()

  const acquired = new Set(
    (
      save?.player?.inventory as
        | { rosaryBeads?: { items?: BeadItem[] } }
        | undefined
    )?.rosaryBeads?.items
      ?.map((entry) => entry.item?.name)
      .filter((name): name is string => typeof name === "string") ?? [],
  )

  return (
    <>
      <h2>Rosary Beads</h2>
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
              />{" "}
              <div className="bead-label">{bead.caption.en}</div>
            </div>
          )
        })}
      </div>
    </>
  )
}
