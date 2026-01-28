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

## Export Palette

Export the entire palette in standard formats for use in design tools and code.

- [ ] CSS variables (`:root { --color-1: #ff5733; ... }`)
- [ ] JSON (`{ "colors": ["#ff5733", ...] }`)
- [ ] Tailwind config (full `colors` object)
- [ ] SCSS variables (`$color-1: #ff5733; ...`)
- [ ] Adobe ASE (Adobe Swatch Exchange)
- [ ] GPL (GIMP Palette)

**UI/UX:**
- Add "Export" button in the save/load controls area
- Icon: `Download` or `FileOutput` (something that conveys "take it with you")
- Opens a modal/dropdown with format options
- One-click copy or download depending on format

**Help text (in export modal):**
> Can't find your format? Click any color's hex code to copy it individually in HEX, RGB, HSL, CSS, Tailwind, or SCSS.

**Implementation:** Generate formatted strings client-side. For binary formats like ASE, use appropriate encoding.

---

## Color Blindness Preview

Toggle to simulate how the palette appears to people with color vision deficiencies.

- [ ] Deuteranopia (red-green, most common)
- [ ] Protanopia (red-green)
- [ ] Tritanopia (blue-yellow)
- [ ] Achromatopsia (monochromacy, rare)
- [ ] Toggle in UI to switch between normal and simulated views

**Implementation:** Apply color transformation matrices to simulate CVD. Can use CSS filters or transform hex values directly.

**UX Notes:**
- This setting should change theming **site-wide**, not just the palette preview. The entire UI should be viewable through the CVD simulation so users can experience what others see.
- Transition animation: **circle wipe** effect that emits outward from the toggle component's origin coordinates (like the iOS accessibility zoom or a radial reveal). This makes the mode switch feel intentional and helps users understand the transformation is happening.

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

## Priority Order (Suggested)

1. ~~**Copy in Multiple Formats** - High utility, low effort~~ ✅ Done!
2. ~~**Share via URL** - Highest impact, lowest effort~~ ✅ Done!
3. **Export Palette** - Natural companion to share, completes the save/export flow
4. **Quick Palette Presets** - Lowers barrier to entry
5. **Contrast Checker** - Accessibility focus, differentiator
6. **Color Blindness Preview** - Accessibility focus, rarely free
7. **Extract from Image** - Big feature, more complex

---

*All features are client-side only. No backend, no accounts, no paywalls.*
