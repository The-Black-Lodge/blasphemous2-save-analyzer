import Altar from "./components/Altar"
import Prayer from "./components/Prayer"
import Rosary from "./components/Rosary"
import SaveProvider from "./components/SaveProvider"

function App() {
  return (
    <SaveProvider>
      <Altar />
      <Rosary />
      <Prayer />
    </SaveProvider>
  )
}

export default App
