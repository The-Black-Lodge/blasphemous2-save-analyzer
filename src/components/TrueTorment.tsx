import trueTormentData from "../data/true-torment.json"

interface TormentEntry {
  id: string
  challengeId: number
  name: string
  description: string
}

interface TrueTormentData {
  title: string
  domineLabel?: string
  torments: TormentEntry[]
}

interface TrueTormentProps {
  enabled: boolean
  activeChallengeIds: ReadonlySet<number>
}

const { domineLabel = "Domines", torments } =
  trueTormentData as TrueTormentData

export default function TrueTorment({
  enabled,
  activeChallengeIds,
}: TrueTormentProps) {
  if (!enabled) {
    return (
      <>
        <span
          className="hud-sprite hud-sprite--menu-arrow-sm float-left"
          aria-hidden="true"
        />
        <p className="leading-icon-sm">Not enabled</p>
      </>
    )
  }

  const activeCount = torments.filter((torment) =>
    activeChallengeIds.has(torment.challengeId),
  ).length

  return (
    <>
      <p className="true-torment-count">
        {activeCount}/{torments.length} {domineLabel}
      </p>
      <div className="relic-cards">
      {torments.map((torment) => {
        const selected = activeChallengeIds.has(torment.challengeId)
        return (
          <div
            key={torment.id}
            className={`relic-card${selected ? " relic-card--acquired" : ""}`}
          >
            <h4 className="relic-card-name">{torment.name}</h4>
            <p className="relic-card-description">{torment.description}</p>
          </div>
        )
      })}
      </div>
    </>
  )
}
