import type { ReadableSaveJson } from "./saveParser"

type TriggerRoom = {
  elements?: Record<
    string,
    {
      elementId?: number
      data?: { type?: string; isActive?: boolean }
    }
  >
}

/** `true` / `false` when the trigger exists; `null` if room data is unavailable. */
export function getRoomTriggerActive(
  save: ReadableSaveJson | null,
  roomHash: number,
  elementKey: number,
): boolean | null {
  const room = save?.roomElements?.[`room_${roomHash}`] as TriggerRoom | undefined
  if (!room?.elements) return null

  for (const element of Object.values(room.elements)) {
    if (element.elementId !== elementKey) continue
    if (element.data?.type !== "TriggerData") return false
    return element.data.isActive === true
  }

  return null
}

/** Pickup collected - persistent trigger flipped on after looting. */
export function isRoomTriggerCollected(
  save: ReadableSaveJson | null,
  roomHash: number,
  elementKey: number,
): boolean {
  return getRoomTriggerActive(save, roomHash, elementKey) === true
}

/** Interactable cleared - trigger inactive after use (e.g. Sleeping Daughters). */
export function isRoomTriggerCleared(
  save: ReadableSaveJson | null,
  roomHash: number,
  elementKey: number,
): boolean {
  return getRoomTriggerActive(save, roomHash, elementKey) === false
}
