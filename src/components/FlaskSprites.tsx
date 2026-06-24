export default function FlaskSprites({
  count,
  factor,
  goldActive,
}: {
  count: number
  factor: number
  goldActive: boolean
}) {
  if (count <= 0) return null

  const spriteKey = (index: number) => {
    const isGold = goldActive && index === count - 1
    const suffix = isGold ? "golden" : ""
    return `flask${suffix ? "-" + suffix : ""}-${factor}-full`
  }

  return (
    <span className="flask-display">
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className={`hud-sprite hud-sprite--${spriteKey(index)}`}
          style={{ marginRight: "24px" }}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}
