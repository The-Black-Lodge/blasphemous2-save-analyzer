import { Fragment } from "react"
import type { ItemRef } from "../utils/catalogs"
import {
  ARSENAL_LAYOUT,
  ARSENAL_WEAPONS,
  getEquippedArsenalWeapons,
  isArsenalWeaponUnlocked,
  type ArsenalWeaponKey,
} from "../utils/arsenalWeapons"

interface ArsenalOfPenitenceProps {
  weaponSlots?: ItemRef[]
  unlockedWeapons?: ItemRef[]
}

function ArsenalWeaponSlot({
  weaponKey,
  unlocked,
  equipped,
}: {
  weaponKey: ArsenalWeaponKey
  unlocked: boolean
  equipped: boolean
}) {
  const weapon = ARSENAL_WEAPONS[weaponKey]

  return (
    <div
      className={`arsenal-weapon-slot${unlocked ? "" : " arsenal-weapon-slot--locked"}${equipped ? " arsenal-weapon-slot--equipped" : ""}`}
      title={weapon.displayName}
    >
      <div className="arsenal-weapon-icon-slot">
        <span
          className={`wm-sprite wm-sprite--${weapon.sprite}`}
          aria-hidden="true"
        />
      </div>
      <span className="arsenal-weapon-label">{weapon.displayName}</span>
    </div>
  )
}

export default function ArsenalOfPenitence({
  weaponSlots,
  unlockedWeapons,
}: ArsenalOfPenitenceProps) {
  const equipped = getEquippedArsenalWeapons(weaponSlots)

  return (
    <div className="arsenal-of-penitence">
      {ARSENAL_LAYOUT.map((column, columnIndex) => (
        <div
          key={`arsenal-group-${columnIndex}`}
          className={`arsenal-group${column.length === 1 ? " arsenal-group--single" : ""}`}
        >
          {column.map((weaponKey, weaponIndex) => (
            <Fragment key={weaponKey}>
              {weaponIndex > 0 ? (
                <hr className="arsenal-group-divider" aria-hidden="true" />
              ) : null}
              <ArsenalWeaponSlot
                weaponKey={weaponKey}
                unlocked={isArsenalWeaponUnlocked(unlockedWeapons, weaponKey)}
                equipped={equipped.has(weaponKey)}
              />
            </Fragment>
          ))}
        </div>
      ))}
    </div>
  )
}
