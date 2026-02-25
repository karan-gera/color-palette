# Adding a New View (Tab-Strip Pattern)

Reference implementation: Gradient Generator (feature #13). Follow this checklist when adding a view that lives alongside the palette behind the right-edge tab strip.

---

## When to use this pattern vs. the overlay pattern

- **Tab-strip view** (`ViewTabStrip`): persistent workspace view that coexists with palette. User can switch freely (G key, tab clicks). Example: gradient generator.
- **Fullscreen overlay** (`DocsOverlay` pattern): temporary, Escape to exit, no tab strip. Example: docs, palette visualization preview.

---

## Checklist: Tab-Strip View

### 1. New component — `src/components/NewView.tsx`
- Accepts `onOpenExport` and any state hooks it needs via props.
- Import `motion` from `framer-motion` at the top — add stagger variants for internal sections (see `GradientView.tsx` for the `container`/`item` variant pattern).
- All UI text: lowercase, `font-mono`.

### 2. State hook (if needed) — `src/hooks/useNewViewState.ts`
- Persist to localStorage with key `'color-palette:<view-name>'`.
- Add `beforeunload` listener for synchronous flush (pattern from `useGradientStops.ts` — prevents debounce cancel on unmount).
- Expose a `reset`/`syncPalette` function if state is palette-derived.
- Write tests in `src/__tests__/hooks/useNewViewState.test.ts`.

### 3. Export dialog (if needed) — `src/components/NewViewExportDialog.tsx`
- Same structure as `GradientExportDialog.tsx`: format list + keyboard nav via `useListKeyboardNav`.

### 4. Generator helpers — `src/helpers/newViewGenerator.ts`
- Pure functions only. Write tests in `src/__tests__/helpers/newViewGenerator.test.ts`.

### 5. Update `ViewTabStrip.tsx`
- Add new view to `View` type union (`'palette' | 'gradient' | 'new-view'`).
- Add a new tab entry with an appropriate Lucide icon.

### 6. Update `App.tsx`

```ts
// a) Widen the activeView type
const [activeView, setActiveView] = useState<'palette' | 'gradient' | 'new-view'>('palette')

// b) Initialize state hook
const newViewState = useNewViewState(current ?? [], colorIds)

// c) Add export dialog state
const [isNewViewExportDialog, setIsNewViewExportDialog] = useState(false)

// d) Sync palette colors (if palette-derived, like gradient)
useEffect(() => {
  const palette = (current ?? []).map((hex, i) => ({ id: colorIds[i], hex }))
  newViewState.syncPaletteColors(palette)
}, [current, colorIds])

// e) Handle view switch — seed from palette if needed
const handleSwitchView = useCallback((view) => {
  if (view === 'new-view' && newViewState.needsInit) {
    newViewState.resetFromPalette(current ?? [], colorIds)
  }
  setActiveView(view)
}, [...])

// f) Add to closeAllDialogs
setIsNewViewExportDialog(false)

// g) Add to isAnyDialogOpen
const isAnyDialogOpen = ... || isNewViewExportDialog || ...

// h) Add to AnimatePresence block (same opacity fade as gradient):
{activeView === 'new-view' && (
  <motion.div key="new-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
    <NewView ... />
  </motion.div>
)}

// i) Render export dialog conditionally
{isNewViewExportDialog && <NewViewExportDialog ... />}
```

### 7. Update `useKeyboardShortcuts.ts`

```ts
// a) Widen isPaletteView concept if needed — OR add isPaletteOrGradientView, etc.
// Currently: isPaletteView gates all palette shortcuts.
// If new view needs its own shortcuts:
//   - Add them in the switch statement
//   - Guard palette-only shortcuts with !isPaletteView (already done)

// b) Add shortcut for toggling to new view (if applicable)
case 'n': // example
  event.preventDefault()
  onToggleNewView()
  break

// c) Update SHORTCUT_GROUPS for the hints display
```

### 8. Disable palette shortcuts in new view
- The `isPaletteView` flag already gates all palette shortcuts.
- If new view also needs to be excluded (not palette, not gradient), update the flag: `isPaletteView: activeView === 'palette'` in App.tsx already handles this — palette shortcuts are off in ANY non-palette view.

### 9. Update `E` key export handler (if view has its own export)
```ts
const handleExport = useCallback(() => {
  if (activeView === 'gradient') setIsGradientExportDialog(true)
  else if (activeView === 'new-view') setIsNewViewExportDialog(true)
  else { setExportInitialView('selecting'); setIsExportDialog(true) }
}, [activeView])
```

### 10. Docs / changelog
- Update `DocsOverlay.tsx`: add view to Help section
- Update changelog entry in DocsOverlay's Changelog tab
- Update `TODO.md`: mark feature done, add implementation notes

### 11. Run build + tests
```bash
npm run build
npm run test
```

---

## Checklist: Fullscreen Overlay Pattern

For views that are temporary (Escape to exit, not part of the tab strip):

1. Create `src/components/NewOverlay.tsx` — `fixed inset-0 z-[9997]`, fade+slide animation (see `DocsOverlay.tsx`)
2. Add `showNewOverlay` boolean state to App.tsx
3. Add to `closeAllDialogs` and `isAnyDialogOpen`
4. Add a keyboard shortcut (single letter, check for conflicts)
5. Render conditionally: `{showNewOverlay && <NewOverlay onClose={() => setShowNewOverlay(false)} />}`
6. Add shortcut to `SHORTCUT_GROUPS` in `useKeyboardShortcuts.ts`

This pattern does NOT require changes to `ViewTabStrip.tsx` or `handleSwitchView`.

---

## Key files reference

| Purpose | File |
|---------|------|
| View tab strip (right edge) | `src/components/ViewTabStrip.tsx` |
| Gradient view (reference) | `src/components/GradientView.tsx` |
| Gradient state hook (reference) | `src/hooks/useGradientStops.ts` |
| Gradient export dialog (reference) | `src/components/GradientExportDialog.tsx` |
| Keyboard shortcuts | `src/hooks/useKeyboardShortcuts.ts` |
| Main orchestrator | `src/App.tsx` |
| Docs overlay (overlay pattern ref) | `src/components/DocsOverlay.tsx` |
