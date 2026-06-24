import markOfThePreceptorData from "../data/mark-of-the-preceptor.json"
import type { ReadableSaveJson } from "./saveParser"

export interface PreceptorLocation {
  id: number
  sceneFile: string
  roomHash: number
  elementKey: number
  label: string
  url: string | null
}

export const PRECEPTOR_LOCATIONS =
  markOfThePreceptorData.locations as PreceptorLocation[]

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

export function isPreceptorMarkCollected(
  save: ReadableSaveJson | null,
  location: PreceptorLocation,
): boolean {
  return isRoomTriggerActive(save, location.roomHash, location.elementKey)
}

export function getPreceptorMarksCollectedCount(
  save: ReadableSaveJson | null,
): number | null {
  if (!save?.roomElements) return null

  return PRECEPTOR_LOCATIONS.filter((location) =>
    isPreceptorMarkCollected(save, location),
  ).length
}
