import tearsOfAtonementData from "../data/tears-of-atonement.json"
import { isRoomTriggerCollected } from "./roomTriggers"
import type { ReadableSaveJson } from "./saveParser"

export interface TearsOfAtonementLocation {
  id: number
  sceneFile: string
  roomHash: number
  elementKey: number
  amount: number
  label: string
  url: string | null
}

export const TEARS_OF_ATONEMENT_URNS =
  tearsOfAtonementData.urns as TearsOfAtonementLocation[]

export const TEARS_OF_ATONEMENT_OTHERS =
  tearsOfAtonementData.others as TearsOfAtonementLocation[]

export function isTearsOfAtonementCollected(
  save: ReadableSaveJson | null,
  location: TearsOfAtonementLocation,
): boolean {
  return isRoomTriggerCollected(save, location.roomHash, location.elementKey)
}
