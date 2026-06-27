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
  decodeEnemySpawnPersistencePayload,
  decodeGuiltPersistencePayload,
  decodeStatsPersistentPayload,
  decodeWeaponMemoryPersistencePayload,
} from "./playerDecoders"

const INVENTORY_COMPONENT_ID = 51037994
const STATS_COMPONENT_ID = -911447619
const ABILITIES_COMPONENT_ID = -749611200
const QUEST_MANAGER_ID = -596494782
const QUEST_MANAGER_TYPE_ID = 0xc7ee3d13
const SHOP_PERSISTENCE_TYPE_ID = 0x6401dbab

const QUEST_ID_MAP: Record<number, { name: string; category: string; description: string }> = Object.fromEntries([
  // Bosses quest (tracks boss defeats)
  [-1159116381, { name: "Bosses", category: "bosses", description: "Boss defeat tracking" }],
  // Main story quests
  [-1643499381, { name: "Main Path", category: "main_story", description: "ST00 - Main path, weapon choice, sorrows" }],
  // Mid-game NPC quests
  [-1455898277, { name: "Gold Delivery", category: "main_story", description: "ST103 - Tree quest, gold delivery to Mud Girl" }],
  [-836930327, { name: "Doves Discovered", category: "main_story", description: "ST06 - Itinerant quest, doves discovery" }],
  [-1999729741, { name: "Doves Flag", category: "main_story", description: "Bosses Doves Discovered Fix" }],
  [1891953028, { name: "Company", category: "main_story", description: "ST07 - Company quest, coins delivery" }],
  [1891953026, { name: "Company Progress", category: "main_story", description: "ST07 - Company quest progress" }],
  // Shop conditional quests
  [1085383974, { name: "Shop Conditional", category: "shop", description: "SHOPMISSABLES - conditional shop items" }],
  [1085383975, { name: "Blood Lady", category: "main_story", description: "ST11 - Blood Lady quest, chalice upgrades" }],
  [1085383972, { name: "Shop Conditional 2", category: "shop", description: "SHOPMISSABLES - additional shop items" }],
  [1085383973, { name: "Shop Conditional 3", category: "shop", description: "SHOPMISSABLES - additional shop items" }],
  // Arena/progression quests
  [1488668501, { name: "Arena Progress", category: "arena", description: "Arena quest progress" }],
  [1488668502, { name: "Arena Conditional", category: "arena", description: "Arena quest conditional" }],
  [1488668499, { name: "Arena Conditional 2", category: "arena", description: "Arena quest conditional 2" }],
  // Location access quests
  [-1643499380, { name: "Location Access", category: "location", description: "Location access quests" }],
  [-1643499383, { name: "Location Access 2", category: "location", description: "Location access quest 2" }],
  // Z36 Castle Entrance
  [1670614045, { name: "Castle Entrance", category: "main_story", description: "Z36 Castle Entrance quest" }],
  [1670614044, { name: "Castle Entrance 2", category: "main_story", description: "Z36 Castle Entrance quest 2" }],
  [1670614043, { name: "Castle Entrance 3", category: "main_story", description: "Z36 Castle Entrance quest 3" }],
  [1670614039, { name: "Castle Entrance 4", category: "main_story", description: "Z36 Castle Entrance quest 4" }],
  // Symbol quests
  [-1240214854, { name: "Symbols Progress", category: "main_story", description: "Crystallbell symbols quest progress" }],
  [-836930326, { name: "Symbols Progress 2", category: "main_story", description: "Crystallbell symbols quest progress 2" }],
  [-1240214853, { name: "Symbols Progress 3", category: "main_story", description: "Crystallbell symbols quest progress 3" }],
  [-1240214856, { name: "Symbols Progress 4", category: "main_story", description: "Crystallbell symbols quest progress 4" }],
  // Additional tracked quests
  [-1999729740, { name: "Doves Tracking", category: "main_story", description: "Doves tracking quest" }],
  [-1455898278, { name: "Gold Progress", category: "main_story", description: "Gold delivery progress" }],
  [-1455898279, { name: "Gold Progress 2", category: "main_story", description: "Gold delivery progress 2" }],
  [-1455898280, { name: "Gold Progress 3", category: "main_story", description: "Gold delivery progress 3" }],
  [-1455898281, { name: "Gold Progress 4", category: "main_story", description: "Gold delivery progress 4" }],
  [-1455898310, { name: "Gold Progress 5", category: "main_story", description: "Gold delivery progress 5" }],
  [-1455898309, { name: "Gold Progress 6", category: "main_story", description: "Gold delivery progress 6" }],
  [-1455898314, { name: "Gold Progress 7", category: "main_story", description: "Gold delivery progress 7" }],
  // Conditional quests
  [-513524378, { name: "Conditional Quest", category: "conditional", description: "Conditional quest trigger" }],
  [-725627380, { name: "Conditional Quest 2", category: "conditional", description: "Conditional quest trigger 2" }],
  [-1058269311, { name: "Conditional Quest 3", category: "conditional", description: "Conditional quest trigger 3" }],
  [-1058269313, { name: "Conditional Quest 4", category: "conditional", description: "Conditional quest trigger 4" }],
  [-1058269317, { name: "Conditional Quest 5", category: "conditional", description: "Conditional quest trigger 5" }],
  [-1058269318, { name: "Conditional Quest 6", category: "conditional", description: "Conditional quest trigger 6" }],
  [-1058269319, { name: "Conditional Quest 7", category: "conditional", description: "Conditional quest trigger 7" }],
  [-1752002532, { name: "Conditional Quest 8", category: "conditional", description: "Conditional quest trigger 8" }],
  [-398251897, { name: "Conditional Quest 9", category: "conditional", description: "Conditional quest trigger 9" }],
  [729153612, { name: "Cesareo (Wax Seeds)", category: "main_story", description: "ST29 - Wax seed planting at Severed Tower" }],
])

