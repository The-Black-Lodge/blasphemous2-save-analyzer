import { useState } from "react"
import b2data from "../data/b2data.json"
import resonancesData from "../data/resonances.json"
import figureSprites from "../data/figure-sprites.json"
import { FigureSprite } from "./FigureSprite"
import { useSave } from "./SaveContext"
import { getEquippedFigures } from "../utils/inventoryEquipped"
import {
  getEnvoyChain,
  getHighestAcquiredChainIndex,
  getMaidenChain,
  isChainAcquired,
} from "../utils/figureChains"
import figureChainsJson from "../data/figure-chains.json"

interface FigureChain {
  displaySource: string
  sources: string[]
}

interface FigureItem {
  item?: {
    name?: string
  }
}

const maidenChain = getMaidenChain()
const figureBySource = new Map(
  b2data.figures.map((figure) => [figure.source, figure]),
)

const figureSpriteData = figureSprites as Record<string, Record<string, unknown>>

function hasResonanceSprite(source: string): boolean {
  const entry = (figureSpriteData as any).sprites?.[source]
  return entry && typeof entry.resonance === "object"
}

const envoyDisplaySources = new Map(
  figureChainsJson.envoys.map((chain) => [chain.displaySource, chain]),
)

function getEnvoyChainFor(source: string): FigureChain | null {
  if (envoyDisplaySources.has(source)) {
    return envoyDisplaySources.get(source) ?? null
  }
  for (const chain of figureChainsJson.envoys) {
    if (chain.sources.includes(source)) {
      return chain
    }
  }
  return null
}

function getFigureSpriteSource(source: string, acquired: Set<string>): string {
  if (source === maidenChain.displaySource) {
    const chainIndex = getHighestAcquiredChainIndex(maidenChain, acquired)
    if (chainIndex !== null) {
      return maidenChain.sources[chainIndex]
    }
  }
  return source
}

type ResonanceTab = "equipped" | "available" | "all"

function ResonanceFigure({
  source,
  acquired,
  variant,
}: {
  source: string
  acquired: Set<string>
  variant?: "resonance"
}) {
  const figure = figureBySource.get(source)
  if (!figure) return null

  const envoyChain = getEnvoyChainFor(source)
  const isBurnt = envoyChain ? acquired.has(envoyChain.sources[1]) : false
  const displayFigure = isBurnt ? figureBySource.get(envoyChain.displaySource) : figure

  return (
    <div className="resonance-figure">
      <span className="resonance-figure-sprite">
        <FigureSprite
          source={getFigureSpriteSource(source, acquired)}
          acquired={acquired}
          burnt={isBurnt}
          variant={variant}
        />
      </span>
      <span className="resonance-figure-label">
        {isBurnt ? `Burnt Figure (${displayFigure.caption.en})` : displayFigure.caption.en}
      </span>
    </div>
  )
}

interface ResonancePair {
  source: string
  name?: string
  description: { en: string }
  requirement: { figures: [string, string] }
}

const resonancePairs = resonancesData.resonances.filter(
  (r) => r.requirement?.type === "figurePair",
) as ResonancePair[]

function isResonanceAvailable(
  resonance: ResonancePair,
  acquired: Set<string>,
): boolean {
  const figA = resonance.requirement.figures[0]
  const figB = resonance.requirement.figures[1]
  const isAcquiredA =
    figA === maidenChain.displaySource
      ? isChainAcquired(maidenChain, acquired)
      : acquired.has(figA)
  const isAcquiredB =
    figB === maidenChain.displaySource
      ? isChainAcquired(maidenChain, acquired)
      : acquired.has(figB)
  return isAcquiredA && isAcquiredB
}

function findResonancePair(figA: string, figB: string): ResonancePair | null {
  return (
    resonancePairs.find(
      (r) =>
        (r.requirement.figures[0] === figA && r.requirement.figures[1] === figB) ||
        (r.requirement.figures[0] === figB && r.requirement.figures[1] === figA),
    ) ?? null
  )
}

