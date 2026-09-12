import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import MobileInterstitial from './components/MobileInterstitial.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MobileInterstitial>
      <App />
    </MobileInterstitial>
  </StrictMode>,
)
