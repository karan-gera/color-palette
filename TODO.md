# TODO - Feature Roadmap

Features we're making free that competitors paywall.

---

## Copy in Multiple Formats

Let users click a color and copy in various formats:

- [ ] HEX (`#ff5733`)
- [ ] RGB (`rgb(255, 87, 51)`)
- [ ] HSL (`hsl(14, 100%, 60%)`)
- [ ] CSS variable (`--color-primary: #ff5733;`)
- [ ] Tailwind config (`'primary': '#ff5733'`)
- [ ] SCSS variable (`$color-primary: #ff5733;`)

**Implementation:** Add a dropdown or popover when clicking the color hex code below each palette item.

---

## Share via URL

Encode the palette in a shareable URL for frictionless sharing.

- [ ] Encode colors in URL params (e.g., `?colors=ff5733,3498db,2ecc71`)
- [ ] Auto-load palette from URL on page load
- [ ] Add "Copy Link" button to share current palette
- [ ] Include locked states in URL (optional)

**Implementation:** Use `URLSearchParams` to read/write. No backend needed.

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

1. **Share via URL** - Highest impact, lowest effort
2. **Copy in Multiple Formats** - High utility, low effort
3. **Quick Palette Presets** - Lowers barrier to entry
4. **Contrast Checker** - Accessibility focus, differentiator
5. **Color Blindness Preview** - Accessibility focus, rarely free
6. **Extract from Image** - Big feature, more complex

---

*All features are client-side only. No backend, no accounts, no paywalls.*
