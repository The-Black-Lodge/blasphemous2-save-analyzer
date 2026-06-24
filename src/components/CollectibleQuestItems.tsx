import { type ReactElement } from "react"
import collectiblePlaceholdersData from "../data/collectible-placeholders.json"
import cobijadasData from "../data/cobijadas.json"
import goldenLumpsData from "../data/golden-lumps.json"
import hiddenSymbolsData from "../data/hidden-symbols.json"
import lacrimatorioData from "../data/lacrimatorio.json"
import CollectibleLacrimatorio from "./CollectibleLacrimatorio"
import lullabiesData from "../data/lullabies.json"
import CollectibleRemembrances from "./CollectibleRemembrances"
import offeringsData from "../data/offerings.json"
import CollectibleOfferings from "./CollectibleOfferings"
import questCollectionsData from "../data/quest-collections.json"
import sculptorToolsData from "../data/sculptor-tools.json"
import sealedEnvelopesData from "../data/sealed-envelopes.json"
import sleepingDaughtersData from "../data/sleeping-daughters.json"
import CollectibleChildren from "./CollectibleChildren"
import CollectibleCobijadas from "./CollectibleCobijadas"
import CollectibleGoldenLumps from "./CollectibleGoldenLumps"
import CollectibleLocationCollection from "./CollectibleLocationCollection"
import CollectibleMarkOfMartyrdom from "./CollectibleMarkOfMartyrdom"
import CollectibleMarkOfTheEmbrujo from "./CollectibleMarkOfTheEmbrujo"
import CollectibleMarkOfThePreceptor from "./CollectibleMarkOfThePreceptor"
import CollectibleHiddenSymbols from "./CollectibleHiddenSymbols"
import CollectiblePlaceholder from "./CollectiblePlaceholder"
import CollectibleQuestGroup, {
  type QuestCollection,
} from "./CollectibleQuestGroup"
import CollectibleSculptorTools from "./CollectibleSculptorTools"
import { collectibleCollectionSummaries } from "./collectibleCollectionSummaries"
import { questCollectionSummaries } from "./questCollectionSummaries"
import type { CollectibleLocationData } from "../utils/collectibleLocations"
import { isLullabyCollected } from "../utils/lullabies"
import { isSealedEnvelopeCollected } from "../utils/sealedEnvelopes"

interface PlaceholderEntry {
  id: string
  title: string
}

const collections = questCollectionsData.collections as QuestCollection[]

function locationCollection(
  key: string,
  data: CollectibleLocationData,
  isCollected?: Parameters<typeof CollectibleLocationCollection>[0]["isCollected"],
): { key: string; title: string; element: ReactElement } {
  return {
    key,
    title: data.title,
    element: (
      <CollectibleLocationCollection
        collection={data}
        summary={collectibleCollectionSummaries[key]}
        isCollected={isCollected}
      />
    ),
  }
}

const placeholderSections = (
  collectiblePlaceholdersData.placeholders as PlaceholderEntry[]
).map((entry) => ({
  key: entry.id,
  title: entry.title,
  element: <CollectiblePlaceholder title={entry.title} />,
}))

const collectibleSections = [
  {
    key: "children",
    title: "Children of Moonlight",
    element: <CollectibleChildren />,
  },
  {
    key: "cobijadas",
    title: cobijadasData.title,
    element: <CollectibleCobijadas />,
  },
  {
    key: "golden-lumps",
    title: goldenLumpsData.title,
    element: <CollectibleGoldenLumps />,
  },
  {
    key: "hidden-symbols",
    title: hiddenSymbolsData.title,
    element: <CollectibleHiddenSymbols />,
  },
  {
    key: "sculptor-tools",
    title: sculptorToolsData.title,
    element: <CollectibleSculptorTools />,
  },
  {
    key: "mark-of-martyrdom",
    title: "Mark of Martyrdom",
    element: <CollectibleMarkOfMartyrdom />,
  },
  {
    key: "mark-of-the-embrujo",
    title: "Mark of the Embrujo",
    element: <CollectibleMarkOfTheEmbrujo />,
  },
  {
    key: "mark-of-the-preceptor",
    title: "Mark of the Preceptor",
    element: <CollectibleMarkOfThePreceptor />,
  },
  {
    key: "lacrimatorio",
    title: lacrimatorioData.title,
    element: <CollectibleLacrimatorio />,
  },
  locationCollection(
    "lullabies",
    lullabiesData as CollectibleLocationData,
    isLullabyCollected,
  ),
  {
    key: "mementos",
    title: "Remembrances",
    element: <CollectibleRemembrances />,
  },
  {
    key: "offerings",
    title: offeringsData.title,
    element: <CollectibleOfferings />,
  },
  locationCollection(
    "sealed-envelope",
    sealedEnvelopesData as CollectibleLocationData,
    isSealedEnvelopeCollected,
  ),
  locationCollection(
    "sleeping-daughter",
    sleepingDaughtersData as CollectibleLocationData,
  ),
  ...collections.map((collection) => ({
    key: collection.id,
    title: collection.title,
    element: (
      <CollectibleQuestGroup
        collection={collection}
        summary={questCollectionSummaries[collection.id]}
      />
    ),
  })),
  ...placeholderSections,
].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }))

export default function CollectibleQuestItems() {
  return (
    <div className="collectible-quest-items">
      {collectibleSections.map((section) => (
        <div key={section.key} id={`collectible-${section.key}`}>
          {section.element}
        </div>
      ))}
    </div>
  )
}
