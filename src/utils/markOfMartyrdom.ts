import markOfMartyrdomData from "../data/mark-of-martyrdom.json"
import type { ReadableSaveJson } from "./saveParser"
import { findStat } from "./playerDecoders"
import type { ShopPersistenceEntry } from "./payloadDecoders"

export const KILL_BAR_MAX =
  (markOfMartyrdomData.killBar as { max: number } | undefined)?.max ?? 40

export const ORB_EXPERIENCE_STAT = "Orb Experience"

const SHOP_HAND_ID = 1033931609
const SHOP_ITINERANT_ID = 637619968
const MARTYRDOM_SHOP_ITEM_ID = 997923798
const SHOP_HAND_ORB_PRICES = [23000, 42000] as const

export type MartyrdomTracking =
  | { type: "roomTrigger" }
  | { type: "bossKill"; bossVarID: number; bossCode?: string }
  | { type: "shopOrb"; shopId: number; orbIndex: number }
  | { type: "shopItem"; shopId: number; itemId: number }

export interface MartyrdomLocation {
  id: number
  sceneFile: string | null
  roomHash?: number
  elementKey?: number
  source: "chest" | "quest" | "boss" | "shop"
  label: string
  markCount?: number
  url: string | null
  tracking?: MartyrdomTracking
}

export const MARTYRDOM_LOCATIONS =
  markOfMartyrdomData.locations as MartyrdomLocation[]

function getQuestVariables(save: ReadableSaveJson | null): Record<number, number> {
  const raw = (
    save?.player?.questPersistence as
      | { variables?: Record<string | number, number> }
      | undefined
  )?.variables
  if (!raw) return {}

  const out: Record<number, number> = {}
  for (const [key, value] of Object.entries(raw)) {
    out[Number(key)] = value
  }
  return out
}

function readShopsFromCommonElements(
  save: ReadableSaveJson | null,
): ShopPersistenceEntry[] {
  for (const element of Object.values(save?.commonElements ?? {})) {
    const data = (
      element as {
        data?: { type?: string; shops?: ShopPersistenceEntry[] }
      }
    ).data
    if (data?.type === "ShopPersistenceData" && Array.isArray(data.shops)) {
      return data.shops
    }
  }
  return []
}

function getShops(save: ReadableSaveJson | null): ShopPersistenceEntry[] {
  const fromPlayer = save?.player?.shops
  if (Array.isArray(fromPlayer) && fromPlayer.length > 0) {
    return fromPlayer as ShopPersistenceEntry[]
  }

  return readShopsFromCommonElements(save)
}

function shopIdsMatch(left: number, right: number): boolean {
  return left === right || (left >>> 0) === (right >>> 0)
}

function findShop(save: ReadableSaveJson | null, shopId: number) {
  return getShops(save).find((shop) => shopIdsMatch(shop.shopId, shopId))
}

function listIncludesValue(list: number[] | undefined, value: number): boolean {
  if (!list) return false
  return list.some((entry) => entry === value)
}

function isRoomTriggerActive(
  save: ReadableSaveJson | null,
  roomHash: number,
  elementKey: number,
): boolean {
  const room = save?.roomElements?.[`room_${roomHash}`] as
    | {
        elements?: Record<
          string,
          {
            elementId?: number
            data?: { type?: string; isActive?: boolean }
          }
        >
      }
    | undefined

  if (!room?.elements) return false

  for (const element of Object.values(room.elements)) {
    if (element.elementId !== elementKey) continue
    if (element.data?.type !== "TriggerData") return false
    return element.data.isActive === true
  }

  return false
}

function isBossMarkCollected(
  save: ReadableSaveJson | null,
  bossVarID: number,
  bossCode?: string,
): boolean {
  const questValue = getQuestVariables(save)[bossVarID]
  if (questValue >= 0.5) return true

  const bosses = (
    save?.player?.bossKillStatus as
      | {
          bosses?: {
            varID?: number
            code?: string
            defeated?: boolean
          }[]
        }
      | undefined
  )?.bosses

  if (!bosses) return false

  const byVar = bosses.find((entry) => entry.varID === bossVarID)
  if (byVar?.defeated) return true

  if (bossCode) {
    const byCode = bosses.find((entry) => entry.code === bossCode)
    if (byCode?.defeated) return true
  }

  return false
}

function isShopOrbPurchased(
  soldOrbs: number[] | undefined,
  orbIndex: number,
): boolean {
  if (!soldOrbs?.length) return false
  if (listIncludesValue(soldOrbs, orbIndex)) return true

  const price = SHOP_HAND_ORB_PRICES[orbIndex]
  if (price !== undefined && listIncludesValue(soldOrbs, price)) return true

  return false
}

function isShopOrbCollected(
  save: ReadableSaveJson | null,
  shopId: number,
  orbIndex: number,
): boolean {
  const shop = findShop(save, shopId)
  if (isShopOrbPurchased(shop?.soldOrbs, orbIndex)) return true

  const handShop = findShop(save, SHOP_HAND_ID)
  if (shopIdsMatch(shopId, SHOP_HAND_ID) && isShopOrbPurchased(handShop?.soldOrbs, orbIndex)) {
    return true
  }

  return getShops(save).some((entry) => isShopOrbPurchased(entry.soldOrbs, orbIndex))
}

function isShopItemCollected(
  save: ReadableSaveJson | null,
  shopId: number,
  itemId: number,
): boolean {
  const shop = findShop(save, shopId)
  if (listIncludesValue(shop?.soldItems, itemId)) return true

  return getShops(save).some((entry) => listIncludesValue(entry.soldItems, itemId))
}

export function isMartyrdomMarkCollected(
  save: ReadableSaveJson | null,
  location: MartyrdomLocation,
): boolean {
  const tracking = location.tracking

  if (tracking?.type === "bossKill") {
    return isBossMarkCollected(save, tracking.bossVarID, tracking.bossCode)
  }

  if (tracking?.type === "shopOrb") {
    return isShopOrbCollected(save, tracking.shopId, tracking.orbIndex)
  }

  if (tracking?.type === "shopItem") {
    if (isShopItemCollected(save, tracking.shopId, tracking.itemId)) return true
    if (tracking.itemId === MARTYRDOM_SHOP_ITEM_ID) {
      return isShopItemCollected(save, SHOP_ITINERANT_ID, tracking.itemId)
    }
    return false
  }

  if (location.roomHash === undefined || location.elementKey === undefined) {
    return false
  }
  return isRoomTriggerActive(save, location.roomHash, location.elementKey)
}

export function getKillBarMarksEarned(save: ReadableSaveJson | null): number | null {
  const stats = save?.player?.stats as Record<string, unknown> | undefined
  if (!stats) return null

  const orbExp = findStat(stats, [ORB_EXPERIENCE_STAT])
  if (!orbExp || !("upgrades" in orbExp)) return null
  return orbExp.upgrades
}

export function getMartyrdomPinsCollectedCount(
  save: ReadableSaveJson | null,
): number | null {
  if (!save) return null

  return MARTYRDOM_LOCATIONS.filter((location) =>
    isMartyrdomMarkCollected(save, location),
  ).length
}

/** @deprecated Use getMartyrdomPinsCollectedCount */
export function getMartyrdomMarksCollectedCount(
  save: ReadableSaveJson | null,
): number | null {
  return getMartyrdomPinsCollectedCount(save)
}
