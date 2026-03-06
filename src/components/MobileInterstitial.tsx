import { useState } from 'react'

const SESSION_KEY = 'paletteport:mobile-proceed'

function isMobileDevice(): boolean {
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches && window.innerWidth < 768
}

type MobileInterstitialProps = {
  children: React.ReactNode
}

export default function MobileInterstitial({ children }: MobileInterstitialProps) {
  const [proceeded, setProceeded] = useState<boolean>(() => {
    return sessionStorage.getItem(SESSION_KEY) === '1'
  })

  if (!isMobileDevice() || proceeded) {
    return <>{children}</>
  }

  function handleProceed() {
    sessionStorage.setItem(SESSION_KEY, '1')
    setProceeded(true)
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-8 font-mono">
      <div className="flex flex-col items-center gap-8 max-w-sm text-center">
        <div className="flex gap-2">
          {['#e06c75', '#e5c07b', '#98c379', '#61afef', '#c678dd'].map((c) => (
            <div
              key={c}
              className="size-8 rounded-full"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-xl font-semibold text-foreground lowercase tracking-tight">
            paletteport
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed lowercase">
            our mobile experience isn't up to our standards yet. we're working on it.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed lowercase">
            for the best experience, visit on a desktop browser.
          </p>
        </div>

        <button
          onClick={handleProceed}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors lowercase cursor-pointer"
        >
          continue to desktop version anyway
        </button>
      </div>
    </div>
  )
}
