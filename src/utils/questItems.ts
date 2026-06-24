import b2data from "../data/b2data.json"
import collectiblePlaceholdersData from "../data/collectible-placeholders.json"
import cobijadasData from "../data/cobijadas.json"
import goldenLumpsData from "../data/golden-lumps.json"
import hiddenSymbolsData from "../data/hidden-symbols.json"
import lacrimatorioData from "../data/lacrimatorio.json"
import lullabiesData from "../data/lullabies.json"
import offeringsData from "../data/offerings.json"
import questCollectionsData from "../data/quest-collections.json"
import sculptorToolsData from "../data/sculptor-tools.json"
import sealedEnvelopesData from "../data/sealed-envelopes.json"
import sleepingDaughtersData from "../data/sleeping-daughters.json"
import type { ReadableSaveJson } from "./saveParser"
import {
  areAllPreceptorMarksSpent,
} from "./markOfThePreceptor"
import {
  getKillBarMarksEarned,
  KILL_BAR_MAX,
} from "./markOfMartyrdom"
import { hasMeaCulpaUnlocked, MEA_CULPA_HILT } from "./meaCulpa"
import {
  type QuestItemAcquisition,
  type QuestItemStatus,
} from "./inventoryQuests"
import {
  PROXIMO_RATTLE,
  resolveQuestItemAcquisition,
  shouldHideProximoRattle,
} from "./remembrances"
import {
  getQuestItemCaption,
  getQuestItemGroup,
  getQuestItemUrl,
} from "./questItemRegistry"

const questCollectionTitles = (
  questCollectionsData.collections as { id: string; title: string; items: { itemName: string }[] }[]
).map((collection) => collection.title)

const questCollectionByItem = new Map<string, string>()
for (const collection of questCollectionsData.collections as {
  title: string
  items: { itemName: string }[]
}[]) {
  for (const item of collection.items) {
    questCollectionByItem.set(item.itemName, collection.title)
  }
}

/** Collectible tab section titles in the same order as the Collectibles page. */
export function getCollectibleSectionTitles(): string[] {
  const placeholderTitles = (
    collectiblePlaceholdersData.placeholders as { title: string }[]
  ).map((entry) => entry.title)

  return [
    "Children of Moonlight",
    cobijadasData.title,
    goldenLumpsData.title,
    hiddenSymbolsData.title,
    sculptorToolsData.title,
    "Mark of Martyrdom",
    "Mark of the Embrujo",
    "Mark of the Preceptor",
    lacrimatorioData.title,
    lullabiesData.title,
    "Remembrances",
    offeringsData.title,
    sealedEnvelopesData.title,
    sleepingDaughtersData.title,
    ...questCollectionTitles,
    ...placeholderTitles,
  ].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
}

const collectibleSectionOrder = new Map(
  getCollectibleSectionTitles().map((title, index) => [title, index]),
)

function compareSectionTitles(a: string, b: string): number {
  const ai = collectibleSectionOrder.get(a)
  const bi = collectibleSectionOrder.get(b)
  if (ai !== undefined && bi !== undefined) return ai - bi
  if (ai !== undefined) return -1
  if (bi !== undefined) return 1
  return a.localeCompare(b, undefined, { sensitivity: "base" })
}

export function resolveQuestItemSectionTitle(source: string): string {
  const fromCollection = questCollectionByItem.get(source)
  if (fromCollection) return fromCollection

  const group = getQuestItemGroup(source)
  if (group === "Mark of Martyrdom") return "Mark of Martyrdom"
  if (group === "Mark of the Preceptor") return "Mark of the Preceptor"
  if (/lullaby/i.test(group)) return lullabiesData.title
  if (/sealed envelope|cursed letter/i.test(group)) return sealedEnvelopesData.title
  if (/lacrimatorio/i.test(group)) return lacrimatorioData.title
  if (
    /offering|piece of (rusted silver|cracked ceramic|old piece of gold)/i.test(
      group,
    )
  ) {
    return offeringsData.title
  }
  if (/remembrance of/i.test(group)) return "Remembrances"
  if (/sculptor|asterion/i.test(group)) return sculptorToolsData.title
  if (group === "Lump of Gold") return goldenLumpsData.title

  return group
}

export function areAllMartyrdomMarksSpent(save: ReadableSaveJson | null): boolean {
  const earned = getKillBarMarksEarned(save)
  return earned !== null && earned >= KILL_BAR_MAX
}

type HideRule =
  | { type: "rewardPresent"; completed: string; hide: string[] }
  | { type: "allInputsConsumed"; inputItems: string[] }

