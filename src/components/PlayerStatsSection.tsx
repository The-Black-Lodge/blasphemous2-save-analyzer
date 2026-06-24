import type { ReactNode } from "react"
import { useAppNavigation } from "../App"
import type { ReadableSaveJson } from "../utils/saveParser"
import {
  CHALICE_ITEMS,
  countCollectedQuestItems,
  FERVENT_KISS_ITEMS,
  RECEPTACLE_ITEMS,
  SHARD_ITEMS,
} from "../utils/inventoryQuests"
import {
  formatGoldenFlaskProgress,
  getGoldenFlaskProgress,
} from "../utils/lacrimatorio"

interface StatEntry {
  statName: string | null
  value: number
  upgrades?: number
}

interface PlayerStatsSectionProps {
  save: ReadableSaveJson
  healthRange?: StatEntry
  flaskRange?: StatEntry
  healingFlaskFactor?: StatEntry
  goldFlaskActive: boolean
  fervour?: StatEntry
  guiltValue?: number
  guiltDropsInWorld?: number
  tears?: StatEntry
}

function StatLine({ children }: { children: ReactNode }) {
  return (
    <>
      <span
        className="hud-sprite hud-sprite--menu-arrow-sm float-left"
        aria-hidden="true"
      />
      <p className="leading-icon-sm">{children}</p>
    </>
  )
}

function CollectibleLink({
  collectionKey,
  label,
}: {
  collectionKey: string
  label: string
}) {
  const { scrollToCollectible } = useAppNavigation()

  return (
    <button
      type="button"
      className="rosary-collectible-link"
      onClick={() => scrollToCollectible(collectionKey)}
    >
      {label}
    </button>
  )
}

export default function PlayerStatsSection({
  save,
  healthRange,
  flaskRange,
  healingFlaskFactor,
  goldFlaskActive,
  fervour,
  guiltValue,
  guiltDropsInWorld,
  tears,
}: PlayerStatsSectionProps) {
  const chaliceCount = countCollectedQuestItems(save, CHALICE_ITEMS)
  const receptacleCount = countCollectedQuestItems(save, RECEPTACLE_ITEMS)
  const shardCount = countCollectedQuestItems(save, SHARD_ITEMS)
  const ferventKissCount = countCollectedQuestItems(save, FERVENT_KISS_ITEMS)
  const goldenFlaskProgress = getGoldenFlaskProgress(save, goldFlaskActive)

  return (
    <div className="player-panel-section">
      {healthRange && (
        <StatLine>
          Health: {healthRange.value} → {chaliceCount}/{CHALICE_ITEMS.length}{" "}
          <CollectibleLink
            collectionKey="ornate-chalice"
            label="Ornate Chalices"
          />
        </StatLine>
      )}
      {flaskRange && (
        <StatLine>
          Flask: {flaskRange.value} → {receptacleCount}/{RECEPTACLE_ITEMS.length}{" "}
          <CollectibleLink
            collectionKey="empty-receptacle"
            label="Empty Receptacles"
          />
        </StatLine>
      )}
      {healingFlaskFactor && (
        <StatLine>
          Flask Strength: {healingFlaskFactor.value} → {shardCount}/
          {SHARD_ITEMS.length}{" "}
          <CollectibleLink
            collectionKey="silver-clad-shard"
            label="Silver-Clad Crystal Shards"
          />
        </StatLine>
      )}
      <StatLine>
        Golden Flask: {formatGoldenFlaskProgress(goldenFlaskProgress)} →{" "}
        <CollectibleLink
          collectionKey="lacrimatorio"
          label="Imperfectus Lacrimatorio"
        />
      </StatLine>
      {fervour && (
        <StatLine>
          Fervour: {fervour.value} → {ferventKissCount}/{FERVENT_KISS_ITEMS.length}{" "}
          <CollectibleLink collectionKey="fervent-kiss" label="Fervent Kisses" />
        </StatLine>
      )}
      {guiltValue !== undefined && (
        <StatLine>
          Guilt: {guiltValue}
          {guiltDropsInWorld !== undefined
            ? ` (${guiltDropsInWorld} drops in the world)`
            : ""}
        </StatLine>
      )}
      {tears && <StatLine>Tears of Atonement: {tears.value}</StatLine>}
    </div>
  )
}
