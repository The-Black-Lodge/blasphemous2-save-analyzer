import { useSave } from "./SaveContext"
import {
  getQuestItemAcquisition,
  getQuestItemStatus,
} from "../utils/inventoryQuests"

export interface SummaryPart {
  type: "text" | "em" | "link"
  value?: string
  text?: string
  href?: string
}

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
  summary?: SummaryPart[]
  items: QuestCollectionEntry[]
}

interface CollectibleQuestGroupProps {
  collection: QuestCollection
}

function CollectionSummary({ parts }: { parts: SummaryPart[] }) {
  return (
    <h4 className="collectible-quest-summary">
      {parts.map((part, index) => {
        if (part.type === "em") {
          return <em key={index}>{part.value}</em>
        }
        if (part.type === "link") {
          return (
            <a
              key={index}
              href={part.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {part.text}
            </a>
          )
        }
        return <span key={index}>{part.value}</span>
      })}
    </h4>
  )
}

export default function CollectibleQuestGroup({
  collection,
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
      {collection.summary?.length ? (
        <CollectionSummary parts={collection.summary} />
      ) : null}
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
