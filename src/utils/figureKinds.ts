import figureKindsJson from "../data/figure-kinds.json"

export type FigureKind =
  | "erudition"
  | "punishment"
  | "faith"
  | "pilgrimage"
  | "empty"
  | "grace"

export const FIGURE_KIND_ORDER: FigureKind[] = [
  "erudition",
  "punishment",
  "faith",
  "pilgrimage",
  "empty",
  "grace",
]

export const FIGURE_KIND_LABELS: Record<FigureKind, string> = {
  erudition: "Erudition",
  punishment: "Punishment",
  faith: "Faith",
  pilgrimage: "Pilgrimage",
  empty: "Empty",
  grace: "Grace",
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
