# TESTING.md — Color Palette Generator Test Suite

This document is a comprehensive reference for the test suite. It is written for developers joining the project who need to understand not just *what* is tested, but *why* each behavior matters for a color tool and what real-world bugs or edge cases each test guards against.

---

## 1. Overview

### Framework

| Tool | Role |
|------|------|
| **Vitest** | Test runner. Integrates natively with Vite — same config, path aliases, ESM transforms. No Babel overhead. |
| **jsdom** | DOM environment. Provides `localStorage`, `document`, `URL`, `Blob`, `FileReader`, and `window.history`. |
| **@testing-library/react** | `renderHook` for testing React hooks without mounting a full component tree. |
| **@vitest/coverage-v8** | V8 native coverage reporting. |

### Why not Jest?

This project uses Vite. Jest requires a separate Babel or `ts-jest` transform pipeline to handle TypeScript and the `@/` path alias — that's configuration overhead that Vitest eliminates entirely. Vitest also starts faster and shares the Vite HMR transform cache during watch mode.

### Running Tests

```bash
npm test              # Run all tests once (CI)
npm run test:watch    # Watch mode for development
npm run test:coverage # V8 coverage report in coverage/
```

### Philosophy

Tests focus on **pure functions and state logic** — the mathematical and algorithmic core that the UI depends on. A bug in `hslToHex` or `contrastRatio` affects every feature silently and produces no runtime error. A test catches it immediately and pinpoints the cause.

React component rendering is **out of scope** — the value is in verifying the layers beneath the UI, not the rendering itself.

---

## 2. Setup

### Installation

```bash
npm install --save-dev vitest @vitest/coverage-v8 jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Configuration Files

| File | Purpose |
|------|---------|
| `vitest.config.ts` | Vitest config with jsdom environment, `@/` path alias, globals enabled |
| `src/__tests__/setup.ts` | Runs before every test file: imports jest-dom matchers, clears localStorage after each test |

### scripts in package.json

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

---

## 3. Test File Reference

### 3.1 `helpers/colorTheory.test.ts`

**Module:** [src/helpers/colorTheory.ts](src/helpers/colorTheory.ts)

This is the mathematical core of the entire application. Every color generation, format conversion, preset, and variation feature depends on these functions. A bug here produces incorrect colors silently — no runtime error, just wrong output.

#### `hexToRgb`

Parses a 6-character hex string into `{r, g, b}` values using `parseInt(..., 16)` on 2-character slices. Tests cover black, white, the three primaries, a mid-range color, and the # stripping behavior.

**Why it matters:** `hexToRgb` feeds both `contrast.ts` (luminance math) and `exportFormats.ts` (binary format generation). Wrong channel parsing produces incorrect WCAG ratios and corrupted binary exports with no error.

#### `hexToHsl`

Converts RGB to HSL. Key invariants tested:
- Pure red → `h=0, s=100, l=50`; green → `h=120`; blue → `h=240` (canonical HSL values)
- Black and white must have `s=0` (achromatic)
- All outputs stay in their documented ranges (`h: 0–360`, `s: 0–100`, `l: 0–100`)

**Why it matters:** Downstream functions like `isPresetActive` compare HSL values against preset bounds. Out-of-range outputs would silently break preset drift detection.

#### `hslToHex` — includes the h=360 regression test

This function had a documented bug (fixed in commit `52d00c1`):

> **The bug:** `hslToHex({ h: 360, s: 100, l: 50 })` returned pure gray instead of red. `hNorm = 360 / 360 = 1.0`. All six conditional branches check `hNorm < someValue` where the maximum is `1`. When `hNorm = 1.0`, no branch matches, `rPrime = gPrime = bPrime = 0`, producing `#000000` or gray depending on lightness. This affected 5 of 8 presets (pastel, neon, jewel, warm, muted) because their hue ranges include values near 360°.

> **The fix:** Normalize with `(((h % 360) + 360) % 360) / 360` before dividing — maps 360 → 0, handles negatives.

The test `'h=360 produces the same result as h=0 (not gray)'` is the **regression guard** for this fix. If it ever fails again, the boundary normalization has regressed.

