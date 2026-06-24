import questLootPickups from "../data/quest-loot-pickups.json"
import type { ReadableSaveJson } from "./saveParser"
import { formatItemRef } from "./catalogs"
import { inferDeliveredSculptorTools } from "./sculptorTools"

interface InventoryItem {
  item?: {
    name?: string
  }
}

interface QuestRecord {
  questID: number
  status: number
  variables: Record<number, number>
}

interface QuestPersistenceData {
  type?: string
  quests?: QuestRecord[]
}

export type QuestItemAcquisition =
  | "owned"
  | "picked-up"
  | "handed-in"
  | "missing"

export interface QuestItemStatus {
  owned: Set<string>
  worldPickup: Set<string>
  inferred: Set<string>
  pickedUp: Set<string>
}

/** ST11 — Blood Lady */
const ST11_QUEST_ID = 1085383975
const ST11_VARS = {
  CHALICE_UPGRADE: -549613052,
  RECEPTACLE_UPGRADE: 375976085,
  SHARD_UPGRADE: 2079137411,
  HEALTH_FINISHED: 1970708205,
  FLASKN_FINISHED: 1368681068,
  FLASKH_FINISHED: -693867466,
} as const

const CHALICE_ITEMS = ["QI42", "QI43", "QI44", "QI45", "QI46"] as const
const RECEPTACLE_ITEMS = ["QI47", "QI48", "QI49", "QI50"] as const
const SHARD_ITEMS = ["QI51", "QI52", "QI53"] as const

/** ST12 — Besamanos (Hand-Kisser) */
const ST12_QUEST_ID = 1488668502
const ST12_VARS = {
  HAND_SECRET: -1163596600,
  KISSES_DELIVERED: 479213983,
  HAND_SECRET_DOOR: -795119097,
} as const

const TRIBUTE_ITEMS = ["QI29", "QI30", "QI31"] as const
const FERVENT_KISS_ITEMS = ["QI37", "QI38", "QI39", "QI40", "QI41"] as const
const ROSARY_KNOT_ITEMS = ["QI32", "QI33", "QI34", "QI35"] as const

/** ST29 — Cesareo (wax seeds at Severed Tower) */
const ST29_QUEST_ID = 729153612
const ST29_VARS = {
  SEEDS_PLANTED: -67422643,
} as const

const WAX_SEED_ITEMS = ["QI56", "QI57", "QI58", "QI59", "QI60", "QI61"] as const

const byElementKey = questLootPickups.byElementKey as Record<
  string,
  { itemName: string }
>

function questVarActive(value: number | undefined): boolean {
  return typeof value === "number" && value >= 0.5
}

function parseSignedInt32FromIdHex(idHex: string): number | null {
  const trimmed = idHex.trim()
  const hex = /^0x/i.test(trimmed) ? trimmed.slice(2) : trimmed
  const unsigned = Number.parseInt(hex, 16)
  if (!Number.isFinite(unsigned)) return null
  return unsigned > 0x7fffffff ? unsigned - 0x100000000 : unsigned
}

function getQuestPersistence(
  save: ReadableSaveJson | null,
): QuestPersistenceData | null {
  const fromPlayer = save?.player?.questPersistence as
    | QuestPersistenceData
    | undefined
  if (fromPlayer?.quests?.length) return fromPlayer

  const fromCommon = save?.commonElements?.ID_QUEST_MANAGER as
    | { data?: QuestPersistenceData }
    | undefined
  if (fromCommon?.data?.type === "QuestPersistenceData") return fromCommon.data

  return null
}

function findQuest(
  save: ReadableSaveJson | null,
  questId: number,
): QuestRecord | null {
  const persistence = getQuestPersistence(save)
  return persistence?.quests?.find((q) => q.questID === questId) ?? null
}

/** Quest item codes (QI##) currently in inventory. */
export function getOwnedQuestSources(
  save: ReadableSaveJson | null,
): Set<string> {
  const owned = new Set<string>()

  const inventoryQuestItems = (
    save?.player?.inventory as { quests?: { items?: InventoryItem[] } } | undefined
  )?.quests?.items

  for (const entry of inventoryQuestItems ?? []) {
    const name = entry?.item?.name
    if (typeof name === "string") owned.add(name)
  }

  const ownQuestItems = (
    save?.player as
      | { inventorySummary?: { ownQuestItems?: Array<string | number> } }
      | undefined
  )?.inventorySummary?.ownQuestItems

  if (Array.isArray(ownQuestItems)) {
    for (const code of ownQuestItems) {
      if (typeof code === "number") {
        const ref = formatItemRef(code)
        if (ref?.name) owned.add(ref.name)
      } else if (typeof code === "string") {
        const parsed = parseSignedInt32FromIdHex(code)
        if (parsed === null) continue
        const ref = formatItemRef(parsed)
        if (ref?.name) owned.add(ref.name)
      }
    }
  }

  return owned
}

