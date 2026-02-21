# TODO - Feature Roadmap

Features we're making free that competitors paywall.

---

## CRITICAL BUGS

### ~~Double-delete crash~~ ✅ Fixed

**Fix:** Added `isDeleting` state guard in `AnimatedPaletteItem.tsx` — same early-return pattern used by theme/CVD transition guards (`if (isDeleting) return`). Subsequent clicks during the 250ms exit animation are ignored.

### ~~Preset rerolls don't persist in history~~ ✅ Fixed

**Fix:** Changed `applyPreset` in `App.tsx` from `replace([colors], 0)` (which wiped the entire history) to `push(colors)`, so preset applications and rerolls are appended to the undo/redo stack like any other palette change.

### ~~Contrast checker causes browser scrollbar jank~~ ✅ Fixed

**Fix:** Hidden the browser scrollbar on `html` via `scrollbar-width: none` (Firefox) and `::-webkit-scrollbar { display: none }` (Chrome/Safari) in `index.css`. Page remains scrollable via trackpad/mouse wheel/keyboard — the scrollbar is just not rendered, so no layout shift occurs when the contrast checker expands.

### ~~hslToHex boundary bug at h=360 produces gray~~ ✅ Fixed

**Bug:** `Math.round()` on hue floats near 359.5+ produced h=360, which mapped to `hNorm=1.0` in `hslToHex`. All branching conditions checked `< 1`, so none matched — `rPrime=gPrime=bPrime` stayed 0, producing pure gray regardless of saturation. Affected 5/8 presets (pastel, neon, jewel, warm, muted) whose hue ranges include the 0/360 boundary. Broke preset drift detection since the gray's s=0 fell outside every preset's saturation range.

**Fix:** Normalized hue input in `hslToHex`: `const hNorm = (((h % 360) + 360) % 360) / 360` — maps 360→0 and handles negative hues.

---

## Copy in Multiple Formats ✅

Let users click a color and copy in various formats:

- [x] HEX (`#ff5733`)
- [x] RGB (`rgb(255, 87, 51)`)
- [x] HSL (`hsl(14, 100%, 60%)`)
- [x] CSS variable (`--color-primary: #ff5733;`)
- [x] Tailwind config (`'primary': '#ff5733'`)
- [x] SCSS variable (`$color-primary: #ff5733;`)

**Implementation:** Dropdown menu appears when clicking the hex code below each palette item. Copy icon shows green checkmark on successful copy.

---

## Share via URL ✅

Encode the palette in a shareable URL for frictionless sharing.

- [x] Encode colors in URL params (e.g., `?colors=ff5733,3498db,2ecc71`)
- [x] Auto-load palette from URL on page load
- [x] Add "Copy Link" button to share current palette
- [x] Include locked states in URL (optional)

**Implementation:** Share button in controls area with Link icon. Press `C` to copy link. URL params auto-load on page visit and clear after loading.

---

## Export Palette ✅

Export the entire palette in standard formats for use in design tools and code.

### Code Formats
- [x] CSS variables (`:root { --color-1: #ff5733; ... }`)
- [x] JSON (`{ "colors": ["#ff5733", ...] }`)
- [x] Tailwind config (full `colors` object)
- [x] SCSS variables (`$color-1: #ff5733; ...`)

### Art App Formats
- [x] Adobe ASE (.ase) — Photoshop, Illustrator, Procreate, Clip Studio Paint
- [x] Adobe ACO (.aco) — Photoshop
- [x] Procreate Swatches (.swatches) — Procreate
- [x] GIMP Palette (.gpl) — GIMP, Krita, Inkscape
- [x] Paint.NET Palette (.txt) — Paint.NET

**UI/UX:**
- Export button in controls area with Download icon
- Press `E` to open export dialog
- Two-tab interface: "For Code" and "For Art Apps"
- App-specific selection with import instructions for each software
- Keyboard navigation with arrow keys, Tab to switch tabs
- Copy to clipboard for text formats, download for binary formats

**Help text (in export modal):**
> Can't find your format? Click any color's hex code to copy it individually.

**Implementation:** Text formats copied to clipboard, binary formats downloaded as files. Art app formats include full import instructions for each software.

---

## Color Blindness Preview (Phase 1 ✅)

Toggle to simulate how the palette appears to people with color vision deficiencies.

- [x] Deuteranopia (red-green, most common)
- [x] Protanopia (red-green)
- [x] Tritanopia (blue-yellow)
- [x] Achromatopsia (monochromacy, rare)
- [x] Toggle in UI to switch between normal and simulated views
- [x] Site-wide filter application (entire UI, not just palette)
- [x] localStorage persistence
- [x] Cross-browser support (Chrome, Firefox, Waterfox)
- [x] Circle wipe transition for theme toggle (Phase 3)
- [x] **FIX:** Horizontal wipe for CVD toggle — scoped to palette container bounds instead of full screen

**Implementation:** SVG filters with feColorMatrix using Viénot 1999 (deuteranopia, protanopia) and Brettel 1997 (tritanopia) algorithms. Filters embedded in React and applied to wrapper element for consistent cross-browser rendering.

**UX Notes:**
- This setting changes theming **site-wide** ✅ — the entire UI is viewable through the CVD simulation
- Theme toggle: circle wipe from click point ✅
- CVD toggle: horizontal wipe (needs refinement — should span palette colors, not full screen)

---

## Contrast Checker ✅

Show WCAG contrast ratios between colors for accessibility compliance.

- [x] Calculate contrast ratio between any two colors
- [x] Show AA (4.5:1), AAA (7:1), and AA18 (3:1) compliance levels
- [x] Matrix view showing all color pair contrasts
- [x] Per-color cards showing contrast vs theme backgrounds (light/gray/dark)
- [x] Human-readable contrast descriptions per color
- [x] Tabbed UI (line variant) — "vs backgrounds" and "vs each other"
- [x] Crossfade animation between tabs (150ms, forceMount + grid stack)
- [x] Tab bar fades in/out when crossing the 2-color threshold
- [x] Auto-reset to "vs backgrounds" tab when colors drop below 2
- [x] Keyboard shortcut: `K` toggles panel, `Shift+K` cycles tabs (disabled when < 2 colors)
- [x] Keyboard hints reflect disabled state (dimmed at 30% opacity)
- [x] Expandable/collapsible with smooth max-height + opacity transition

