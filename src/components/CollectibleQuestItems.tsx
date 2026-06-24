import { Fragment } from "react"
import collectiblePlaceholdersData from "../data/collectible-placeholders.json"
import cobijadasData from "../data/cobijadas.json"
import goldenLumpsData from "../data/golden-lumps.json"
import hiddenSymbolsData from "../data/hidden-symbols.json"
import questCollectionsData from "../data/quest-collections.json"
import sculptorToolsData from "../data/sculptor-tools.json"
import CollectibleChildren from "./CollectibleChildren"
import CollectibleCobijadas from "./CollectibleCobijadas"
import CollectibleGoldenLumps from "./CollectibleGoldenLumps"
import CollectibleMarkOfMartyrdom from "./CollectibleMarkOfMartyrdom"
import CollectibleMarkOfTheEmbrujo from "./CollectibleMarkOfTheEmbrujo"
import CollectibleMarkOfThePreceptor from "./CollectibleMarkOfThePreceptor"
import CollectibleHiddenSymbols from "./CollectibleHiddenSymbols"
import CollectiblePlaceholder from "./CollectiblePlaceholder"
import CollectibleQuestGroup, {
  type QuestCollection,
} from "./CollectibleQuestGroup"
import CollectibleSculptorTools from "./CollectibleSculptorTools"
import { questCollectionSummaries } from "./questCollectionSummaries"

const collections = questCollectionsData.collections as QuestCollection[]

const placeholderSections = collectiblePlaceholdersData.placeholders.map(
  (entry) => ({
    key: entry.id,
    title: entry.title,
    element: <CollectiblePlaceholder title={entry.title} />,
  }),
)

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
        <Fragment key={section.key}>{section.element}</Fragment>
      ))}
    </div>
  )
}
