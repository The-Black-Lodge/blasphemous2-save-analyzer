import questCollectionsData from "../data/quest-collections.json"
import CollectibleQuestGroup, {
  type QuestCollection,
} from "./CollectibleQuestGroup"

const collections = questCollectionsData.collections as QuestCollection[]

export default function CollectibleQuestItems() {
  return (
    <div className="collectible-quest-items">
      {collections.map((collection) => (
        <CollectibleQuestGroup key={collection.id} collection={collection} />
      ))}
    </div>
  )
}
