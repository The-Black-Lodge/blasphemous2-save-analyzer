import { useState, useContext } from "react"
import b2data from "../data/b2data.json"
import { FigureCategorySprite } from "./FigureCategorySprite"
import { FigureSprite } from "./FigureSprite"
import { useSave } from "./SaveContext"
import { TabContext } from "../App"

function useTab() {
  const tab = useContext(TabContext)
  return tab
}
import {
  FIGURE_KIND_LABELS,
  FIGURE_KIND_ORDER,
  getFigureDisplayKind,
  getOrderedFigureSourcesForKind,
  type FigureKind,
} from "../utils/figureKinds"
import {
  getEnvoyChain,
  getHiddenChainSources,
  getHighestAcquiredChainIndex,
  getMaidenChain,
  getMaidenChainRepairLevel,
  isChainAcquired,
} from "../utils/figureChains"

interface FigureItem {
  item?: {
    name?: string
  }
}

type AltarTab = "all" | FigureKind | "other"

const MAIDEN_UNWAVERING_SOURCE = "FG36"
const hiddenChainSources = getHiddenChainSources()
const maidenChain = getMaidenChain()
const figureBySource = new Map(
  b2data.figures.map((figure) => [figure.source, figure]),
)

function getFigureSpriteSource(source: string, acquired: Set<string>): string {
  if (source === maidenChain.displaySource) {
    const chainIndex = getHighestAcquiredChainIndex(maidenChain, acquired)
    if (chainIndex !== null) {
      return maidenChain.sources[chainIndex]
    }
  }

  return source
}

function MaidenLabel({ chainIndex }: { chainIndex: number | null }) {
  if (chainIndex === maidenChain.sources.length - 1) {
    return (
      <>
        {figureBySource.get(MAIDEN_UNWAVERING_SOURCE)?.caption.en ??
          "The Unwavering One"}{" "}
        <i className="fa-solid fa-star"></i>
      </>
    )
  }

  const repairs =
    chainIndex === null ? 0 : getMaidenChainRepairLevel(chainIndex)

  return (
    <>
      The Maiden{" "}
      {Array.from({ length: repairs }, (_, index) => (
        <i key={`heart-${index}`} className="fa-solid fa-heart"></i>
      ))}
      {Array.from({ length: 3 - repairs }, (_, index) => (
        <i key={`heart-crack-${index}`} className="fa-solid fa-heart-crack"></i>
      ))}
    </>
  )
}

function isFigureOwned(source: string, acquired: Set<string>): boolean {
  if (source === maidenChain.displaySource) {
    return isChainAcquired(maidenChain, acquired)
  }

  const envoyChain = getEnvoyChain(source)
  if (envoyChain) {
    return isChainAcquired(envoyChain, acquired)
  }

  return acquired.has(source)
}

function FigureItem({
  source,
  acquired,
}: {
  source: string
  acquired: Set<string>
}) {
  const figure = figureBySource.get(source)
  if (!figure) return null

  const owned = isFigureOwned(source, acquired)
  const itemClassName = owned
    ? "altar-figure-item"
    : "altar-figure-item altar-figure-item--missing"

  if (source === maidenChain.displaySource) {
    const chainIndex = getHighestAcquiredChainIndex(maidenChain, acquired)

    return (
      <li className={itemClassName}>
        <span className="altar-figure-sprite-slot">
          <FigureSprite
            source={getFigureSpriteSource(source, acquired)}
            acquired={acquired}
          />
        </span>
        <span className="altar-figure-label">
          <MaidenLabel chainIndex={chainIndex} />
        </span>
      </li>
    )
  }

  const envoyChain = getEnvoyChain(source)
  if (envoyChain) {
    const burntSource = envoyChain.sources[1]
    const isBurnt = acquired.has(burntSource)

    return (
      <li className={itemClassName}>
        <span className="altar-figure-sprite-slot">
          <FigureSprite
            source={getFigureSpriteSource(source, acquired)}
            acquired={acquired}
            burnt={isBurnt}
          />
        </span>
        <span className="altar-figure-label">
          {isBurnt ? `Burnt Figure (${figure.caption.en})` : figure.caption.en}
        </span>
      </li>
    )
  }

  return (
    <li className={itemClassName}>
      <span className="altar-figure-sprite-slot">
        <FigureSprite
          source={getFigureSpriteSource(source, acquired)}
          acquired={acquired}
        />
      </span>
      <span className="altar-figure-label">{figure.caption.en}</span>
    </li>
  )
}