// Boss quest variable mapping from GameModeManagerConfig.varsOfDeadBossesList
const BOSS_VARS = [
  { id: 0, varID: 931769267, name: "Radames", code: "BS01" },
  { id: 1, varID: 972433550, name: "Orospina", code: "BS02" },
  { id: 2, varID: 1093909737, name: "Lesmes", code: "BS03" },
  { id: 3, varID: 486012140, name: "Afilaor", code: "BS04" },
  { id: 4, varID: 607488327, name: "Benedicta", code: "BS05" },
  { id: 5, varID: 648152610, name: "Tercios", code: "BS06" },
  { id: 6, varID: 769628797, name: "Susona", code: "BS07" },
  { id: 7, varID: -577512320, name: "Orgaz", code: "BS08" },
  { id: 8, varID: 810398647, name: "Eviterno", code: "BS10" },
  { id: 9, varID: 931874834, name: "Tutorial Boss", code: "BS11" },
]

const DLC_BOSS_VARS = [
  { id: 10, varID: -1364307071, name: "Mater Priora", code: "BS101" },
  { id: 11, varID: -1713357321, name: "Penitent Rogue A", code: "BS102A" },
  { id: 12, varID: 97115205, name: "Penitent Rogue B", code: "BS102B" },
  { id: 13, varID: -1393746147, name: "Crescencia", code: "BS201" },
]
const STATS_TYPE_IDS = new Set([0x5ce1f99b, 0xefa6f720])
const ABILITIES_TYPE_ID = 0x533635a5
const WEAPON_MEMORY_TYPE_IDS = new Set([0x82e037ab, 0x9b2e8fbc])
const ENEMY_SPAWN_TYPE_ID = 0x10adb1ff
const TRIGGER_TYPE_ID = 0x02a7c4f7

