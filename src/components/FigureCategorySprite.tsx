import type { FigureKind } from "../utils/figureKinds"

export function FigureCategorySprite({ kind }: { kind: FigureKind }) {
  return (
    <span className="altar-category-icon-slot" aria-hidden="true">
      <span className={`fg-cat-sprite fg-cat-sprite--${kind}`} />
    </span>
  )
}
