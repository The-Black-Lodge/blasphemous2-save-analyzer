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
      <h2>Rosary</h2>
      <ul>
        {b2data.beads.map((bead) => (
          <li key={bead.source}>
            <i
              className={
                acquired.has(bead.source)
                  ? "fa-regular fa-square-check"
                  : "fa-regular fa-square"
              }
            ></i>{" "}
            {bead.caption.en}
          </li>
        ))}
      </ul>
    </>
  )
}
