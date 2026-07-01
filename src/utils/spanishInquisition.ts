import ac32Enemies from "../data/ac32-enemies.json"
import type { AchievementProgressEntry } from "./globalAchievementDecoders"
import { unityStringHash } from "./unityStringHash"

export const SPANISH_INQUISITION_TITLE =
  "Nobody Expects the Spanish Inquisition!"

export interface Ac32EnemyEntry {
  code: string
  scriptableId: number
  occursInGame?: boolean
}

const AC32_ENEMY_LIST = ac32Enemies.enemies as Ac32EnemyEntry[]

/** Enemies with a World-scene spawnpoint in exported assets. */
export const AC32_IN_GAME_ENEMIES = AC32_ENEMY_LIST.filter(
  (enemy) => enemy.occursInGame !== false,
)

export const AC32_TRACKED_COUNT = AC32_IN_GAME_ENEMIES.length

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

function toKillStatus(
  enemies: Ac32EnemyEntry[],
  killedIds: ReadonlySet<number>,
): EnemyKillStatus[] {
  return enemies.map(({ code, scriptableId }) => ({
    code,
    scriptableId,
    killed: killedIds.has(scriptableId),
  }))
}

export function getSpanishInquisitionBestiary(): SpanishInquisitionStatus {
  const enemies = toKillStatus(AC32_IN_GAME_ENEMIES, new Set())

  return {
    enemies,
    killedCount: 0,
    trackedTotal: AC32_TRACKED_COUNT,
  }
}

export function getSpanishInquisitionStatus(
  progress: AchievementProgressEntry[],
  saveSlot: number,
): SpanishInquisitionStatus {
  const knownIds = new Set(
    AC32_IN_GAME_ENEMIES.map((enemy) => enemy.scriptableId),
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

  const enemies = toKillStatus(AC32_IN_GAME_ENEMIES, killedIds)

  return {
    enemies,
    killedCount: enemies.filter((enemy) => enemy.killed).length,
    trackedTotal: AC32_TRACKED_COUNT,
  }
}
