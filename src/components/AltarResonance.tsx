import { useState } from "react"
import b2data from "../data/b2data.json"
import { FigureSprite } from "./FigureSprite"
import { useSave } from "./SaveContext"
import { getEquippedFigures } from "../utils/inventoryEquipped"
import {
  getEnvoyChain,
  getHighestAcquiredChainIndex,
  getMaidenChain,
  isChainAcquired,
} from "../utils/figureChains"

interface FigureItem {
  item?: {
    name?: string
  }
}

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

type ResonanceTab = "equipped" | "available" | "all"

function ResonanceFigure({
  source,
  acquired,
}: {
  source: string
  acquired: Set<string>
}) {
  const figure = figureBySource.get(source)
  if (!figure) return null

  const envoyChain = getEnvoyChain(source)
  const isBurnt = envoyChain ? acquired.has(envoyChain.sources[1]) : false

  return (
    <div className="resonance-figure">
      <span className="resonance-figure-sprite">
        <FigureSprite
          source={getFigureSpriteSource(source, acquired)}
          acquired={acquired}
          burnt={isBurnt}
        />
      </span>
      <span className="resonance-figure-label">
        {isBurnt ? `Burnt Figure (${figure.caption.en})` : figure.caption.en}
      </span>
    </div>
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
                    return (
                      <li key={rowIdx} className="resonance-row">
                        {slotA && (
                          <ResonanceFigure
                            source={slotA.source}
                            acquired={acquired}
                          />
                        )}
                        {slotB && (
                          <ResonanceFigure
                            source={slotB.source}
                            acquired={acquired}
                          />
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
        </div>
      </div>
    </aside>
  )
}