Additional tests cover: h=361 wraps, negative hue wraps, round-trip hex→hsl→hex within 1-channel rounding tolerance, output always 7 chars starting with `#`.

#### `clamp`

Simple boundary enforcement. Tests: below-min, above-max, at-exact-min, at-exact-max. Used throughout HSL generation to keep channels in valid ranges — a pass-through bug would produce hex strings with values like `-1` in a channel.

#### `formatColor`

Tests all 6 output formats: hex (lowercase), rgb (parenthesized), hsl (with percentages), css-var (configurable name), tailwind (single-quoted), scss (dollar-prefix). Each is used in the clipboard copy feature.

#### `generateRelatedColor`

Color generation adds random jitter for natural variety — tests verify structural properties, not exact values:
- All 7 relationship types return a valid 6-char hex string
- Monochromatic is the only relationship that can be asserted on hue (it explicitly preserves `h = baseHsl.h`)
- Works with empty reference array + fallback

#### `generatePresetPalette`

Verifies count (default 5, custom), valid hex from all 8 presets, monochrome near-zero saturation, pastel high-lightness. Run multiple times for stochastic coverage.

#### `isPresetActive`

The drift detection function. Tests: empty → false; in-range → true; out-of-range → false; 2° tolerance is respected (a color 2° below the saturation minimum still passes).

#### `PALETTE_PRESETS`

Structural validation: exactly 8 entries, unique IDs, all required fields present, warm preset hue range is wrapping (`hue[0] > hue[1]` — used to switch to the circular comparison path in `isHueInRange`).

#### `generateTints / generateShades / generateTones`

These populate the Color Variations Panel. Tests verify:
- Count (default 9, configurable)
- Valid hex output
- Monotonic lightness for tints (non-decreasing) and shades (non-increasing) — out-of-order swatches break the visual gradient
- Tones preserve lightness within 1 unit (saturation-only change)
- Tints preserve hue within 2° (rounding-only drift allowed)

---

### 3.2 `helpers/contrast.test.ts`

**Module:** [src/helpers/contrast.ts](src/helpers/contrast.ts)

WCAG contrast calculations power the Contrast Checker panel. Incorrect values could mislead designers into believing a color combination is accessible when it is not. The Contrast Checker is one of the features we ship free that competitors paywall — correctness is non-negotiable.

#### `relativeLuminance`

WCAG 2.1 formula. Key anchors:
- Black = `0.0` exactly; white ≈ `1.0` (maximum brightness)
- Always in `[0, 1]` for any hex input
- Green (`#00ff00`) has higher luminance than red (`#ff0000`) — reflects human perception (green coefficient 0.7152 vs red 0.2126)
- Mid-gray (`#808080`) ≈ `0.216` — a known value from WCAG spec examples

#### `contrastRatio`

- Black on white = `21:1` (the spec maximum)
- Symmetric (argument order is irrelevant)
- Identical colors = `1:1` (minimum)
- All ratios ≥ 1 by definition

#### `wcagLevel`

All four levels and their exact boundaries tested with `>=` semantics:
- `≥ 7` → `'aaa'`
- `≥ 4.5` → `'aa'`
- `≥ 3` → `'aa18'`
- `< 3` → `'fail'`

Boundary tests at exactly `7`, `4.5`, `3` verify that `>=` vs `>` is correct — an off-by-epsilon mistake would fail colors that are exactly at the compliance threshold.

#### `describeContrast`

Human-readable summaries tested for: all-excellent phrase, all-insufficient warning, mixed results with `·` separator, `joinList` "and" for two-item lists, `aa18` → "large text only" phrasing.

---

### 3.3 `helpers/storage.test.ts`

**Module:** [src/helpers/storage.ts](src/helpers/storage.ts)

localStorage is the only persistence layer. Tests use jsdom's built-in implementation, cleared after each test by `setup.ts`.

#### `getSavedPalettes`

- Empty storage → `[]` (not null — callers iterate the result)
- Corrupted JSON → `[]` (catches the error; a user with corrupted storage should not see a white screen)
- Non-array JSON → `[]`
- Entries missing `colors` are filtered — partial data does not crash the app