**Implementation:** Uses relative luminance formula from WCAG 2.1 spec. Pure client-side calculation. Radix Tabs with forceMount for CSS-driven crossfade transitions.

---

## Quick Palette Presets ✅

One-click generation of popular palette styles for users who don't know color theory.

- [x] Pastel
- [x] Neon / Vibrant
- [x] Earth tones
- [x] Jewel tones
- [x] Monochrome
- [x] Warm
- [x] Cool
- [x] Muted / Desaturated

**Implementation:** Predefined HSL ranges for each preset with lightness stratification for contrast spread. Toolbar dropdown with Sparkles icon, `P` key to cycle presets, confirmation dialog when locked colors would be replaced. Generator in `colorTheory.ts` handles hue wrapping (warm preset), full-hue spacing with jitter, and monochrome special case.

---

## Preset Browser Overhaul ✅

Redesign the preset selector to feel like a synth VST preset browser.

### Icon
- [x] Replace Sparkles icon — it's been co-opted by gen AI and sends the wrong signal
- [x] Pick a neutral icon (e.g. Palette, Layers, SwatchBook, or similar)

### Navigation
- [x] Left/right arrow buttons flanking the preset name, visually attached
- [x] Arrows cycle through presets and auto-apply on click (no extra confirm step)
- [x] Lock warning modal still triggers when locked colors exist

### Hover interaction
- [x] On hover, preset name text becomes two icon-only buttons: expand dropdown + reroll
- [x] Both buttons are purely symbol-based (no text labels)
- [x] Dropdown opens full preset list for direct selection
- [x] Reroll regenerates the current preset

### Active preset label
- [x] When a preset is selected, show its name in the text label (e.g. "pastel")
- [x] Default text when no preset is active (e.g. "presets")
- [x] Detect "broken" preset state: if one or more colors fall outside the preset's stated HSL bounds, the preset is no longer active
- [x] Broken state triggers: user edits a color, rerolls, adds/removes colors, or any color drifts out of the preset's H/S/L ranges
- [x] Transition from preset name back to default text with a fade animation

### Keyboard
- [x] `P` continues to cycle presets (existing)
- [x] Consider left/right arrow support when preset selector is focused

---

## Mobile / Responsive Design

The app is desktop-only today. Making it genuinely usable on phones and tablets is a prerequisite before any serious growth. This is a full layout pass — not a polish task.

### Root causes (from BUGS.md)
- Fixed widths (`w-[200px]`, `size-[200px]`, etc.) cause horizontal overflow at narrow viewports or high zoom levels
- Bottom fade overlay has `pointer-events: auto` and blocks toolbar buttons at 150%+ browser zoom (softlock)
- Touch targets are too small (action buttons below palette items, HSL dot, lock icon)
- Keyboard hints bottom bar is not responsive — wraps badly, overlaps controls

### Layout

- [ ] Audit all fixed widths — replace with responsive equivalents (`clamp()`, `max-w`, `w-full`, responsive classes)
- [ ] Add `overflow-x: hidden` to root container as a safety net while the audit runs
- [ ] Test at 375px, 390px, 414px (common phones), 768px (tablet), and 1024px (small laptop)
- [ ] Test at 100%, 125%, 150%, 200% browser zoom on desktop
- [ ] Palette circles: shrink gracefully on narrow viewports using `clamp()` or responsive size classes
- [ ] Two-row palette layout: verify grid/flex works at narrow widths without overflow
- [ ] Header: responsive breakpoints — collapse or hide labels at narrow widths
- [ ] Controls toolbar: consider a scrollable row or stacked layout on mobile
- [ ] Contrast checker panel: verify it doesn't overflow on small screens
- [ ] Keyboard hints bar: hide on mobile (touch devices) or collapse to a toggle

### Touch / Interaction

- [ ] Increase touch target size to ≥44px for all interactive elements (WCAG 2.5.5)
  - [ ] Lock icon on palette items
  - [ ] Action buttons (delete, edit, reroll, variations)
  - [ ] HSL picker dot
  - [ ] Preset browser arrows
  - [ ] Close / back buttons in dialogs and panels
- [ ] Verify drag-to-reorder works reliably on touch (pointer events + `touch-action: none` already in place — test on real devices)
- [ ] Tap-to-lock vs tap-to-color — review gesture conflicts on mobile

### Overlays / Z-index

- [ ] Fix keyboard hints fade gradient: set `pointer-events: none` so it never blocks clicks
- [ ] Only show bottom fade when hints are actually overflowing (check scroll height vs client height)
- [ ] Audit all overlay `z-index` values — ensure header stays above all overlays on mobile
- [ ] Dialogs (export, save, open, docs): verify they don't overflow viewport height on small screens; add internal scroll if needed

### Mobile-specific layout (stretch)

- [ ] Consider a single-column stacked layout for phones: palette → controls → panels (vs. side-by-side)
- [ ] Evaluate whether the Hero section needs to be hidden or collapsed on mobile to save vertical space
- [ ] Bottom sheet pattern for dialogs on mobile (slides up from bottom) instead of centered modals

**Implementation notes:** Start with the pointer-events softlock (quick win, unblocks usage). Then do the fixed-width audit (biggest structural change). Touch target pass last (CSS only, low risk). Stretch goals only after layout is stable.

---

## IndexedDB Migration (Low Priority)

Evaluate moving from localStorage to IndexedDB for future-proofing storage.

**Current state:** localStorage usage is ~150 bytes per saved palette + a handful of preference flags. At ~5MB ceiling, we can store ~30,000 palettes — nowhere near the limit today.

### Research
- [ ] Audit current localStorage keys and projected growth per feature (extract from image caching? undo history persistence? palette collections/tags?)
- [ ] Compare IndexedDB API ergonomics: raw API vs. lightweight wrappers (idb, Dexie, localForage)
- [ ] Evaluate bundle size cost of each wrapper
- [ ] Research IndexedDB browser support and quota limits (especially Safari/iOS gotchas, storage eviction in private browsing)
- [ ] Determine migration path: can we read existing localStorage data and migrate on first load?
- [ ] Assess whether a unified storage abstraction (`storage.ts` interface that swaps backend) is worth the indirection

### When to pull the trigger
- Storing binary blobs (extracted images, generated palette thumbnails)
- Persisting undo history across sessions
- Adding palette collections, tags, or searchable metadata
- Any feature where localStorage's synchronous, string-only API becomes painful

**Until then:** localStorage is fine. Don't over-engineer.

