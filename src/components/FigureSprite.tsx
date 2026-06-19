import { useState } from "react"
import {
  getFigureSpriteClassName,
  hasBurnSprite,
  resolveFigureSpriteVariant,
  type FigureSpriteVariant,
} from "../utils/figureSprites"

export function FigureSprite({
  source,
  acquired,
  burnt = false,
  variant,
}: {
  source: string
  acquired: Set<string>
  burnt?: boolean
  variant?: FigureSpriteVariant
}) {
  const [hovered, setHovered] = useState(false)
  const showBurn = burnt && hasBurnSprite(source) && !hovered
  const effectiveVariant = showBurn
    ? "burn"
    : (variant ?? resolveFigureSpriteVariant(source, acquired))
  const className = getFigureSpriteClassName(source, acquired, effectiveVariant)
  if (!className) return null

  return (
    <span
      className={className}
      aria-hidden="true"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    />
  )
}
