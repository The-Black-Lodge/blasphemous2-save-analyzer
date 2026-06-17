import {
  B2BinaryReader,
  readNestedPersistentObject,
  type NestedPersistentObject,
} from "./binaryReader"
import { formatElementKey, resolveTypeName } from "./catalogs"
import {
  enrichObject,
  extractInventorySummary,
  type ParsedSave,
} from "./payloadDecoders"

const KNOWN_FORMATS: Record<string, { version: number; magic: number[] }> = {
  "slot-save": {
    version: 25,
    magic: [0xb3, 0xc3, 0xd3, 0xdb, 0x07, 0xf9, 0xf6, 0x9d],
  },
  "global-data": {
    version: 19,
    magic: [0x11, 0xbd, 0x9b, 0x13, 0xab, 0x9f, 0xb1, 0x8d],
  },
}

function getFormatKind(bytes: Uint8Array): string {
  if (bytes.length < 12) return "unknown"
  const view = new DataView(bytes.buffer, bytes.byteOffset, 12)
  const ver = view.getUint32(0, true)
  for (const [kind, entry] of Object.entries(KNOWN_FORMATS)) {
    if (entry.version !== ver) continue
    let match = true
    for (let i = 0; i < 8; i++) {
      if (bytes[4 + i] !== entry.magic[i]) {
        match = false
        break
      }
    }
    if (match) return kind
  }
  return "unknown"
}

function readPersistentObject(reader: B2BinaryReader): NestedPersistentObject {
  const obj = readNestedPersistentObject(reader)
  enrichObject(obj)
  return obj
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
    const obj = readPersistentObject(reader)
    elements[String(key)] = { key, object: obj }
  }
  return elements
}

function readRoomElements(
  reader: B2BinaryReader,
): ParsedSave["snapshot"]["roomElements"] {
  const roomCount = reader.readInt32()
  const rooms: NonNullable<ParsedSave["snapshot"]["roomElements"]> = {}
  for (let r = 0; r < roomCount; r++) {
    const roomKey = reader.readInt32()
    const innerCount = reader.readInt32()
    const inner: Record<
      string,
      { key: number; object: NestedPersistentObject }
    > = {}
    for (let j = 0; j < innerCount; j++) {
      const elementKey = reader.readInt32()
      const obj = readPersistentObject(reader)
      inner[String(elementKey)] = { key: elementKey, object: obj }
    }
    rooms[String(roomKey)] = {
      key: roomKey,
      elementCount: innerCount,
      elements: inner,
    }
  }
  return rooms
}

function parseSnapshot(
  bytes: Uint8Array,
  includeRooms: boolean,
): ParsedSave["snapshot"] {
  const reader = new B2BinaryReader(bytes)
  const commonCount = reader.readInt32()
  const commonElements = readCommonElements(reader, commonCount)
  const roomElements = includeRooms ? readRoomElements(reader) : null

  const remaining = reader.bytes.length - reader.position
  if (remaining !== 0) {
    throw new Error(
      `snapshot trailing bytes: ${remaining} at 0x${reader.position.toString(16)}`,
    )
  }

  return {
    commonCount,
    commonElements,
    roomElements,
    roomCount: roomElements ? Object.keys(roomElements).length : 0,
  }
}

function parseB2SaveFile(bytes: Uint8Array): ParsedSave {
  if (bytes.length < 64) {
    throw new Error(`File too small (${bytes.length} bytes)`)
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, 4)
  const version = view.getUint32(0, true)
  const formatKind = getFormatKind(bytes)

  if (formatKind === "unknown") {
    throw new Error(`Unknown save format (version=${version})`)
  }

  const includeRooms = formatKind === "slot-save"
  const snapshot = parseSnapshot(bytes, includeRooms)

  if (snapshot.commonCount !== version) {
    throw new Error(
      `version/commonCount mismatch: header=${version} snapshot=${snapshot.commonCount}`,
    )
  }

  return {
    header: { fileSize: bytes.length, formatKind, version },
    snapshot,
  }
}

function exportElementObject(
  obj: NestedPersistentObject,
): Record<string, unknown> {
  const entry: Record<string, unknown> = { typeId: obj.typeId }
  const typeName = resolveTypeName(obj.typeId)
  if (typeName) entry.typeName = typeName
  if (obj.decoded) {
    entry.data = obj.decoded
  } else {
    entry.payloadSize = obj.payloadSize
    entry.note = "undecoded"
  }
  return entry
}

export interface ReadableSaveJson {
  file: {
    format: string
    version: number
    size: number
  }
  commonElements: Record<string, Record<string, unknown>>
  roomElements?: Record<string, Record<string, unknown>>
  player?: Record<string, unknown>
}

export function parseSaveBytes(bytes: Uint8Array): ReadableSaveJson {
  const parsed = parseB2SaveFile(bytes)
  const out: ReadableSaveJson = {
    file: {
      format: parsed.header.formatKind,
      version: parsed.header.version,
      size: parsed.header.fileSize,
    },
    commonElements: {},
  }

  for (const [key, entry] of Object.entries(parsed.snapshot.commonElements)) {
    const exportKey = formatElementKey(Number(key), "manager")
    const el = exportElementObject(entry.object)
    el.managerId = Number(key)
    out.commonElements[exportKey] = el
  }

  if (parsed.snapshot.roomElements) {
    out.roomElements = {}
    for (const [roomKey, room] of Object.entries(
      parsed.snapshot.roomElements,
    )) {
      const elements: Record<string, Record<string, unknown>> = {}
      for (const [elKey, el] of Object.entries(room.elements)) {
        const exported = exportElementObject(el.object)
        exported.elementId = Number(elKey)
        elements[`element_${elKey}`] = exported
      }
      out.roomElements[`room_${roomKey}`] = {
        roomId: Number(roomKey),
        elementCount: room.elementCount,
        elements,
      }
    }
  }

  const player = extractInventorySummary(parsed)
  if (player) out.player = player

  return out
}

export async function parseSaveFile(
  input: File | ArrayBuffer | Uint8Array,
): Promise<ReadableSaveJson> {
  let bytes: Uint8Array
  if (input instanceof Uint8Array) {
    bytes = input
  } else if (input instanceof ArrayBuffer) {
    bytes = new Uint8Array(input)
  } else {
    const buffer = await input.arrayBuffer()
    bytes = new Uint8Array(buffer)
  }
  return parseSaveBytes(bytes)
}