---

## Extract from Image

Drag-and-drop an image to extract dominant colors.

- [ ] Drag-and-drop zone or file picker
- [ ] Extract 3-5 dominant colors from image
- [ ] Use color quantization algorithm (k-means or median cut)
- [ ] Preview extracted colors before adding to palette

**Implementation:** Use Canvas API to read pixel data. Implement k-means clustering or use a lightweight library. Fully client-side.

---

## Color Naming ✅

Show the closest human-readable color name under each palette item (e.g. "Coral Reef", "Midnight Blue").

- [x] Nearest-neighbor lookup by Oklab distance
- [x] Display color name between action buttons and hex code on each palette item
- [x] Use `color-name-list/bestof` (MIT license, ~4K curated names)
- [x] Show CSS named color tooltip if within threshold (~0.02 Oklab distance)

**Implementation:** `colorNaming.ts` helper converts hex → Oklab (Bjorn Ottosson 2020) via sRGB linearization → LMS → cube root → Oklab matrices. Pre-computes ~4K color entries at module load (~5ms). Brute-force nearest neighbor using squared Euclidean distance in Oklab. CSS named colors (~148) checked separately with tighter threshold. Displayed in `PaletteItem.tsx` with `useMemo`, truncated with ellipsis, tooltip shows CSS color name when applicable. **No Pantone** — proprietary and aggressively enforced.

---

## Color Variations Panel ✅

Click any color to see tints (lighter), shades (darker), and tones (desaturated).

- [x] Generate 9 tints (increase L toward 97)
- [x] Generate 9 shades (decrease L toward 3)
- [x] Generate 9 tones (decrease S toward 2)
- [x] Click any variation to copy hex, shift+click to replace palette color
- [x] Panel replaces palette row with crossfade transition
- [x] Distinct swatch shapes: rounded squares (tints), diamonds (shades), pentagons (tones)
- [x] Source color highlighted as first swatch in each row
- [x] Staggered entrance animation (30ms per swatch)
- [x] Blend icon button on each palette item + `V 1-5` keyboard chord
- [x] Back button or Escape to return to palette

**Implementation:** HSL interpolation in `colorTheory.ts` (`generateTints/Shades/Tones`). `ColorVariations.tsx` panel with shaped swatches via CSS (`rounded-lg`, `rotate-45`, `clip-path: polygon`). Leader key chord in `useKeyboardShortcuts.ts` using `useRef` to track last keypress within 500ms window. Crossfade via absolute positioning + opacity/scale transitions in `App.tsx`.

---

## Palette Visualization / Preview Mode

Full-screen preview mode to see your palette in context. Accessed via a preview button in the toolbar.

### Preview Modes
- [ ] **Dynamic mosaic** — full-screen abstract composition using palette colors (default)
- [ ] **UI elements** — cards, buttons, nav bars, form inputs with palette applied
- [ ] **Title design** — large typography compositions showcasing the palette

### UI
- [ ] Preview button in toolbar (Eye or Maximize icon)
- [ ] Keyboard shortcut: `F` for fullscreen preview
- [ ] Bottom bar with mode switcher (mosaic / ui / title)
- [ ] Press `Esc` or click anywhere to exit
- [ ] Smooth fade transition in/out

### Mosaic Mode
- [ ] Randomly generated geometric shapes (circles, rectangles, triangles)
- [ ] Each shape uses a palette color
- [ ] Regenerate layout on each open or with a refresh button
- [ ] Optional: subtle animation (floating, pulsing)

### UI Elements Mode
- [ ] Sample mockup with primary, secondary, accent, background, text slots
- [ ] Auto-assign palette colors to slots based on luminance
- [ ] Multiple templates: dashboard, landing page, mobile app
- [ ] Copy CSS variable assignments

### Title Design Mode
- [ ] Large display typography with palette colors
- [ ] Multiple layouts: stacked, side-by-side, overlapping
- [ ] Editable placeholder text

**Implementation:** Pure CSS/HTML components, no external assets. Canvas API for mosaic generation. Realtime Colors does a version of UI preview; most tools paywall it or don't offer it.

---

## Drag to Reorder ✅

Drag palette colors to rearrange their order. Color order matters in design (primary, secondary, accent…) but currently colors are fixed in the position they were added.

- [x] Drag-and-drop reordering of palette items
- [x] Visual feedback during drag: lifted appearance, drop target indicator
- [x] Smooth animated reflow when items shift position
- [x] Touch support for mobile (pointer events handle touch natively, `touch-action: none` on circles)
- [ ] Keyboard equivalent: `Shift+Arrow` to move the focused color left/right (deferred — needs focus model)
- [x] Locked state and all per-color metadata travel with the dragged item
- [x] Reorder pushes to undo history (reorderable via undo/redo)

**Implementation:** `usePaletteDrag` hook in `src/hooks/usePaletteDrag.ts` manages pointer events and drag state. Pointer capture on the circle element; 8px movement threshold distinguishes drag from click-to-lock. Dragged item follows pointer via `transform: translate()` with scale-up and drop-shadow. Displaced items slide with `transition: transform 200ms`. Drag disabled during edit mode. Both `colors` and `lockedStates` arrays reordered in sync via `reorderColors` callback in `App.tsx` (calls `push()` for undo support).

**Keyboard reorder (future):** Needs a "focused color" concept before `Shift+Arrow` can work. Options: leader-key chord (press 1-5 then arrow), implicit focus tracking, or explicit selection state. Deferred until a focus model is designed.

---

## EyeDropper / Color Picker ✅

Pick a color from screen (Chromium) or OS color picker (Firefox/Safari) and add it to the palette.

- [x] Pipette button in controls area (Lucide Pipette icon)
- [x] Keyboard shortcut: `I`
- [x] Chromium: native EyeDropper API (`await new EyeDropper().open()`)
- [x] Firefox/Safari fallback: hidden `<input type="color">` opens OS color picker
- [x] Picked color added to palette (disabled at MAX_COLORS = 10)
- [x] Per-color edit mode: Pipette icon next to `•` dot (Chromium only) — pick replaces edit value
- [x] Feature detection via `'EyeDropper' in window`

**Implementation:** `eyeDropper.ts` helper exports `hasEyeDropper` boolean and `pickColorNative()` async function. Toolbar button in Controls triggers EyeDropper or falls back to hidden color input in App.tsx. In PaletteItem edit mode, Pipette icon appears left of HSL dot on Chromium — picked color fills the hex input live. Zero dependencies.

