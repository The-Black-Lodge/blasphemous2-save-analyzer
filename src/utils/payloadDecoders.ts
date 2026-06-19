import {
  B2BinaryReader,
  getPersistentObjectList,
  readNestedPersistentObject,
  type NestedPersistentObject,
} from "./binaryReader"
import {
  formatElementKey,
  formatItemRef,
  resolveManagerName,
  resolveTypeName,
} from "./catalogs"
import {
  decodeAbilitiesPersistentPayload,
  decodeAbilityLockPersistencePayload,
  decodeCherubsPersistencePayload,
  decodeCompletionPersistencePayload,
  decodeGuiltPersistencePayload,
  decodeStatsPersistentPayload,
  decodeWeaponMemoryPersistencePayload,
} from "./playerDecoders"

const INVENTORY_COMPONENT_ID = 51037994
const STATS_COMPONENT_ID = -911447619
const ABILITIES_COMPONENT_ID = -749611200
const STATS_TYPE_IDS = new Set([0x5ce1f99b, 0xefa6f720])
const ABILITIES_TYPE_ID = 0x533635a5
const WEAPON_MEMORY_TYPE_IDS = new Set([0x82e037ab, 0x9b2e8fbc])

function dateTimeFromBinary(value: bigint): Date | null {
  if (value === 0n) return null
  const ticks = value & 0x3fffffffffffffffn
  const ms = Number((ticks - 621355968000000000n) / 10000n)
  if (!Number.isFinite(ms)) return null
  return new Date(ms)
}

function testPlausibleSaveMetadata(played: number, dt: Date | null): boolean {
  if (played < 0 || played > 5e6 || !dt) return false
  const year = dt.getFullYear()
  return year >= 2020 && year <= 2035
}

function typeNameMatch(typeName: string | null, pattern: string): boolean {
  if (!typeName) return false
  const needle = pattern.replace(/\*/g, "")
  return typeName.includes(needle)
}

function decodeItemFields(
  payload: Uint8Array,
  typeName: string | null,
): Record<string, unknown> | null {
  if (payload.length < 4) return null
  const r = new B2BinaryReader(payload)
  const itemId = r.readInt32()
  const result: Record<string, unknown> = { item: formatItemRef(itemId) }

  if (typeName?.includes("StackableItemData") && r.getRemaining() >= 4) {
    result.stack = r.readInt32()
  } else if (
    typeName?.includes("EquippablesItemData") &&
    r.getRemaining() >= 4
  ) {
    result.slot = r.readInt32()
  }

  if (typeName?.match(/_v2|_v3|_v4/) && r.getRemaining() >= 4) {
    result.internalValue = r.readInt32()
  }
  if (typeName?.match(/_v3|_v4/) && r.getRemaining() >= 1) {
    result.markAsNew = r.readBoolean()
  }
  if (typeName?.includes("_v4") && r.getRemaining() >= 4) {
    result.level = r.readInt32()
  }

  return result
}

function decodeInventoryListSection(
  label: string,
  reader: B2BinaryReader,
): Record<string, unknown> {
  const objects = getPersistentObjectList(reader)
  const entries: Record<string, unknown>[] = []
  for (const obj of objects) {
    const typeName = resolveTypeName(obj.typeId)
    const entry = decodeItemFields(obj.payload, typeName) ?? {
      rawTypeId: obj.typeId,
    }
    entries.push(entry)
  }
  return { label, count: objects.length, items: entries }
}

export function decodeInventoryPersistentPayload(
  payload: Uint8Array,
): Record<string, unknown> | null {
  if (payload.length < 4) return null
  const r = new B2BinaryReader(payload)
  const sections = [
    "consumables",
    "figures",
    "quests",
    "rosaryBeads",
    "prayers",
    "collectibles",
    "altarPiecePresets",
  ] as const

  const out: Record<string, unknown> = { type: "InventoryPersistentData" }
  for (const label of sections) {
    if (r.getRemaining() < 4) break
    out[label] = decodeInventoryListSection(label, r)
  }
  return out
}

