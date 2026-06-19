import {
  B2BinaryReader,
  getPersistentObjectList,
} from "./binaryReader"
import { formatHashKey, resolveHashDisplayName, resolveHashName } from "./catalogs"

export interface StatWithValue {
  stat: number
  statHex: string
  statName: string | null
  value: number
}

export interface StatWithUpgrade extends StatWithValue {
  upgrades: number
}

export interface AbilityEntry {
  hash: number
  hashHex: string
  name: string | null
  displayName: string | null
  active: boolean
}

function formatStatId(stat: number): {
  statHex: string
  statName: string | null
} {
  const statHex = formatHashKey(stat)
  return { statHex, statName: resolveHashDisplayName(statHex) }
}

function readInt32List(reader: B2BinaryReader): number[] {
  if (reader.getRemaining() < 4) return []
  const count = reader.readInt32()
  const values: number[] = []
  for (let i = 0; i < count; i++) {
    if (reader.getRemaining() < 4) break
    values.push(reader.readInt32())
  }
  return values
}

function readStatWithValueList(reader: B2BinaryReader): StatWithValue[] {
  const objects = getPersistentObjectList(reader)
  const entries: StatWithValue[] = []

  for (const obj of objects) {
    const payloadReader = new B2BinaryReader(obj.payload)
    if (payloadReader.getRemaining() < 8) continue
    const stat = payloadReader.readInt32()
    const value = payloadReader.readInt32()
    const { statHex, statName } = formatStatId(stat)
    entries.push({ stat, statHex, statName, value })
  }

  return entries
}

function readStatWithUpgradeList(reader: B2BinaryReader): StatWithUpgrade[] {
  const objects = getPersistentObjectList(reader)
  const entries: StatWithUpgrade[] = []

  for (const obj of objects) {
    const payloadReader = new B2BinaryReader(obj.payload)
    if (payloadReader.getRemaining() < 12) continue
    const stat = payloadReader.readInt32()
    const value = payloadReader.readInt32()
    const upgrades = payloadReader.readInt32()
    const { statHex, statName } = formatStatId(stat)
    entries.push({ stat, statHex, statName, value, upgrades })
  }

  return entries
}

export function decodeStatsPersistentPayload(
  payload: Uint8Array,
): Record<string, unknown> | null {
  if (payload.length < 4) return null

  const reader = new B2BinaryReader(payload)
  const result: Record<string, unknown> = {
    type: "StatsPersistentData",
    ranges: readStatWithUpgradeList(reader),
    values: readStatWithValueList(reader),
    modifiables: readStatWithValueList(reader),
  }

  if (reader.getRemaining() >= 4) {
    result.knowValues = readInt32List(reader)
  }
  if (reader.getRemaining() >= 4) {
    result.notNewValues = readInt32List(reader)
  }

  return result
}

export function decodeAbilitiesPersistentPayload(
  payload: Uint8Array,
): Record<string, unknown> | null {
  if (payload.length < 4) return null

  const reader = new B2BinaryReader(payload)
  const objects = getPersistentObjectList(reader)
  const abilities: AbilityEntry[] = []

  for (const obj of objects) {
    const payloadReader = new B2BinaryReader(obj.payload)
    if (payloadReader.getRemaining() < 5) continue
    const hash = payloadReader.readInt32()
    const active = payloadReader.readBoolean()
    const hashHex = formatHashKey(hash)
    abilities.push({
      hash,
      hashHex,
      name: resolveHashName(hashHex)?.name ?? null,
      displayName: resolveHashDisplayName(hashHex),
      active,
    })
  }

  return { type: "AbilitiesPersistentData", abilities }
}

export function decodeCherubsPersistencePayload(
  payload: Uint8Array,
): Record<string, unknown> | null {
  if (payload.length < 4) return null
  const reader = new B2BinaryReader(payload)
  const tokens = readInt32List(reader)
  return {
    type: "CherubsACHManagerPersistenceData",
    tokens,
    tokenHex: tokens.map((token) => formatHashKey(token)),
  }
}

export function decodeCompletionPersistencePayload(
  payload: Uint8Array,
): Record<string, unknown> | null {
  if (payload.length < 4) return null
  const reader = new B2BinaryReader(payload)
  return {
    type: "CompletionPersistenceData",
    completion: reader.readInt32(),
  }
}

export function decodeAbilityLockPersistencePayload(
  payload: Uint8Array,
): Record<string, unknown> | null {
  if (payload.length < 4) return null
  const reader = new B2BinaryReader(payload)
  return {
    type: "AbilityLockPersistenceData",
    showedAbilities: readInt32List(reader),
  }
}

export function decodeGuiltPersistencePayload(
  payload: Uint8Array,
): Record<string, unknown> | null {
  if (payload.length < 4) return null
  const reader = new B2BinaryReader(payload)
  const objects = getPersistentObjectList(reader)
  return {
    type: "GuiltPersistenceData",
    dropCount: objects.length,
  }
}

export function decodeWeaponMemoryPersistencePayload(
  payload: Uint8Array,
): Record<string, unknown> | null {
  if (payload.length < 4) return null

  const reader = new B2BinaryReader(payload)
  const unlockedWeaponMemories = readInt32List(reader)
  const result: Record<string, unknown> = {
    type: "WeaponMemoryPersistenceData",
    unlockedWeaponMemories,
    unlockedWeaponMemoryHex: unlockedWeaponMemories.map((id) =>
      formatHashKey(id),
    ),
  }

  if (reader.getRemaining() >= 4) {
    const pairCount = reader.readInt32()
    const weaponTiers: Record<string, number> = {}
    for (let i = 0; i < pairCount; i++) {
      if (reader.getRemaining() < 8) break
      const weaponId = reader.readInt32()
      const tier = reader.readInt32()
      weaponTiers[formatHashKey(weaponId)] = tier
    }
    if (Object.keys(weaponTiers).length > 0) {
      result.weaponTiers = weaponTiers
    }
  }

  return result
}

export function findStat(
  stats: Record<string, unknown> | undefined,
  names: string[],
): StatWithUpgrade | StatWithValue | null {
  if (!stats) return null

  const ranges = (stats.ranges as StatWithUpgrade[] | undefined) ?? []
  const values = (stats.values as StatWithValue[] | undefined) ?? []
  const modifiables = (stats.modifiables as StatWithValue[] | undefined) ?? []

  for (const list of [ranges, values, modifiables]) {
    for (const entry of list) {
      if (entry.statName && names.includes(entry.statName)) {
        return entry
      }
    }
  }

  return null
}
