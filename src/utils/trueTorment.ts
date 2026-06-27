import type { ReadableSaveJson } from "./saveParser"

export const GAME_MODE_MANAGER_ID = 1956689667

export interface GameModePersistenceData {
  type: "GameModePersistenceData"
  currentMode: number
  newGamePlusUpgrades: number
  ch09FixApplied?: boolean
}

export interface ChallengeStateEntry {
  challengeId: number
  active: boolean
}

export interface ChallengesPersistenceData {
  type: "ChallengesPersistenceData"
  challengeStates: ChallengeStateEntry[]
  prevCompletedChallengesIds: number[]
  completedChallengesIds: number[]
  cancelledChallengesIds: number[]
  initialChallengesChosen: boolean
}

export interface TrueTormentState {
  enabled: boolean
  currentMode: number
  newGamePlusUpgrades: number
  activeChallengeIds: Set<number>
}

/** CH03 Spilled Blood — health bar replaced by life orbs. */
export const CH03_CHALLENGE_ID = -2066987380
export const CH03_HEALTH_PER_ORB = 40

export function isChallengeActive(
  state: TrueTormentState | null,
  challengeId: number,
): boolean {
  return state?.activeChallengeIds.has(challengeId) ?? false
}

export function healthToLifeOrbs(
  health: number,
  perOrb = CH03_HEALTH_PER_ORB,
): number {
  return Math.floor(health / perOrb)
}

function readManagerData<T extends { type: string }>(
  save: ReadableSaveJson | null,
  type: T["type"],
): T | null {
  if (!save?.commonElements) return null

  for (const element of Object.values(save.commonElements)) {
    const data = element.data as T | undefined
    if (data?.type === type) return data
  }

  return null
}

export function getTrueTormentState(
  save: ReadableSaveJson | null,
): TrueTormentState | null {
  const gameMode = readManagerData<GameModePersistenceData>(
    save,
    "GameModePersistenceData",
  )
  if (!gameMode) return null

  const challenges = readManagerData<ChallengesPersistenceData>(
    save,
    "ChallengesPersistenceData",
  )

  const activeChallengeIds = new Set<number>()
  for (const entry of challenges?.challengeStates ?? []) {
    if (entry.active) activeChallengeIds.add(entry.challengeId)
  }

  return {
    enabled: gameMode.currentMode === 1,
    currentMode: gameMode.currentMode,
    newGamePlusUpgrades: gameMode.newGamePlusUpgrades,
    activeChallengeIds,
  }
}
