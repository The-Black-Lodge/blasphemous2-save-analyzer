import goldenLumpsData from "../data/golden-lumps.json"
import type { ReadableSaveJson } from "./saveParser"

export interface GoldenLumpLocation {
  id: number
  sceneFile: string
  roomHash: number
  elementKey: number
  url: string | null
}

export const GOLDEN_LUMP_BASE = goldenLumpsData.base as GoldenLumpLocation[]
export const GOLDEN_LUMP_DLC = goldenLumpsData.dlc as GoldenLumpLocation[]

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

/** Lump picked up at this world location (room trigger active). */
export function isGoldenLumpCollected(
  save: ReadableSaveJson | null,
  location: GoldenLumpLocation,
): boolean {
  return isRoomTriggerActive(save, location.roomHash, location.elementKey)
}
