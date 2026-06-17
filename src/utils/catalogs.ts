import idCatalogJson from "../data/id-catalog.json"

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

const idCatalog = idCatalogJson as IdCatalog

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

export function formatItemRef(itemId: number): { id: number; idHex: string } {
  return { id: itemId, idHex: formatHashKey(itemId) }
}
