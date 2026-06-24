import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
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

interface AppNavigation {
  scrollToCollectible: (sectionKey: string) => void
}

const AppNavigationContext = createContext<AppNavigation | null>(null)

export function useAppNavigation(): AppNavigation {
  const navigation = useContext(AppNavigationContext)
  if (!navigation) {
    throw new Error("useAppNavigation must be used within AppNavigationContext")
  }
  return navigation
}

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
  const collectibleScrollTarget = useRef<string | null>(null)

  const scrollToCollectible = useCallback((sectionKey: string) => {
    collectibleScrollTarget.current = sectionKey
    setTab((current) =>
      current === "all" || current === "collectibles" ? current : "collectibles",
    )
  }, [])

  useEffect(() => {
    const sectionKey = collectibleScrollTarget.current
    if (!sectionKey) return
    if (tab !== "collectibles" && tab !== "all") return

    collectibleScrollTarget.current = null
    const timeoutId = window.setTimeout(() => {
      document
        .getElementById(`collectible-${sectionKey}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [tab])

  const visibleSections =
    tab === "all" ? SECTIONS : SECTIONS.filter((section) => section.id === tab)

  return (
    <TabContext.Provider value={tab}>
      <AppNavigationContext.Provider value={{ scrollToCollectible }}>
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
      </AppNavigationContext.Provider>
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
