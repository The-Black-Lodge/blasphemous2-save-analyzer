import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './styles/fonts.css'
import './styles/figure-sprites.css'
import './styles/figure-category-sprites.css'
import './styles/item-sprites.css'
import './styles/prayer-sprites.css'
import './styles/quest-sprites.css'
import './styles/hud-sprites.css'
import './styles/weapon-memory-sprites.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
