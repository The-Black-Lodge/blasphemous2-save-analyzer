import {
  B2BinaryReader,
  readNestedPersistentObject,
  type NestedPersistentObject,
} from "./binaryReader"
import { formatElementKey, resolveTypeName } from "./catalogs"
import {
  decodeAchievementsPayload,
  type AchievementProgressEntry,
} from "./globalAchievementDecoders"
import { unityStringHash } from "./unityStringHash"

const GLOBAL_DATA_MAGIC = [
  0x11, 0xbd, 0x9b, 0x13, 0xab, 0x9f, 0xb1, 0x8d,
] as const

export const ACHIEVEMENTS_MANAGER_KEY = unityStringHash(
  "ID_ACHIEVEMENTS_MANAGER",
)

function magicMatches(
  bytes: Uint8Array,
  magic: readonly number[],
): boolean {
  if (bytes.length < 12) return false
  for (let i = 0; i < magic.length; i++) {
    if (bytes[4 + i] !== magic[i]) return false
  }
  return true
}

function isGlobalDataFile(bytes: Uint8Array): boolean {
  return magicMatches(bytes, GLOBAL_DATA_MAGIC)
}

function readCommonElements(
  reader: B2BinaryReader,
  count: number,
): Record<string, { key: number; object: NestedPersistentObject }> {
  const elements: Record<
    string,
    { key: number; object: NestedPersistentObject }
  > = {}
  for (let i = 0; i < count; i++) {
    const key = reader.readInt32()
    const obj = readNestedPersistentObject(reader)
    elements[String(key)] = { key, object: obj }
  }
  return elements
}

function parseGlobalSnapshot(bytes: Uint8Array): {
  commonCount: number
  commonElements: Record<string, { key: number; object: NestedPersistentObject }>
} {
  const reader = new B2BinaryReader(bytes)
  const commonCount = reader.readInt32()
  const commonElements = readCommonElements(reader, commonCount)

  const remaining = reader.bytes.length - reader.position
  if (remaining !== 0) {
    throw new Error(
      `global snapshot trailing bytes: ${remaining} at 0x${reader.position.toString(16)}`,
    )
  }

  return { commonCount, commonElements }
}

function exportElementObject(
  obj: NestedPersistentObject,
): Record<string, unknown> {
  const entry: Record<string, unknown> = { typeId: obj.typeId }
  const typeName = resolveTypeName(obj.typeId)
  if (typeName) entry.typeName = typeName
  entry.payloadSize = obj.payloadSize
  return entry
}

export interface ReadableGlobalSaveJson {
  file: {
    format: string
    version: number
    size: number
  }
  commonElements: Record<string, Record<string, unknown>>
  achievementProgress: AchievementProgressEntry[]
}

export function parseGlobalSaveBytes(bytes: Uint8Array): ReadableGlobalSaveJson {
  if (bytes.length < 64) {
    throw new Error(`File too small (${bytes.length} bytes)`)
  }

  if (!isGlobalDataFile(bytes)) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, 4)
    const version = view.getUint32(0, true)
    throw new Error(
      `Not a GlobalData file (expected global-data magic, version=${version})`,
    )
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, 4)
  const version = view.getUint32(0, true)
  const snapshot = parseGlobalSnapshot(bytes)

  if (snapshot.commonCount !== version) {
    throw new Error(
      `version/commonCount mismatch: header=${version} snapshot=${snapshot.commonCount}`,
    )
  }

  const achievementsElement =
    snapshot.commonElements[String(ACHIEVEMENTS_MANAGER_KEY)]
  const achievementProgress = achievementsElement
    ? decodeAchievementsPayload(achievementsElement.object.payload)
    : []

  const out: ReadableGlobalSaveJson = {
    file: {
      format: "global-data",
      version,
      size: bytes.length,
    },
    commonElements: {},
    achievementProgress,
  }

  for (const [key, entry] of Object.entries(snapshot.commonElements)) {
    const exportKey = formatElementKey(Number(key), "manager")
    const el = exportElementObject(entry.object)
    el.managerId = Number(key)
    out.commonElements[exportKey] = el
  }

  return out
}

export async function parseGlobalSaveFile(
  input: File | ArrayBuffer | Uint8Array,
): Promise<ReadableGlobalSaveJson> {
  let bytes: Uint8Array
  if (input instanceof Uint8Array) {
    bytes = input
  } else if (input instanceof ArrayBuffer) {
    bytes = new Uint8Array(input)
  } else {
    const buffer = await input.arrayBuffer()
    bytes = new Uint8Array(buffer)
  }
  return parseGlobalSaveBytes(bytes)
}
