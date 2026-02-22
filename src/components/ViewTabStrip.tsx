type ViewTab = 'palette' | 'gradient'

type ViewTabStripProps = {
  activeView: ViewTab
  onSwitch: (view: ViewTab) => void
}

const TABS: Array<{ id: ViewTab; label: string }> = [
  { id: 'palette',  label: 'palette'  },
  { id: 'gradient', label: 'gradient' },
]

export default function ViewTabStrip({ activeView, onSwitch }: ViewTabStripProps) {
  return (
    <div className="group flex flex-col gap-3 items-end">
      {TABS.map(tab => {
        const isActive = tab.id === activeView
        return (
          <button
            key={tab.id}
            onClick={() => onSwitch(tab.id)}
            className="flex items-center gap-2 cursor-pointer"
            aria-label={`switch to ${tab.label} view`}
            aria-pressed={isActive}
          >
            {/* Label — invisible until group hover */}
            <span
              className={[
                'font-mono text-xs transition-all duration-200 whitespace-nowrap',
                'opacity-0 group-hover:opacity-100',
                isActive ? 'text-foreground' : 'text-muted-foreground',
              ].join(' ')}
            >
              {tab.label}
            </span>

            {/* Dot indicator */}
            <span
              className={[
                'block rounded-full transition-all duration-200',
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