#### `savePalette`

- Returns the saved palette (callers use the return value to update UI state)
- Appends, does not overwrite
- UUID matches the `8-4-4-4-12` format with version 4 marker and variant bits — important for future merge/sync correctness
- `savedAt` is a valid ISO date string
- Colors array is a **copy** — mutations to the caller's array do not corrupt saved data

#### `removePalette`

Removes only the matching entry; others untouched; missing ID is a silent no-op.

#### `setAllPalettes`

Bulk replace used by import/restore. Works with empty array (clears all saves).

#### `mergePalettes`

Import without overwriting. Tests: all-new, duplicate detection, mixed input, correct counts. A bug where duplicates were not detected would silently create duplicate palettes in the Open dialog.

#### `importPalettesFromFile`

Uses `FileReader` (available in jsdom). Tests: valid export resolves, missing `palettes` field rejects, malformed JSON rejects, invalid individual entries are filtered without rejecting the whole import.

#### `exportAllPalettes`

Verifies the DOM download pattern: `createElement('a')`, `appendChild`, link `click()`, `removeChild`. All three steps must execute for the browser to trigger a file download.

---

### 3.4 `helpers/urlShare.test.ts`

**Module:** [src/helpers/urlShare.ts](src/helpers/urlShare.ts)

URL sharing allows palette links to be shared. Encoding must be reversible; decoding must handle partial or malformed URLs gracefully (old links, user edits).

**Mocking strategy:** `window.location` is stubbed with `vi.stubGlobal` before each test. Functions read `window.location` at call time, so post-import stubbing works. `vi.resetModules()` in `afterEach` evicts module cache between tests.

#### `encodePaletteToUrl`

- Empty colors → origin + pathname only (no `?` params, clean URL)
- `#` stripped from all hex values (URL encoding omits the hash)
- `locked` param omitted when all unlocked (keeps share links clean for the common case)
- `locked` param included when any color is locked

#### `decodePaletteFromUrl`

- No `colors` param → `null` (no-op for the loader)
- `#` prefix added back, lowercase forced
- Invalid hex values filtered without crashing
- All invalid → `null`
- No `locked` param → all colors default to `true` (preserves the shared palette as-is)
- `locked` shorter than colors → padded with `true`
- `locked` longer than colors → trimmed

The padding/trimming behavior guards against manual link edits breaking the app.

#### `clearUrlParams`

Verifies `history.replaceState` is called with a URL that has no `colors` or `locked` params — the cleanup step after loading a shared palette.

---

### 3.5 `helpers/exportFormats.test.ts`

**Module:** [src/helpers/exportFormats.ts](src/helpers/exportFormats.ts)

Export formats must be correct for the receiving software to accept them. An incorrect ASE binary fails silently in Photoshop — no error, just no import.

Test palette: `['#ff5733', '#3498db', '#2ecc71']` — three distinct colors with known RGB values.

#### CSS

Starts with `:root {`, indexed `--color-1` through `--color-n` with correct hex values.

#### JSON

Valid JSON, `colors` array of correct length and values.

#### Tailwind

Contains `module.exports` and single-quoted keys (the template uses `.replace(/"/g, "'")`).

#### SCSS

Every line starts with `$color-`, correct count.

#### GPL (GIMP Palette)

Starts with `GIMP Palette` header. Correct RGB integer triplets verified against known input (`#ff5733` = R:255 G:87 B:51).

#### Paint.NET

Starts with `; Paint.NET` comment. Color lines start with `FF` (fully opaque alpha). Format is `AARRGGBB` — verified against `#ff5733` → `FFFF5733`.

#### ASE (Adobe Swatch Exchange)

Returns a `Blob`. Non-zero size. **First 4 bytes = `ASEF` (65, 83, 69, 70)**. Adobe software checks this signature immediately — a Blob missing it is rejected with no error message.

#### ACO (Photoshop Color Swatches)

Returns a `Blob`. First 2 bytes = version `1` (big-endian `uint16`).

#### Procreate (.swatches)

