import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'

const MAX_TAG_LENGTH = 24

type TagPillInputProps = {
  tags: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
  autoFocus?: boolean
}

export default function TagPillInput({ tags, onChange, suggestions = [], placeholder = 'add tag', autoFocus = false }: TagPillInputProps) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const sorted = [...tags].sort((a, b) => a.localeCompare(b))

  const filteredSuggestions = suggestions.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  )

  useEffect(() => {
    setHighlightedIndex(-1)
  }, [input])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [tags.length])

  const addTag = (value: string) => {
    const trimmed = value.trim().toLowerCase().slice(0, MAX_TAG_LENGTH)
    if (!trimmed || tags.includes(trimmed)) {
      setInput('')
      setShowSuggestions(false)
      return
    }
    onChange([...tags, trimmed])
    setInput('')
    setShowSuggestions(false)
  }

  const addMany = (raw: string) => {
    const candidates = raw.split(',').map((s) => s.trim().toLowerCase().slice(0, MAX_TAG_LENGTH)).filter(Boolean)
    const unique = candidates.reduce<string[]>((acc, t) => {
      if (!tags.includes(t) && !acc.includes(t)) acc.push(t)
      return acc
    }, [])
    if (unique.length > 0) onChange([...tags, ...unique])
    setInput('')
    setShowSuggestions(false)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text')
    if (text.includes(',')) {
      e.preventDefault()
      addMany(text)
    }
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      e.stopPropagation()
      if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
        addTag(filteredSuggestions[highlightedIndex])
      } else if (input.trim()) {
        addTag(input)
      }
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      onChange(tags.slice(0, -1))
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.min(i + 1, filteredSuggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setHighlightedIndex(-1)
    }
  }

  return (
    <div
      ref={scrollRef}
      className="flex flex-wrap content-start gap-1.5 p-2 min-h-9 max-h-24 overflow-y-auto rounded-md border border-input bg-transparent cursor-text focus-within:ring-1 focus-within:ring-ring"
      onClick={() => inputRef.current?.focus()}
    >
      {sorted.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-secondary text-secondary-foreground font-mono text-xs max-w-[180px]"
        >
          <span className="truncate">{tag}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
            className="opacity-50 hover:opacity-100 transition-opacity shrink-0"
            tabIndex={-1}
          >
            <X className="size-2.5" />
          </button>
        </span>
      ))}
      <div className="relative flex-1 min-w-[80px]">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setShowSuggestions(true)
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={tags.length === 0 ? placeholder : ''}
          maxLength={MAX_TAG_LENGTH}
          autoFocus={autoFocus}
          className="w-full bg-transparent font-mono text-xs outline-none placeholder:text-muted-foreground py-0.5"
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 mt-1 z-50 min-w-[140px] rounded-md border bg-popover shadow-md overflow-hidden">
            {filteredSuggestions.map((s, i) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); addTag(s) }}
                className={`w-full text-left px-3 py-1.5 font-mono text-xs transition-colors ${
                  i === highlightedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
