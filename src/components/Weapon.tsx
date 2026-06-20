import { useContext } from "react"
import { useSave } from "./SaveContext"
import { TabContext } from "../App"
import { resolveIdLabel } from "../utils/catalogs"

function useTab() {
  const tab = useContext(TabContext)
  return tab
}

export default function Weapon() {
  const { save } = useSave()
  const tab = useTab()
  const player = save?.player as Record<string, unknown> | undefined
  const weaponMemory = player?.weaponMemory as
    | {
        unlockedWeaponMemories?: number[]
        unlockedWeaponMemoryHex?: string[]
        weaponTiers?: Record<string, number>
      }
    | undefined

  return (
    <section className="weapon">
      {tab === "all" && <h2>Weapon Memories</h2>}

      {weaponMemory && (
        <>
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
