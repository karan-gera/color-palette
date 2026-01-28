type Hint = {
  key: string
  label: string
}

type DialogKeyboardHintsProps = {
  hints: Hint[]
}

export default function DialogKeyboardHints({ hints }: DialogKeyboardHintsProps) {
  return (
    <div className="flex justify-center gap-4 pt-3 mt-3 border-t border-border/50">
      {hints.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-1.5 text-xs">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono font-medium border border-border/50 min-w-[20px] text-center">
            {key}
          </kbd>
          <span className="text-muted-foreground font-mono">{label}</span>
        </div>
      ))}
    </div>
  )
}
