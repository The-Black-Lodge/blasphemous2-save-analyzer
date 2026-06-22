import registry from "../data/quest-item-registry.json"

export interface QuestItemRegistryEntry {
  itemName: string
  caption: string
  group: string
  url: string | null
}

const items = registry.items as Record<string, QuestItemRegistryEntry>

export function getQuestItemRegistryEntry(
  itemName: string,
): QuestItemRegistryEntry | null {
  return items[itemName] ?? null
}

export function getQuestItemCaption(itemName: string): string {
  return items[itemName]?.caption ?? itemName
}

export function getQuestItemGroup(itemName: string): string {
  return items[itemName]?.group ?? itemName
}
