import { useContext } from "react"
import { useSave } from "./SaveContext"
import { TabContext } from "../App"

function useTab() {
  const tab = useContext(TabContext)
  return tab
}
import { findStat } from "../utils/playerDecoders"
import {
  formatHashKey,
  resolveIdLabel,
  type ItemRef,
} from "../utils/catalogs"

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

function formatItem(item: ItemRef | undefined): string {
  if (!item) return "—"
  return item.displayName ?? item.caption ?? item.name ?? item.idHex
}

function formatPlayTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

function StatList({
  title,
  items,
}: {
  title: string
  items: StatEntry[]
}) {
  if (items.length === 0) return null
  return (
    <>
      <h4>{title}</h4>
      <ul>
        {items.map((entry) => (
          <li key={`${entry.statHex}-${entry.value}`}>
            {entry.statName ?? resolveIdLabel(entry.statHex)}: {entry.value}
            {entry.upgrades !== undefined ? ` (upgrades: ${entry.upgrades})` : ""}
          </li>
        ))}
      </ul>
    </>
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
  const spawn = player.spawn as
    | {
        spawnRoom?: number
        spawnEntryId?: number
        spawnType?: number
        prieuDieuRoom?: number
        prieuDieuId?: number
      }
    | undefined
  const equipment = player.equipment as
    | {
        currentWeapon?: ItemRef
        currentArmor?: ItemRef
        weaponSlots?: ItemRef[]
        unlockedWeapons?: ItemRef[]
      }
    | undefined
  const stats = player.stats as
    | {
        ranges?: StatEntry[]
        values?: StatEntry[]
        modifiables?: StatEntry[]
        knowValues?: number[]
        notNewValues?: number[]
      }
    | undefined
  const abilities = player.abilities as
    | { abilities?: AbilityEntry[] }
    | undefined
  const guilt = player.guilt as { dropCount?: number } | undefined
  const abilityLock = player.abilityLock as
    | { showedAbilities?: number[] }
    | undefined
  const weaponMemory = player.weaponMemory as
    | {
        unlockedWeaponMemories?: number[]
        unlockedWeaponMemoryHex?: string[]
        weaponTiers?: Record<string, number>
      }
    | undefined

  const health = findStat(stats, ["Health"])
  const fervour = findStat(stats, ["Fervour"])
  const guiltStat = findStat(stats, ["Guilt"])
  const flasks = findStat(stats, ["Flask"])
  const orbExperience = findStat(stats, ["Orb Experience"])
  const tears = findStat(stats, ["Tears"])

  return (
    <section className="player">
      {tab === "all" && <h2>The Penitent One</h2>}

      {saveMeta && (
        <>
          <h3>Save</h3>
          <ul>
            {saveMeta.PlayedTime !== undefined && (
              <li>Play time: {formatPlayTime(saveMeta.PlayedTime)}</li>
            )}
            {saveMeta.LastPlayed && (
              <li>Last played: {new Date(saveMeta.LastPlayed).toLocaleString()}</li>
            )}
          </ul>
        </>
      )}

      {completion?.completion !== undefined && (
        <>
          <h3>Completion</h3>
          <p>Map completion: {completion.completion}%</p>
        </>
      )}

      {spawn && (
        <>
          <h3>Spawn</h3>
          <ul>
            <li>Spawn room: {spawn.spawnRoom}</li>
            <li>Spawn entry: {spawn.spawnEntryId}</li>
            <li>Spawn type: {spawn.spawnType}</li>
            <li>Prie-Dieu room: {spawn.prieuDieuRoom}</li>
            <li>Prie-Dieu id: {spawn.prieuDieuId}</li>
          </ul>
        </>
      )}

      {equipment && (
        <>
          <h3>Equipment</h3>
          <ul>
            <li>Current weapon: {formatItem(equipment.currentWeapon)}</li>
            <li>Current armor: {formatItem(equipment.currentArmor)}</li>
          </ul>
          {equipment.weaponSlots && equipment.weaponSlots.length > 0 && (
            <>
              <h4>Weapon slots</h4>
              <ul>
                {equipment.weaponSlots.map((weapon, index) => (
                  <li key={`slot-${index}`}>
                    Slot {index + 1}: {formatItem(weapon)}
                  </li>
                ))}
              </ul>
            </>
          )}
          {equipment.unlockedWeapons &&
            equipment.unlockedWeapons.length > 0 && (
              <>
                <h4>Arsenal of Penitence</h4>
                <ul>
                  {equipment.unlockedWeapons.map((weapon) => (
                    <li key={weapon.idHex}>{formatItem(weapon)}</li>
                  ))}
                </ul>
              </>
            )}
        </>
      )}

      {stats && (
        <>
          <h3>Stats</h3>
          {(health ||
            fervour ||
            guiltStat ||
            flasks ||
            orbExperience ||
            tears) && (
            <>
              <h4>Highlights</h4>
              <ul>
                {health && (
                  <li>
                    Health: {health.value}
                    {"upgrades" in health && health.upgrades !== undefined
                      ? ` / ${health.upgrades}`
                      : ""}
                  </li>
                )}
                {fervour && (
                  <li>
                    Fervour: {fervour.value}
                    {"upgrades" in fervour && fervour.upgrades !== undefined
                      ? ` / ${fervour.upgrades}`
                      : ""}
                  </li>
                )}
                {guiltStat && <li>Guilt: {guiltStat.value}</li>}
                {flasks && <li>Flasks: {flasks.value}</li>}
                {orbExperience && (
                  <li>Orb experience: {orbExperience.value}</li>
                )}
                {tears && <li>Tears: {tears.value}</li>}
              </ul>
            </>
          )}
          <StatList title="Ranges" items={stats.ranges ?? []} />
          <StatList title="Values" items={stats.values ?? []} />
          <StatList title="Modifiables" items={stats.modifiables ?? []} />
          {stats.knowValues && stats.knowValues.length > 0 && (
            <>
              <h4>Known values</h4>
              <p>{stats.knowValues.join(", ")}</p>
            </>
          )}
          {stats.notNewValues && stats.notNewValues.length > 0 && (
            <>
              <h4>Not-new values</h4>
              <p>{stats.notNewValues.join(", ")}</p>
            </>
          )}
        </>
      )}

      {abilities?.abilities && abilities.abilities.length > 0 && (
        <>
          <h3>Abilities / Relics</h3>
          <ul>
            {abilities.abilities.map((ability) => (
              <li key={ability.hashHex}>
                {resolveIdLabel(ability.hashHex)}
                {ability.active ? " (active)" : " (inactive)"}
              </li>
            ))}
          </ul>
        </>
      )}

      {guilt?.dropCount !== undefined && (
        <>
          <h3>Guilt drops on map</h3>
          <p>{guilt.dropCount} drop(s)</p>
        </>
      )}

      {abilityLock?.showedAbilities &&
        abilityLock.showedAbilities.length > 0 && (
          <>
            <h3>Shown ability unlocks</h3>
            <p>
              {abilityLock.showedAbilities
                .map((id) => resolveIdLabel(formatHashKey(id)))
                .join(", ")}
            </p>
          </>
        )}

      {weaponMemory && (
        <>
          <h3>Weapon memories</h3>
          {weaponMemory.unlockedWeaponMemoryHex &&
            weaponMemory.unlockedWeaponMemoryHex.length > 0 && (
              <>
                <h4>Unlocked</h4>
                <ul>
                  {weaponMemory.unlockedWeaponMemoryHex.map((id) => (
                    <li key={id}>{resolveIdLabel(id)}</li>
                  ))}
                </ul>
              </>
            )}
          {weaponMemory.weaponTiers &&
            Object.keys(weaponMemory.weaponTiers).length > 0 && (
              <>
                <h4>Tiers</h4>
                <ul>
                  {Object.entries(weaponMemory.weaponTiers).map(
                    ([weaponId, tier]) => (
                      <li key={weaponId}>
                        {resolveIdLabel(weaponId)}: tier {tier}
                      </li>
                    ),
                  )}
                </ul>
              </>
            )}
        </>
      )}
    </section>
  )
}
