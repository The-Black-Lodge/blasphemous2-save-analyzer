import { Fragment } from "react"
import cobijadasData from "../data/cobijadas.json"
import goldenLumpsData from "../data/golden-lumps.json"
import questCollectionsData from "../data/quest-collections.json"
import sculptorToolsData from "../data/sculptor-tools.json"
import CollectibleChildren from "./CollectibleChildren"
import CollectibleCobijadas from "./CollectibleCobijadas"
import CollectibleGoldenLumps from "./CollectibleGoldenLumps"
import CollectibleQuestGroup, {
  type QuestCollection,
} from "./CollectibleQuestGroup"
import CollectibleSculptorTools from "./CollectibleSculptorTools"
import { questCollectionSummaries } from "./questCollectionSummaries"

const collections = questCollectionsData.collections as QuestCollection[]

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
    key: "sculptor-tools",
    title: sculptorToolsData.title,
    element: <CollectibleSculptorTools />,
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
