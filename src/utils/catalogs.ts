import idCatalogJson from "../data/id-catalog.json"
import itemCatalogJson from "../data/item-catalog.json"

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