---

## Expand to 10 Colors ✅

Raise the palette limit from 5 to 10 colors with a two-row layout and position-to-position animations. Palette limit of 5 was the industry floor shared by every free competitor (Coolors charges $3.49/mo for 6+).

- [x] `MAX_COLORS = 10` exported constant in `colorTheory.ts` (replaces all hardcoded `5` guards)
- [x] `getRowSplit(count)` pure function: 1–5 → single row; 6→3+3, 7→4+3, 8→4+4, 9→5+4, 10→5+5
- [x] Stable `colorIds: string[]` parallel state (UUIDs per color, threaded through all mutations like `lockedStates`)
- [x] Install Framer Motion — `layoutId` + `layout` props for position-to-position animations when row split changes
- [x] `AnimatedPaletteItem.tsx` — replaced manual CSS `setTimeout`/`isDeleting` pattern with Framer `motion.div`
- [x] `AnimatedPaletteContainer.tsx` — two-row layout with `LayoutGroup` + `AnimatePresence`; `AddColor` button follows last active row
- [x] `usePaletteDrag.ts` — 2D rewrite: Euclidean nearest-center drop target, row-aware slide transforms (Y-proximity threshold 50px)
- [x] Keyboard shortcuts: regex `[1-5]→[0-9]`, `0` → position 10; all shortcut labels updated to `1-9, 0`
- [x] Docs: 9 prose/Kbd references updated; v0.12 changelog entry; competitor table row added

**Implementation:** `getRowSplit` in `colorTheory.ts` maps count → `[row1Count, row2Count]`. `colorIds` uses `crypto.randomUUID()` per color, synced in all 7 mutations (add, addPicked, delete, reorder, applyPreset, URL load, open saved). Framer `layoutId` matching lets circles animate physically across DOM parents (row 1 → row 2) when the split changes. Drag updated from X-axis-only slot offsets to 2D nearest-center with per-row translate shifts.

---

## Color Harmony Score

A live readout showing how harmonious the current palette is, based on color theory fundamentals.

### Metrics
- [ ] Hue distribution — are hues well-spaced or clustered? (entropy of hue angles)
- [ ] Saturation balance — consistent saturation or chaotic?
- [ ] Lightness spread — good contrast range or everything mid-tone?
- [ ] Relationship detection — does the palette approximate a known harmony (complementary, triadic, etc.)?

### Display
- [ ] Compact badge or gauge near the palette (not a full panel)
- [ ] Human-readable label: e.g. "balanced", "high contrast", "clustered hues", "monochromatic"
- [ ] Optional numeric score (0-100) with tooltip breakdown
- [ ] Updates live as colors change
- [ ] Keyboard shortcut: `H` to toggle visibility

### Edge cases
- [ ] Single color: hide or show "add more colors"
- [ ] Two colors: limited analysis (contrast only)
- [ ] All identical colors: "no variation"

**Implementation:** Score function in `colorTheory.ts` operating on HSL arrays. Hue distribution via circular variance, saturation/lightness via standard deviation. Relationship detection by comparing pairwise hue angles to known patterns (±10° tolerance). Lightweight — no heavy math, just stats on 2-5 values.

---

## Palette Collections and Tags

Organize saved palettes into collections and tag them for easy retrieval.

- [ ] Add tags when saving a palette (comma-separated or pill input)
- [ ] Suggested tags: project names, moods (warm, calm, bold), seasons, use cases (UI, illustration, branding)
- [ ] Filter saved palettes by tag in the Open dialog
- [ ] Search saved palettes by name or tag
- [ ] Create/rename/delete collections (optional grouping layer above tags)
- [ ] Bulk actions: delete multiple, add tag to multiple
- [ ] Migrate existing saved palettes (add empty tags array, backward compatible)

**Implementation:** Extend `SavedPalette` type with `tags: string[]` field. Tag input component with autocomplete from existing tags. Filter UI in `OpenDialog.tsx` — pill-based tag filter bar above the palette list. All stored in localStorage (or IndexedDB when migrated). No breaking changes to existing data — migration adds defaults on first load.

---

## Session Palette History

A visual timeline of every palette state generated during the current session. Solves the "that palette from 15 rerolls ago looked great" problem.

- [ ] Thumbnail strip showing recent palette states as small color bars
- [ ] Appears as a collapsible row above or below the main palette
- [ ] Click any thumbnail to restore that palette state
- [ ] Restoring from history pushes to undo stack (non-destructive)
- [ ] Auto-captures on: reroll, preset apply, add/delete color, edit color, reorder
- [ ] Deduplication: don't store consecutive identical states
- [ ] Cap at ~50 entries to keep memory bounded
- [ ] Session-only — not persisted to localStorage (intentional: keeps it lightweight)
- [ ] Keyboard shortcut: `G` to toggle history strip visibility

### Display
- [ ] Each thumbnail: 4-5 thin vertical color bars, ~40px wide
- [ ] Hover preview: tooltip with hex codes
- [ ] Current state highlighted with border/ring
- [ ] Smooth horizontal scroll with overflow

**Implementation:** Store palette snapshots (hex arrays) in a `useRef` array in `App.tsx`. Render as a horizontal scrollable strip with `overflow-x: auto`. Each thumbnail is a flex row of colored `div`s. Clicking dispatches to `useHistory.replace()`. No persistence, no dependencies.

---

## Gradient Generator

Generate CSS gradients from palette colors.

- [ ] Linear gradient (configurable angle)
- [ ] Radial gradient
- [ ] Conic gradient
- [ ] Copy as CSS
- [ ] Visual preview of gradient

**Implementation:** Build gradient CSS strings from palette hex values. Simple UI with angle picker and type selector. Coolors Pro and Colorffy Pro paywall this.

---

## Keyboard Shortcut Dialog Overhaul ✅

Redesigned the keyboard hints overlay to scale gracefully with grouped layout and OS-aware modifier symbols.

- [x] Group shortcuts by category (palette, per-color, file, view, general)
- [x] Cleaner layout — 5-column grouped bottom bar with category labels
- [x] Visual hierarchy — group labels, disabled shortcuts dimmed at 30% opacity
- [x] Structured shortcut data (`SHORTCUT_GROUPS` with `ShortcutDef` / `ShortcutGroup` types)
- [x] OS-aware modifier rendering — `⇧`/`⌥` on macOS, `Shift`/`Alt` on Windows/Linux
- [x] Platform detection via `navigator.userAgentData` with `navigator.platform` fallback (`src/helpers/platform.ts`)
- [x] Separate `<kbd>` per modifier — `⇧` `⌥` `1-5` instead of single `Shift+Alt+1-5` box
- [x] Modifier symbol kbds sized larger to compensate for Unicode glyph rendering

