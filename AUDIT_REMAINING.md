# Codebase Audit — Remaining Items

Completed 1–10. Pick up from #11.

## Medium

### 11. ExportDialog decomposition
`ExportDialog.tsx` has a `renderContent` / single-component that's ~400 lines. Break into focused sub-components (format picker, image export section, etc.).

### 12. Replace `generateUUID` in `storage.ts` with `crypto.randomUUID()`
`storage.ts` has a hand-rolled UUID that uses `Math.random()`. Replace with `crypto.randomUUID()` which is available in all modern browsers and returns a proper v4 UUID. Check if `generateUUID` is used anywhere else.

## Low

### 13. Dead ternary in `PaletteItem.tsx`
`borderStyle` ternary has both branches set to `'dashed'`. One branch is dead. Just use `'dashed'` directly.

### 14. `cycleContrastTabRef` / `cycleCVDRef` ref wormholes
`App.tsx` passes a `ref` object to `ContrastChecker` and `Header` as a way to call imperative methods on child components. This is an inverted anti-pattern. The correct approach is `useImperativeHandle` + `forwardRef`, or lifting the cycling logic up to App. Scope: moderate refactor touching `ContrastChecker.tsx`, `Header.tsx`, and `App.tsx`.

### 15. Remove `scroll.ts` no-op wrapper
`src/helpers/scroll.ts` exports `shouldScrollOnExpand` and `SCROLL_DELAY_MS` — it's a trivial wrapper over a constant and a one-liner. The constant and logic can be inlined in App.tsx directly, eliminating the file.

### 16. Keyboard nav duplication in `OpenDialog` + `ExportDialog`
Both dialogs implement near-identical arrow-key / Enter keyboard navigation for their list. Extract a shared `useListKeyboardNav` hook.

### 17. Module-level LRU cache for `getColorName`
`getColorName` in `colorNaming.ts` recomputes the nearest color on every call with no caching. Add a simple `Map`-based module-level cache keyed by hex string so repeated lookups for the same color are O(1).
