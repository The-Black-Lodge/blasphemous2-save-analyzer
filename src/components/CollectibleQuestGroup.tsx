import type { ReactNode } from "react"
import { useSave } from "./SaveContext"
import {
  getQuestItemAcquisition,
  getQuestItemStatus,
} from "../utils/inventoryQuests"

export interface QuestCollectionEntry {
  id: number
  itemName: string
  caption: string
  url: string | null
}

export interface QuestCollection {
  id: string
  title: string
  sprite: string
  items: QuestCollectionEntry[]
}

interface CollectibleQuestGroupProps {
  collection: QuestCollection
  summary?: ReactNode
}

export default function CollectibleQuestGroup({
  collection,
  summary,
}: CollectibleQuestGroupProps) {
  const { save } = useSave()
  const status = getQuestItemStatus(save)

  return (
    <section className="collectible-quest-group">
      <span
        className={`qi-sprite qi-sprite--${collection.sprite} float-left`}
        aria-hidden="true"
      />
      <h3 className="leading-icon">{collection.title}</h3>
      {summary ? <h4 className="collectible-summary">{summary}</h4> : null}
      <div className="collectible-grid">
        {collection.items.map((entry) => {
          const acquired =
            getQuestItemAcquisition(entry.itemName, status) !== "missing"
          return (
            <div
              key={entry.itemName}
              className={`collectible-cell${acquired ? " collected" : ""}`}
            >
              <span>#{entry.id}</span>
              {entry.url && (
                <a href={entry.url} target="_blank" rel="noopener noreferrer">
                  <i className="fa-solid fa-link" />
                </a>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
