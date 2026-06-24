import bossesData from "../data/bosses.json"
import bossesDisplay from "../data/bosses-display.json"
import { useSave } from "./SaveContext"
import { TabContext } from "../App"
import { useContext, useMemo, type ReactNode } from "react"

function useTab() {
  const tab = useContext(TabContext)
  return tab
}

const displayNameOverrides = bossesDisplay.displayNames as Record<string, string>
const bossUrls = bossesDisplay.urls as Record<string, string>
const sectionLabels = bossesDisplay.sectionLabels as string[]
const sections = bossesDisplay.sections as string[][]

const bossNameByCode = new Map(
  bossesData.map((boss) => [boss.code, boss.name] as const),
)

const spriteBase = `${import.meta.env.BASE_URL}sprites/bosses/`

function BossCell({
  code,
  caption,
  url,
}: {
  code: string
  caption: string
  url: string | null
}) {
  return (
    <div className="collectible-cell boss-cell" title={caption}>
      <img
        className="boss-sprite"
        src={`${spriteBase}${code}.jpg`}
        alt=""
        aria-hidden="true"
      />
      <span className="boss-cell-label">{caption}</span>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <i className="fa-solid fa-link" />
        </a>
      ) : null}
    </div>
  )
}

export default function Bosses() {
  const { save } = useSave()
  const tab = useTab()

  const defeatedByCode = useMemo(() => {
    const map = new Map<string, boolean>()
    const bossKillStatus = save?.player?.bossKillStatus as
      | { bosses?: { code: string; defeated: boolean }[] }
      | undefined

    for (const boss of bossKillStatus?.bosses ?? []) {
      map.set(boss.code, boss.defeated)
    }
    return map
  }, [save])

  const displayedCodes = sections.flat()
  const defeatedCount = displayedCodes.filter(
    (code) => defeatedByCode.get(code) === true,
  ).length

  return (
    <section className="bosses">
      {tab === "all" && <h2>Bosses</h2>}

      <div className="collectible-grid">
        {sections.flatMap((section, sectionIndex) => {
          const items: ReactNode[] = []
          if (sectionIndex > 0) {
            items.push(
              <hr
                key={`divider-${sectionIndex}`}
                className="collectible-grid-divider"
                aria-hidden="true"
              />,
            )
          }
          items.push(
            <p
              key={`label-${sectionIndex}`}
              className="collectible-grid-section-label"
            >
              {sectionLabels[sectionIndex] ?? `Section ${sectionIndex + 1}`}
            </p>,
          )
          for (const code of section) {
            items.push(
              <BossCell
                key={code}
                code={code}
                caption={
                  displayNameOverrides[code] ?? bossNameByCode.get(code) ?? code
                }
                url={bossUrls[code] ?? null}
              />,
            )
          }
          return items
        })}
      </div>

      {save?.player?.bossKillStatus ? (
        <p className="boss-summary">
          {defeatedCount} / {displayedCodes.length} defeated
        </p>
      ) : null}
    </section>
  )
}