**Implementation:** Replaced flat `KEYBOARD_SHORTCUTS` array with grouped `SHORTCUT_GROUPS` constant. `getModifierLabel()` in `platform.ts` maps modifier names to OS-appropriate symbols at module load. Bottom bar preserved (not a dialog) for glanceability — new users can reference shortcuts while building muscle memory.

---

## Full Keyboard Coverage ✅

Every action in the tool should be reachable from the keyboard. Power users should never need to reach for the mouse.

- [x] Delete a specific color (`Shift+1-5`)
- [x] Edit a specific color (`Shift+Alt+1-5`)
- [x] Reroll a single color (`Alt+1-5`)
- [x] Cycle color relationship mode
- [x] Cycle CVD simulation mode
- [x] Navigate between colors (arrow keys)
- [x] Copy current color in default format
- [x] All shortcuts discoverable through keyboard hints (`?`)

**Implementation:** Full keyboard control added via `useKeyboardShortcuts.ts`. Bare keys for common actions, `Shift+` for secondary, `Alt+` for per-color. No `Ctrl/Cmd+` combos to avoid browser conflicts.

---

## Inline Color Editing ✅

Replace the edit color modal with inline editing directly on the hex label below each color circle. Clicking the pencil icon (or `Shift+Alt+1-5`) turns the hex label into a text input in-place.

- [x] When editing, swap the hex label with a styled `<input>` at the same position/size
- [x] Input pre-filled with current hex value, auto-selected
- [x] Enter to confirm, Escape to cancel, click-away cancels
- [x] Input styling matches hex label (font-mono, text-xs, uppercase, underline)
- [x] Live preview: circle color updates as user types valid hex
- [x] Validation: invalid hex on Enter flashes red border, stays in edit mode
- [x] Removed `EditColorDialog.tsx`
- [x] `Shift+Alt+1-5` triggers inline edit (unchanged shortcut, new behavior)

**Implementation:** `isEditing` prop flows from `App.tsx` → `AnimatedPaletteContainer` → `AnimatedPaletteItem` → `PaletteItem`. When active, `<ColorFormatMenu>` is replaced by `<input>` with matching styling. Live preview via `previewColor` on the circle's `backgroundColor`. `EditColorDialog.tsx` deleted.

---

## PalettePort (Paid Feature — Kick the Can)

The only paid feature. A lightweight social palette gallery where users can browse, share, and discover palettes published by other people. Think "community presets" — not a full social network, just a curated feed of color palettes behind a paywall.

**Core philosophy:** PalettePort exists so we have something to offer in exchange for financial support. It does NOT paywall any features. Every tool, every export format, every accessibility feature — free, forever. PalettePort is purely additive. If users organically create a subreddit, Discord, or forum to trade shareable links, that's great — we will not compete with that or take action against it. PalettePort is a thank-you, not a tollbooth.

### Competitor Pricing (What We're Undercutting)

| Tool | Price | What they paywall |
|------|-------|-------------------|
| **Coolors Pro** | ~$3.49/mo | Contrast checker, palette variations, >5 colors, unlimited saves, palette visualizer layouts, dark mode, advanced exports, AI, ad removal |
| **Colorffy Pro** | $5/mo ($3.33/mo annual) | AI tools, unlimited collections, branding kit PDF, code exports (CSS/SCSS/Tailwind/Swift/Flutter), wallpapers, ad-free |
| **Adobe Color** | "Free" w/ Creative Cloud ($23-70/mo) | Effectively paywalled behind CC subscription for any real workflow |
| **Khroma** | Free | Limited feature set, AI-only generation |
| **Realtime Colors** | Free | Limited feature set, no export, no save |
| **Paletton** | Free | Dated UI, no export formats, no accessibility tools |
| **Color Hunt** | Free | Browse-only, no generation tools |

**What we give away free that Coolors charges $3.49/mo for:**
- Contrast checker ✅
- Palette variations (tints/shades/tones) ✅
- Advanced exports (CSS, JSON, Tailwind, SCSS, ASE, ACO, GPL, Procreate, Paint.NET) ✅
- Dark mode (and gray mode) ✅
- Unlimited saves ✅
- Color blindness simulation ✅
- Color naming ✅
- Full keyboard coverage ✅

The competitive position is absurd: our free tier already beats their paid tier. PalettePort pricing should make this unmistakable.

### Pricing
- **$6.99 one-time** — lifetime access, no recurring, best value
- **$0.99/month** — subscription for those who prefer it
- Positioned as: "everything is free — this is how you support continued development"
- No free tier for PalettePort itself — but the entire standalone app remains 100% free forever
- No feature gating on the free tool — PalettePort is purely additive, purely optional

For context: Coolors charges $3.49/mo for features we ship free. We charge $0.99/mo (or $6.99 forever) for a community gallery that users don't even need. The comparison should make competitors look ridiculous.

### Messaging
The paywall should feel like supporting a project you believe in, not getting squeezed. Communicate clearly:

- "your support keeps this tool free for everyone"
- "100% of the core tool is free, forever — PalettePort funds continued development"
- "other tools charge $3-5/mo for features we give you for free — if you want to support us, here's how"
- Tone: grateful, honest, zero guilt-tripping — never "you owe us", always "here's what your support makes possible"
- Show what's been shipped for free (the feature list is the proof — contrast checker, export formats, CVD simulation, etc.)
- Consider a "supporters" or "thank you" acknowledgment somewhere visible (footer? about dialog?) — not names, just a count or a warm message
- No dark patterns: no fake urgency, no "limited time pricing", no nagging modals on the free tool
- If someone finds a free alternative to the community aspect (subreddit, Discord, forum), that's fine — we celebrate it, not fight it

### AI Commitment

**No generative AI features in the product. Ever. For as long as it exists.**

- No AI color suggestions, no AI palette generation, no AI chatbot, no "powered by" anything
- Every feature is deterministic: color theory math, algorithms, user input — no black boxes
- Competitors are bolting on AI to justify subscription pricing (Coolors AI, Colorffy AI). We go the other direction
- This is a competitive advantage, not a limitation — users who want predictable, transparent tools will seek this out

