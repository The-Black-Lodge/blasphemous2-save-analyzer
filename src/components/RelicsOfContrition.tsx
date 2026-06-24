interface RelicEntry {
  id: number
  hash: string
  name: string
  description?: string
  url?: string
  ability?: {
    active: boolean
  } | null
}

export default function RelicsOfContrition({ relics }: { relics: RelicEntry[] }) {
  if (relics.length === 0) return null

  return (
    <div className="relic-cards">
      {relics.map((relic) => (
        <div
          key={relic.hash}
          className={`relic-card${relic.ability ? " relic-card--acquired" : ""}`}
        >
          <h4 className="relic-card-name">{relic.name}</h4>
          {relic.description ? (
            <p className="relic-card-description">{relic.description}</p>
          ) : null}
          {relic.url ? (
            <a
              className="relic-card-link"
              href={relic.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Map link for ${relic.name}`}
            >
              <i className="fa-solid fa-link" />
            </a>
          ) : null}
        </div>
      ))}
    </div>
  )
}
