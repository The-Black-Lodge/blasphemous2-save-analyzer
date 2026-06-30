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
import SaveProvider, { OpenSaveButton } from "./components/SaveProvider"
import GlobalSaveProvider, {
  OpenGlobalDataButton,
} from "./components/GlobalSaveProvider"
import Collectibles from "./components/Collectibles"
import GlobalAnalyzer from "./components/GlobalAnalyzer"

type SectionTab =
  | "bosses"
  | "player"
  | "rosary"
  | "quest"
  | "prayers"
  | "altar"
  | "collectibles"
  | "global"
type Tab = "all" | SectionTab

const TabContext = createContext<Tab>("all")

interface AppNavigation {
  scrollToCollectible: (sectionKey: string) => void
  goToTab: (tab: SectionTab) => void
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
    { id: "collectibles", label: "Collectibles", Component: Collectibles },
    { id: "bosses", label: "Bosses", Component: Bosses },
    { id: "global", label: "Global Analyzer", Component: GlobalAnalyzer },
  ]

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "Show All" },
  ...SECTIONS,
]

function scrollBelowStickyHeader(element: HTMLElement) {
  const header = document.querySelector(".app-top-bar")
  const headerHeight = header?.getBoundingClientRect().height ?? 0
  const top =
    element.getBoundingClientRect().top + window.scrollY - headerHeight - 8
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" })
}

function AppContent() {
  const [tab, setTab] = useState<Tab>("all")
  const collectibleScrollTarget = useRef<string | null>(null)

  const scrollToCollectible = useCallback((sectionKey: string) => {
    collectibleScrollTarget.current = sectionKey
    setTab((current) =>
      current === "all" || current === "collectibles" ? current : "collectibles",
    )
  }, [])

  const goToTab = useCallback((sectionTab: SectionTab) => {
    setTab(sectionTab)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  useEffect(() => {
    const sectionKey = collectibleScrollTarget.current
    if (!sectionKey) return
    if (tab !== "collectibles" && tab !== "all") return

    collectibleScrollTarget.current = null
    const timeoutId = window.setTimeout(() => {
      const target = document.getElementById(`collectible-${sectionKey}`)
      if (target) scrollBelowStickyHeader(target)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [tab])

  const visibleSections =
    tab === "all" ? SECTIONS : SECTIONS.filter((section) => section.id === tab)

  return (
    <TabContext.Provider value={tab}>
      <AppNavigationContext.Provider value={{ scrollToCollectible, goToTab }}>
      <>
        <div className="app-top-bar">
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
          {tab === "global" ? <OpenGlobalDataButton /> : <OpenSaveButton />}
        </div>
        <main className="app-content">
          {visibleSections.map(({ id, Component }) => (
            <Component key={id} />
          ))}
        </main>
        <footer className="app-footer">
          <a
            className="app-github-link"
            href="https://github.com/The-Black-Lodge/blasphemous2-save-analyzer"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub"
          >
            <i className="fa-brands fa-github" aria-hidden="true" />
          </a>
        </footer>
      </>
      </AppNavigationContext.Provider>
    </TabContext.Provider>
  )
}

function App() {
  return (
    <SaveProvider>
      <GlobalSaveProvider>
        <AppContent />
      </GlobalSaveProvider>
    </SaveProvider>
  )
}

export default App
export { TabContext }
