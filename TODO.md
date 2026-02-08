# TODO - Feature Roadmap

Features we're making free that competitors paywall.

---

## CRITICAL BUGS

### ~~Double-delete crash~~ ✅ Fixed

**Fix:** Added `isDeleting` state guard in `AnimatedPaletteItem.tsx` — same early-return pattern used by theme/CVD transition guards (`if (isDeleting) return`). Subsequent clicks during the 250ms exit animation are ignored.

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

## Preset Browser Overhaul

Redesign the preset selector to feel like a synth VST preset browser.

### Icon
- [ ] Replace Sparkles icon — it's been co-opted by gen AI and sends the wrong signal
- [ ] Pick a neutral icon (e.g. Palette, Layers, SwatchBook, or similar)

### Navigation
- [ ] Left/right arrow buttons flanking the preset name, visually attached
- [ ] Arrows cycle through presets and auto-apply on click (no extra confirm step)
- [ ] Lock warning modal still triggers when locked colors exist

### Hover interaction
- [ ] On hover, preset name text becomes two icon-only buttons: expand dropdown + reroll
- [ ] Both buttons are purely symbol-based (no text labels)
- [ ] Dropdown opens full preset list for direct selection
- [ ] Reroll regenerates the current preset

### Active preset label
- [ ] When a preset is selected, show its name in the text label (e.g. "pastel")
- [ ] Default text when no preset is active (e.g. "presets")
- [ ] Detect "broken" preset state: if one or more colors fall outside the preset's stated HSL bounds, the preset is no longer active
- [ ] Broken state triggers: user edits a color, rerolls, adds/removes colors, or any color drifts out of the preset's H/S/L ranges
- [ ] Transition from preset name back to default text with a fade animation

### Keyboard
- [ ] `P` continues to cycle presets (existing)
- [ ] Consider left/right arrow support when preset selector is focused

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

## Palette Visualization

Preview palette colors applied to a sample UI layout (card, button, nav bar, text).

- [ ] Sample mockup with primary, secondary, accent, background, text slots
- [ ] Auto-assign palette colors to slots based on luminance
- [ ] Toggle between mockup templates (dashboard, landing page, mobile app)
- [ ] Copy the CSS variable assignments

**Implementation:** Pure CSS/HTML mockup components. No external assets. Realtime Colors does a version of this; most tools paywall it or don't offer it.

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

## Onboarding Flow

First-time user experience that teaches core interactions without being annoying.

### Research
- [ ] Audit competitor onboarding: Coolors, Realtime Colors, Colorffy, Adobe Color, Khroma — what do they do (or not do)?
- [ ] Survey onboarding patterns in creative tools: coach marks, guided tours, progressive disclosure, empty states, sample-first, video walkthroughs
- [ ] Identify the "aha moment" — what's the shortest path from landing to feeling productive? (e.g. first reroll? first lock+reroll? first copy?)
- [ ] Catalog every discoverable feature that a new user wouldn't find on their own (keyboard shortcuts, shift+click behaviors, leader chords, format menu, variations panel, presets, CVD mode, contrast checker, export formats)
- [ ] Decide trigger: first visit only vs. every visit until dismissed vs. opt-in from help menu
- [ ] Research localStorage vs. cookie vs. URL param for "has seen onboarding" persistence
- [ ] Accessibility audit: onboarding must work with screen readers and keyboard-only navigation
- [ ] Mobile considerations: which interactions are touch-incompatible and need alternate guidance?

### Design decisions
- [ ] Choose pattern: tooltip sequence / coach marks / interactive walkthrough / empty state hints / hybrid
- [ ] Define steps and ordering — what does the user learn first, second, third?
- [ ] Decide if onboarding is skippable mid-flow (skip button? escape?)
- [ ] Decide if onboarding is re-triggerable (e.g. "?" menu → "show tour again")
- [ ] Dismissal behavior: per-step dismiss vs. dismiss-all
- [ ] Visual style: should it feel like part of the UI or an overlay? match the monospace/lowercase aesthetic

### Implementation
- [ ] "Has seen onboarding" flag in localStorage
- [ ] Step state machine (current step, completed steps, skipped)
- [ ] Highlight/spotlight effect on target elements
- [ ] Tooltip positioning (above/below/side, responsive to viewport)
- [ ] Smooth transitions between steps
- [ ] No external dependencies — keep it client-side and lightweight
- [ ] Don't block interaction — user can still click around during onboarding
- [ ] Graceful degradation if target element isn't visible (e.g. no colors yet)

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
11. **Preset Browser Overhaul** - VST-style navigation, active label with drift detection
12. **Gradient Generator** - Nice companion feature, low effort
13. **Palette Visualization** - High wow factor, moderate effort
14. ~~**Inline Color Editing** - Replace edit dialog with in-place hex input~~ ✅ Done!
15. **Extract from Image** - Big feature, most complex
16. **Onboarding Flow** - First-time UX, research-heavy
17. **IndexedDB Migration** - Low priority, not needed yet

---

*All features are client-side only. No backend, no accounts, no paywalls.*