**Transparency on development:** This project was built with some use of generative AI for programming assistance (code generation, debugging, planning). That should be disclosed honestly. The distinction is clear: AI helped write the code, but no AI runs in the product. The user never interacts with a model. Every color, every calculation, every result is algorithmic and reproducible.

**Where to communicate this:**
- About page / footer: brief statement ("no AI features, ever — just math and color theory")
- If competitors lean harder into AI marketing, this becomes a stronger differentiator
- Don't be preachy about it — state it plainly and move on

### Monetization Phases

**Phase 0: Donations (do this first, do this NOW)**
- Add a Ko-fi / Buy Me a Coffee / GitHub Sponsors link
- Zero engineering cost, zero server cost, pure upside
- Validates willingness to pay before building anything
- Use the same messaging: "keep this tool free for everyone"
- Can launch today with a button and a sentence

**Phase 1: PalettePort (only when ready)**
- Build the community gallery behind the $6.99 / $0.99 paywall
- Only after the free tool is feature-complete AND there's meaningful traffic (5K+ MAU)
- Only if users are actively requesting community features

**Phase 2: Enterprise (explore if Phase 1 succeeds)**

Use WorkOS as the unified auth layer across all paid tiers. Their free tier (1M MAU) covers both PalettePort consumer auth and basic enterprise org auth — zero cost until an enterprise customer needs SAML/SCIM.

#### Auth: WorkOS

| Feature | Cost | Notes |
|---------|------|-------|
| AuthKit (email, social, MFA, RBAC, orgs) | **Free** up to 1M MAU | Covers all PalettePort + basic enterprise auth |
| SSO (SAML/OIDC) | $125/mo per connection | Pass through to enterprise customer with margin |
| Directory Sync (SCIM) | $125/mo per connection | Auto-provision/deprovision users from Okta, Azure AD, etc. |
| Audit log streaming | $125/mo per SIEM connection | Enterprise compliance requirement |
| Custom domain | $99/mo | `auth.companyname.com` white-labeling |

WorkOS AuthKit is open-source, built on Radix (same as our shadcn/ui components), integrates in <10 minutes via hosted flow. This eliminates auth as a rabbit hole — no rolling our own, no Clerk/Lucia/Auth.js evaluation needed.

#### What enterprise customers would get

**Brand palette management:**
- Org-wide shared palette library (the canonical brand colors)
- "Approved" palette status — mark palettes as official, prevent drift
- Palette versioning: track changes to brand colors over time, with diff view
- Role-based access: admin (set/edit brand palettes), editor (create palettes using brand), viewer (read-only)

**Design token pipeline:**
- Auto-generate design tokens from brand palettes (CSS variables, Tailwind config, SCSS, JSON)
- Webhook or API: push updated tokens to repos on palette change
- CI/CD validation: lint step that checks committed colors against approved brand palette
- Figma plugin sync (stretch goal — huge value, also huge effort)

**Collaboration:**
- Share palettes within org (private by default, not public to PalettePort gallery)
- Request/approve workflows: designer proposes palette → lead reviews → approved or rejected
- Comments on palettes (lightweight, not a full discussion system)

**Compliance and governance:**
- WCAG contrast requirements enforced at org level (e.g., "all brand palettes must pass AA")
- Audit log: who changed which brand color, when, with before/after
- Export compliance reports for accessibility audits
- CVD simulation applied to brand palettes in bulk

**Integration / API:**
- REST API to fetch org palettes programmatically
- API keys with scoped permissions (read-only for CI, read-write for admins)
- Rate-limited, versioned, documented

#### Enterprise pricing model

| Tier | Price | Includes |
|------|-------|----------|
| Team (up to 10 seats) | $49/mo flat | Shared libraries, RBAC, design token export, API access |
| Business (up to 50 seats) | $149/mo flat | + approval workflows, audit log, WCAG enforcement |
| Enterprise (50+ seats) | Custom | + SSO (SAML/SCIM), directory sync, SLA, priority support |

SSO pass-through: WorkOS charges $125/mo per SAML connection. Enterprise tier pricing should absorb this (e.g., $249/mo includes 1 SSO connection, additional connections at $100/mo).

**Why flat-rate tiers, not per-seat:**
- Per-seat discourages adoption within orgs ("do we really need to add the intern?")
- Flat rate with seat caps encourages full-team usage
- Easier to understand, easier to sell
- Upgrade trigger is organic: team outgrows cap, bumps to next tier

#### Enterprise research needed

- [ ] Is there actual demand from design system teams for this? Talk to designers at companies
- [ ] What do design teams currently use for brand color management? (Figma libraries, Notion docs, custom tools, nothing?)
- [ ] Would teams use a standalone palette tool, or does it need to plug into Figma/Sketch/Adobe?
- [ ] Competitive landscape: Specify, Zeroheight, Supernova — do they cover this? At what price?
- [ ] What's the minimum viable enterprise feature set? (Probably: shared library + RBAC + API + SSO)
- [ ] Can enterprise be built incrementally on top of PalettePort's backend, or does it need separate infrastructure?

**Warning:** Enterprise is still a big lift. But WorkOS eliminates the single scariest part (auth/SSO). The remaining work is org data modeling, RBAC enforcement, and API — meaty, but not unknowable. Don't start until Phase 1 proves the backend works and there's inbound enterprise interest.

### What it is
- Browse palettes shared by other users
- Curated "home page" with editor's picks, trending, and new
- Filter/search by tags, color, mood, preset type
- One-click import: pull any community palette into your local tool
- "Publish" button in the existing save flow — opt-in sharing to the gallery
- Like/favorite palettes (lightweight interaction, not full social)
- User profiles are minimal: display name + published palettes (no bios, no followers, no DMs)

### What it is NOT
- Not a social network — no feeds, no comments, no followers graph
- Not a marketplace — no selling palettes, no premium creators
- Not a collaboration tool — no shared editing, no real-time co-creation
- Not required — the tool works 100% without it, forever

### Architecture (the hard part)

This is a full rearchitecture. The current app is entirely client-side with zero backend. PalettePort requires:

- [ ] **Backend API** — REST or tRPC service for palette CRUD, browse, search, curation
- [ ] **Database** — palette storage, user accounts, likes, tags, curation metadata
- [ ] **Authentication** — account creation, login, session management (OAuth? email/password? magic link?)
- [ ] **Payment processing** — Stripe integration for one-time and subscription billing
- [ ] **Entitlement system** — verify paid status, gate PalettePort features client-side and server-side
- [ ] **Content moderation** — palette names/tags could contain slurs; need basic filtering at minimum
- [ ] **CDN / hosting** — the free app is static; PalettePort needs a running server
- [ ] **CI/CD pipeline** — deployment for backend, database migrations, monitoring
- [ ] **Rate limiting / abuse prevention** — prevent spam publishing, scraping, etc.

### Research (before writing a single line of code)

#### Business viability
- [ ] Is there actual demand? Survey existing users / post in design communities
- [ ] Competitive landscape: who else does community palettes? (Coolors explore is free, Color Hunt is free, Colour Lovers is dead) — what's the moat?
- [ ] Pricing validation: is $6.99 one-time sustainable? Model server costs vs. expected conversion rate
- [ ] Will anyone pay $1/month for this when free alternatives exist? What's the unique value prop?

#### Technical stack
- [ ] Backend framework: Node/Express, Hono, Next.js API routes, Go, Rust — what fits a solo/small team?
- [ ] Database: Postgres (Supabase? Neon?), SQLite (Turso?), or something managed?
- [ ] Auth provider: Clerk, Auth.js, Supabase Auth, Lucia, roll-your-own?
- [ ] Payment: Stripe (obvious choice) — one-time + subscription in same product, webhook handling
- [ ] Hosting: Vercel, Railway, Fly.io, self-hosted VPS — cost at low scale?
- [ ] How to keep the free app fully static while adding a backend for PalettePort only?
- [ ] Can PalettePort be a separate deployment/subdomain that the main app calls into? (e.g. `port.colorpalette.app`)

#### Data model
- [ ] Palette schema: colors, name, tags, author, created_at, likes_count, curated flag
- [ ] User schema: id, display_name, email, payment_status, created_at
- [ ] How to handle palette versioning (user edits a published palette)?
- [ ] How to handle deleted accounts (orphan palettes? anonymize? delete?)

#### UX integration
- [ ] Where does PalettePort live in the existing UI? Separate tab? Separate route? Dialog?
- [ ] How does the free → paid boundary feel? Soft gate (preview + blur) or hard gate (button → paywall)?
- [ ] What does "publish" look like in the save flow? Extra toggle? Separate action?
- [ ] Offline behavior: what happens when the backend is down? Free features must work regardless

#### Legal / compliance
- [ ] Terms of service for user-generated content
- [ ] Privacy policy (storing emails, payment data)
- [ ] GDPR / data deletion requests
- [ ] Tax implications of selling digital goods (VAT, sales tax per jurisdiction)

### Financial Model (Revisit With Real User Numbers)

**Stripe fee reality:**
- $0.99/mo subscription → **$0.66 net/mo** (Stripe takes 33% — brutal on micro-transactions)
- $6.99 one-time → **$6.49 net** (Stripe takes 7.2% — much more efficient)

**Blended revenue per paying user:**
Assuming 60% choose one-time, 40% choose monthly. One-time amortized over ~18 months average product lifetime.
- One-time amortized: $6.49 / 18 = ~$0.36/mo
- Monthly sub: $0.66/mo
- **Blended: ~$0.48/mo per paying user**

**Estimated monthly infrastructure costs:**

| MAU | Hosting | DB | Auth | Misc | Total |
|-----|---------|-----|------|------|-------|
| 1K | $7 | $0* | $0* | $3 | **~$10** |
| 5K | $15 | $0* | $0* | $5 | **~$20** |
| 10K | $25 | $25 | $15 | $10 | **~$75** |
| 25K | $40 | $25 | $50 | $15 | **~$130** |
| 50K | $75 | $50 | $75 | $25 | **~$225** |
| 100K | $150 | $100 | $150 | $40 | **~$440** |

*Free tiers cover small scale (Supabase/Neon DB, Supabase/Clerk Auth, Vercel/Fly hosting)

**Break-even conversion rates:**

| MAU | Monthly Cost | Users to Break Even | Conv. Rate |
|-----|-------------|---------------------|------------|
| 1K | ~$10 | 21 | 2.1% |
| 5K | ~$20 | 42 | 0.8% |
| 10K | ~$75 | 156 | 1.6% |
| 25K | ~$130 | 271 | 1.1% |
| 50K | ~$225 | 469 | 0.9% |
| 100K | ~$440 | 917 | 0.9% |

**Monthly profit at various conversion rates:**

| MAU | Cost | 1% conv. | 2% conv. | 3% conv. |
|-----|------|----------|----------|----------|
| 1K | $10 | -$5 | +$0 | +$4 |
| 5K | $20 | +$4 | +$28 | +$52 |
| 10K | $75 | -$27 | +$21 | +$69 |
| 25K | $130 | -$10 | +$110 | +$230 |
| 50K | $225 | +$15 | +$255 | +$495 |
| 100K | $440 | +$40 | +$520 | +$1,000 |

**Benchmarks:** Industry freemium conversion is 2-5% (Spotify ~3%, Dropbox ~4%). Creative tools trend lower at 1-3%.

**Takeaways:**
- Below 5K MAU, infrastructure costs eat most or all revenue — not worth it
- At 2% conversion (realistic for creative tools), break-even is comfortable at 5K+ MAU
- At 3% conversion, genuinely profitable starting around 10K MAU
- One-time purchases are ~5x more margin-efficient than $0.99/mo subs after Stripe fees
- Consider adding **$9.99/year** annual billing later — much better margin than monthly micro-transactions
- The $0.99/mo price is more of an accessibility option than a revenue driver

**Don't launch until:** 5K+ MAU minimum, and ideally users are actively requesting community features.

### Social Embeds / OG Images (ships with PalettePort)

When someone shares a palette URL on Discord, Slack, Twitter, or any Open Graph-aware platform, they should see a rich preview showing the actual palette — not a blank card.

**Design:** Mosaic grid of color swatches. Grid layout adapts to color count (1–10). When the color count leaves an odd cell, that cell shows the app name/logo instead. Clean, no hex labels — just bold color blocks.

**Why this can't ship on GitHub Pages:** Discord's crawler doesn't execute JavaScript, so OG meta tags in a static SPA's `index.html` are always the same regardless of the `?colors=` URL param. Palette-specific embeds require server-side meta tag injection (Edge Middleware) and a dynamic image generation endpoint (`/api/og`). Both require a server — the same server PalettePort needs anyway.