function decodeEquipmentPersistencePayload(
  payload: Uint8Array,
): Record<string, unknown> | null {
  if (payload.length < 12) return null
  const r = new B2BinaryReader(payload)
  const currentWeapon = r.readInt32()
  const currentArmor = r.readInt32()
  const slotCount = r.readInt32()
  const weaponSlots: unknown[] = []
  for (let i = 0; i < slotCount; i++) {
    weaponSlots.push(formatItemRef(r.readInt32()))
  }
  const unlockedCount = r.readInt32()
  const unlockedWeapons: unknown[] = []
  for (let i = 0; i < unlockedCount; i++) {
    unlockedWeapons.push(formatItemRef(r.readInt32()))
  }
  return {
    type: "EquipmentPersistence",
    currentWeapon: formatItemRef(currentWeapon),
    currentArmor: formatItemRef(currentArmor),
    weaponSlots,
    unlockedWeapons,
  }
}

function decodePersistemItemPayload(
  payload: Uint8Array,
): Record<string, unknown> | null {
  if (payload.length < 4) return null
  const r = new B2BinaryReader(payload)
  const id = r.readInt32()
  const strId = resolveManagerName(id)

  let nested: unknown = null
  if (r.getRemaining() >= 20) {
    const obj = readNestedPersistentObject(r)
    if (id === INVENTORY_COMPONENT_ID) {
      nested = decodeInventoryPersistentPayload(obj.payload)
    } else if (id === STATS_COMPONENT_ID) {
      nested = decodeStatsPersistentPayload(obj.payload)
    } else if (id === ABILITIES_COMPONENT_ID) {
      nested = decodeAbilitiesPersistentPayload(obj.payload)
    }
    if (!nested) {
      nested = decodePersistentPayload(obj.typeIdRaw, obj.payload)
    }
    if (!nested) {
      nested = {
        typeId: obj.typeId,
        payloadSize: obj.payloadSize,
        note: "undecoded",
        typeName: resolveTypeName(obj.typeId) ?? undefined,
      }
    }
  }

  return { type: "PersistemItem", strId, id, data: nested }
}

function decodePersistentComponentDataPayload(
  payload: Uint8Array,
): Record<string, unknown> | null {
  if (payload.length < 4) return null
  const r = new B2BinaryReader(payload)
  const count = r.readInt32()
  const components: Record<string, unknown> = {}

  for (let i = 0; i < count; i++) {
    const obj = readNestedPersistentObject(r)
    const decoded = decodePersistemItemPayload(obj.payload)
    if (decoded) {
      const key = (decoded.strId as string) || `component_${i}`
      components[key] = decoded
    }
  }

  return { type: "PersistentComponentData", componentCount: count, components }
}

function decodePlayerSpawnPersistencePayload(
  payloadBytes: Uint8Array,
): Record<string, unknown> | null {
  if (payloadBytes.length < 24) return null
  const r = new B2BinaryReader(payloadBytes)
  const result: Record<string, unknown> = {
    type: "PlayerSpawnPersistenceData",
    spawnRoom: r.readInt32(),
    spawnEntryId: r.readInt32(),
    spawnType: r.readInt32(),
    prieuDieuRoom: r.readInt32(),
    prieuDieuId: r.readInt32(),
  }

  if (r.getRemaining() >= 20) {
    const obj = readNestedPersistentObject(r)
    let nested = decodePersistentComponentDataPayload(obj.payload)
    if (!nested) {
      nested = {
        typeId: obj.typeId,
        payloadSize: obj.payloadSize,
        note: "undecoded",
        typeName: resolveTypeName(obj.typeId) ?? undefined,
      }
    }
    result.playerPersistence = nested
  }

  return result
}

