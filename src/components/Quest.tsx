import b2data from "../data/b2data.json"
import { useSave } from "./SaveContext"
import { useState, useContext } from "react"
import { getAcquiredPrayerSources } from "../utils/inventoryPrayers"
import {
  getQuestItemAcquisition,
  getQuestItemStatus,
} from "../utils/inventoryQuests"
import { getQuestItemCaption } from "../utils/questItemRegistry"
import { TabContext } from "../App"

function useTab() {
  const tab = useContext(TabContext)
  return tab
}

interface QuestItem {
  item?: {
    name?: string
    caption?: string
  }
}

export default function Quest() {
  const { save } = useSave()
  const tab = useTab()
  const [showAll, setShowAll] = useState(false)

  const questStatus = getQuestItemStatus(save)
  const { pickedUp } = questStatus
  const acquiredPrayers = getAcquiredPrayerSources(save)

  const acquiredFigures = new Set<string>()
  const inventoryFigures = (
    save?.player?.inventory as { figures?: { items?: QuestItem[] } } | undefined
  )?.figures?.items

  for (const entry of inventoryFigures ?? []) {
    const name = entry?.item?.name
    if (typeof name === "string") acquiredFigures.add(name)
  }

  // Some quest chains grant a "completed" item and consume the earlier inputs.
  // Hide them once their completion reward is obtained or all inputs are gone.
  const hiddenByCompleted = (() => {
    type HideRule =
      | { type: "rewardPresent"; completed: string; hide: string[] }
      | { type: "allInputsConsumed"; inputItems: string[] }

    const rules: HideRule[] = [
      { type: "rewardPresent", completed: "QI107", hide: ["QI106"] },
      { type: "rewardPresent", completed: "QI108", hide: ["QI106", "QI107"] },
      {
        type: "rewardPresent",
        completed: "QI109",
        hide: ["QI106", "QI107", "QI108"],
      },
      {
        type: "rewardPresent",
        completed: "QI110",
        hide: ["QI106", "QI107", "QI108", "QI109"],
      },
      {
        type: "rewardPresent",
        completed: "QI111",
        hide: ["QI106", "QI107", "QI108", "QI109", "QI110"],
      },
      {
        type: "rewardPresent",
        completed: "QI62",
        hide: ["QI56", "QI57", "QI58", "QI59", "QI60", "QI61"],
      },
      { type: "rewardPresent", completed: "QI06", hide: ["QI05"] },
      { type: "rewardPresent", completed: "QI10", hide: ["QI07"] },
      { type: "rewardPresent", completed: "QI09", hide: ["QI08"] },
      { type: "rewardPresent", completed: "QI55", hide: ["QI54"] },
      { type: "rewardPresent", completed: "QI103", hide: ["QI101", "QI102"] },
      {
        type: "rewardPresent",
        completed: "QI27",
        hide: ["QI23", "QI24", "QI25", "QI26"],
      },
      { type: "rewardPresent", completed: "QI14", hide: ["QI13"] },
      { type: "rewardPresent", completed: "QI16", hide: ["QI15"] },
      { type: "rewardPresent", completed: "QI18", hide: ["QI17"] },
      { type: "rewardPresent", completed: "QI20", hide: ["QI19"] },
      { type: "rewardPresent", completed: "QI22", hide: ["QI21"] },
      { type: "rewardPresent", completed: "QI205", hide: ["QI204"] },
      { type: "rewardPresent", completed: "QI206", hide: ["QI204", "QI205"] },
      { type: "rewardPresent", completed: "QI208", hide: ["QI207"] },
      { type: "rewardPresent", completed: "QI209", hide: ["QI207", "QI208"] },
      { type: "rewardPresent", completed: "QI211", hide: ["QI210"] },
      { type: "rewardPresent", completed: "QI212", hide: ["QI210", "QI211"] },
      {
        type: "allInputsConsumed",
        inputItems: ["QI01", "QI02", "QI03", "QI11", "QI12"],
      },
    ]

    const hidden = new Set<string>()

    if (acquiredPrayers.has("PR16")) {
      for (const src of ["QI23", "QI24", "QI25", "QI26", "QI27"])
        hidden.add(src)
    }

    if (acquiredFigures.has("FG112")) {
      hidden.add("QI105")
    }

    for (const rule of rules) {
      if (rule.type === "rewardPresent") {
        if (pickedUp.has(rule.completed)) {
          for (const src of rule.hide) hidden.add(src)
        }
      } else if (rule.type === "allInputsConsumed") {
        const allAreMissing = rule.inputItems.every(
          (item) => !pickedUp.has(item),
        )
        if (allAreMissing) {
          for (const src of rule.inputItems) hidden.add(src)
        }
      }
    }
    return hidden
  })()

  const shouldShowItem = (source: string): boolean => {
    if (showAll) return true
    return !hiddenByCompleted.has(source)
  }

  const questOrderGroups: string[][] = [
    ["QI56", "QI57", "QI58", "QI59", "QI60", "QI61", "QI62"],
    ["QI05", "QI06"],
    ["QI07", "QI10"],
    ["QI08", "QI09"],
    ["QI54", "QI55"],
    ["QI101", "QI102", "QI103"],
    ["QI23", "QI24", "QI25", "QI26", "QI27"],
    ["QI12", "QI02", "QI03", "QI11", "QI01"],
    ["QI13", "QI14"],
    ["QI15", "QI16"],
    ["QI17", "QI18"],
    ["QI19", "QI20"],
    ["QI21", "QI22"],
    ["QI105"],
    ["QI210", "QI211", "QI212"],
    ["QI204", "QI205", "QI206"],
    ["QI207", "QI208", "QI209"],
    ["QI106", "QI107", "QI108", "QI109", "QI110", "QI111"],
  ]

  const questOrderIndex = new Map<string, number>()
  let orderCursor = 0
  for (const group of questOrderGroups) {
    for (const src of group) {
      if (!questOrderIndex.has(src)) questOrderIndex.set(src, orderCursor++)
    }
  }

  const orderedQuestItems = [...b2data.quest_item].sort((a, b) => {
    const ai = questOrderIndex.get(a.source)
    const bi = questOrderIndex.get(b.source)

    if (ai === undefined && bi === undefined) return 0
    if (ai === undefined) return 1
    if (bi === undefined) return -1
    return ai - bi
  })

  const questPersistence = save?.player?.questPersistence as
    | {
        quests?: {
          questID: number
          questName: string
          questCategory: string
          status: number
          varCount: number
          variables: Record<number, number>
        }[]
      }
    | undefined
  const questList = questPersistence?.quests ?? []

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
          <span className="quest-legend__item quest-legend__item--handed-in">
            Handed in
          </span>
          {!hasRoomData && (
            <span className="quest-legend__note">
              (slot save required for world pickup detection)
            </span>
          )}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
          marginTop: 8,
        }}
      >
        <div className="quest-grid">
          {orderedQuestItems.map((item) => {
            if (!shouldShowItem(item.source)) return null

            const acquisition = getQuestItemAcquisition(item.source, questStatus)
            const className =
              acquisition === "owned"
                ? "quest-item"
                : acquisition === "missing"
                  ? "quest-item quest-item--missing"
                  : `quest-item quest-item--${acquisition}`
            const caption = getQuestItemCaption(item.source)

            return (
              <div
                key={item.source}
                className={className}
                title={
                  acquisition === "owned"
                    ? "Currently in inventory"
                    : acquisition === "picked-up"
                      ? "Picked up from the world (not in inventory)"
                      : acquisition === "handed-in"
                        ? "Handed in or consumed"
                        : "Not yet obtained"
                }
              >
                <span
                  className={`qi-sprite qi-sprite--${item.source}`}
                  aria-hidden="true"
                />
                <div className="quest-label">{caption}</div>
              </div>
            )
          })}
        </div>

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
      </div>
    </section>
  )
}