function FigurePanel({
  kind,
  label,
  sources,
  acquired,
  showHeading,
}: {
  kind?: FigureKind
  label: string
  sources: string[]
  acquired: Set<string>
  showHeading: boolean
}) {
  if (sources.length === 0) return null

  return (
    <section className="altar-panel">
      {showHeading ? (
        <h3 className="altar-panel-heading">
          {kind ? <FigureCategorySprite kind={kind} /> : null}
          <span>{label}</span>
        </h3>
      ) : null}
      <ul className="altar-figures">
        {sources.map((source) => (
          <FigureItem key={source} source={source} acquired={acquired} />
        ))}
      </ul>
    </section>
  )
}

export default function Altar() {
  const { save } = useSave()
  const appTab = useTab()
  const [tab, setTab] = useState<AltarTab>("all")

  const acquired = new Set(
    (
      save?.player?.inventory as
        | { figures?: { items?: FigureItem[] } }
        | undefined
    )?.figures?.items
      ?.map((entry) => entry.item?.name)
      .filter((name): name is string => typeof name === "string") ?? [],
  )

  const byKind = new Map(
    FIGURE_KIND_ORDER.map((kind) => [
      kind,
      getOrderedFigureSourcesForKind(kind, acquired, hiddenChainSources),
    ]),
  )

  const unclassified: string[] = []
  for (const figure of b2data.figures) {
    if (hiddenChainSources.has(figure.source)) {
      continue
    }
    if (!getFigureDisplayKind(figure.source, acquired)) {
      unclassified.push(figure.source)
    }
  }

  const categoryTabs = FIGURE_KIND_ORDER.filter(
    (kind) => (byKind.get(kind)?.length ?? 0) > 0,
  )
  const otherTabVisible = unclassified.length > 0

  const visiblePanels =
    tab === "all"
      ? [
          ...categoryTabs.map((kind) => ({
            id: kind,
            kind,
            label: FIGURE_KIND_LABELS[kind],
            sources: byKind.get(kind) ?? [],
          })),
          ...(otherTabVisible
            ? [{ id: "other" as const, label: "Other", sources: unclassified }]
            : []),
        ]
      : tab === "other"
        ? [{ id: "other" as const, label: "Other", sources: unclassified }]
        : [
            {
              id: tab,
              kind: tab,
              label: FIGURE_KIND_LABELS[tab],
              sources: byKind.get(tab) ?? [],
            },
          ]

  return (
    <section className="altar">
      {appTab === "all" && <h2>Altarpiece of Favours</h2>}
      <div className="altar-layout">
        <div className="altar-board">
          <nav className="altar-tabs" aria-label="Figure categories">
            <button
              type="button"
              className="altar-tab"
              role="tab"
              aria-selected={tab === "all"}
              onClick={() => setTab("all")}
            >
              Show All
            </button>
            {categoryTabs.map((kind) => (
              <button
                key={kind}
                type="button"
                className="altar-tab altar-tab--category"
                role="tab"
                aria-selected={tab === kind}
                onClick={() => setTab(kind)}
              >
                <FigureCategorySprite kind={kind} />
                <span>{FIGURE_KIND_LABELS[kind]}</span>
              </button>
            ))}
            {otherTabVisible ? (
              <button
                type="button"
                className="altar-tab"
                role="tab"
                aria-selected={tab === "other"}
                onClick={() => setTab("other")}
              >
                Other
              </button>
            ) : null}
          </nav>
          <div className="altar-panels">
            {visiblePanels.map((panel) => (
              <FigurePanel
                key={panel.id}
                kind={"kind" in panel ? panel.kind : undefined}
                label={panel.label}
                sources={panel.sources}
                acquired={acquired}
                showHeading={tab === "all"}
              />
            ))}
          </div>
        </div>
        <aside className="altar-resonances">
          <h3>Resonances</h3>
        </aside>
      </div>
    </section>
  )
}
