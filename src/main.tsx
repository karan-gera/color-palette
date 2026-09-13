import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import './index.css'
import App from './App.tsx'
import AppErrorBoundary from './components/AppErrorBoundary.tsx'
import DevErrorBoundaryTrigger from './components/DevErrorBoundaryTrigger.tsx'
import MobileInterstitial from './components/MobileInterstitial.tsx'

const crashTestRequested = import.meta.env.DEV && new URLSearchParams(window.location.search).get('test-error-boundary') === '1'

function clearCrashTestParam() {
  if (!crashTestRequested) return
  const url = new URL(window.location.href)
  url.searchParams.delete('test-error-boundary')
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary onReset={clearCrashTestParam}>
      <MotionConfig reducedMotion="user">
        <MobileInterstitial>
          <DevErrorBoundaryTrigger>
            <App />
          </DevErrorBoundaryTrigger>
        </MobileInterstitial>
      </MotionConfig>
    </AppErrorBoundary>
  </StrictMode>,
)
