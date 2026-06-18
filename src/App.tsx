import Altar from "./components/Altar"
import Rosary from "./components/Rosary"
import SaveProvider from "./components/SaveProvider"

function App() {
  return (
    <SaveProvider>
      <Altar />
      <Rosary />
    </SaveProvider>
  )
}

export default App
