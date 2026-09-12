type ViewTab = 'palette' | 'gradient' | 'extract'

type ViewTabStripProps = {
  activeView: ViewTab
  onSwitch: (view: ViewTab) => void
}

const TABS: Array<{ id: ViewTab; label: string }> = [
  { id: 'palette',  label: 'palette'  },
  { id: 'gradient', label: 'gradient' },
  { id: 'extract',  label: 'extract'  },
]

export default function ViewTabStrip({ activeView, onSwitch }: ViewTabStripProps) {
  return (
    <div className="group grid grid-rows-3 justify-items-stretch">
      {TABS.map(tab => {
        const isActive = tab.id === activeView
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSwitch(tab.id)}
            className="grid min-h-11 min-w-28 grid-cols-[1fr_0.75rem] items-center gap-2 rounded-sm px-2 text-right cursor-pointer hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={`switch to ${tab.label} view`}
            aria-pressed={isActive}
          >
            {/* Label — invisible until group hover */}
            <span
              className={[
                'font-mono text-xs transition-all duration-200 reduced-motion-instant whitespace-nowrap',
                'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
                isActive ? 'text-foreground' : 'text-muted-foreground',
              ].join(' ')}
            >
              {tab.label}
            </span>

            {/* Dot indicator */}
            <span
              className={[
                'block rounded-full transition-all duration-200 reduced-motion-instant',
                isActive
                  ? 'w-3 h-3 bg-foreground'
                  : 'w-2.5 h-2.5 border border-foreground/40 bg-transparent group-hover:border-foreground/70',
              ].join(' ')}
            />
          </button>
        )
      })}
    </div>
  )
}