function decodeSavePersistencePayload(
  payload: Uint8Array,
): Record<string, unknown> | null {
  if (payload.length < 12) return null

  for (const off of [0, 4]) {
    if (payload.length < off + 12) continue
    const view = new DataView(payload.buffer, payload.byteOffset + off)
    const played = view.getFloat32(0, true)
    const dtBin = view.getBigInt64(4, true)
    const dt = dateTimeFromBinary(dtBin)
    if (testPlausibleSaveMetadata(played, dt)) {
      const result: Record<string, unknown> = {
        type: "SavePersistenceData",
        PlayedTime: played,
        DateTimeBinary: dtBin.toString(),
        LastPlayed: dt!.toISOString(),
      }
      if (off > 0) {
        const prefixView = new DataView(payload.buffer, payload.byteOffset, 4)
        result.prefix = prefixView.getInt32(0, true)
      }
      return result
    }
  }
  return null
}

export function decodePersistentPayload(
  typeId: number,
  payload: Uint8Array,
): unknown {
  const decoded = decodeSavePersistencePayload(payload)
  if (decoded) return decoded

  const typeIdHex = `0x${typeId.toString(16).padStart(8, "0").toUpperCase()}`
  const typeName = resolveTypeName(typeIdHex)

  if (
    typeId === 0x294aeb63 ||
    typeNameMatch(typeName, "EquipmentPersistence")
  ) {
    const equip = decodeEquipmentPersistencePayload(payload)
    if (equip) return equip
  }

  if (
    typeId === 0xc14d8fe5 ||
    typeId === 0x770ee50b ||
    typeNameMatch(typeName, "InventoryPersistentData")
  ) {
    const inv = decodeInventoryPersistentPayload(payload)
    if (inv) return inv
  }

  if (
    typeId === 0x6aa54575 ||
    (typeNameMatch(
      typeName,
      "PlayerPersistentComponent+PersistentComponentData",
    ) &&
      !typeName?.includes("PersistemItem"))
  ) {
    const comp = decodePersistentComponentDataPayload(payload)
    if (comp) return comp
  }

  if (typeId === 0x3c8a3839 || typeNameMatch(typeName, "PersistemItem")) {
    const item = decodePersistemItemPayload(payload)
    if (item) return item
  }

  if (
    typeNameMatch(typeName, "PlayerSpawnManager+PlayerSpawnPersistenceData")
  ) {
    const spawn = decodePlayerSpawnPersistencePayload(payload)
    if (spawn) return spawn
  }

  if (
    STATS_TYPE_IDS.has(typeId) ||
    typeNameMatch(typeName, "StatsPersistentData")
  ) {
    const stats = decodeStatsPersistentPayload(payload)
    if (stats) return stats
  }

  if (
    typeId === ABILITIES_TYPE_ID ||
    typeNameMatch(typeName, "AbilitiesPersistentData")
  ) {
    const abilities = decodeAbilitiesPersistentPayload(payload)
    if (abilities) return abilities
  }

  if (typeNameMatch(typeName, "CherubsACHManagerPersistenceData")) {
    const cherubs = decodeCherubsPersistencePayload(payload)
    if (cherubs) return cherubs
  }

  if (typeNameMatch(typeName, "CompletionPersistenceData")) {
    const completion = decodeCompletionPersistencePayload(payload)
    if (completion) return completion
  }

  if (typeNameMatch(typeName, "AbilityLockPersistenceData")) {
    const abilityLock = decodeAbilityLockPersistencePayload(payload)
    if (abilityLock) return abilityLock
  }

  if (
    typeNameMatch(typeName, "GuiltPersistenceData") &&
    typeName !== null &&
    !typeName.includes("Drop")
  ) {
    const guilt = decodeGuiltPersistencePayload(payload)
    if (guilt) return guilt
  }

  if (
    WEAPON_MEMORY_TYPE_IDS.has(typeId) ||
    typeNameMatch(typeName, "WeaponMemoryPersistenceData")
  ) {
    const weaponMemory = decodeWeaponMemoryPersistencePayload(payload)
    if (weaponMemory) return weaponMemory
  }

  if (
    typeNameMatch(typeName, "ItemData") ||
    typeNameMatch(typeName, "StackableItemData") ||
    typeNameMatch(typeName, "EquippablesItemData")
  ) {
    const item = decodeItemFields(payload, typeName)
    if (item) return { ...item, type: "ItemFields" }
  }

  if (payload.length === 4) {
    const view = new DataView(payload.buffer, payload.byteOffset, 4)
    return { type: "int32", value: view.getInt32(0, true) }
  }

  if (payload.length <= 32) {
    const hex = [...payload]
      .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
      .join(" ")
    return { type: "bytes", hex }
  }

  return null
}