Returns a `Blob`. **First 2 bytes = `PK` (0x50, 0x4B)** — the ZIP local file header signature. Procreate `.swatches` files are ZIP archives; an invalid ZIP fails to import.

**Known limitation:** Full binary spec validation (complete ASE/ACO/ZIP parsing) is out of scope. The signature tests catch the most common generation bugs.

---

### 3.6 `helpers/platform.test.ts`

**Module:** [src/helpers/platform.ts](src/helpers/platform.ts)

Platform detection runs **at module load time** and sets a `const PLATFORM`. This controls modifier symbol rendering across all keyboard shortcut hints — getting it wrong means macOS users see `Shift` instead of `⇧`.

**Mocking strategy:** `PLATFORM` is a module-level constant set at import time. The only way to test both branches:
1. `vi.stubGlobal('navigator', { platform: 'MacIntel' })`
2. `const { getModifierLabel } = await import('@/helpers/platform')`
3. `vi.resetModules()` in `afterEach` to evict the cached module

#### Tests

- Mac (`platform='MacIntel'`): `shift` → `'⇧'`, `alt` → `'⌥'`
- Non-mac (`platform='Win32'`): `shift` → `'Shift'`, `alt` → `'Alt'`
- Unknown modifier: passthrough (the `??` fallback returns the input unchanged)
- `userAgentData.platform` takes priority over `navigator.platform` when present

---

### 3.7 `helpers/colorNaming.test.ts`

**Module:** [src/helpers/colorNaming.ts](src/helpers/colorNaming.ts)

Color naming provides human-readable labels ("Coral Reef", "Steel Blue") shown beneath each palette item. Oklab nearest-neighbor search over ~4K entries runs once at module load (~5ms) and is cached.

Tests verify the **result contract**, not specific color names (names depend on the `color-name-list` dataset which may change across package updates).

#### Tests

- Always returns a non-empty `name` string for any hex input
- Result shape has both `name` and `cssName` properties
- `cssName` is either `string` or `null` (never `undefined`)
- Exact CSS named colors return the correct `cssName`: `#ff0000` → `'red'`, `#0000ff` → `'blue'`, `#000000` → `'black'`, `#ffffff` → `'white'`, `#00ff00` → `'lime'` (not `'green'` — CSS green is `#008000`)

**Known limitation:** The threshold test for near-miss colors is type-check only. The actual threshold value (`0.0004` squared Oklab distance) is an implementation detail — if it changes, the near-miss behavior changes but the test remains valid.

---

### 3.8 `hooks/useHistory.test.ts`

**Module:** [src/hooks/useHistory.ts](src/hooks/useHistory.ts)

The undo/redo system tracks every palette change. A bug that fails to truncate future history after an undo would allow "ghost" future states — the user undoes, makes a change, but can still redo the old path. `renderHook` + `act()` from `@testing-library/react` are used to test the hook in isolation.

#### Initial state

- `current = history[initialIndex]`
- `canUndo` false at index 0, true when `index > 0`
- `canRedo` false at end, true otherwise
- Empty history: `current` is `undefined` (not a crash)

#### `push` — the critical truncation test

After an undo, `push` must slice off future entries. If it simply appended, the old future would remain accessible via `redo`, which violates the standard undo model and confuses users.

```
history: ['a', 'b', 'c'], index: 2
→ undo twice → index: 0, current: 'a'
→ push('d') → history: ['a', 'd'], canRedo: false
```

#### `undo`

Decrements index; no-op at index 0; enables `canRedo`.

#### `redo`

Increments index; no-op at end; enables `canUndo`.

#### `replace`

- Replaces entire history, defaults to last index
- Empty array → `index = -1`, `current = undefined` (special-cased)
- Out-of-bounds `nextIndex` is clamped — no array-out-of-bounds errors

#### Invariant sequences

- Push → undo → redo round-trip restores to pushed state
- At history midpoint, both `canUndo` and `canRedo` are true simultaneously
- Multiple push/undo/redo cycles maintain correct history array

---

## 4. Future Test Stubs

The following files exist with `it.todo()` markers. They document the expected behavior of planned features. When a feature lands, replace `it.todo('...')` with full implementations.

