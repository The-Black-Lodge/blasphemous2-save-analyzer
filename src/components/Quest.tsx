import { useSave } from "./SaveContext"
import { useState, useContext } from "react"
import { getAcquiredPrayerSources } from "../utils/inventoryPrayers"
import { getQuestItemStatus } from "../utils/inventoryQuests"
import type { QuestItemAcquisition } from "../utils/inventoryQuests"
import { TabContext } from "../App"
import {
  buildOrderedQuestItems,
  getHiddenByCompletedQuestItems,
} from "../utils/questItems"

function useTab() {
  const tab = useContext(TabContext)
  return tab
}

interface QuestItem {
  item?: {
    name?: string
  }
}

function acquisitionTitle(acquisition: QuestItemAcquisition): string {
  switch (acquisition) {
    case "owned":
      return "Currently in inventory"
    case "picked-up":
      return "Picked up from the world (not in inventory)"
    case "handed-in":
      return "Handed in or consumed"
    default:
      return "Not yet obtained"
  }
}

function QuestItemCell({
  source,
  caption,
  url,
  acquisition,
}: {
  source: string
  caption: string
  url: string | null
  acquisition: QuestItemAcquisition
}) {
  const stateClass =
    acquisition === "missing"
      ? " quest-item-cell--missing"
      : acquisition === "picked-up"
        ? " quest-item-cell--picked-up"
        : ""

  return (
    <div
      className={`collectible-cell quest-item-cell${stateClass}`}
      title={acquisitionTitle(acquisition)}
    >
      <div className="quest-item-cell-icon-slot">
        <span className={`qi-sprite qi-sprite--${source}`} aria-hidden="true" />
      </div>
      <span className="quest-item-cell-label">{caption}</span>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <i className="fa-solid fa-link" />
        </a>
      ) : null}
    </div>
  )
}

export default function Quest() {
  const { save } = useSave()
  const tab = useTab()
  const [showAll, setShowAll] = useState(false)

  const questStatus = getQuestItemStatus(save)
  const acquiredPrayers = getAcquiredPrayerSources(save)

  const acquiredFigures = new Set<string>()
  const inventoryFigures = (
    save?.player?.inventory as { figures?: { items?: QuestItem[] } } | undefined
  )?.figures?.items

  for (const entry of inventoryFigures ?? []) {
    const name = entry?.item?.name
    if (typeof name === "string") acquiredFigures.add(name)
  }

  const hiddenByCompleted = getHiddenByCompletedQuestItems(
    questStatus,
    acquiredPrayers,
    acquiredFigures,
  )

  const questItems = buildOrderedQuestItems(
    save,
    questStatus,
    hiddenByCompleted,
    showAll,
  )

  const hasRoomData = Boolean(save?.roomElements)

  return (
    <section className="quest">
      {tab === "all" && <h2>Quest Items</h2>}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="button"
          className="app-tab"
          onClick={() => setShowAll((v) => !v)}
          aria-pressed={showAll}
          title={showAll ? "Hide completed quest inputs" : "Show everything"}
        >
          {showAll ? "Hide completed" : "Show all"}
        </button>
        <span className="quest-legend">
          <span className="quest-legend__item quest-legend__item--owned">
            In inventory
          </span>
          <span className="quest-legend__item quest-legend__item--picked-up">
            Picked up
          </span>
          {!hasRoomData && (
            <span className="quest-legend__note">
              (slot save required for world pickup detection)
            </span>
          )}
        </span>
      </div>

      <div className="collectible-grid">
        {questItems.map((item) => (
          <QuestItemCell
            key={item.source}
            source={item.source}
            caption={item.caption}
            url={item.url}
            acquisition={item.acquisition}
          />
        ))}
      </div>

      {/*
      {questList.length > 0 && (
        <div className="quest-progress">
          <h3>Quest Progress</h3>
          <ul>
            {questList.map((q) => (
              <li key={q.questID}>
                {q.questName}{" "}
                <span className="quest-status">
                  [{q.questCategory}] status: {q.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      */}
    </section>
  )
}
