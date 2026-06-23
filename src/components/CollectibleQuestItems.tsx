import questCollectionsData from "../data/quest-collections.json"
import CollectibleQuestGroup, {
  type QuestCollection,
} from "./CollectibleQuestGroup"
import CollectibleCobijadas from "./CollectibleCobijadas"
import CollectibleSculptorTools from "./CollectibleSculptorTools"
import { questCollectionSummaries } from "./questCollectionSummaries"

const collections = questCollectionsData.collections as QuestCollection[]

export default function CollectibleQuestItems() {
  return (
    <div className="collectible-quest-items">
      <CollectibleSculptorTools />
      <CollectibleCobijadas />
      {collections.map((collection) => (
        <CollectibleQuestGroup
          key={collection.id}
          collection={collection}
          summary={questCollectionSummaries[collection.id]}
        />
      ))}
    </div>
  )
}
