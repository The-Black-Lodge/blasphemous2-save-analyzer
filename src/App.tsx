import Altar from "./components/Altar"
import SaveProvider from "./components/SaveProvider"

function App() {
  return (
    <SaveProvider>
      <Altar />
    </SaveProvider>
  )
}

export default App
