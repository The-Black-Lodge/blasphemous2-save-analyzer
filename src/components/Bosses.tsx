import bossesData from "../data/bosses.json"
import { useSave } from "./SaveContext"
import { TabContext } from "../App"
import { useContext } from "react"

function useTab() {
  const tab = useContext(TabContext)
  return tab
}

interface BossEntry {
  id: number
  code: string
  name: string
  defeated: boolean
}

export default function Bosses() {
  const { save } = useSave()
  const tab = useTab()

  const bossList: BossEntry[] = []
  const bossKillStatus = save?.player?.bossKillStatus as
    | { bosses?: BossEntry[]; bossesDefeated?: number }
    | undefined

  if (bossKillStatus?.bosses) {
    bossList.push(...bossKillStatus.bosses)
  } else {
    for (const boss of bossesData) {
      bossList.push({ id: boss.id, code: boss.code, name: boss.name, defeated: false })
    }
  }

  return (
    <section className="bosses">
      {tab === "all" && <h2>Bosses</h2>}

      <ul>
        {bossList.map((boss) => (
          <li
            key={boss.id}
            className={boss.defeated ? "boss-defeated" : "boss-undead"}
          >
            {boss.defeated ? "✓" : "○"} {boss.name}{" "}
            <span className="boss-code">[{boss.code}]</span>
          </li>
        ))}
      </ul>

      {bossKillStatus?.bossesDefeated !== undefined &&
        bossKillStatus.bosses !== undefined && (
        <p className="boss-summary">
          {bossKillStatus.bossesDefeated} / {bossKillStatus.bosses.length}{" "}
          defeated
        </p>
      )}
    </section>
  )
}
