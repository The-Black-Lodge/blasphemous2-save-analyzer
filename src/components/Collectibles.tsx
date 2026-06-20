import { useContext } from "react"
import CollectibleChildren from "./CollectibleChildren"
import { TabContext } from "../App"

function useTab() {
  const tab = useContext(TabContext)
  return tab
}

export default function Collectibles() {
  const tab = useTab()
  return (
    <section className="collectibles">
      {tab === "all" && <h2>Collectibles</h2>}
      <CollectibleChildren />
    </section>
  )
}