function decodeTriggerData(
  payload: Uint8Array,
): { type: "TriggerData"; isActive: boolean } | null {
  if (payload.length < 1) return null
  return { type: "TriggerData", isActive: payload[0] !== 0 }
}

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

  const isStackable = typeName?.includes("StackableItemData") ?? false
  const isEquippable = typeName?.includes("EquippablesItemData") ?? false
  const hasV2Fields =
    typeName?.match(/_v2|_v3|_v4/) !== null ||
    (!typeName && (payload.length === 9 || payload.length === 13))
  const hasV3Fields =
    typeName?.match(/_v3|_v4/) !== null ||
    (!typeName && (payload.length === 9 || payload.length === 13))
  const hasV4Fields =
    typeName?.includes("_v4") ?? (!typeName && payload.length === 17)

  if (isStackable && r.getRemaining() >= 4) {
    result.stack = r.readInt32()
  } else if (isEquippable && r.getRemaining() >= 4) {
    result.slot = r.readInt32()
  }

  if (hasV2Fields && r.getRemaining() >= 4) {
    result.internalValue = r.readInt32()
  }
  if (hasV3Fields && r.getRemaining() >= 1) {
    result.markAsNew = r.readBoolean()
  }
  if (hasV4Fields && r.getRemaining() >= 4) {
    result.level = r.readInt32()
  }

  return result
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

const GAME_MODE_TYPE_ID = 0x0356c921
const CHALLENGES_TYPE_ID = 0x89e8b711

function readBoolByte(reader: B2BinaryReader): boolean {
  if (reader.getRemaining() < 1) return false
  return reader.readBytes(1)[0] !== 0
}

function decodeGameModePersistencePayload(
  payload: Uint8Array,
): Record<string, unknown> | null {
  if (payload.length < 8) return null

  const reader = new B2BinaryReader(payload)
  const result: Record<string, unknown> = {
    type: "GameModePersistenceData",
    currentMode: reader.readInt32(),
    newGamePlusUpgrades: reader.readInt32(),
  }

  if (reader.getRemaining() >= 1) {
    result.ch09FixApplied = readBoolByte(reader)
  }

  return result
}

function decodeChallengesPersistencePayload(
  payload: Uint8Array,
): Record<string, unknown> | null {
  if (payload.length < 4) return null

  const reader = new B2BinaryReader(payload)
  const count = reader.readInt32()
  const challengeStates: { challengeId: number; active: boolean }[] = []

  for (let i = 0; i < count; i++) {
    if (reader.getRemaining() < 5) break
    challengeStates.push({
      challengeId: reader.readInt32(),
      active: readBoolByte(reader),
    })
  }

  return {
    type: "ChallengesPersistenceData",
    challengeStates,
    prevCompletedChallengesIds: readInt32List(reader),
    completedChallengesIds: readInt32List(reader),
    cancelledChallengesIds: readInt32List(reader),
    initialChallengesChosen: readBoolByte(reader),
  }
}

function decodeAltarPiecePresetFields(
  payload: Uint8Array,
): Record<string, unknown> | null {
  if (payload.length < 8) return null
  const reader = new B2BinaryReader(payload)
  return {
    slot: reader.readInt32(),
    equippedFigures: readInt32List(reader),
    activeResonances: readInt32List(reader),
    pairs: readInt32List(reader),
  }
}