**Implementation plan (when the time comes):**
- Deploy to Vercel (or equivalent) instead of GitHub Pages
- `middleware.ts` — intercepts requests with `?colors=` and injects palette-specific `og:image`, `og:title`, `og:description`, `twitter:card` tags
- `api/og.ts` — Vercel Edge Function using `@vercel/og` (Satori) to render a mosaic JSX component to a 1200×630 PNG
- Mosaic layout: calculate optimal grid (cols = `ceil(sqrt(n))`), fill cells with color blocks, last cell = app name/logo if n doesn't fill the grid evenly

**Infeasible on static hosting. Ship when PalettePort ships.**

---

### Why we're kicking this can

1. **Effort-to-value ratio is terrible right now** — months of backend work for a feature that might convert 2% of users
2. **The free tool isn't done** — every hour on PalettePort is an hour not spent on features that help everyone
3. **Server costs are nonzero** — the current app costs $0 to run; PalettePort introduces ongoing expenses
4. **Moderation is a job** — even a "simple" community feature creates content moderation obligations
5. **Auth is a rabbit hole** — account systems are never simple, and they bring security liability
6. **The moat isn't clear yet** — free community palette sites already exist; need a compelling reason to pay
7. **Donations first** — if people won't tip $3 on Ko-fi, they won't pay $6.99 for a community feature

**Revisit when:** The free feature set is complete, the app has meaningful traffic (5K+ MAU), donations are flowing (proving willingness to pay), and users are actively asking for community features. Not before. Phase 0 (donations) can ship today.

---

## Documentation Pages ✅

Full-screen overlay with About, Help, and Changelog tabs. Accessible from CircleHelp icon in header and `?` (Shift+/) keyboard shortcut.

### About / Landing Page
- [x] What the tool is: free, open-source, no AI, no accounts, no paywalls
- [x] Feature highlights with icons and descriptions (10 shipped features)
- [x] Competitor comparison table (what we give free vs. what others paywall)
- [x] AI commitment statement ("no AI features in the product, ever")
- [x] Development transparency ("built with AI assistance, no AI in the product")
- [x] Ko-fi / donation link placeholder (Phase 0 monetization)

### User Guide / Help
- [x] Getting started: add colors, reroll, lock, save
- [x] Keyboard shortcuts reference (rendered from `SHORTCUT_GROUPS` data, OS-aware)
- [x] Feature walkthroughs: presets, export, color blindness preview, contrast checker, variations, eyedropper
- [x] Tips and workflows integrated into feature descriptions
- [x] Sidebar nav with 7 sections, 16 pages — inline component demos as visual references
- [x] Undo & redo page (what's tracked, session-only, future-clearing behavior)
- [x] Save & open + import/export palettes pages (localStorage, backup/restore, file format)
- [x] Theme page (3-way toggle, resolution order, contrast checker impact)
- [x] HSL picker documented on palette page
- [x] CVD toggle clickable D/P/T/A buttons documented on color blindness page

### Changelog
- [x] Version history with dates and feature summaries (v0.1–v0.10)
- [x] Manually maintained, most recent first
- [x] Accessible from docs overlay Changelog tab

### Implementation
- [x] Full-screen overlay component (`DocsOverlay.tsx`) — `fixed inset-0 z-[9997]`, fade+slide animation
- [x] Tabbed navigation within the overlay (About / Help / Changelog) — custom buttons, not Radix Tabs
- [x] Accessible from CircleHelp icon in header + `?` keyboard shortcut
- [x] Full design freedom — custom layouts per tab (feature grid, competitor table, changelog entries)
- [x] Consistent foundation: font-mono, lowercase labels, existing theme system (light/gray/dark)
- [x] Deploys to GitHub Pages as part of the existing Vite SPA build — no routing, no server
- [x] Keyboard shortcuts split: `/` → keyboard hints, `?` → docs overlay

---

## Priority Order (Suggested)

1. ~~**Copy in Multiple Formats** - High utility, low effort~~ ✅ Done!
2. ~~**Share via URL** - Highest impact, lowest effort~~ ✅ Done!
3. ~~**Export Palette** - Natural companion to share, completes the save/export flow~~ ✅ Done!
4. ~~**Color Blindness Preview** - Accessibility focus, rarely free~~ ✅ Phase 1 Done!
5. ~~**Keyboard Shortcut Dialog Overhaul** - Scaling pain, do before adding more shortcuts~~ ✅ Done!
6. ~~**Full Keyboard Coverage** - Every action reachable, zero mouse, power user dream~~ ✅ Done!
7. ~~**Quick Palette Presets** - Lowers barrier to entry~~ ✅ Done!
8. ~~**Color Naming** - Instant perceived value, low effort~~ ✅ Done!
9. ~~**Contrast Checker** - Accessibility focus, differentiator~~ ✅ Done!
10. ~~**Color Variations Panel** - Commonly paywalled, moderate effort~~ ✅ Done!
11. ~~**Preset Browser Overhaul** - VST-style navigation, active label with drift detection~~ ✅ Done!
12. ~~**Drag to Reorder** - Missing table-stakes interaction, low-medium effort~~ ✅ Done!
13. ~~**EyeDropper / Color Picker** - Native EyeDropper + input[type=color] fallback~~ ✅ Done!
14. ~~**Expand to 10 Colors** - Two-row layout, Framer Motion animations, 2D drag, free what competitors paywall~~ ✅ Done!
15. **Mobile / Responsive Design** - Prerequisite for growth; pointer-events softlock first, then layout audit
16. **Gradient Generator** - Nice companion feature, low effort
17. **Palette Visualization** - High wow factor, moderate effort
18. **Color Harmony Score** - Unique differentiator, medium effort
19. **Session Palette History** - Solves real reroll regret, low-medium effort
20. **Palette Collections and Tags** - Natural save/open evolution, medium effort
21. ~~**Inline Color Editing** - Replace edit dialog with in-place hex input~~ ✅ Done!
22. **Extract from Image** - Big feature, most complex
23. ~~**Documentation Pages** - About, user guide, changelog — static, no backend~~ ✅ Done!
24. **IndexedDB Migration** - Low priority, not needed yet
25. **PalettePort** - Only paid feature, requires full backend, kick the can indefinitely

---

*All features are client-side only. No backend, no accounts, no paywalls — except PalettePort.*
