import { useState } from "react"
import Altar from "./components/Altar"
import Prayer from "./components/Prayer"
import Rosary from "./components/Rosary"
import SaveProvider from "./components/SaveProvider"

type Tab = "all" | "rosary" | "prayers" | "altar"

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "Show All" },
  { id: "rosary", label: "Rosary Beads" },
  { id: "prayers", label: "Prayers" },
  { id: "altar", label: "Altarpiece of Favours" },
]

function AppContent() {
  const [tab, setTab] = useState<Tab>("all")

  const showRosary = tab === "all" || tab === "rosary"
  const showPrayers = tab === "all" || tab === "prayers"
  const showAltar = tab === "all" || tab === "altar"

  return (
    <>
      <nav className="app-tabs" aria-label="Inventory sections">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className="app-tab"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <main className="app-content">
        {showRosary ? <Rosary /> : null}
        {showPrayers ? <Prayer /> : null}
        {showAltar ? <Altar /> : null}
      </main>
    </>
  )
}

function App() {
  return (
    <SaveProvider>
      <AppContent />
    </SaveProvider>
  )
}

export default App
