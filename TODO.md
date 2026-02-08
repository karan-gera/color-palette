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

## Inline Color Editing

Replace the edit color modal with inline editing directly on the hex label below each color circle. Clicking the pencil icon (or `Shift+Alt+1-5`) should turn the hex label into a text input in-place, so it feels like you're renaming the color itself.

- [ ] When editing, swap the hex `<p>` with a styled `<input>` at the same position/size
- [ ] Input should be pre-filled with the current hex value, auto-selected
- [ ] Enter to confirm, Escape to cancel (same as current dialog)
- [ ] Input styling should match the existing hex label exactly (font-mono, text-xs, lowercase) — the transition from label to input should feel seamless
- [ ] Live preview: update the circle color as the user types a valid hex value
- [ ] Validation: only accept valid hex on confirm, revert on invalid
- [ ] Remove `EditColorDialog.tsx` once inline editing is complete
- [ ] Update `Shift+Alt+1-5` shortcut to trigger inline edit instead of opening a dialog

**Why:** The modal is heavy-handed for a single text input. Inline editing feels more direct, more fun, and keeps you in flow. It also removes one dialog from the codebase.

---

## Priority Order (Suggested)

1. ~~**Copy in Multiple Formats** - High utility, low effort~~ ✅ Done!
2. ~~**Share via URL** - Highest impact, lowest effort~~ ✅ Done!
3. ~~**Export Palette** - Natural companion to share, completes the save/export flow~~ ✅ Done!
4. ~~**Color Blindness Preview** - Accessibility focus, rarely free~~ ✅ Phase 1 Done!
5. ~~**Keyboard Shortcut Dialog Overhaul** - Scaling pain, do before adding more shortcuts~~ ✅ Done!
6. ~~**Full Keyboard Coverage** - Every action reachable, zero mouse, power user dream~~ ✅ Done!
7. **Quick Palette Presets** - Lowers barrier to entry
8. ~~**Color Naming** - Instant perceived value, low effort~~ ✅ Done!
9. ~~**Contrast Checker** - Accessibility focus, differentiator~~ ✅ Done!
10. ~~**Color Variations Panel** - Commonly paywalled, moderate effort~~ ✅ Done!
11. **Gradient Generator** - Nice companion feature, low effort
12. **Palette Visualization** - High wow factor, moderate effort
13. **Extract from Image** - Big feature, most complex

---

*All features are client-side only. No backend, no accounts, no paywalls.*
