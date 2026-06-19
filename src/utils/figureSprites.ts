import figureSprites from "../data/figure-sprites.json"

export type FigureSpriteVariant =
  | "base"
  | "resonance"
  | "empty"
  | "full"
  | "burn"

export interface SpriteRect {
  sheet: string
  x: number
  y: number
  w: number
  h: number
}

export interface FigureSpriteEntry {
  base?: SpriteRect
  resonance?: SpriteRect
  empty?: SpriteRect
  full?: SpriteRect
  burn?: SpriteRect
}

interface FigureSpritesFile {
  atlas: Record<string, { w: number; h: number }>
  sprites: Record<string, FigureSpriteEntry>
  scale?: number
}

const figureSpriteData = figureSprites as FigureSpritesFile

const VARIANT_FALLBACK: FigureSpriteVariant[] = [
  "base",
  "resonance",
  "burn",
  "full",
  "empty",
]

export const FIGURE_SPRITE_SCALE = figureSpriteData.scale ?? 2
export const FIGURE_SPRITE_WIDTH = 38 * FIGURE_SPRITE_SCALE
export const FIGURE_SPRITE_HEIGHT = 80 * FIGURE_SPRITE_SCALE

function resolveVariant(
  source: string,
  preferred: FigureSpriteVariant,
): FigureSpriteVariant | null {
  const entry = figureSpriteData.sprites[source]
  if (!entry) return null

  if (entry[preferred]) {
    return preferred
  }

  for (const candidate of VARIANT_FALLBACK) {
    if (entry[candidate]) {
      return candidate
    }
  }

  return null
}

export function resolveFigureSpriteVariant(
  source: string,
  acquired: Set<string>,
): FigureSpriteVariant {
  if (source === "FG209") {
    return acquired.has("FG209") ? "full" : "empty"
  }

  return "base"
}

export function getFigureSpriteClassName(
  source: string,
  acquired: Set<string>,
  variant?: FigureSpriteVariant,
): string | null {
  const preferred = variant ?? resolveFigureSpriteVariant(source, acquired)
  const resolved = resolveVariant(source, preferred)
  if (!resolved) return null

  return `fg-sprite fg-sprite--${source}--${resolved}`
}

export function hasBurnSprite(source: string): boolean {
  return Boolean(figureSpriteData.sprites[source]?.burn)
}
