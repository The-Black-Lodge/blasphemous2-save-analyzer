import markOfTheEmbrujoData from "../data/mark-of-the-embrujo.json"
import type { ReadableSaveJson } from "./saveParser"

export interface EmbrujoLocation {
  id: number
  sceneFile: string
  roomHash: number
  elementKey: number
  url: string | null
}

export const EMBRUJO_LOCATIONS =
  markOfTheEmbrujoData.locations as EmbrujoLocation[]

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

/** Mark collected from the DLC2Coins chest in this room. */
export function isEmbrujoMarkCollected(
  save: ReadableSaveJson | null,
  location: EmbrujoLocation,
): boolean {
  return isRoomTriggerActive(save, location.roomHash, location.elementKey)
}

export function getEmbrujoMarksCollectedCount(
  save: ReadableSaveJson | null,
): number | null {
  if (!save?.roomElements) return null

  return EMBRUJO_LOCATIONS.filter((location) =>
    isEmbrujoMarkCollected(save, location),
  ).length
}
