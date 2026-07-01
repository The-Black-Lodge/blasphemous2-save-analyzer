import enemiesDisplay from "../data/enemies-display.json"

export interface EnemyDisplayEntry {
  devName: string
  displayName: string
  spriteFile: string | null
  spriteStatus: string
  spritePick?: EnemySpritePick | null
}

export interface EnemySpritePickBase {
  source?: string
  spriteDir: string | null
  animationPrefix: string
  asset: string
  sheet: string
  sheetPath?: string
  x: number
  y: number
  w: number
  h: number
}

export interface EnemySpritePickVariantProxy {
  source: "variant-proxy"
  proxyCode: string
  note?: string
  basePick: EnemySpritePickBase
}

export type EnemySpritePick = EnemySpritePickBase | EnemySpritePickVariantProxy

const displayByCode = enemiesDisplay.enemies as Record<string, EnemyDisplayEntry>

export const enemySpriteHeight = enemiesDisplay.spriteHeight
export const enemySpriteScale = enemiesDisplay.spriteScale

export function getEnemyDisplay(code: string): EnemyDisplayEntry | null {
  return displayByCode[code] ?? null
}

export function inferVariantProxy(code: string): string | null {
  const num = Number.parseInt(code.slice(2), 10)
  if (Number.isNaN(num) || num < 11) return null
  const ones = num % 10
  if (ones === 0) return null
  return `EN${String(ones).padStart(2, "0")}`
}

export function variantIndex(code: string): number | null {
  const num = Number.parseInt(code.slice(2), 10)
  if (Number.isNaN(num) || num < 11) return null
  const ones = num % 10
  if (ones === 0) return null
  return Math.floor(num / 10)
}

function isGenericEnemyName(code: string, name: string): boolean {
  return name === code || /^EN\d+$/i.test(name)
}

function proxyCodeForEntry(
  code: string,
  entry: EnemyDisplayEntry | null,
): string | null {
  const pick = entry?.spritePick
  if (pick && "proxyCode" in pick) return pick.proxyCode
  return inferVariantProxy(code)
}

export function getEnemyDisplayName(code: string): string {
  const entry = getEnemyDisplay(code)
  if (!entry) return code

  const proxyCode = proxyCodeForEntry(code, entry)
  const index = variantIndex(code)
  if (!proxyCode || index === null) return entry.displayName

  const isVariantProxy = entry.spriteStatus === "variant-proxy"
  const isGeneric =
    isGenericEnemyName(code, entry.displayName) ||
    isGenericEnemyName(code, entry.devName)
  if (!isVariantProxy && !isGeneric) return entry.displayName

  const parentName = getEnemyDisplayName(proxyCode)
  if (isGenericEnemyName(proxyCode, parentName)) return entry.displayName

  return `${parentName} Variant ${index}`
}

export function getEnemySpriteUrl(code: string): string | null {
  const entry = getEnemyDisplay(code)
  if (!entry?.spriteFile) return null
  return `${import.meta.env.BASE_URL}sprites/enemies/${entry.spriteFile}`
}
