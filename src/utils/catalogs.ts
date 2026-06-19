import idCatalogJson from "../data/id-catalog.json"
import itemCatalogJson from "../data/item-catalog.json"
import nameCatalogJson from "../data/name-catalog.json"

interface IdCatalogEntry {
  id: number
  idHex: string
  guid?: string
  name?: string
}

interface IdCatalog {
  managersById: Record<string, IdCatalogEntry>
  typesById: Record<string, IdCatalogEntry>
}

interface ItemCatalogEntry {
  id: number
  idHex: string
  name: string
  category: string
  localized?: {
    caption?: { en?: string }
    description?: { en?: string }
    lore?: { en?: string }
  }
}

interface ItemCatalog {
  itemsById: Record<string, ItemCatalogEntry>
}

interface NameCatalogEntry {
  name: string
  category: string
  path?: string
}

interface NameCatalog {
  namesByHex: Record<string, NameCatalogEntry>
}

export interface ItemRef {
  id: number
  idHex: string
  name?: string
  category?: string
  caption?: string
  description?: string
  displayName?: string
}

const idCatalog = idCatalogJson as IdCatalog
const itemCatalog = itemCatalogJson as ItemCatalog
const nameCatalog = nameCatalogJson as NameCatalog

export function humanizeIdentifier(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
}

function normalizeHashHex(hashHex: string): string {
  const trimmed = hashHex.trim()
  if (/^0x/i.test(trimmed)) {
    return `0x${trimmed.slice(2).toUpperCase()}`
  }
  return `0x${trimmed.toUpperCase()}`
}

function parseHashHex(hashHex: string): number {
  const normalized = normalizeHashHex(hashHex)
  const unsigned = Number.parseInt(normalized.slice(2), 16)
  return unsigned > 0x7fffffff ? unsigned - 0x1_0000_0000 : unsigned
}

export function resolveHashName(hashHex: string): NameCatalogEntry | null {
  return nameCatalog.namesByHex[normalizeHashHex(hashHex)] ?? null
}

export function resolveHashDisplayName(hashHex: string): string | null {
  const entry = resolveHashName(normalizeHashHex(hashHex))
  if (!entry) return null
  if (entry.category === "ability") {
    return humanizeIdentifier(entry.name)
  }
  if (entry.category === "weaponMemory") {
    return entry.name.replace(/_/g, " ")
  }
  return entry.name
}

/** Resolve a persistence ID to the best available human label. */
export function resolveIdLabel(hashHex: string): string {
  const normalized = normalizeHashHex(hashHex)
  const fromNameCatalog = resolveHashDisplayName(normalized)
  if (fromNameCatalog) return fromNameCatalog

  const item = formatItemRef(parseHashHex(normalized))
  const itemLabel = item.displayName ?? item.caption ?? item.name
  if (itemLabel) return itemLabel

  return normalized
}

export function resolveManagerName(key: number): string | null {
  const entry = idCatalog.managersById[String(key)]
  return entry?.guid ?? null
}

export function resolveTypeName(typeIdHex: string): string | null {
  const id = parseInt(typeIdHex.replace(/^0x/i, ""), 16)
  const signed = id > 0x7fffffff ? id - 0x1_0000_0000 : id
  const entry = idCatalog.typesById[String(signed)]
  return entry?.name ?? null
}

export function formatElementKey(key: number, prefix: string): string {
  return resolveManagerName(key) ?? `${prefix}_${key}`
}

export function formatHashKey(value: number): string {
  const u = value >>> 0
  return `0x${u.toString(16).padStart(8, "0").toUpperCase()}`
}

export function formatItemRef(itemId: number): ItemRef {
  const entry = itemCatalog.itemsById[String(itemId)]
  if (!entry) {
    return { id: itemId, idHex: formatHashKey(itemId) }
  }

  const out: ItemRef = {
    id: itemId,
    idHex: entry.idHex,
    name: entry.name,
    category: entry.category,
  }

  const caption = entry.localized?.caption?.en
  if (caption) {
    out.caption = caption
    out.displayName = caption
  }

  const description = entry.localized?.description?.en
  if (description) {
    out.description = description
  }

  return out
}