const HIDE_RULES: HideRule[] = [
  { type: "rewardPresent", completed: "QI107", hide: ["QI106"] },
  { type: "rewardPresent", completed: "QI108", hide: ["QI106", "QI107"] },
  {
    type: "rewardPresent",
    completed: "QI109",
    hide: ["QI106", "QI107", "QI108"],
  },
  {
    type: "rewardPresent",
    completed: "QI110",
    hide: ["QI106", "QI107", "QI108", "QI109"],
  },
  {
    type: "rewardPresent",
    completed: "QI111",
    hide: ["QI106", "QI107", "QI108", "QI109", "QI110"],
  },
  {
    type: "rewardPresent",
    completed: "QI62",
    hide: ["QI56", "QI57", "QI58", "QI59", "QI60", "QI61"],
  },
  { type: "rewardPresent", completed: "QI06", hide: ["QI05"] },
  { type: "rewardPresent", completed: "QI10", hide: ["QI07"] },
  { type: "rewardPresent", completed: "QI09", hide: ["QI08"] },
  { type: "rewardPresent", completed: "QI55", hide: ["QI54"] },
  { type: "rewardPresent", completed: "QI103", hide: ["QI101", "QI102"] },
  {
    type: "rewardPresent",
    completed: "QI27",
    hide: ["QI23", "QI24", "QI25", "QI26"],
  },
  { type: "rewardPresent", completed: "QI14", hide: ["QI13"] },
  { type: "rewardPresent", completed: "QI16", hide: ["QI15"] },
  { type: "rewardPresent", completed: "QI18", hide: ["QI17"] },
  { type: "rewardPresent", completed: "QI20", hide: ["QI19"] },
  { type: "rewardPresent", completed: "QI22", hide: ["QI21"] },
  { type: "rewardPresent", completed: "QI205", hide: ["QI204"] },
  { type: "rewardPresent", completed: "QI206", hide: ["QI204", "QI205"] },
  { type: "rewardPresent", completed: "QI208", hide: ["QI207"] },
  { type: "rewardPresent", completed: "QI209", hide: ["QI207", "QI208"] },
  { type: "rewardPresent", completed: "QI211", hide: ["QI210"] },
  { type: "rewardPresent", completed: "QI212", hide: ["QI210", "QI211"] },
]

export function getHiddenByCompletedQuestItems(
  questStatus: QuestItemStatus,
  acquiredPrayers: Set<string>,
  acquiredFigures: Set<string>,
): Set<string> {
  const { pickedUp } = questStatus
  const hidden = new Set<string>()

  if (acquiredPrayers.has("PR16")) {
    for (const src of ["QI23", "QI24", "QI25", "QI26", "QI27"]) hidden.add(src)
  }

  if (acquiredFigures.has("FG112")) {
    hidden.add("QI105")
  }

  for (const rule of HIDE_RULES) {
    if (rule.type === "rewardPresent") {
      if (pickedUp.has(rule.completed)) {
        for (const src of rule.hide) hidden.add(src)
      }
    } else if (rule.type === "allInputsConsumed") {
      const allAreMissing = rule.inputItems.every((item) => !pickedUp.has(item))
      if (allAreMissing) {
        for (const src of rule.inputItems) hidden.add(src)
      }
    }
  }

  return hidden
}

export function shouldShowQuestItem(
  source: string,
  options: {
    save: ReadableSaveJson | null
    questStatus: QuestItemStatus
    hiddenByCompleted: Set<string>
    showAll: boolean
  },
): boolean {
  const { save, questStatus, hiddenByCompleted, showAll } = options
  const acquisition = resolveQuestItemAcquisition(save, source, questStatus)

  if (acquisition === "handed-in") return false

  if (source === PROXIMO_RATTLE && shouldHideProximoRattle(save, questStatus)) {
    return false
  }

  if (
    resolveQuestItemSectionTitle(source) === "Mark of Martyrdom" &&
    areAllMartyrdomMarksSpent(save)
  ) {
    return false
  }

  if (
    resolveQuestItemSectionTitle(source) === "Mark of the Preceptor" &&
    areAllPreceptorMarksSpent(save)
  ) {
    return false
  }

  if (source === MEA_CULPA_HILT && hasMeaCulpaUnlocked(save)) {
    return false
  }

  if (showAll) return true
  return !hiddenByCompleted.has(source)
}

export interface OrderedQuestItem {
  source: string
  caption: string
  url: string | null
  acquisition: QuestItemAcquisition
}

function compareQuestItems(a: OrderedQuestItem, b: OrderedQuestItem): number {
  const sectionCompare = compareSectionTitles(
    resolveQuestItemSectionTitle(a.source),
    resolveQuestItemSectionTitle(b.source),
  )
  if (sectionCompare !== 0) return sectionCompare
  return a.caption.localeCompare(b.caption, undefined, { sensitivity: "base" })
}

export function buildOrderedQuestItems(
  save: ReadableSaveJson | null,
  questStatus: QuestItemStatus,
  hiddenByCompleted: Set<string>,
  showAll: boolean,
): OrderedQuestItem[] {
  const items: OrderedQuestItem[] = []

  for (const item of b2data.quest_item) {
    if (
      !shouldShowQuestItem(item.source, {
        save,
        questStatus,
        hiddenByCompleted,
        showAll,
      })
    ) {
      continue
    }

    items.push({
      source: item.source,
      caption: getQuestItemCaption(item.source),
      url: getQuestItemUrl(item.source),
      acquisition: resolveQuestItemAcquisition(save, item.source, questStatus),
    })
  }

  return items.sort(compareQuestItems)
}
