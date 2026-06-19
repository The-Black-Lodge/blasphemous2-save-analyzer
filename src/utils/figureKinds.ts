import figureKindsJson from "../data/figure-kinds.json"
import { getEnvoyChain } from "./figureChains"

export type FigureKind =
  | "faith"
  | "pilgrimage"
  | "punishment"
  | "erudition"
  | "grace"
  | "empty"

export const FIGURE_KIND_ORDER: FigureKind[] = [
  "faith",
  "pilgrimage",
  "punishment",
  "erudition",
  "grace",
  "empty",
]

export const FIGURE_KIND_LABELS: Record<FigureKind, string> = {
  faith: "Faith",
  pilgrimage: "Pilgrimage",
  punishment: "Punishment",
  erudition: "Erudition",
  grace: "Grace",
  empty: "Empty",
}

const figureOrder = figureKindsJson.order as Record<FigureKind, string[]>
const trueTormentOnly = new Set(figureKindsJson.trueTormentOnly)
const ENVOY_DISPLAY_SOURCES = new Set(["FG30", "FG31", "FG32", "FG33"])

const kindBySource = new Map<string, FigureKind>()

for (const kind of FIGURE_KIND_ORDER) {
  for (const source of figureOrder[kind]) {
    if (ENVOY_DISPLAY_SOURCES.has(source) && kind === "empty") {
      continue
    }
    if (!kindBySource.has(source)) {
      kindBySource.set(source, kind)
    }
  }
}

for (const source of ENVOY_DISPLAY_SOURCES) {
  kindBySource.set(source, "erudition")
}

export function getFigureKind(source: string): FigureKind | null {
  return kindBySource.get(source) ?? null
}

/** Category shown in the altar for a figure, accounting for burnt envoys. */
export function getFigureDisplayKind(
  source: string,
  acquired: ReadonlySet<string>,
): FigureKind | null {
  const envoyChain = getEnvoyChain(source)
  if (envoyChain && source === envoyChain.displaySource) {
    const burntSource = envoyChain.sources[1]
    return acquired.has(burntSource) ? "empty" : "erudition"
  }

  return kindBySource.get(source) ?? null
}

/** Display order for a category; respects burnt envoy transfer. */
export function getOrderedFigureSourcesForKind(
  kind: FigureKind,
  acquired: ReadonlySet<string>,
  exclude: ReadonlySet<string> = new Set(),
): string[] {
  return figureOrder[kind].filter((source) => {
    if (exclude.has(source)) return false
    return getFigureDisplayKind(source, acquired) === kind
  })
}

export function isTrueTormentOnlyFigure(source: string): boolean {
  return trueTormentOnly.has(source)
}