export default function AltarResonance() {
  const { save } = useSave()
  const [tab, setTab] = useState<ResonanceTab>("equipped")

  const acquired = new Set(
    (
      save?.player?.inventory as
        | { figures?: { items?: FigureItem[] } }
        | undefined
    )?.figures?.items
      ?.map((entry) => entry.item?.name)
      .filter((name): name is string => typeof name === "string") ?? [],
  )

  const equippedFigures = getEquippedFigures(save)

  const availableResonances = resonancePairs.filter((r) =>
    isResonanceAvailable(r, acquired),
  )

  return (
    <aside className="altar-resonances">
      <nav className="altar-tabs" aria-label="Resonance categories">
        <button
          type="button"
          className="altar-tab"
          role="tab"
          aria-selected={tab === "equipped"}
          onClick={() => setTab("equipped")}
        >
          Equipped
        </button>
        <button
          type="button"
          className="altar-tab"
          role="tab"
          aria-selected={tab === "available"}
          onClick={() => setTab("available")}
        >
          Available
        </button>
        <button
          type="button"
          className="altar-tab"
          role="tab"
          aria-selected={tab === "all"}
          onClick={() => setTab("all")}
        >
          All
        </button>
      </nav>
      <div className="altar-resonance-content">
        <div className="altar-resonance-panel">
          {tab === "equipped" && (
            <>
              {equippedFigures.length > 0 ? (
                <ul className="resonance-grid">
                  {Array.from({ length: 4 }, (_, rowIdx) => {
                    const slotA = equippedFigures[rowIdx * 2]
                    const slotB = equippedFigures[rowIdx * 2 + 1]
                    const figA = slotA?.source ?? null
                    const figB = slotB?.source ?? null
                    const resonance =
                      figA && figB ? findResonancePair(figA, figB) : null

                    return (
                      <li key={rowIdx} className="resonance-row">
                        {slotA && (
                          <ResonanceFigure
                            source={slotA.source}
                            acquired={acquired}
                            variant={resonance ? "resonance" : undefined}
                          />
                        )}
                        {slotB && (
                          <ResonanceFigure
                            source={slotB.source}
                            acquired={acquired}
                            variant={resonance ? "resonance" : undefined}
                          />
                        )}
                        {resonance && (
                          <div className="resonance-effect">
                            {resonance.name && (
                              <span className="resonance-name">{resonance.name}</span>
                            )}
                            {resonance.description.en}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="altar-equipped-empty">
                  No figures equipped on the board.
                </p>
              )}
            </>
          )}
          {tab === "available" && (
            <>
              {availableResonances.length > 0 ? (
                <ul className="resonance-grid">
                  {availableResonances.map((resonance) => (
                    <li key={resonance.source} className="resonance-row">
                      <ResonanceFigure
                        source={resonance.requirement.figures[0]}
                        acquired={acquired}
                        variant={hasResonanceSprite(resonance.requirement.figures[0]) ? "resonance" : undefined}
                      />
                      <ResonanceFigure
                        source={resonance.requirement.figures[1]}
                        acquired={acquired}
                        variant={hasResonanceSprite(resonance.requirement.figures[1]) ? "resonance" : undefined}
                      />
                      <div className="resonance-effect">
                        {resonance.name && (
                          <span className="resonance-name">{resonance.name}</span>
                        )}
                        {resonance.description.en}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="altar-equipped-empty">
                  No available resonances.
                </p>
              )}
            </>
          )}
          {tab === "all" && (
            <ul className="resonance-grid">
              {resonancePairs.map((resonance) => (
                <li key={resonance.source} className="resonance-row">
                  <ResonanceFigure
                    source={resonance.requirement.figures[0]}
                    acquired={acquired}
                    variant={hasResonanceSprite(resonance.requirement.figures[0]) ? "resonance" : undefined}
                  />
                  <ResonanceFigure
                    source={resonance.requirement.figures[1]}
                    acquired={acquired}
                    variant={hasResonanceSprite(resonance.requirement.figures[1]) ? "resonance" : undefined}
                  />
                  <div className="resonance-effect">
                    {resonance.name && (
                      <span className="resonance-name">{resonance.name}</span>
                    )}
                    {resonance.description.en}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  )
}
