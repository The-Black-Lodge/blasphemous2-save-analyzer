import b2data from "../data/b2data.json"
import { FigureSprite } from "./FigureSprite"
import { useSave } from "./SaveContext"
import {
  FIGURE_KIND_LABELS,
  FIGURE_KIND_ORDER,
  getFigureKind,
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

const MAIDEN_UNWAVERING_SOURCE = "FG36"
const hiddenChainSources = getHiddenChainSources()
const maidenChain = getMaidenChain()
const figureBySource = new Map(
  b2data.figures.map((figure) => [figure.source, figure]),
)

function getFigureSpriteSource(
  source: string,
  acquired: Set<string>,
): string {
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

function FigureRow({
  source,
  acquired,
}: {
  source: string
  acquired: Set<string>
}) {
  const figure = figureBySource.get(source)
  if (!figure) return null

  if (source === maidenChain.displaySource) {
    const chainIndex = getHighestAcquiredChainIndex(maidenChain, acquired)

    return (
      <li key={source} className="altar-figure-row">
        <span className="altar-figure-label">
          <i
            className={
              isChainAcquired(maidenChain, acquired)
                ? "fa-regular fa-square-check"
                : "fa-regular fa-square"
            }
          ></i>{" "}
          <MaidenLabel chainIndex={chainIndex} />
        </span>
        <span className="altar-figure-sprite-slot">
          <FigureSprite
            source={getFigureSpriteSource(source, acquired)}
            acquired={acquired}
          />
        </span>
      </li>
    )
  }

  const envoyChain = getEnvoyChain(source)
  if (envoyChain) {
    const burntSource = envoyChain.sources[1]
    const isBurnt = acquired.has(burntSource)

    return (
      <li key={source} className="altar-figure-row">
        <span className="altar-figure-label">
          <i
            className={
              isChainAcquired(envoyChain, acquired)
                ? "fa-regular fa-square-check"
                : "fa-regular fa-square"
            }
          ></i>{" "}
          {isBurnt ? `Burnt Figure (${figure.caption.en})` : figure.caption.en}
        </span>
        <span className="altar-figure-sprite-slot">
          <FigureSprite
            source={getFigureSpriteSource(source, acquired)}
            acquired={acquired}
            burnt={isBurnt}
          />
        </span>
      </li>
    )
  }

  return (
    <li key={source} className="altar-figure-row">
      <span className="altar-figure-label">
        <i
          className={
            acquired.has(source)
              ? "fa-regular fa-square-check"
              : "fa-regular fa-square"
          }
        ></i>{" "}
        {figure.caption.en}
      </span>
      <span className="altar-figure-sprite-slot">
        <FigureSprite
          source={getFigureSpriteSource(source, acquired)}
          acquired={acquired}
        />
      </span>
    </li>
  )
}

function FigureList({
  label,
  sources,
  acquired,
}: {
  label: string
  sources: string[]
  acquired: Set<string>
}) {
  if (sources.length === 0) return null

  return (
    <div className="altar-column">
      <h3>{label}</h3>
      <ul>
        {sources.map((source) => (
          <FigureRow key={source} source={source} acquired={acquired} />
        ))}
      </ul>
    </div>
  )
}

export default function Altar() {
  const { save } = useSave()
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
    FIGURE_KIND_ORDER.map((kind) => [kind, [] as string[]]),
  )
  const unclassified: string[] = []

  for (const figure of b2data.figures) {
    if (hiddenChainSources.has(figure.source)) {
      continue
    }

    const kind = getFigureKind(figure.source)
    if (kind) {
      byKind.get(kind)?.push(figure.source)
    } else {
      unclassified.push(figure.source)
    }
  }

  return (
    <section className="altar">
      <h2>Altar</h2>
      <div className="altar-columns">
        {FIGURE_KIND_ORDER.map((kind) => (
          <FigureList
            key={kind}
            label={FIGURE_KIND_LABELS[kind]}
            sources={byKind.get(kind) ?? []}
            acquired={acquired}
          />
        ))}
        {unclassified.length > 0 ? (
          <FigureList label="Other" sources={unclassified} acquired={acquired} />
        ) : null}
      </div>
    </section>
  )
}
