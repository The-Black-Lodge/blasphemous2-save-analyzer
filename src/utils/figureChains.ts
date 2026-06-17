import figureChainsJson from "../data/figure-chains.json"

export interface FigureChain {
  displaySource: string
  sources: string[]
}

interface FigureChainsData {
  maiden: FigureChain
  envoys: FigureChain[]
}

const figureChains = figureChainsJson as FigureChainsData

export const MAIDEN_CHAIN = figureChains.maiden.sources
export const ENVOY_CHAINS = figureChains.envoys

const chainByMember = new Map<string, FigureChain>()

for (const source of figureChains.maiden.sources) {
  chainByMember.set(source, figureChains.maiden)
}

for (const chain of figureChains.envoys) {
  for (const source of chain.sources) {
    chainByMember.set(source, chain)
  }
}

export function getMaidenChain(): FigureChain {
  return figureChains.maiden
}

export function getMaidenChainIndex(source: string): number | null {
  const index = figureChains.maiden.sources.indexOf(source)
  return index === -1 ? null : index
}

export function isMaidenChainMember(source: string): boolean {
  return figureChains.maiden.sources.includes(source)
}

export function getFigureChain(source: string): FigureChain | null {
  return chainByMember.get(source) ?? null
}

export function getFigureChainIndex(source: string): number | null {
  const chain = chainByMember.get(source)
  if (!chain) return null
  const index = chain.sources.indexOf(source)
  return index === -1 ? null : index
}

const envoyByDisplaySource = new Map(
  figureChains.envoys.map((chain) => [chain.displaySource, chain]),
)

export function getMaidenChainRepairLevel(chainIndex: number): number {
  return Math.floor(chainIndex / 2)
}

export function getHiddenChainSources(): Set<string> {
  const hidden = new Set<string>()

  for (const source of figureChains.maiden.sources) {
    if (source !== figureChains.maiden.displaySource) {
      hidden.add(source)
    }
  }

  for (const chain of figureChains.envoys) {
    for (const source of chain.sources) {
      if (source !== chain.displaySource) {
        hidden.add(source)
      }
    }
  }

  return hidden
}

export function getEnvoyChain(displaySource: string): FigureChain | null {
  return envoyByDisplaySource.get(displaySource) ?? null
}

export function getHighestAcquiredChainIndex(
  chain: FigureChain,
  acquired: Set<string>,
): number | null {
  let highest: number | null = null

  for (let i = 0; i < chain.sources.length; i++) {
    if (acquired.has(chain.sources[i])) {
      highest = i
    }
  }

  return highest
}

export function isChainAcquired(
  chain: FigureChain,
  acquired: Set<string>,
): boolean {
  return chain.sources.some((source) => acquired.has(source))
}
