import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Download, Upload, Pencil, Check, Plus, XIcon, ChevronUp, ChevronDown } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import DialogKeyboardHints from './DialogKeyboardHints'
import NotificationModal from './NotificationModal'
import TagPillInput from './TagPillInput'
import type { SavedPalette, PaletteCollection } from '@/helpers/storage'
import {
  exportAllPalettes,
  importPalettesFromFile,
  mergePalettes,
  updatePalette,
  saveCollection,
  renameCollection,
  removeCollection,
  getAllTags,
} from '@/helpers/storage'

type OpenDialogProps = {
  palettes: SavedPalette[]
  collections: PaletteCollection[]
  onCancel: () => void
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onPalettesUpdated: () => void
  onCollectionsUpdated: () => void
}

const HINTS = [
  { key: '↑↓', label: 'navigate' },
  { key: 'Enter', label: 'load' },
  { key: 'Del', label: 'delete' },
  { key: 'Esc', label: 'close' },
]

const EMPTY_HINTS = [
  { key: 'Esc', label: 'close' },
]

export default function OpenDialog({
  palettes,
  collections,
  onCancel,
  onSelect,
  onRemove,
  onPalettesUpdated,
  onCollectionsUpdated,
}: OpenDialogProps) {
  const [fading, setFading] = useState<Record<string, boolean>>({})
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')

  // Filter state
  const [search, setSearch] = useState('')
  const [activeCollection, setActiveCollection] = useState<string | null>(null) // null = All
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([])

  // Collection editing state
  const [creatingCollection, setCreatingCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [renamingCollection, setRenamingCollection] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [pendingDeleteCollection, setPendingDeleteCollection] = useState<string | null>(null)

  // Palette inline edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [editCollection, setEditCollection] = useState<string>('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Scroll indicators
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  const updateScrollIndicators = useCallback(() => {
    const el = listRef.current
    if (!el) { setCanScrollUp(false); setCanScrollDown(false); return }
    const { scrollTop, scrollHeight, clientHeight } = el
    setCanScrollUp(scrollTop > 1)
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - 1)
  }, [])

  // Derived filtered list
  const filtered = palettes.filter((p) => {
    if (fading[p.id]) return false
    if (activeCollection !== null) {
      if (activeCollection === '__none__') {
        if (p.collection) return false
      } else {
        if (p.collection !== activeCollection) return false
      }
    }
    if (activeTagFilters.length > 0) {
      if (!activeTagFilters.every((t) => p.tags.includes(t))) return false
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      const nameMatch = p.name.toLowerCase().includes(q)
      const tagMatch = p.tags.some((t) => t.toLowerCase().includes(q))
      if (!nameMatch && !tagMatch) return false
    }
    return true
  })

  // Tags available in the current filtered set (before tag filter itself)
  const visibleTags = [...new Set(
    palettes
      .filter((p) => {
        if (activeCollection !== null) {
          if (activeCollection === '__none__') return !p.collection
          return p.collection === activeCollection
        }
        return true
      })
      .filter((p) => {
        if (!search.trim()) return true
        const q = search.trim().toLowerCase()
        return p.name.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q))
      })
      .flatMap((p) => p.tags)
  )].sort()

  // Prune stale tag filters when switching collections
  useEffect(() => {
    if (activeTagFilters.length === 0) return
    const pruned = activeTagFilters.filter((t) => visibleTags.includes(t))
    if (pruned.length !== activeTagFilters.length) setActiveTagFilters(pruned)
  }, [activeCollection]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard nav for list
  const [selectedIndex, setSelectedIndex] = useState(0)
  useEffect(() => { setSelectedIndex(0) }, [search, activeCollection, activeTagFilters.join(',')])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showNotification || editingId || creatingCollection || renamingCollection || pendingDeleteCollection) return
      const active = document.activeElement
      if (active === searchRef.current) return
      if (active instanceof HTMLInputElement || active instanceof HTMLSelectElement || active?.closest('[data-tag-pill-input]')) return

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(0, i - 1))
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(filtered.length - 1, i + 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIndex]) onSelect(filtered[selectedIndex].id)
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (filtered[selectedIndex]) handleDelete(filtered[selectedIndex].id)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filtered, selectedIndex, showNotification, editingId, creatingCollection, renamingCollection, pendingDeleteCollection])

  // Scroll selected into view
  useEffect(() => {
    if (listRef.current && filtered.length > 0) {
      const items = listRef.current.querySelectorAll('[data-palette-item]')
      const el = items[selectedIndex] as HTMLElement
      if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedIndex, filtered.length])

  // Re-check scroll indicators when content changes
  useEffect(() => {
    const timer = setTimeout(updateScrollIndicators, 50)
    return () => clearTimeout(timer)
  }, [filtered.length, updateScrollIndicators])

  const handleDelete = useCallback((id: string) => {
    setFading((prev) => ({ ...prev, [id]: true }))
    setTimeout(() => {
      onRemove(id)
      setFading((prev) => { const next = { ...prev }; delete next[id]; return next })
      setSelectedIndex((i) => Math.max(0, i > 0 ? i - 1 : 0))
    }, 200)
  }, [onRemove])

  const handleExportAll = () => { exportAllPalettes() }
  const handleImportClick = () => { fileInputRef.current?.click() }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const imported = await importPalettesFromFile(file)
      const result = mergePalettes(imported.palettes, imported.collections)
      onPalettesUpdated()
      if (result.collectionsImported > 0) onCollectionsUpdated()
      let message = 'palettes imported successfully!'
      if (result.duplicates > 0) message += ` (${result.duplicates} duplicate${result.duplicates > 1 ? 's' : ''} skipped)`
      if (result.collectionsImported > 0) message += ` · ${result.collectionsImported} collection${result.collectionsImported > 1 ? 's' : ''} added`
      setNotificationMessage(message)
      setShowNotification(true)
    } catch (error) {
      setNotificationMessage(`import failed: ${error instanceof Error ? error.message : 'unknown error'}`)
      setShowNotification(true)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Inline edit handlers
  const startEdit = (p: SavedPalette) => {
    setEditingId(p.id)
    setEditName(p.name)
    setEditTags([...p.tags])
    setEditCollection(p.collection ?? '')
  }

  const commitEdit = (id: string) => {
    updatePalette(id, {
      ...(editName.trim() ? { name: editName.trim() } : {}),
      tags: editTags,
      collection: editCollection || undefined,
    })
    onPalettesUpdated()
    setEditingId(null)
  }

  const cancelEdit = () => { setEditingId(null) }

  // Collection handlers
  const commitNewCollection = () => {
    const name = newCollectionName.trim()
    if (name) {
      const result = saveCollection(name)
      if (result) {
        onCollectionsUpdated()
      } else {
        setNotificationMessage(`collection "${name}" already exists`)
        setShowNotification(true)
      }
    }
    setCreatingCollection(false)
    setNewCollectionName('')
  }

  const commitRename = (oldName: string) => {
    const newName = renameValue.trim()
    if (newName && newName !== oldName) {
      const ok = renameCollection(oldName, newName)
      if (ok) {
        onCollectionsUpdated()
        onPalettesUpdated()
        if (activeCollection === oldName) setActiveCollection(newName)
      } else {
        setNotificationMessage(`collection "${newName}" already exists`)
        setShowNotification(true)
      }
    }
    setRenamingCollection(null)
    setRenameValue('')
  }

  const confirmDeleteCollection = () => {
    if (!pendingDeleteCollection) return
    removeCollection(pendingDeleteCollection)
    onCollectionsUpdated()
    onPalettesUpdated()
    if (activeCollection === pendingDeleteCollection) setActiveCollection(null)
    setPendingDeleteCollection(null)
  }

  const allTags = getAllTags()

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onCancel()}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-mono lowercase">open palette</DialogTitle>
          </DialogHeader>

          {palettes.length > 0 && (
          <>
          {/* Search */}
          <div className="relative">
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="search by name or tag"
              className={`font-mono text-sm ${search ? 'pr-8' : ''}`}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>

          {/* Collection tabs */}
          <div className="flex flex-wrap items-center gap-1 -mx-1 px-1">
            {/* All tab */}
            <button
              onClick={() => setActiveCollection(null)}
              className={`px-2.5 py-1 rounded-sm font-mono text-xs transition-colors ${
                activeCollection === null
                  ? 'bg-foreground text-background'
                  : 'hover:bg-accent text-muted-foreground hover:text-foreground'
              }`}
            >
              all
            </button>

            {/* Uncategorized tab (only if some palettes have no collection) */}
            {palettes.some((p) => !p.collection) && collections.length > 0 && (
              <button
                onClick={() => setActiveCollection('__none__')}
                className={`px-2.5 py-1 rounded-sm font-mono text-xs transition-colors ${
                  activeCollection === '__none__'
                    ? 'bg-foreground text-background'
                    : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                }`}
              >
                uncategorized
              </button>
            )}

            {/* Collection tabs */}
            {collections.map((c) => {
              const isActive = activeCollection === c.name
              return renamingCollection === c.name ? (
                <input
                  key={c.name}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); commitRename(c.name) }
                    if (e.key === 'Escape') { e.stopPropagation(); setRenamingCollection(null) }
                  }}
                  onBlur={() => commitRename(c.name)}
                  autoFocus
                  className="px-2 py-1 rounded-sm font-mono text-xs border border-input bg-background outline-none w-24"
                />
              ) : (
                <button
                  key={c.name}
                  onClick={() => setActiveCollection(c.name)}
                  onDoubleClick={() => { setRenamingCollection(c.name); setRenameValue(c.name) }}
                  className={`inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-sm font-mono text-xs transition-colors ${
                    isActive
                      ? 'bg-foreground text-background'
                      : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {c.name}
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => { e.stopPropagation(); setPendingDeleteCollection(c.name) }}
                    className={`rounded-sm transition-colors ${
                      isActive
                        ? 'hover:bg-background/20'
                        : 'hover:bg-foreground/10'
                    }`}
                  >
                    <XIcon className="size-3.5" />
                  </span>
                </button>
              )
            })}

            {/* New collection */}
            {creatingCollection ? (
              <input
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); commitNewCollection() }
                  if (e.key === 'Escape') { e.stopPropagation(); setCreatingCollection(false); setNewCollectionName('') }
                }}
                onBlur={commitNewCollection}
                autoFocus
                placeholder="collection name"
                className="px-2 py-1 rounded-sm font-mono text-xs border border-input bg-background outline-none w-32"
              />
            ) : (
              <button
                onClick={() => setCreatingCollection(true)}
                className="px-2 py-1 rounded-sm font-mono text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-1"
              >
                <Plus className="size-3" />
                new
              </button>
            )}
          </div>
          </>
          )}

          {/* Animated body: tags + palette list */}
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
            className="grid overflow-hidden"
          >
            {/* Tag filter chips — no inner AnimatePresence; the outer layout handles height */}
            {visibleTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-4">
                {visibleTags.map((tag) => {
                  const active = activeTagFilters.includes(tag)
                  return (
                    <button
                      key={tag}
                      onClick={() =>
                        setActiveTagFilters((prev) =>
                          active ? prev.filter((t) => t !== tag) : [...prev, tag]
                        )
                      }
                      className={`px-2 py-0.5 rounded-sm font-mono text-xs border transition-colors ${
                        active
                          ? 'bg-foreground text-background border-foreground'
                          : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                      }`}
                    >
                      {tag}
                      {active && <span className="ml-1 opacity-60">×</span>}
                    </button>
                  )
                })}
                {activeTagFilters.length > 1 && (
                  <button
                    onClick={() => setActiveTagFilters([])}
                    className="px-2 py-0.5 rounded-sm font-mono text-xs border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                  >
                    clear tags
                  </button>
                )}
              </div>
            )}

            {/* Palette list with scroll indicators */}
            <div className="relative">
              <div
                className={`absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-background to-transparent pointer-events-none z-10 flex items-start justify-center pt-1 transition-opacity duration-200 ${
                  canScrollUp ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <ChevronUp className="size-4 text-muted-foreground" />
              </div>

              <div
                ref={listRef}
                onScroll={updateScrollIndicators}
                className="max-h-[40vh] overflow-y-auto scrollbar-none -mx-2 px-2 py-1"
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {filtered.length === 0 ? (
                    <motion.p
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-muted-foreground text-sm font-mono text-center py-8"
                    >
                      {palettes.length === 0 ? 'no saved palettes' : 'no results'}
                    </motion.p>
                  ) : (
                  filtered.map((p, index) => (
                    <motion.div
                      key={p.id}
                      data-palette-item
                      layout
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: fading[p.id] ? 0 : 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{
                        layout: { type: 'spring', stiffness: 400, damping: 36 },
                        opacity: { duration: 0.15 },
                        scale: { duration: 0.15 },
                      }}
                      onClick={() => { setSelectedIndex(index); if (editingId !== p.id) cancelEdit() }}
                      className={`rounded-md border bg-card cursor-pointer mb-2 last:mb-0 ${
                        index === selectedIndex
                          ? 'ring-2 ring-ring border-ring'
                          : 'hover:border-muted-foreground/50'
                      }`}
                    >
                      {editingId === p.id ? (
                        /* Inline edit mode */
                        <div className="p-3 grid gap-2" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="palette name"
                            className="font-mono text-sm h-8"
                            autoFocus
                          />
                          <div data-tag-pill-input>
                            <TagPillInput
                              tags={editTags}
                              onChange={setEditTags}
                              suggestions={allTags}
                              placeholder="add tag"
                            />
                          </div>
                          {collections.length > 0 && (
                            <select
                              value={editCollection}
                              onChange={(e) => setEditCollection(e.target.value)}
                              className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs font-mono shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                              <option value="">no collection</option>
                              {collections.map((c) => (
                                <option key={c.name} value={c.name}>{c.name}</option>
                              ))}
                            </select>
                          )}
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={cancelEdit} className="font-mono lowercase text-xs h-7">
                              cancel
                            </Button>
                            <Button size="sm" onClick={() => commitEdit(p.id)} className="font-mono lowercase text-xs h-7">
                              <Check className="size-3 mr-1" />
                              done
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Normal display mode */
                        <div className="flex items-center justify-between gap-3 p-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-mono text-sm font-medium truncate">{p.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {new Date(p.savedAt).toLocaleString()}
                            </div>
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {p.colors.map((color, i) => (
                                <div
                                  key={i}
                                  className="cvd-color size-5 rounded-sm border"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))}
                            </div>
                            {p.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {p.tags.map((tag) => (
                                  <span key={tag} className="px-1.5 py-0.5 rounded-sm bg-secondary text-secondary-foreground font-mono text-xs">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="outline"
                              size="icon-sm"
                              onClick={(e) => { e.stopPropagation(); startEdit(p) }}
                              className="text-muted-foreground hover:text-foreground"
                              title="edit"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); onSelect(p.id) }}
                              className="font-mono lowercase"
                            >
                              load
                            </Button>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              onClick={(e) => { e.stopPropagation(); handleDelete(p.id) }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
                </AnimatePresence>
              </div>

              <div
                className={`absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none z-10 flex items-end justify-center pb-1 transition-opacity duration-200 ${
                  canScrollDown ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <ChevronDown className="size-4 text-muted-foreground" />
              </div>
            </div>
          </motion.div>

          <DialogFooter className="border-t pt-4 mt-2">
            <div className="flex w-full justify-between">
              <div className="flex gap-2">
                {palettes.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleExportAll} className="font-mono lowercase">
                    <Download className="size-4" />
                    export
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleImportClick} className="font-mono lowercase">
                  <Upload className="size-4" />
                  import
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={onCancel} className="font-mono lowercase">
                close
              </Button>
            </div>
          </DialogFooter>

          <DialogKeyboardHints hints={filtered.length > 0 ? HINTS : EMPTY_HINTS} />

          <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileImport} className="hidden" />
        </DialogContent>
      </Dialog>

      {showNotification && (
        <NotificationModal message={notificationMessage} onClose={() => setShowNotification(false)} />
      )}

      {pendingDeleteCollection && (() => {
        const count = palettes.filter((p) => p.collection === pendingDeleteCollection).length
        return (
          <Dialog open onOpenChange={(open) => { if (!open) setPendingDeleteCollection(null) }}>
            <DialogContent className="sm:max-w-sm" showCloseButton={false}>
              <DialogHeader>
                <DialogTitle className="font-mono lowercase">delete collection</DialogTitle>
              </DialogHeader>
              <p className="text-sm font-mono">
                {count > 0
                  ? <>delete <strong>{pendingDeleteCollection}</strong>? {count} palette{count !== 1 && 's'} in this collection will be moved to uncategorized.</>
                  : <>delete <strong>{pendingDeleteCollection}</strong>?</>
                }
              </p>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setPendingDeleteCollection(null)} className="font-mono lowercase">
                  cancel
                </Button>
                <Button variant="destructive" size="sm" onClick={confirmDeleteCollection} className="font-mono lowercase">
                  delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      })()}
    </>
  )
}
