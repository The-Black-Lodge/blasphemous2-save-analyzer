import ac32Enemies from "../data/ac32-enemies.json"
import type { AchievementProgressEntry } from "./globalAchievementDecoders"
import { unityStringHash } from "./unityStringHash"

export const SPANISH_INQUISITION_TITLE =
  "Nobody Expects the Spanish Inquisition!"
export const AC32_TRACKED_COUNT = 65

const AC32_ACHIEVEMENT_IDS = new Set([
  unityStringHash("AC32"),
  -608566600,
])

const KILLED_ENEMY_PATTERN = /Killed enemy with id: '(-?\d+)'/

export interface EnemyKillStatus {
  code: string
  scriptableId: number
  killed: boolean
}

export interface SpanishInquisitionStatus {
  enemies: EnemyKillStatus[]
  killedCount: number
  trackedTotal: number
}

export function getSpanishInquisitionStatus(
  progress: AchievementProgressEntry[],
  saveSlot: number,
): SpanishInquisitionStatus {
  const knownIds = new Set(
    ac32Enemies.enemies.map((enemy) => enemy.scriptableId),
  )
  const killedIds = new Set<number>()

  for (const entry of progress) {
    if (entry.savegameSlot !== saveSlot) continue

    const killMatch = KILLED_ENEMY_PATTERN.exec(entry.concept)
    if (killMatch) {
      const enemyId = Number(killMatch[1])
      if (knownIds.has(enemyId)) killedIds.add(enemyId)
      continue
    }

    if (
      AC32_ACHIEVEMENT_IDS.has(entry.achievementId) &&
      knownIds.has(entry.tokenid)
    ) {
      killedIds.add(entry.tokenid)
    }
  }

  const enemies = ac32Enemies.enemies.map(({ code, scriptableId }) => ({
    code,
    scriptableId,
    killed: killedIds.has(scriptableId),
  }))

  return {
    enemies,
    killedCount: enemies.filter((enemy) => enemy.killed).length,
    trackedTotal: AC32_TRACKED_COUNT,
  }
}