export function getPlayerInventoryFromSpawnPayload(
  payloadBytes: Uint8Array,
): Record<string, unknown> | null {
  if (payloadBytes.length < 24) return null
  const spawnReader = new B2BinaryReader(payloadBytes)
  spawnReader.readInt32()
  spawnReader.readInt32()
  spawnReader.readInt32()
  spawnReader.readInt32()
  spawnReader.readInt32()
  if (spawnReader.getRemaining() < 20) return null

  const playerObj = readNestedPersistentObject(spawnReader)
  const playerReader = new B2BinaryReader(playerObj.payload)
  const componentCount = playerReader.readInt32()
  for (let i = 0; i < componentCount; i++) {
    const itemObj = readNestedPersistentObject(playerReader)
    const itemReader = new B2BinaryReader(itemObj.payload)
    const componentId = itemReader.readInt32()
    if (componentId !== INVENTORY_COMPONENT_ID) continue
    if (itemReader.getRemaining() < 20) return null
    const invObj = readNestedPersistentObject(itemReader)
    return decodeInventoryPersistentPayload(invObj.payload)
  }
  return null
}

function itemCode(item: Record<string, unknown>): string | number | null {
  const ref = item.item as { id?: number; idHex?: string } | undefined
  if (!ref) return null
  if (typeof ref.id === "number") return ref.id
  if (typeof ref.idHex === "string") return ref.idHex
  return null
}

export function toInventorySummary(
  inventoryData: Record<string, unknown>,
): Record<string, unknown> | null {
  if (inventoryData.type !== "InventoryPersistentData") return null

  const names: Record<string, string> = {
    consumables: "ownConsumables",
    quests: "ownQuestItems",
    rosaryBeads: "ownBeads",
    prayers: "ownPrayers",
    figures: "ownFigures",
    collectibles: "ownCollectibles",
  }

  const out: Record<string, unknown> = {}
  for (const [section, outKey] of Object.entries(names)) {
    const block = inventoryData[section] as
      | { items?: Record<string, unknown>[] }
      | undefined
    if (!block?.items) continue
    const codes: (string | number)[] = []
    for (const item of block.items) {
      const code = itemCode(item)
      if (code) codes.push(code)
    }
    if (codes.length > 0) out[outKey] = codes
  }

  const beads = inventoryData.rosaryBeads as
    | { items?: Record<string, unknown>[] }
    | undefined
  if (beads?.items) {
    const worn: { slot: number; bead: string | number }[] = []
    for (const item of beads.items) {
      const slot = item.slot as number | undefined
      if (slot !== undefined && slot >= 0) {
        const code = itemCode(item)
        if (code) worn.push({ slot, bead: code })
      }
    }
    if (worn.length > 0) out.wearBeads = worn
  }

  return out
}

export function extractInventorySummary(
  parsed: ParsedSave,
): Record<string, unknown> | null {
  return extractPlayerSummary(parsed)
}

function getCommonManagerData(
  parsed: ParsedSave,
  managerKey: string,
): unknown {
  const common = parsed.snapshot.commonElements
  for (const [key, entry] of Object.entries(common)) {
    if (formatElementKey(Number(key), "manager") !== managerKey) continue
    return entry.object.decoded
  }
  return null
}

