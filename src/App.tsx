import { createContext, useState } from "react"
import type { ComponentType } from "react"
import Altar from "./components/Altar"
import Bosses from "./components/Bosses"
import Player from "./components/Player"
import Prayer from "./components/Prayer"
import Quest from "./components/Quest"
import Rosary from "./components/Rosary"
import SaveProvider from "./components/SaveProvider"
import Weapon from "./components/Weapon"
import Collectibles from "./components/Collectibles"

type SectionTab =
  | "bosses"
  | "player"
  | "rosary"
  | "quest"
  | "prayers"
  | "altar"
  | "weapon"
  | "collectibles"
type Tab = "all" | SectionTab

const TabContext = createContext<Tab>("all")

const SECTIONS: { id: SectionTab; label: string; Component: ComponentType }[] =
  [
    { id: "player", label: "The Penitent One", Component: Player },
    { id: "rosary", label: "Rosary Beads", Component: Rosary },
    { id: "quest", label: "Quest Items", Component: Quest },
    { id: "prayers", label: "Prayers", Component: Prayer },
    { id: "altar", label: "Altarpiece of Favours", Component: Altar },
    { id: "weapon", label: "Weapon Memories", Component: Weapon },
    { id: "collectibles", label: "Collectibles", Component: Collectibles },
    { id: "bosses", label: "Bosses", Component: Bosses },
  ]

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "Show All" },
  ...SECTIONS,
]

function AppContent() {
  const [tab, setTab] = useState<Tab>("all")

  const visibleSections =
    tab === "all" ? SECTIONS : SECTIONS.filter((section) => section.id === tab)

  return (
    <TabContext.Provider value={tab}>
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
          {visibleSections.map(({ id, Component }) => (
            <Component key={id} />
          ))}
        </main>
      </>
    </TabContext.Provider>
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
export { TabContext }