function decodeAltarPiecePresetListSection(
  reader: B2BinaryReader,
): Record<string, unknown> {
  const objects = getPersistentObjectList(reader)
  const entries: Record<string, unknown>[] = []
  for (const obj of objects) {
    const entry =
      decodeAltarPiecePresetFields(obj.payload) ?? { rawTypeId: obj.typeId }
    entries.push(entry)
  }
  return { label: "altarPiecePresets", count: objects.length, items: entries }
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
  for (let i = 0; i < sections.length; i++) {
    const label = sections[i]
    if (r.getRemaining() < 4) break
    if (label === "altarPiecePresets") {
      out[label] = decodeAltarPiecePresetListSection(r)
    } else {
      out[label] = decodeInventoryListSection(label, r)
    }
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

function decodeQuestPersistencePayload(
  payload: Uint8Array,
): Record<string, unknown> | null {
  if (payload.length < 4) return null

  const r = new B2BinaryReader(payload)
  const questCount = r.readInt32()
  const quests: Record<string, unknown>[] = []
  const allVariables: Record<number, number> = {}

  for (let q = 0; q < Math.min(questCount, 200); q++) {
    if (r.getRemaining() < 20) break

    r.readUInt32()
    const qRelA = r.readInt64()
    const qRelB = r.readInt64()
    const afterHeader = r.position
    const qPayloadStart = afterHeader + Number(qRelA)
    const qPayloadEnd = qPayloadStart + Number(qRelB)

    if (qRelB < 0n || qPayloadStart < 0 || qPayloadEnd > payload.length) break

    r.position = qPayloadStart
    const qPayload = r.readBytes(Number(qRelB))
    r.position = qPayloadEnd

    if (qPayload.length < 12) break

    const qView = new DataView(qPayload.buffer, qPayload.byteOffset)
    const questId = qView.getInt32(0, true)
    const currentStatus = qView.getFloat32(4, true)
    const varCount = qView.getInt32(8, true)

    const questVars: Record<number, number> = {}
    for (let j = 0; j < varCount; j++) {
      const varOffset = 12 + j * 28
      if (varOffset + 28 > qPayload.length) break

      const vView = new DataView(qPayload.buffer, qPayload.byteOffset + varOffset)
      const vRelA = Number(vView.getBigInt64(4, true))
      const vRelB = Number(vView.getBigInt64(12, true))
      const vPayloadStart = varOffset + 20 + vRelA
      const vPayloadLen = vRelB
      if (vPayloadStart + vPayloadLen > qPayload.length) break

      const vDataView = new DataView(qPayload.buffer, qPayload.byteOffset + vPayloadStart)
      const vId = vDataView.getInt32(0, true)
      const vValue = vDataView.getFloat32(4, true)
      questVars[vId] = vValue
      allVariables[vId] = vValue
    }

    const qInfo = QUEST_ID_MAP[questId]
    quests.push({
      questID: questId,
      questName: qInfo?.name ?? `Quest_${questId}`,
      questCategory: qInfo?.category ?? "unknown",
      status: currentStatus,
      varCount,
      variables: questVars,
    })
  }

  return {
    type: "QuestPersistenceData",
    questCount,
    quests,
    variables: allVariables,
  }
}

function normalizeQuestVariables(
  variables: Record<string | number, number>,
): Record<number, number> {
  const out: Record<number, number> = {}
  for (const [key, value] of Object.entries(variables)) {
    out[Number(key)] = value
  }
  return out
}

function decodeBossKillStatus(
  questVariables: Record<number, number>,
): Record<string, unknown> {
  const allBosses = [...BOSS_VARS, ...DLC_BOSS_VARS]
  const bosses: Record<string, unknown>[] = []

  for (const boss of allBosses) {
    const varValue = questVariables[boss.varID] ?? 0.0
    const defeated = varValue >= 0.5
    bosses.push({
      id: boss.id,
      varID: boss.varID,
      code: boss.code,
      name: boss.name,
      defeated,
    })
  }

  const defeatedCount = bosses.filter((b) => b.defeated).length

  return {
    type: "BossKillStatus",
    bosses,
    bossesDefeated: defeatedCount,
    bossesRemaining: allBosses.length - defeatedCount,
  }
}

export interface ShopPersistenceEntry {
  shopId: number
  soldItems: number[]
  unlockConditionals: number[]
  soldOrbs: number[]
}

export function decodeShopPersistencePayload(
  payload: Uint8Array,
): { type: "ShopPersistenceData"; shops: ShopPersistenceEntry[] } | null {
  if (payload.length < 4) return null

  const reader = new B2BinaryReader(payload)
  const count = reader.readInt32()
  const shops: ShopPersistenceEntry[] = []

  for (let i = 0; i < count; i++) {
    if (reader.getRemaining() < 20) break
    const obj = readNestedPersistentObject(reader)
    const shopReader = new B2BinaryReader(obj.payload)
    if (shopReader.getRemaining() < 4) continue

    const shopId = shopReader.readInt32()
    const soldItems = readInt32List(shopReader)
    const unlockConditionals = readInt32List(shopReader)
    const soldOrbs =
      shopReader.getRemaining() >= 4 ? readInt32List(shopReader) : []

    shops.push({ shopId, soldItems, unlockConditionals, soldOrbs })
  }

  return { type: "ShopPersistenceData", shops }
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
    typeId === QUEST_MANAGER_TYPE_ID ||
    typeNameMatch(typeName, "QuestManager")
  ) {
    const quest = decodeQuestPersistencePayload(payload)
    if (quest) return quest
  }

  if (
    typeId === SHOP_PERSISTENCE_TYPE_ID ||
    typeNameMatch(typeName, "ShopManager+ShopPersistenceData")
  ) {
    const shop = decodeShopPersistencePayload(payload)
    if (shop) return shop
  }

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
    typeId === ENEMY_SPAWN_TYPE_ID ||
    typeNameMatch(typeName, "EnemySpawnManagerPersistenceData")
  ) {
    const enemySpawn = decodeEnemySpawnPersistencePayload(payload)
    if (enemySpawn) return enemySpawn
  }

  if (
    typeNameMatch(typeName, "ItemData") ||
    typeNameMatch(typeName, "StackableItemData") ||
    typeNameMatch(typeName, "EquippablesItemData")
  ) {
    const item = decodeItemFields(payload, typeName)
    if (item) return { ...item, type: "ItemFields" }
  }

  if (
    typeId === TRIGGER_TYPE_ID ||
    typeNameMatch(typeName, "TriggerData")
  ) {
    const trigger = decodeTriggerData(payload)
    if (trigger) return trigger
  }

  if (
    typeId === GAME_MODE_TYPE_ID ||
    typeNameMatch(typeName, "GameModePersistenceData")
  ) {
    const gameMode = decodeGameModePersistencePayload(payload)
    if (gameMode) return gameMode
  }

  if (
    typeId === CHALLENGES_TYPE_ID ||
    typeNameMatch(typeName, "ChallengesPersistenceData")
  ) {
    const challenges = decodeChallengesPersistencePayload(payload)
    if (challenges) return challenges
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

function readShopPersistence(parsed: ParsedSave): ShopPersistenceEntry[] | null {
  const common = parsed.snapshot.commonElements
  for (const [key, entry] of Object.entries(common)) {
    if (formatElementKey(Number(key), "manager") !== "ID_SHOP_MANAGER") continue

    const decoded = entry.object.decoded as
      | { type?: string; shops?: ShopPersistenceEntry[] }
      | null
    if (decoded?.type === "ShopPersistenceData" && decoded.shops) {
      return decoded.shops
    }

    const fresh = decodeShopPersistencePayload(entry.object.payload)
    if (fresh?.shops) {
      entry.object.decoded = fresh
      return fresh.shops
    }
    break
  }

  return null
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

  const enemySpawn = getCommonManagerData(parsed, "ID_ENEMYSPAWN_MANAGER")
  if (enemySpawn) summary.enemySpawn = enemySpawn

  const guilt = getCommonManagerData(parsed, "ID_GUILT_MANAGER")
  if (guilt) summary.guilt = guilt

  const abilityLock = getCommonManagerData(parsed, "ID_ABILITYLOCK_MANAGER")
  if (abilityLock) summary.abilityLock = abilityLock

  // QuestManager: extract quest persistence data
  for (const [key, entry] of Object.entries(common)) {
    if (Number(key) !== QUEST_MANAGER_ID) continue
    const questData = entry.object.decoded as Record<string, unknown> | null
    if (questData && questData.type === "QuestPersistenceData") {
      summary.questPersistence = questData
      const questVariables = normalizeQuestVariables(
        (questData.variables as Record<string | number, number>) ?? {},
      )
      summary.bossKillStatus = decodeBossKillStatus(questVariables)
    }
    break
  }

  const shops = readShopPersistence(parsed)
  if (shops) summary.shops = shops

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
