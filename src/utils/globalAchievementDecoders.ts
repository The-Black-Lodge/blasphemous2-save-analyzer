import {
  B2BinaryReader,
  readNestedPersistentObject,
} from "./binaryReader"

export interface AchievementProgressEntry {
  tokenid: number
  savegameSlot: number
  achievementId: number
  progress: number
  concept: string
}

function decodeProgressPayload(payload: Uint8Array): AchievementProgressEntry {
  const reader = new B2BinaryReader(payload)
  return {
    tokenid: reader.readInt32(),
    savegameSlot: reader.readInt32(),
    achievementId: reader.readInt32(),
    progress: reader.readInt32(),
    concept: reader.readBinaryString(),
  }
}

export function decodeAchievementsPayload(
  payload: Uint8Array,
): AchievementProgressEntry[] {
  const reader = new B2BinaryReader(payload)
  const groupCount = reader.readInt32()
  const entries: AchievementProgressEntry[] = []

  for (let i = 0; i < groupCount; i++) {
    const groupObj = readNestedPersistentObject(reader)
    const groupReader = new B2BinaryReader(groupObj.payload)
    const progressCount = groupReader.readInt32()

    for (let j = 0; j < progressCount; j++) {
      const progressObj = readNestedPersistentObject(groupReader)
      entries.push(decodeProgressPayload(progressObj.payload))
    }
  }

  return entries
}
