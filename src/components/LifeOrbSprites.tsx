export default function LifeOrbSprites({ count }: { count: number }) {
  if (count <= 0) return <>0</>

  return (
    <span className="life-orb-display" aria-label={`${count} life orbs`}>
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className="hud-sprite hud-sprite--life-orb-full"
          aria-hidden="true"
        />
      ))}
    </span>
  )
}
