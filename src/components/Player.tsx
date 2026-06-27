import { Fragment, useContext, type ReactNode } from "react"
import { TabContext } from "../App"
import relicsData from "../data/relics.json"
import { findStat } from "../utils/playerDecoders"
import { formatHashKey, resolveIdLabel, type ItemRef } from "../utils/catalogs"
import type { ReadableSaveJson } from "../utils/saveParser"
import { useSave } from "./SaveContext"
import {
  CH03_CHALLENGE_ID,
  getTrueTormentState,
  isChallengeActive,
} from "../utils/trueTorment"
import ArsenalOfPenitence from "./ArsenalOfPenitence"
import PlayerStatsSection from "./PlayerStatsSection"
import RelicsOfContrition from "./RelicsOfContrition"
import TrueTorment from "./TrueTorment"
import trueTormentData from "../data/true-torment.json"

function useTab() {
  const tab = useContext(TabContext)
  return tab
}

interface StatEntry {
  stat: number
  statHex: string
  statName: string | null
  value: number
  upgrades?: number
}

interface AbilityEntry {
  hashHex: string
  name: string | null
  displayName: string | null
  active: boolean
}

function formatPlayTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

function PlayerPanel({ sections }: { sections: ReactNode[] }) {
  if (sections.length === 0) return null

  return (
    <div className="player-panel">
      {sections.map((section, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <hr className="player-panel-divider" aria-hidden="true" />
          ) : null}
          {section}
        </Fragment>
      ))}
    </div>
  )
}

export default function Player() {
  const { save } = useSave()
  const tab = useTab()
  const player = save?.player as Record<string, unknown> | undefined

  if (!player) {
    return (
      <section className="player">
        <h2>The Penitent One</h2>
        <p>No save loaded.</p>
      </section>
    )
  }

  const saveMeta = player.saveMeta as
    | { PlayedTime?: number; LastPlayed?: string }
    | undefined
  const completion = player.completion as { completion?: number } | undefined
  const equipment = player.equipment as
    | {
        weaponSlots?: ItemRef[]
        unlockedWeapons?: ItemRef[]
      }
    | undefined
  const stats = player.stats as
    | {
        ranges?: StatEntry[]
        modifiables?: StatEntry[]
      }
    | undefined
  const abilities = player.abilities as
    | { abilities?: AbilityEntry[] }
    | undefined
  const guilt = player.guilt as { dropCount?: number } | undefined
  const abilityLock = player.abilityLock as
    | { showedAbilities?: number[] }
    | undefined

  const fervour = findStat(stats, ["Fervour"])
  const guiltStat = findStat(stats, ["Guilt"])
  const tears = findStat(stats, ["Tears"])

  const flaskRange = stats?.ranges?.find((s) => s.statName === "Flask")
  const healthRange = stats?.ranges?.find((s) => s.statName === "Health")
  const healingFlaskFactor = stats?.modifiables?.find(
    (s) => s.statName === "Healing Flasks Factor",
  )
  const goldFlaskAbility = abilities?.abilities?.find(
    (a) => a.hashHex === formatHashKey(0x84734265),
  )
  const goldFlaskActive = !!goldFlaskAbility?.active

  const hasOverview =
    saveMeta?.PlayedTime !== undefined ||
    !!saveMeta?.LastPlayed ||
    completion?.completion !== undefined

  const relicEntries = relicsData.map((r) => ({
    ...r,
    ability: abilities?.abilities?.find((a) => a.hashHex === r.hash),
  }))

  const hasEquipment = !!equipment
  const trueTormentState = getTrueTormentState(save as ReadableSaveJson)
  const spilledBloodActive = isChallengeActive(
    trueTormentState,
    CH03_CHALLENGE_ID,
  )

  const hasAbilityUnlocks =
    (abilityLock?.showedAbilities?.length ?? 0) > 0

  const sections: ReactNode[] = []

  if (hasOverview) {
    sections.push(
      <div key="overview" className="player-panel-section">
        {saveMeta?.PlayedTime !== undefined && (
          <>
            <span
              className="hud-sprite hud-sprite--menu-arrow-sm float-left"
              aria-hidden="true"
            />
            <p className="leading-icon-sm">
              Play time: {formatPlayTime(saveMeta.PlayedTime)}
            </p>
          </>
        )}
        {saveMeta?.LastPlayed && (
          <>
            <span
              className="hud-sprite hud-sprite--menu-arrow-sm float-left"
              aria-hidden="true"
            />
            <p className="leading-icon-sm">
              Last played: {new Date(saveMeta.LastPlayed).toLocaleString()}
            </p>
          </>
        )}
        {completion?.completion !== undefined && (
          <>
            <span
              className="hud-sprite hud-sprite--menu-arrow-sm float-left"
              aria-hidden="true"
            />
            <p className="leading-icon-sm">
              Map completion: {completion.completion}%
            </p>
          </>
        )}
      </div>,
    )
  }

  sections.push(
    <PlayerStatsSection
      key="stats"
      save={save as ReadableSaveJson}
      healthRange={healthRange}
      flaskRange={flaskRange}
      healingFlaskFactor={healingFlaskFactor}
      goldFlaskActive={goldFlaskActive}
      spilledBloodActive={spilledBloodActive}
      fervour={fervour ?? undefined}
      guiltValue={guiltStat?.value}
      guiltDropsInWorld={guilt?.dropCount}
      tears={tears ?? undefined}
    />,
  )

  if (relicEntries.length > 0) {
    sections.push(
      <div key="relics" className="player-panel-section">
        <h3>Relics of Contrition</h3>
        <RelicsOfContrition relics={relicEntries} />
      </div>,
    )
  }

  if (hasEquipment) {
    sections.push(
      <div key="equipment" className="player-panel-section">
        <h3>Equipment</h3>
        <ArsenalOfPenitence
          weaponSlots={equipment?.weaponSlots}
          unlockedWeapons={equipment?.unlockedWeapons}
        />
      </div>,
    )
  }

  if (trueTormentState) {
    sections.push(
      <div key="true-torment" className="player-panel-section">
        <h3>{trueTormentData.title}</h3>
        <TrueTorment
          enabled={trueTormentState.enabled}
          activeChallengeIds={trueTormentState.activeChallengeIds}
        />
      </div>,
    )
  }

  if (hasAbilityUnlocks) {
    sections.push(
      <div key="ability-unlocks" className="player-panel-section">
        <h3>Shown ability unlocks</h3>
        <p>
          {abilityLock!.showedAbilities!
            .map((id) => resolveIdLabel(formatHashKey(id)))
            .join(", ")}
        </p>
      </div>,
    )
  }

  return (
    <section className="player">
      {tab === "all" && <h2>The Penitent One</h2>}
      <PlayerPanel sections={sections} />
    </section>
  )
}
