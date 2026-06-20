import b2data from "../data/b2data.json"
import { FigureSprite } from "./FigureSprite"
import { useSave } from "./SaveContext"
import { getEquippedFigures } from "../utils/inventoryEquipped"
import { findStat } from "../utils/playerDecoders"
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

function EquippedBoardFigure({
  slot,
  source,
  acquired,
}: {
  slot: number
  source: string
  acquired: Set<string>
}) {
  const figure = figureBySource.get(source)
  if (!figure) return null

  const envoyChain = getEnvoyChain(source)
  const isBurnt = envoyChain ? acquired.has(envoyChain.sources[1]) : false

  return (
    <li className="altar-equipped-item">
      <span className="altar-equipped-slot">{slot}</span>
      <span className="altar-figure-sprite-slot">
        <FigureSprite
          source={getFigureSpriteSource(source, acquired)}
          acquired={acquired}
          burnt={isBurnt}
        />
      </span>
      <span className="altar-equipped-label">
        {isBurnt ? `Burnt Figure (${figure.caption.en})` : figure.caption.en}
      </span>
    </li>
  )
}

export default function AltarResonance() {
  const { save } = useSave()

  const altarPieceUpgrade = findStat(
    (save?.player?.stats as Record<string, unknown> | undefined) ?? undefined,
    ["AltarPieceUpgrade"],
  )

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
      <h3>Resonances</h3>
      {altarPieceUpgrade && (
        <p>
          Altar Piece Upgrade: {altarPieceUpgrade.value}
          {"upgrades" in altarPieceUpgrade && altarPieceUpgrade.upgrades !== undefined
            ? ` / ${altarPieceUpgrade.upgrades}`
            : ""}
        </p>
      )}
      {equippedFigures.length > 0 ? (
        <>
          <h4 className="altar-equipped-heading">Equipped Figures</h4>
          <ul className="altar-equipped-list">
            {equippedFigures.map(({ slot, source }) => (
              <EquippedBoardFigure
                key={`${slot}-${source}`}
                slot={slot}
                source={source}
                acquired={acquired}
              />
            ))}
          </ul>
        </>
      ) : (
        <p className="altar-equipped-empty">No figures equipped on the board.</p>
      )}
    </aside>
  )
}
