# TODO - Feature Roadmap

Features we're making free that competitors paywall.

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
- [ ] **FIX:** Horizontal wipe for CVD toggle — currently full-screen left-to-right, should wipe across palette bounds only (leftmost color left edge → rightmost color right edge)

**Implementation:** SVG filters with feColorMatrix using Viénot 1999 (deuteranopia, protanopia) and Brettel 1997 (tritanopia) algorithms. Filters embedded in React and applied to wrapper element for consistent cross-browser rendering.

**UX Notes:**
- This setting changes theming **site-wide** ✅ — the entire UI is viewable through the CVD simulation
- Theme toggle: circle wipe from click point ✅
- CVD toggle: horizontal wipe (needs refinement — should span palette colors, not full screen)

---

## Contrast Checker

Show WCAG contrast ratios between colors for accessibility compliance.

- [ ] Calculate contrast ratio between any two colors
- [ ] Show AA (4.5:1) and AAA (7:1) compliance badges
- [ ] Matrix view showing all color pair contrasts
- [ ] Highlight pairs that fail accessibility thresholds

**Implementation:** Use relative luminance formula from WCAG 2.1 spec. Pure client-side calculation.

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

## Priority Order (Suggested)

1. ~~**Copy in Multiple Formats** - High utility, low effort~~ ✅ Done!
2. ~~**Share via URL** - Highest impact, lowest effort~~ ✅ Done!
3. ~~**Export Palette** - Natural companion to share, completes the save/export flow~~ ✅ Done!
4. ~~**Color Blindness Preview** - Accessibility focus, rarely free~~ ✅ Phase 1 Done!
5. **Quick Palette Presets** - Lowers barrier to entry
6. **Color Naming** - Instant perceived value, low effort
7. **Contrast Checker** - Accessibility focus, differentiator
8. **Color Variations Panel** - Commonly paywalled, moderate effort
9. **Gradient Generator** - Nice companion feature, low effort
10. **Palette Visualization** - High wow factor, moderate effort
11. **Extract from Image** - Big feature, most complex

---

*All features are client-side only. No backend, no accounts, no paywalls.*