| File | Feature | Waiting on |
|------|---------|-----------|
| `future/colorHarmony.test.ts` | Color Harmony Score | Score function in `colorTheory.ts` |
| `future/gradientGenerator.test.ts` | Gradient Generator | `generateLinearGradient` etc. |
| `future/paletteVisualization.test.ts` | Palette Visualization | Slot assignment logic |
| `future/sessionHistory.test.ts` | Session Palette History | `useSessionHistory` hook |
| `future/paletteCollections.test.ts` | Collections & Tags | Extended `SavedPalette` type + filters |
| `future/extractFromImage.test.ts` | Extract from Image | Canvas-based quantization function |

**Protocol:** When implementing a future feature, activate and pass the corresponding stubs **before** marking the feature complete. The stubs document the contract the implementation must satisfy.

---

## 5. Mocking Reference

| Situation | Strategy |
|-----------|----------|
| `localStorage` | jsdom built-in; cleared in `setup.ts` `afterEach` |
| `window.location` | `vi.stubGlobal('location', {...})` before dynamic import + `vi.resetModules()` in `afterEach` |
| `platform.ts` `PLATFORM` const | `vi.resetModules()` + `vi.stubGlobal('navigator', ...)` + `await import(...)` |
| `URL.createObjectURL` | `vi.stubGlobal('URL', { createObjectURL: vi.fn(), revokeObjectURL: vi.fn() })` |
| `FileReader` | jsdom built-in — works natively with `new File(...)` |
| `document.createElement` + DOM download | `vi.spyOn(document, 'createElement').mockReturnValue(mockLink)` |
| `navigator.clipboard` | Out of scope — requires a secure context not available in jsdom |
| `colorNaming.ts` precomputation | No mocking needed — the ~4K entry computation is fast and cached per test run |

---

## 6. Coverage Goals

| Module | Target | Notes |
|--------|--------|-------|
| `colorTheory.ts` | 90%+ | Randomized functions have stochastic branches; tested via structural invariants rather than exact values |
| `contrast.ts` | 100% | Pure functions, no external state, fully deterministic |
| `storage.ts` | 85%+ | `exportAllPalettes` DOM interaction partially covered; `FileReader` error path tested |
| `urlShare.ts` | 85%+ | `copyShareUrl` (clipboard) excluded; other functions fully covered |
| `exportFormats.ts` | 80%+ | Binary format internals (CRC32, ZIP structure) tested via signatures only |
| `platform.ts` | 100% | Both branches (mac/other) covered via `vi.resetModules` pattern |
| `colorNaming.ts` | 70%+ | Oklab math tested via known inputs; near-miss threshold test is approximate |
| `useHistory.ts` | 95%+ | All public operations covered |

### What Coverage Does Not Tell You

100% coverage in `contrast.ts` does not mean the WCAG math is correct — it means every line ran. The tests for `relativeLuminance` and `contrastRatio` are the authoritative correctness check.

Coverage is a floor, not a ceiling. The goal is tests that catch regressions like the h=360 bug — not tests that inflate a metric.

### Out of Scope

- React component rendering (`App.tsx`, `PaletteItem.tsx`, etc.)
- Visual regression testing
- End-to-end browser tests (Playwright/Cypress)
- `navigator.clipboard` API (requires secure context)
- Native EyeDropper API (requires real browser with screen access)
- Color blindness SVG filter visual output

---

## 7. Contributing

### Adding a new feature

1. Write tests alongside or before the feature
2. If it touches `colorTheory.ts`, add to `colorTheory.test.ts`
3. New helper file → new `helpers/yourHelper.test.ts`
4. New hook → `hooks/useYourHook.test.ts`
5. Feature not yet built → add stubs to `future/`
6. Run `npm test` before committing — all existing tests must pass

### Fixing a bug

1. Write a test that reproduces the bug (it should fail)
2. Fix the bug
3. Confirm the test passes
4. The test is now a regression guard

The h=360 bug is the canonical example: `hslToHex({ h: 360, s: 100, l: 50 })` and its test should be read together as a matched pair.

---

*This document is maintained alongside the codebase. Update it when test files are added, stubs are activated, or coverage goals change.*
