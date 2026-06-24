import type { ItemRef } from "./catalogs"

export type ArsenalWeaponKey = "censer" | "whip" | "rapier" | "sword" | "meaculpa"

export interface ArsenalWeapon {
  key: ArsenalWeaponKey
  sprite: ArsenalWeaponKey | "sword"
  displayName: string
  itemNames: string[]
  idHex: string
}

export const ARSENAL_WEAPONS: Record<ArsenalWeaponKey, ArsenalWeapon> = {
  censer: {
    key: "censer",
    sprite: "censer",
    displayName: "Veredicto",
    itemNames: ["Censer"],
    idHex: "0xB6F1D0F2",
  },
  whip: {
    key: "whip",
    sprite: "whip",
    displayName: "Embrujo",
    itemNames: ["Whip"],
    idHex: "0x6DEF09CC",
  },
  rapier: {
    key: "rapier",
    sprite: "rapier",
    displayName: "Sarmiento & Centella",
    itemNames: ["Rapier"],
    idHex: "0x2DA0293D",
  },
  sword: {
    key: "sword",
    sprite: "sword",
    displayName: "Ruego Al Alba",
    itemNames: ["Rosary Blade"],
    idHex: "0x34D64E22",
  },
  meaculpa: {
    key: "meaculpa",
    sprite: "meaculpa",
    displayName: "Mea Culpa",
    itemNames: ["Mea Culpa"],
    idHex: "0xC21A48A0",
  },
}

export const ARSENAL_LAYOUT: ArsenalWeaponKey[][] = [
  ["censer", "whip"],
  ["rapier"],
  ["sword", "meaculpa"],
]

const NO_WEAPON_ID_HEX = "0x2981FE0F"

export function isNoWeapon(ref: ItemRef | undefined): boolean {
  if (!ref) return true
  return ref.idHex === NO_WEAPON_ID_HEX || ref.name === "No Weapon"
}

export function matchesArsenalWeapon(
  ref: ItemRef | undefined,
  key: ArsenalWeaponKey,
): boolean {
  if (!ref || isNoWeapon(ref)) return false
  const weapon = ARSENAL_WEAPONS[key]
  return (
    ref.idHex === weapon.idHex ||
    (ref.name !== undefined && weapon.itemNames.includes(ref.name))
  )
}

export function getEquippedArsenalWeapons(
  weaponSlots: ItemRef[] | undefined,
): Set<ArsenalWeaponKey> {
  const equipped = new Set<ArsenalWeaponKey>()
  for (const slot of weaponSlots ?? []) {
    for (const key of Object.keys(ARSENAL_WEAPONS) as ArsenalWeaponKey[]) {
      if (matchesArsenalWeapon(slot, key)) {
        equipped.add(key)
      }
    }
  }
  return equipped
}

export function isArsenalWeaponUnlocked(
  unlockedWeapons: ItemRef[] | undefined,
  key: ArsenalWeaponKey,
): boolean {
  return unlockedWeapons?.some((weapon) => matchesArsenalWeapon(weapon, key)) ?? false
}
