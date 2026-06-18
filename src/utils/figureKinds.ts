import figureKindsJson from "../data/figure-kinds.json"

export type FigureKind =
  | "candle"
  | "dagger"
  | "skull"
  | "feather"
  | "neutral"
  | "sin"

export const FIGURE_KIND_ORDER: FigureKind[] = [
  "candle",
  "dagger",
  "skull",
  "feather",
  "sin",
  "neutral",
]

export const FIGURE_KIND_LABELS: Record<FigureKind, string> = {
  candle: "Candle",
  dagger: "Dagger",
  skull: "Skull",
  feather: "Feather",
  neutral: "Neutral",
  sin: "Sin",
}

const kindBySource = new Map<string, FigureKind>()
const trueTormentOnly = new Set(figureKindsJson.trueTormentOnly)

for (const kind of FIGURE_KIND_ORDER) {
  for (const source of figureKindsJson[kind]) {
    kindBySource.set(source, kind)
  }
}

export function getFigureKind(source: string): FigureKind | null {
  return kindBySource.get(source) ?? null
}

export function isTrueTormentOnlyFigure(source: string): boolean {
  return trueTormentOnly.has(source)
}
