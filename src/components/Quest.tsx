import b2data from "../data/b2data.json"
import { useSave } from "./SaveContext"

interface QuestItem {
  item?: {
    name?: string
  }
}

export default function Quest() {
  const { save } = useSave()

  const acquired = new Set(
    (
      save?.player?.inventory as
        | { quests?: { items?: QuestItem[] } }
        | undefined
    )?.quests?.items
      ?.map((entry) => entry.item?.name)
      .filter((name): name is string => typeof name === "string") ?? [],
  )

  return (
    <section className="quest">
      <h2>Quest Items</h2>
      <div className="quest-grid">
        {b2data.quest_item.map((item) => {
          const isAcquired = acquired.has(item.source)
          return (
            <div
              key={item.source}
              className={`quest-item${isAcquired ? "" : " quest-item--missing"}`}
            >
              <span
                className={`qi-sprite qi-sprite--${item.source}`}
                aria-hidden="true"
              />
              <div className="quest-label">{item.caption.en}</div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
