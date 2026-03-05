import { useState, useEffect, useCallback } from 'react'
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

type SaveDialogProps = {
  defaultName?: string
  existingTags: string[]
  collections: PaletteCollection[]
  onCancel: () => void
  onSave: (name?: string, tags?: string[], collectionId?: string) => void
}

const HINTS = [
  { key: 'Enter', label: 'save' },
  { key: 'Esc', label: 'cancel' },
]

export default function SaveDialog({ defaultName, existingTags, collections, onCancel, onSave }: SaveDialogProps) {
  const [nameValue, setNameValue] = useState(defaultName ?? '')
  const [tags, setTags] = useState<string[]>([])
  const [collectionId, setCollectionId] = useState<string>('')

  const handleSave = useCallback(() => {
    onSave(nameValue || undefined, tags.length > 0 ? tags : undefined, collectionId || undefined)
  }, [nameValue, tags, collectionId, onSave])

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
          {collections.length > 0 && (
            <div className="grid gap-2">
              <label className="text-sm font-mono lowercase">collection</label>
              <select
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm font-mono shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">none</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
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
