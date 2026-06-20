import b2data from "../data/b2data.json"
import { useSave } from "./SaveContext"
import { useState } from "react"
import { formatItemRef } from "../utils/catalogs"
import { getAcquiredPrayerSources } from "../utils/inventoryPrayers"

interface QuestItem {
  item?: {
    name?: string
    caption?: string
  }
}

export default function Quest() {
  const { save } = useSave()
  const [showAll, setShowAll] = useState(false)

  const parseSignedInt32FromIdHex = (idHex: string): number | null => {
    const trimmed = idHex.trim()
    const hex = /^0x/i.test(trimmed) ? trimmed.slice(2) : trimmed
    const unsigned = Number.parseInt(hex, 16)
    if (!Number.isFinite(unsigned)) return null

    // Convert unsigned 32-bit to signed 32-bit.
    return unsigned > 0x7fffffff ? unsigned - 0x100000000 : unsigned
  }

  const acquired = new Set<string>()
  const acquiredPrayers = getAcquiredPrayerSources(save)

  // Primary source: decoded inventory list (quest items).
  const inventoryQuestItems = (save?.player?.inventory as
    | { quests?: { items?: QuestItem[] } }
    | undefined)?.quests?.items

  for (const entry of inventoryQuestItems ?? []) {
    const name = entry?.item?.name
    if (typeof name === "string") acquired.add(name)
  }

  const acquiredFigures = new Set<string>()
  const inventoryFigures = (save?.player?.inventory as
    | { figures?: { items?: QuestItem[] } }
    | undefined)?.figures?.items

  for (const entry of inventoryFigures ?? []) {
    const name = entry?.item?.name
    if (typeof name === "string") acquiredFigures.add(name)
  }

  // Fallback: inventorySummary stores quest item persistence IDs (numbers or idHex).
  // This helps when some decoded entries don't include `item.name` even though they exist.
  const ownQuestItems = (save?.player as
    | { inventorySummary?: { ownQuestItems?: Array<string | number> } }
    | undefined)?.inventorySummary?.ownQuestItems

  if (Array.isArray(ownQuestItems)) {
    for (const code of ownQuestItems) {
      if (typeof code === "number") {
        const ref = formatItemRef(code)
        if (ref?.name) acquired.add(ref.name)
      } else if (typeof code === "string") {
        const parsed = parseSignedInt32FromIdHex(code)
        if (parsed === null) continue
        const ref = formatItemRef(parsed)
        if (ref?.name) acquired.add(ref.name)
      }
    }
  }

  // Some quest chains grant a "completed" item and consume the earlier inputs.
  // Even if a save still contains those inputs in `inventory.quests.items`,
  // we hide them by default once their completion reward is owned.
  const hiddenByCompleted = (() => {
    type HideRule =
      | { type: "rewardPresent"; completed: string; hide: string[] }
      | { type: "allInputsConsumed"; inputItems: string[] }

    const rules: HideRule[] = [
      // Imperfectus Lacrimatorio progression:
      // only one item is in the player's inventory at a time.
      // Picking up a later stage consumes the previous one.
      // Note: to ensure earlier stages are hidden even if intermediate stages
      // are no longer present in inventory, each stage hides everything before it.
      { type: "rewardPresent", completed: "QI107", hide: ["QI106"] },
      { type: "rewardPresent", completed: "QI108", hide: ["QI106", "QI107"] },
      { type: "rewardPresent", completed: "QI109", hide: ["QI106", "QI107", "QI108"] },
      { type: "rewardPresent", completed: "QI110", hide: ["QI106", "QI107", "QI108", "QI109"] }, // -> Plenus
      { type: "rewardPresent", completed: "QI111", hide: ["QI106", "QI107", "QI108", "QI109", "QI110"] }, // -> Beatus

      // Wax Seeds -> Remembrance of Cesáreo
      {
        type: "rewardPresent",
        completed: "QI62",
        hide: ["QI56", "QI57", "QI58", "QI59", "QI60", "QI61"],
      },

      // Golden Knots (elders): turn in + consume the turned-in item
      { type: "rewardPresent", completed: "QI06", hide: ["QI05"] }, // Regula's Cloth -> Remembrance
      { type: "rewardPresent", completed: "QI10", hide: ["QI07"] }, // Scroll -> Cástula's remembrance
      { type: "rewardPresent", completed: "QI09", hide: ["QI08"] }, // Cloth -> Trifón's remembrance

      // Giant Rattle -> Remembrance of Próximo
      { type: "rewardPresent", completed: "QI55", hide: ["QI54"] },

      // Mud Key -> Ceramic Key (inputs disappear after final break)
      { type: "rewardPresent", completed: "QI103", hide: ["QI101", "QI102"] },

      // Lullaby of the White Shore
      { type: "rewardPresent", completed: "QI27", hide: ["QI23", "QI24", "QI25", "QI26"] },

      // Sealed Envelope -> Cursed Letter (envelope consumed on read; letter stays)
      { type: "rewardPresent", completed: "QI14", hide: ["QI13"] },
      { type: "rewardPresent", completed: "QI16", hide: ["QI15"] },
      { type: "rewardPresent", completed: "QI18", hide: ["QI17"] },
      { type: "rewardPresent", completed: "QI20", hide: ["QI19"] },
      { type: "rewardPresent", completed: "QI22", hide: ["QI21"] },

      // Dead Stares offerings (4x piece -> offering -> consecrated offering)
      { type: "rewardPresent", completed: "QI205", hide: ["QI204"] },
      { type: "rewardPresent", completed: "QI206", hide: ["QI204", "QI205"] },
      { type: "rewardPresent", completed: "QI208", hide: ["QI207"] },
      { type: "rewardPresent", completed: "QI209", hide: ["QI207", "QI208"] },
      { type: "rewardPresent", completed: "QI211", hide: ["QI210"] },
      { type: "rewardPresent", completed: "QI212", hide: ["QI210", "QI211"] },

      // Sculptor Tools (Montañés): all five tools are inputs consumed on completion.
      // There isn't a single unique "completed" reward item to key on, so we hide tools once *all* are missing.
      {
        type: "allInputsConsumed",
        inputItems: ["QI01", "QI02", "QI03", "QI11", "QI12"],
      },
    ]

    const hidden = new Set<string>()

    // If the player has the "Tiento to your Thorned Hairs" spell,
    // they have completed the Lullaby of the White Shore quest line.
    // Hide the entire lullaby chain (including the reward key).
    if (acquiredPrayers.has("PR16")) {
      for (const src of ["QI23", "QI24", "QI25", "QI26", "QI27"]) hidden.add(src)
    }

    // Lump of Gold: 10 turn-ins -> Traitor's Gaze (RB103); 20 -> The Liberated (FG112).
    // Lumps leave inventory once the figure is awarded.
    if (acquiredFigures.has("FG112")) {
      hidden.add("QI105")
    }

    for (const rule of rules) {
      if (rule.type === "rewardPresent") {
        if (acquired.has(rule.completed)) {
          for (const src of rule.hide) hidden.add(src)
        }
      } else if (rule.type === "allInputsConsumed") {
        const allAreMissing = rule.inputItems.every((item) => !acquired.has(item))
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

  // Simple sequential grouping for easier mental parsing (no headings yet).
  const questOrderGroups: string[][] = [
    // Imperfectus Lacrimatorio -> Plenus -> Beatus
    ["QI106", "QI107", "QI108", "QI109", "QI110", "QI111"],

    // Wax Seeds -> Remembrance of Cesáreo
    ["QI56", "QI57", "QI58", "QI59", "QI60", "QI61", "QI62"],

    // Golden Knots / Remembrances (three separate vendor turn-ins)
    ["QI05", "QI06"], // Regula's Cloth -> Remembrance of Régula
    ["QI07", "QI10"], // Scroll -> Cástula's remembrance
    ["QI08", "QI09"], // Cloth -> Trifón's remembrance

    // Giant Rattle -> Remembrance of Próximo
    ["QI54", "QI55"],

    // Mud Key -> Ceramic Key
    ["QI101", "QI102", "QI103"],

    // Lullaby of the White Shore (inputs then completed key)
    ["QI23", "QI24", "QI25", "QI26", "QI27"],

    // Sculptor Tools (Montañés)
    ["QI12", "QI02", "QI03", "QI11", "QI01"],

    // Sealed Envelopes -> Cursed Letters
    ["QI13", "QI14"],
    ["QI15", "QI16"],
    ["QI17", "QI18"],
    ["QI19", "QI20"],
    ["QI21", "QI22"],

    // Lump of Gold (10 -> Traitor's Gaze, 20 -> The Liberated)
    ["QI105"],

    // Dead Stares offerings (piece x4 -> offering -> consecrated offering)
    ["QI210", "QI211", "QI212"], // Old Piece of Gold -> Gold Offering -> Consecrated Gold Offering
    ["QI204", "QI205", "QI206"], // Cracked ceramic -> Ceramic Offering -> Offering of Consecrated Pottery
    ["QI207", "QI208", "QI209"], // Rusted silver -> Silver Offering -> Consecrated Silver Offering
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

    // Keep original order for anything not in our ordering map.
    if (ai === undefined && bi === undefined) return 0
    if (ai === undefined) return 1
    if (bi === undefined) return -1
    return ai - bi
  })

  return (
    <section className="quest">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Quest Items</h2>
        <button
          type="button"
          className="app-tab"
          onClick={() => setShowAll((v) => !v)}
          aria-pressed={showAll}
          title={showAll ? "Hide completed quest inputs" : "Show everything"}
        >
          {showAll ? "Hide completed" : "Show all"}
        </button>
      </div>
      <div className="quest-grid">
        {orderedQuestItems.map((item) => {
          if (!shouldShowItem(item.source)) return null

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
