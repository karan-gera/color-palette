import { useMemo, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { COLOR_FORMATS, formatColor, type ColorFormat } from '@/helpers/colorTheory'
import { getColorName } from '@/helpers/colorNaming'

type ColorFormatMenuProps = {
  color: string
  className?: string
}

export default function ColorFormatMenu({ color, className }: ColorFormatMenuProps) {
  const [copiedFormat, setCopiedFormat] = useState<ColorFormat | 'css-name' | null>(null)
  const cssName = useMemo(() => getColorName(color).cssName, [color])

  const handleCopy = async (format: ColorFormat) => {
    const text = formatColor(color, format)
    try {
      await navigator.clipboard.writeText(text)
      setCopiedFormat(format)
      setTimeout(() => setCopiedFormat(null), 1500)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleCopyCssName = async () => {
    if (!cssName) return
    try {
      await navigator.clipboard.writeText(cssName)
      setCopiedFormat('css-name')
      setTimeout(() => setCopiedFormat(null), 1500)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`font-mono text-xs text-muted-foreground uppercase hover:text-foreground transition-colors cursor-pointer ${className ?? ''}`}
          aria-label={`Copy color ${color} in different formats`}
        >
          {color}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-64">
        <DropdownMenuLabel className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground select-none pointer-events-none pb-1">
          copy as
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {COLOR_FORMATS.map(({ value, label, preview }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => handleCopy(value)}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="font-mono text-xs">{label}</span>
              <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[180px]">
                {preview(color)}
              </span>
            </div>
            {copiedFormat === value ? (
              <Check className="size-3.5 text-green-500" />
            ) : (
              <Copy className="size-3.5 opacity-50" />
            )}
          </DropdownMenuItem>
        ))}
        {cssName && (
          <>
            <DropdownMenuItem
              onClick={handleCopyCssName}
              className="flex items-center justify-between gap-2 cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-mono text-xs">CSS Name</span>
                <span className="font-mono text-[10px] text-muted-foreground">{cssName}</span>
              </div>
              {copiedFormat === 'css-name' ? (
                <Check className="size-3.5 text-green-500" />
              ) : (
                <Copy className="size-3.5 opacity-50" />
              )}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