export function getActiveRoomTriggerKeys(
  save: ReadableSaveJson | null,
): Set<number> {
  const active = new Set<number>()
  const rooms = save?.roomElements
  if (!rooms) return active

  for (const room of Object.values(rooms)) {
    const elements = (room as { elements?: Record<string, unknown> }).elements
    if (!elements) continue

    for (const el of Object.values(elements)) {
      const element = el as {
        elementId?: number
        data?: { type?: string; isActive?: boolean }
      }
      if (element.data?.type !== "TriggerData" || !element.data.isActive) continue
      if (typeof element.elementId === "number") active.add(element.elementId)
    }
  }

  return active
}

export function getWorldPickedUpQuestSources(
  save: ReadableSaveJson | null,
): Set<string> {
  const pickedUp = new Set<string>()
  const activeKeys = getActiveRoomTriggerKeys(save)

  for (const elementKey of activeKeys) {
    const entry = byElementKey[String(elementKey)]
    if (entry?.itemName) pickedUp.add(entry.itemName)
  }

  return pickedUp
}

function inferBloodLadyItems(quest: QuestRecord): string[] {
  const items: string[] = []
  const v = quest.variables
  const status = quest.status

  const chalicesDone =
    status >= 3.5 ||
    questVarActive(v[ST11_VARS.CHALICE_UPGRADE]) ||
    questVarActive(v[ST11_VARS.FLASKN_FINISHED]) ||
    questVarActive(v[ST11_VARS.FLASKH_FINISHED])

  const receptaclesDone =
    status >= 3.5 ||
    questVarActive(v[ST11_VARS.RECEPTACLE_UPGRADE]) ||
    questVarActive(v[ST11_VARS.HEALTH_FINISHED])

  const shardsDone =
    status >= 3.5 || questVarActive(v[ST11_VARS.SHARD_UPGRADE])

  if (chalicesDone) items.push(...CHALICE_ITEMS)
  if (receptaclesDone) items.push(...RECEPTACLE_ITEMS)
  if (shardsDone) items.push(...SHARD_ITEMS)

  return items
}

function inferBesamanosItems(quest: QuestRecord): string[] {
  const items: string[] = []
  const v = quest.variables

  const questStarted =
    questVarActive(v[ST12_VARS.HAND_SECRET]) ||
    questVarActive(v[ST12_VARS.HAND_SECRET_DOOR]) ||
    (v[ST12_VARS.KISSES_DELIVERED] ?? 0) >= 1

  if (questStarted) items.push(...TRIBUTE_ITEMS)

  const kissesDelivered = v[ST12_VARS.KISSES_DELIVERED] ?? 0
  if (kissesDelivered >= 5) items.push(...FERVENT_KISS_ITEMS)

  // Lamp Lady door unlocked — rosary knot turn-ins completed for this line.
  if (questVarActive(v[ST12_VARS.HAND_SECRET_DOOR])) {
    items.push(...ROSARY_KNOT_ITEMS)
  }

  return items
}

function inferWaxSeedItems(quest: QuestRecord): string[] {
  const planted = quest.variables[ST29_VARS.SEEDS_PLANTED] ?? 0
  const count = Math.min(
    WAX_SEED_ITEMS.length,
    Math.max(0, Math.floor(planted)),
  )
  return WAX_SEED_ITEMS.slice(0, count)
}

/** Quest items inferred handed-in from quest manager state. */
export function getInferredQuestSources(
  save: ReadableSaveJson | null,
): Set<string> {
  const inferred = new Set<string>()

  const bloodLady = findQuest(save, ST11_QUEST_ID)
  if (bloodLady) {
    for (const item of inferBloodLadyItems(bloodLady)) inferred.add(item)
  }

  const besamanos = findQuest(save, ST12_QUEST_ID)
  if (besamanos) {
    for (const item of inferBesamanosItems(besamanos)) inferred.add(item)
  }

  const cesareo = findQuest(save, ST29_QUEST_ID)
  if (cesareo) {
    for (const item of inferWaxSeedItems(cesareo)) inferred.add(item)
  }

  for (const item of inferDeliveredSculptorTools(save)) inferred.add(item)

  return inferred
}

export function getQuestItemStatus(
  save: ReadableSaveJson | null,
): QuestItemStatus {
  const owned = getOwnedQuestSources(save)
  const worldPickup = getWorldPickedUpQuestSources(save)
  const inferred = getInferredQuestSources(save)

  const pickedUp = new Set<string>([...owned, ...worldPickup, ...inferred])

  return { owned, worldPickup, inferred, pickedUp }
}

export function getQuestItemAcquisition(
  source: string,
  status: QuestItemStatus,
): QuestItemAcquisition {
  if (status.owned.has(source)) return "owned"
  if (status.inferred.has(source)) return "handed-in"
  if (status.worldPickup.has(source)) return "picked-up"
  if (status.pickedUp.has(source)) return "handed-in"
  return "missing"
}
