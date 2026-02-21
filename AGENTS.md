# AGENTS.md — Workflow Style Guide

This file complements `CLAUDE.md` (project architecture, naming conventions, tech stack) with process guidance: when a feature is done, what to run, how to test, and how to document. It follows the [AGENTS.md open standard](https://agentsdotmd.com/) and is read by Cursor, GitHub Copilot, Windsurf, and other AI coding agents. Claude Code reads `CLAUDE.md` directly; this file's guidance is referenced from there.

---

## Git Commits

**Never commit unless explicitly asked.** If the user asks for a commit message, provide the message text only — do not run `git commit`. Wait for explicit instructions like "commit this" or "make the commit" before actually committing.

---

## Feature Completion Checklist

A feature is **done** when every box below is checked:

- [ ] **TypeScript passes** — `npm run build` exits with no errors
- [ ] **Lint passes** — `npm run lint` exits with no warnings (pre-existing exceptions listed in CLAUDE.md are allowed)
- [ ] **Tests pass** — `npm test` exits with no failures
- [ ] **New tests written** — test file added or updated in `src/__tests__/helpers/` or `src/__tests__/hooks/` covering the new logic (see [Testing Protocol](#testing-protocol))
- [ ] **Doc page exists** — a dedicated page in `DocsOverlay.tsx` (`src/components/DocsOverlay.tsx`) covering the feature (see [Documentation Protocol](#documentation-protocol))
- [ ] **Keyboard shortcut documented** — if a shortcut was added, it appears in `SHORTCUT_GROUPS` in `useKeyboardShortcuts.ts` so the hints overlay (`/`) shows it
- [ ] **Changelog entry added** — a new entry at the top of `CHANGELOG` in `DocsOverlay.tsx` (version incremented by 0.1)
- [ ] **TODO.md updated** — mark the feature's checkbox as `[x]`, add `✅` to its section heading, fill in implementation notes

---

## Recommended Implementation Order

When building a new feature, work in this order to catch integration issues early:

1. **Write the helper/hook logic** in `src/helpers/` or `src/hooks/`
2. **Write tests** for it in `src/__tests__/` (see [Testing Protocol](#testing-protocol)) — run `npm test` to verify
3. **Wire up the UI** — components, keyboard shortcut, toolbar button if applicable
4. **Add the doc page** in `DocsOverlay.tsx` (see [Documentation Protocol](#documentation-protocol))
5. **Run the full check suite** (all four commands below)
6. **Update TODO.md and CHANGELOG** — always last

---

## Commands to Run

Run all four before marking any feature done:

```bash
npm run build       # TypeScript type-check + Vite build — catches type errors
npm run lint        # ESLint — catches code quality issues
npm test            # Vitest (run once, no watch) — all tests must pass
npm run dev         # Manual smoke test in the browser — verify the feature works end-to-end
```

Optional:

```bash
npm run test:watch    # Watch mode — useful while writing tests
npm run test:coverage # Coverage report — aim for 85%+ on helper files, 90%+ on useHistory
npm run preview       # Preview the production build
```

---

## Testing Protocol

### When to write tests

- Every new function in `src/helpers/` gets tests. Even simple helpers — they prevent regressions.
- Every new hook in `src/hooks/` gets `renderHook` + `act` tests covering the state machine.
- UI components are **not** unit-tested (they're tested manually via `npm run dev`).

### Where to put tests

```
src/__tests__/
  helpers/        # one file per helper module (colorTheory, contrast, storage, etc.)
  hooks/          # one file per hook
  future/         # it.todo() stubs for features not yet implemented
```

### Test file naming

Match the source file: `src/helpers/colorTheory.ts` → `src/__tests__/helpers/colorTheory.test.ts`

### Activating future stubs

When you implement a feature that has a stub file in `src/__tests__/future/`, move the file to the appropriate `helpers/` or `hooks/` directory and replace `it.todo(...)` with real test implementations. Example:

```bash
# Before implementation:
src/__tests__/future/extractFromImage.test.ts   # all it.todo()

# After implementation:
src/__tests__/helpers/extractFromImage.test.ts  # real tests
```

### Mocking cheat sheet

| What to mock | How |
|---|---|
| `localStorage` | jsdom built-in; auto-cleared in `afterEach` via `setup.ts` |
| `window.location` | `vi.stubGlobal('location', {...})` + `vi.resetModules()` + dynamic `await import(...)` |
| Module-level consts (e.g. `PLATFORM` in `platform.ts`) | `vi.resetModules()` + `vi.stubGlobal(...)` + `await import(...)` in each test |
| `URL.createObjectURL` | `vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn() })` |
| `navigator.clipboard` | Skip — requires secure context, not testable in jsdom |
| Binary format signatures | Read `Blob` bytes: `new Uint8Array(await blob.arrayBuffer())` |

### Regression tests

If you fix a bug, add a test that would have caught it. Name it clearly:

```ts
it('h=360 produces red, not gray (regression: triple-modulo normalization)', ...)
```

---

## Documentation Protocol

Every feature needs a dedicated page in the Help tab of `DocsOverlay.tsx` (`src/components/DocsOverlay.tsx`).

### Steps

1. **Add a nav entry** to `DOC_NAV` (around line 249) under the appropriate section:

   ```ts
   { type: 'page', id: 'my-feature', label: 'my feature' }
   ```

2. **Add a `case` to `DocPageContent`** (the switch starting around line 326):

   ```tsx
   case 'my-feature':
     return (
       <DocArticle title={title}>
         {/* content */}
       </DocArticle>
     )
   ```

3. **Include a demo** if possible — use `<Demo label="...">` wrapping a real component with `noop` handlers. Demos use `pointer-events-none` so they're visual only.

4. **Use available primitives**:
   - `<Kbd>` — renders a keyboard key
   - `<Demo>` — bordered preview box
   - `<DocArticle>` — wraps the whole page with a title
   - `getModifierLabel('shift')` / `getModifierLabel('alt')` — OS-aware modifier symbols

### Nav sections

| Section | Content |
|---|---|
| basics | core palette interactions |
| storage | save, open, import/export |
| copy & share | clipboard formats, url sharing |
| export | file export to code and art apps |
| color tools | editing, picking, naming, variations |
| accessibility | color blindness, contrast checker |
| reference | theme, keyboard shortcuts |

### Writing style

- All text lowercase (matches the rest of the UI)
- Short paragraphs — users are reading while doing something else
- Lead with what the feature does, then how to trigger it, then edge cases
- Keyboard shortcuts always shown with `<Kbd>` components

---

## Changelog Protocol

Add a new entry to the `CHANGELOG` array at the top of `DocsOverlay.tsx` (before all existing entries):

```ts
{
  version: '0.12',              // bump by 0.1 from the previous entry
  title: 'my feature name',     // short, lowercase
  items: [
    'one-line description of each significant change',
    'keyboard shortcut added if applicable',
    'important behaviors or limitations worth knowing',
  ],
},
```

Keep items short (one clause each). Users scan changelogs, they don't read them.

---

## TODO.md Protocol

After completing a feature, update `TODO.md`:

1. Find the feature's checkbox and mark it: `- [ ]` → `- [x]`
2. Add `✅` to the section heading
3. Add a brief implementation note below the checkbox (what approach was used, any caveats)

Example:

```md
## ✅ Color Naming

- [x] nearest-neighbor lookup via oklab distance
  - Uses `color-name-list/bestof` (MIT). ~4,000 entries precomputed at module load (~4ms, cached).
  - CSS named color tooltip appears when delta-E < 5.
```

---

## Keyboard Shortcuts Protocol

When adding a new keyboard shortcut:

1. **Add to `SHORTCUT_GROUPS`** in `src/hooks/useKeyboardShortcuts.ts` — this is what the hints overlay (`/`) reads:

   ```ts
   {
     key: 'X',
     description: 'do the thing',
     modifiers: ['shift'],   // optional
   }
   ```

2. **Register the handler** in the `useKeyboardShortcuts` hook's keydown handler function.

3. **Document in the doc page** using `<Kbd>` components.

4. **Verify** it doesn't conflict with existing shortcuts by checking the full `SHORTCUT_GROUPS` list.

---

## Pre-existing Lint Issues (Do Not Fix)

These warnings exist in the codebase and are not ours to fix:

- `CircleWipeOverlay.tsx` — `useEffect` dependency warning (intentional animation timing)
- `tabs.tsx` (shadcn/ui) — `react-refresh` plugin error

Do not introduce new lint warnings. The `npm run lint` command must exit clean on files you touch.

---

## What Counts as a "UI Text" Violation

All user-visible text in buttons, labels, dialog titles, nav items, and doc pages must be **lowercase**. This is enforced by convention, not Tailwind. If you add UI text in UPPERCASE or Title Case, fix it.

Exception: code samples, variable names, and content inside `<code>` or `<pre>` blocks.
