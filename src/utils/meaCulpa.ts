import type { ReadableSaveJson } from "./saveParser"

export const MEA_CULPA_WEAPON_ID = -1038464864
export const MEA_CULPA_HILT = "QI104"

function isMeaCulpaWeapon(entry: { id?: number; name?: string } | undefined): boolean {
  return entry?.id === MEA_CULPA_WEAPON_ID || entry?.name === "Mea Culpa"
}

export function hasMeaCulpaUnlocked(save: ReadableSaveJson | null): boolean {
  const equipment = save?.player?.equipment as
    | {
        currentWeapon?: { id?: number; name?: string }
        unlockedWeapons?: Array<{ id?: number; name?: string }>
      }
    | undefined

  if (!equipment) return false
  if (isMeaCulpaWeapon(equipment.currentWeapon)) return true
  return equipment.unlockedWeapons?.some(isMeaCulpaWeapon) ?? false
}
