import b2data from "../data/b2data.json"
import { useSave } from "./SaveContext"
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
        <i
          key={`heart-crack-${index}`}
          className="fa-solid fa-heart-crack"
        ></i>
      ))}
    </>
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

  return (
    <ul>
      {b2data.figures.map((figure) => {
        if (hiddenChainSources.has(figure.source)) {
          return null
        }

        if (figure.source === maidenChain.displaySource) {
          const chainIndex = getHighestAcquiredChainIndex(maidenChain, acquired)

          return (
            <li key={figure.source}>
              <i
                className={
                  isChainAcquired(maidenChain, acquired)
                    ? "fa-regular fa-square-check"
                    : "fa-regular fa-square"
                }
              ></i>{" "}
              <MaidenLabel chainIndex={chainIndex} />
            </li>
          )
        }

        const envoyChain = getEnvoyChain(figure.source)
        if (envoyChain) {
          const burntSource = envoyChain.sources[1]
          const isBurnt = acquired.has(burntSource)

          return (
            <li key={figure.source}>
              <i
                className={
                  isChainAcquired(envoyChain, acquired)
                    ? "fa-regular fa-square-check"
                    : "fa-regular fa-square"
                }
              ></i>{" "}
              {figure.caption.en}
              {isBurnt ? (
                <>
                  {" "}
                  <i className="fa-solid fa-fire"></i>
                </>
              ) : null}
            </li>
          )
        }

        return (
          <li key={figure.source}>
            <i
              className={
                acquired.has(figure.source)
                  ? "fa-regular fa-square-check"
                  : "fa-regular fa-square"
              }
            ></i>{" "}
            {figure.caption.en}
          </li>
        )
      })}
    </ul>
  )
}
