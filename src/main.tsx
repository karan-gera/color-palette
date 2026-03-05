import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Mark this user as having visited the app — skips landing page on future loads.
// Skip for share links (?colors=...) so the recipient still sees the landing page
// on their next direct visit, preserving their first-visit experience.
if (!new URLSearchParams(window.location.search).has('colors')) {
  localStorage.setItem('paletteport:visited', '1')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
