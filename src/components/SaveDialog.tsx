import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
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
import TagPillInput from './TagPillInput'
import type { PaletteCollection } from '@/helpers/storage'
import { saveCollection } from '@/helpers/storage'

type SaveDialogProps = {
  defaultName?: string
  existingTags: string[]
  collections: PaletteCollection[]
  onCancel: () => void
  onSave: (name?: string, tags?: string[], collection?: string) => void
  onCollectionsUpdated: () => void
}

const HINTS = [
  { key: 'Enter', label: 'save' },
  { key: 'Esc', label: 'cancel' },
]

export default function SaveDialog({ defaultName, existingTags, collections, onCancel, onSave, onCollectionsUpdated }: SaveDialogProps) {
  const [nameValue, setNameValue] = useState(defaultName ?? '')
  const [tags, setTags] = useState<string[]>([])
  const [collection, setCollection] = useState<string>('')
  const [creatingCollection, setCreatingCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')

  const handleSave = useCallback(() => {
    onSave(nameValue || undefined, tags.length > 0 ? tags : undefined, collection || undefined)
  }, [nameValue, tags, collection, onSave])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only submit on Enter if focus is NOT inside the tag input
      const active = document.activeElement
      const isTagInput = active?.closest('[data-tag-pill-input]')
      if (e.key === 'Enter' && !e.shiftKey && !isTagInput) {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono lowercase">save palette</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <label className="text-sm font-mono lowercase">name</label>
            <Input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              placeholder="optional"
              className="font-mono"
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-mono lowercase">tags</label>
            <div data-tag-pill-input>
              <TagPillInput
                tags={tags}
                onChange={setTags}
                suggestions={existingTags}
                placeholder="type and press enter"
              />
            </div>
            <p className="text-xs text-muted-foreground font-mono">press enter or comma to add a tag</p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-mono lowercase">collection</label>
            <div className="flex gap-2">
              <select
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm font-mono shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">none</option>
                {collections.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
              {!creatingCollection && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCreatingCollection(true)}
                  className="font-mono lowercase shrink-0 h-9"
                >
                  <Plus className="size-3.5" />
                  new
                </Button>
              )}
            </div>
            {creatingCollection && (
              <div className="flex gap-2">
                <Input
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      e.stopPropagation()
                      const name = newCollectionName.trim()
                      if (name) {
                        const result = saveCollection(name)
                        if (result) {
                          onCollectionsUpdated()
                          setCollection(name)
                        }
                      }
                      setCreatingCollection(false)
                      setNewCollectionName('')
                    }
                    if (e.key === 'Escape') {
                      e.stopPropagation()
                      setCreatingCollection(false)
                      setNewCollectionName('')
                    }
                  }}
                  onBlur={() => {
                    const name = newCollectionName.trim()
                    if (name) {
                      const result = saveCollection(name)
                      if (result) {
                        onCollectionsUpdated()
                        setCollection(name)
                      }
                    }
                    setCreatingCollection(false)
                    setNewCollectionName('')
                  }}
                  placeholder="collection name"
                  className="font-mono text-sm h-9"
                  autoFocus
                />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} className="font-mono lowercase">
            cancel
          </Button>
          <Button onClick={handleSave} className="font-mono lowercase">
            save
          </Button>
        </DialogFooter>
        <DialogKeyboardHints hints={HINTS} />
      </DialogContent>
    </Dialog>
  )
}
