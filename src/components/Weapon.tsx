import { useContext } from "react"
import { TabContext } from "../App"

function useTab() {
  const tab = useContext(TabContext)
  return tab
}

export default function Weapon() {
  const tab = useTab()
  return (
    <section className="weapon">
      {tab === "all" && <h2>Weapon Memories</h2>}
    </section>
  )
}
