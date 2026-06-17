import b2data from "../data/b2data.json"
import { useSave } from "./SaveContext"

interface FigureItem {
  item?: {
    name?: string
  }
}

export default function Altar() {
  const { save } = useSave()
  const acquired = new Set(
    (
      save?.player?.inventory as
        | { figures?: { items?: FigureItem[] } }
        | undefined
    )?.figures?.items
      ?.map((entry) => entry.item?.name)
      .filter((name): name is string => typeof name === "string") ?? [],
  )

  return (
    <ul>
      {b2data.figures.map((figure) => (
        <li key={figure.source}>
          <i
            className={
              acquired.has(figure.source)
                ? "fa-regular fa-square-check"
                : "fa-regular fa-square"
            }
          ></i>{" "}
          {figure.caption.en}
        </li>
      ))}
    </ul>
  )
}
