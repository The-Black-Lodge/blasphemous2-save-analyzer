import offeringsData from "../data/offerings.json"
import {
  getQuestItemAcquisition,
  getQuestItemStatus,
} from "./inventoryQuests"
import { isCollectibleLocationCollected } from "./collectibleLocations"
import type { CollectibleLocation } from "./collectibleLocations"
import type { ReadableSaveJson } from "./saveParser"
import { getQuestItemCaption } from "./questItemRegistry"

export interface OfferingRow {
  pieceItem: string
  completedItem: string
  progression: readonly string[]
  locations: CollectibleLocation[]
}

const ALL_LOCATIONS = offeringsData.locations as CollectibleLocation[]

function locationsForPiece(pieceItem: string): CollectibleLocation[] {
  return ALL_LOCATIONS.filter((location) => location.itemName === pieceItem)
}

/** Ceramic, gold, silver — completed item icon leads each row. */
export const OFFERING_ROWS: OfferingRow[] = [
  {
    pieceItem: "QI204",
    completedItem: "QI206",
    progression: ["QI204", "QI205", "QI206"],
    locations: locationsForPiece("QI204"),
  },
  {
    pieceItem: "QI210",
    completedItem: "QI212",
    progression: ["QI210", "QI211", "QI212"],
    locations: locationsForPiece("QI210"),
  },
  {
    pieceItem: "QI207",
    completedItem: "QI209",
    progression: ["QI207", "QI208", "QI209"],
    locations: locationsForPiece("QI207"),
  },
]

function isProgressionRewardCollected(
  itemName: string,
  progression: readonly string[],
  status: ReturnType<typeof getQuestItemStatus>,
): boolean {
  if (getQuestItemAcquisition(itemName, status) !== "missing") return true

  const index = progression.indexOf(itemName)
  if (index < 0) return false

  for (let i = index + 1; i < progression.length; i++) {
    if (status.pickedUp.has(progression[i])) return true
  }

  return false
}

export function isOfferingPieceCollected(
  save: ReadableSaveJson | null,
  location: CollectibleLocation,
): boolean {
  return isCollectibleLocationCollected(save, location)
}

export function isOfferingRowComplete(
  save: ReadableSaveJson | null,
  row: OfferingRow,
): boolean {
  const status = getQuestItemStatus(save)
  if (
    isProgressionRewardCollected(row.completedItem, row.progression, status)
  ) {
    return true
  }

  return row.locations.every((location) =>
    isOfferingPieceCollected(save, location),
  )
}

export function getOfferingRowCaption(row: OfferingRow): string {
  return getQuestItemCaption(row.completedItem) ?? row.completedItem
}