function getSpawnPlayerComponents(
  parsed: ParsedSave,
): Record<string, { data?: unknown }> | null {
  const common = parsed.snapshot.commonElements
  for (const [key, entry] of Object.entries(common)) {
    if (formatElementKey(Number(key), "manager") !== "ID_PLAYERSPAWN_MANAGER") {
      continue
    }
    const spawn = entry.object.decoded as Record<string, unknown> | null
    if (!spawn) return null

    const persistence = spawn.playerPersistence as
      | { components?: Record<string, { data?: unknown }> }
      | undefined
    return persistence?.components ?? null
  }
  return null
}

export function extractPlayerSummary(
  parsed: ParsedSave,
): Record<string, unknown> | null {
  const summary: Record<string, unknown> = {}
  const common = parsed.snapshot.commonElements

  for (const [key, entry] of Object.entries(common)) {
    if (formatElementKey(Number(key), "manager") !== "EQUIPMENT_MANAGER_ID")
      continue
    const obj = entry.object
    const equip = decodeEquipmentPersistencePayload(obj.payload)
    if (equip) summary.equipment = equip
    break
  }

  for (const [key, entry] of Object.entries(common)) {
    if (formatElementKey(Number(key), "manager") !== "ID_PLAYERSPAWN_MANAGER")
      continue
    const spawnDecoded = entry.object.decoded as Record<string, unknown> | null
    if (spawnDecoded) {
      summary.spawn = {
        spawnRoom: spawnDecoded.spawnRoom,
        spawnEntryId: spawnDecoded.spawnEntryId,
        spawnType: spawnDecoded.spawnType,
        prieuDieuRoom: spawnDecoded.prieuDieuRoom,
        prieuDieuId: spawnDecoded.prieuDieuId,
      }
    }

    const inv = getPlayerInventoryFromSpawnPayload(entry.object.payload)
    if (inv) {
      summary.inventory = inv
      summary.inventorySummary = toInventorySummary(inv)
    }
    break
  }

  const components = getSpawnPlayerComponents(parsed)
  if (components?.STATS?.data) summary.stats = components.STATS.data
  if (components?.Abilities?.data) summary.abilities = components.Abilities.data

  const saveMeta = getCommonManagerData(parsed, "ID_SAVEDATA_MANAGER")
  if (saveMeta) summary.saveMeta = saveMeta

  const completion = getCommonManagerData(parsed, "ID_COMPLETION_MANAGER")
  if (completion) summary.completion = completion

  const cherubs = getCommonManagerData(parsed, "CherubsManager")
  if (cherubs) summary.cherubs = cherubs

  const weaponMemory = getCommonManagerData(parsed, "ID_WeaponMemory_MANAGER")
  if (weaponMemory) summary.weaponMemory = weaponMemory

  const guilt = getCommonManagerData(parsed, "ID_GUILT_MANAGER")
  if (guilt) summary.guilt = guilt

  const abilityLock = getCommonManagerData(parsed, "ID_ABILITYLOCK_MANAGER")
  if (abilityLock) summary.abilityLock = abilityLock

  return Object.keys(summary).length > 0 ? summary : null
}

export interface ParsedSave {
  header: {
    fileSize: number
    formatKind: string
    version: number
  }
  snapshot: {
    commonCount: number
    commonElements: Record<
      string,
      { key: number; object: NestedPersistentObject }
    >
    roomElements: Record<
      string,
      {
        key: number
        elementCount: number
        elements: Record<
          string,
          { key: number; object: NestedPersistentObject }
        >
      }
    > | null
    roomCount: number
  }
}

export function enrichObject(obj: NestedPersistentObject): void {
  try {
    obj.decoded = decodePersistentPayload(obj.typeIdRaw, obj.payload)
  } catch (err) {
    obj.decoded = {
      type: "decodeError",
      message: err instanceof Error ? err.message : String(err),
    }
  }
}
