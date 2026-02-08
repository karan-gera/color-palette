# TODO - Feature Roadmap

Features we're making free that competitors paywall.

---

## CRITICAL BUGS

### Double-delete crash

**Severity:** Critical — requires page reload to recover.

**Repro:** Click the delete button on a color, then click delete again while the exit animation is still playing (~250ms window).

**Behavior:** The app enters an unusable state — all colors disappear, and you can no longer add colors or interact with the palette. Requires a full page reload to recover.

**Root cause (likely):** The delete callback fires twice for the same index. The first delete removes the color and triggers the exit animation. The second delete operates on stale state (the color is already gone), corrupting the palette array or history state.

**Fix direction:** Guard against double-delete — either disable the delete button during the exit animation, or debounce/deduplicate the delete callback so subsequent calls for the same index within the animation window are ignored.

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

## Quick Palette Presets

One-click generation of popular palette styles for users who don't know color theory.

- [ ] Pastel
- [ ] Neon / Vibrant
- [ ] Earth tones
- [ ] Jewel tones
- [ ] Monochrome
- [ ] Warm
- [ ] Cool
- [ ] Muted / Desaturated

**Implementation:** Predefined HSL ranges for each preset. Generate random colors within those constraints.

---

## Extract from Image

Drag-and-drop an image to extract dominant colors.

- [ ] Drag-and-drop zone or file picker
- [ ] Extract 3-5 dominant colors from image
- [ ] Use color quantization algorithm (k-means or median cut)
- [ ] Preview extracted colors before adding to palette

**Implementation:** Use Canvas API to read pixel data. Implement k-means clustering or use a lightweight library. Fully client-side.

---

## Color Naming

Show the closest human-readable color name under each palette item (e.g. "Coral Reef", "Midnight Blue").

- [ ] Nearest-neighbor lookup by OKLCH/Lab distance
- [ ] Display color name below hex code on each palette item
- [ ] Use `color-name-list` (MIT license, ~30K names) or similar open library
- [ ] Optionally show CSS named color if within threshold

**Implementation:** Import color name database, convert to OKLCH, find nearest match by deltaE. Pure client-side. **No Pantone** — their color codes/names are proprietary and aggressively enforced (they forced Adobe to strip Pantone libraries from Creative Cloud in 2022). Use open-source naming databases only.

---

## Color Variations Panel

Click any color to see tints (lighter), shades (darker), and tones (desaturated).

- [ ] Generate 8-10 tints (increase L toward white)
- [ ] Generate 8-10 shades (decrease L toward black)
- [ ] Generate 8-10 tones (decrease S toward gray)
- [ ] Click any variation to copy or replace the palette color
- [ ] Panel UI (flyout, modal, or inline expand)

**Implementation:** HSL math — adjust L for tints/shades, S for tones. No dependencies needed. Competitors (Coolors Pro, Colorffy Pro) paywall this.

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

## Keyboard Shortcut Dialog Overhaul

The keyboard hints overlay is getting cluttered as we add more features and shortcuts. Redesign it to scale gracefully.

- [ ] Group shortcuts by category (palette, file, view, etc.)
- [ ] Cleaner layout that accommodates growing shortcut list without feeling overwhelming
- [ ] Consider a modal/dialog instead of the fixed bottom overlay
- [ ] Visual hierarchy — primary shortcuts prominent, secondary shortcuts discoverable
- [ ] Disabled/contextual shortcuts should be clearly communicated

**Why now:** With contrast checker tabs (`Shift+K`), conditional shortcuts, and more features incoming, the flat list of hints is hitting its limits. This should be addressed before adding more shortcuts.

---

## Priority Order (Suggested)

1. ~~**Copy in Multiple Formats** - High utility, low effort~~ ✅ Done!
2. ~~**Share via URL** - Highest impact, lowest effort~~ ✅ Done!
3. ~~**Export Palette** - Natural companion to share, completes the save/export flow~~ ✅ Done!
4. ~~**Color Blindness Preview** - Accessibility focus, rarely free~~ ✅ Phase 1 Done!
5. **Keyboard Shortcut Dialog Overhaul** - Scaling pain, do before adding more shortcuts
6. **Quick Palette Presets** - Lowers barrier to entry
7. **Color Naming** - Instant perceived value, low effort
8. ~~**Contrast Checker** - Accessibility focus, differentiator~~ ✅ Done!
9. **Color Variations Panel** - Commonly paywalled, moderate effort
10. **Gradient Generator** - Nice companion feature, low effort
11. **Palette Visualization** - High wow factor, moderate effort
12. **Extract from Image** - Big feature, most complex

---

*All features are client-side only. No backend, no accounts, no paywalls.*
