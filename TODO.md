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

## Pre-Release Polish

### Color transition fades lost on reroll

Somewhere during recent work, the smooth color-to-color fade transitions when rerolling the palette stopped working. Colors now snap instantly instead of crossfading. Need to trace where the transition CSS or Framer Motion animation was dropped and restore it.

- [ ] Identify which component/commit broke the fade (likely in `AnimatedPaletteItem.tsx` or the Framer `motion.div` transition props)
- [ ] Restore smooth background-color transition on reroll
- [ ] Verify fades work for: reroll all, reroll single, preset apply, relationship apply

### ✅ Relationship reroll with fully unlocked palette

When no colors are locked, selecting a color relationship (e.g. complementary) produces essentially random results — the relationship is computed relative to the last locked color, but with nothing locked there's no anchor.

- [x] Detect "all unlocked" state when applying a relationship
- [x] Generate a random seed color
- [x] Derive the remaining palette colors from the seed using the selected relationship
- [x] Seed is used as shared reference, not placed in any specific position
- [x] Alternative considered: disable relationships until something is locked (rejected — worse UX)

**Implementation:** In `usePaletteColors.ts`, both `rerollAll` and `handleRelationshipChange` now generate a random hex seed when `lockedColors` is empty and the relationship is not `random`. All unlocked colors derive from this shared seed, producing a cohesive palette.

---

## OG Images / Social Embeds (Cloudflare Worker)

When someone shares a palette URL on Discord, Slack, Twitter/X, iMessage, WhatsApp, Telegram, LinkedIn, Reddit, Bluesky, Teams, or any Open Graph-aware platform, they should see a rich preview card showing the actual palette colors — not a blank card or generic app icon.

**Why this needs a server:** Crawlers (Discordbot, Twitterbot, Slackbot, iMessage link preview, etc.) don't execute JavaScript. A static SPA's `<meta og:image>` is always the same regardless of the `?colors=` URL param. We need something to intercept the HTML and rewrite the tags per-URL, and an endpoint to generate the palette image dynamically.

**Architecture:** Cloudflare Worker on the free tier ($0/mo), sitting in front of GitHub Pages as a transparent proxy. Human visitors pass straight through to GitHub Pages untouched. Only bot/crawler user-agents get intercepted.

### Part 1: Meta tag injection (HTMLRewriter)

The Worker detects crawler user-agents and uses Cloudflare's `HTMLRewriter` API to inject palette-specific OG meta tags into the HTML response before the crawler sees it.

- [ ] Set up Cloudflare Worker project (Wrangler CLI)
- [ ] Bot detection: match known crawler user-agents (Discordbot, Twitterbot, Slackbot, facebookexternalhit, LinkedInBot, WhatsApp, TelegramBot, iMessage/Apple, Googlebot, etc.)
- [ ] For bot requests with `?colors=` param: fetch the SPA HTML from GitHub Pages origin
- [ ] Use `HTMLRewriter` to inject/replace `<meta>` tags in `<head>`:
  - `og:title` — e.g. "palette — #ff5733, #3498db, #2ecc71"
  - `og:description` — e.g. "5-color palette on PalettePort"
  - `og:image` — URL to the Worker's own `/api/og?colors=...` endpoint
  - `og:url` — the canonical palette URL
  - `twitter:card` — `summary_large_image`
- [ ] For non-bot requests or requests without `?colors=`: pass through to GitHub Pages unchanged
- [ ] Test with Discord, Twitter, Slack link preview debuggers

### Part 2: PNG image generation (pure JS, no WASM)

A `/api/og` endpoint on the same Worker that generates a 1200×630 PNG of colored rectangles. No Satori, no resvg, no WASM — just raw pixel buffer manipulation and the built-in `CompressionStream` API. This keeps CPU time under the free tier's 10ms limit.

- [ ] Parse `?colors=` param into array of hex values (1–10 colors)
- [ ] Calculate grid layout: vertical strips for ≤5 colors, 2-row grid for 6–10 (matching the app's `getRowSplit` logic)
- [ ] Fill a 1200×630 RGBA pixel buffer with solid color rectangles
- [ ] Encode as PNG: IHDR chunk + IDAT chunk (deflate via `CompressionStream`) + IEND chunk
- [ ] Return with `Content-Type: image/png` and aggressive `Cache-Control` headers
- [ ] Cache generated images via Cloudflare Cache API (key = sorted color string) — most subsequent requests served from cache at 0 CPU cost
- [ ] Fallback: if no `?colors=` param, serve a static default OG image (app branding)

### Part 3: Deployment & DNS

- [ ] Deploy Worker via Wrangler (`wrangler deploy`)
- [ ] Configure Cloudflare DNS to proxy the domain through the Worker
- [ ] Verify: human visitors see no difference (pass-through to GitHub Pages)
- [ ] Verify: bot crawlers receive rewritten HTML with correct OG tags
- [ ] Test with real services: paste a palette URL into Discord, Twitter, Slack, iMessage

### Part 4: Integration with the app

- [ ] Ensure the app's share URL (`C` key / copy link) produces a URL that the Worker can parse
- [ ] Confirm `?colors=` param format is stable and matches what the Worker expects
- [ ] Add static fallback OG meta tags to `index.html` for when the Worker is bypassed or down

### Cost

$0/mo on Cloudflare Workers free tier:
- 100K requests/day (bot crawlers are a tiny fraction of traffic)
- 10ms CPU/request (meta tag injection: ~1ms, PNG generation: ~3-5ms for solid color blocks)
- Cache API: free, unlimited — repeat requests for the same palette cost 0 CPU
- When/if we move to Vercel for PalettePort, the image generation logic ports directly to `@vercel/og` with minimal changes. The Worker gets turned off.

### Design

1200×630 PNG. Bold color blocks, no text, no labels. Grid adapts to color count:
- 1–5 colors: full-height vertical strips
- 6–10 colors: 2-row grid matching the app's `getRowSplit` layout
- Fallback (no colors param): static branded image

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

## PNG / Image Export ✅

Export the palette as an image file for sharing on social media, mood boards, or design presentations.

### Formats
- [x] PNG (raster, universal)
- [x] SVG (vector, smaller file, scalable)

### Layout
- [x] Grid layout (adaptive grid based on color count)

### Label Options
- [x] No labels (clean, minimal)
- [x] Hex codes (default)
- [x] Color names

### Size Options
- [x] Small (800px wide) — social media friendly
- [x] Medium (1200px wide) — presentations
- [x] Large (1920px wide) — high-res

**Implementation:** Canvas API for PNG (`toDataURL`), manual SVG string generation for vector. Integrated into Export dialog (`E`) as first option. Live SVG preview updates as options change. Grid layout, three label modes (none, hex, names), three sizes.

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

## Mobile / Responsive Design ✅ (separate repo)

**This was moved to a separate repo: `color-palette-mobile` (one directory above, `/Users/curro/Documents/Dev/color-palette-mobile`).**

Reason: Framer Motion is incompatible with the touch "add a color" action — the conflict was fundamental enough that a clean-slate native-first approach made more sense than patching the web repo.

~~The app is desktop-only today. Making it genuinely usable on phones and tablets is a prerequisite before any serious growth. This is a full layout pass — not a polish task.~~

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

## Extract from Image ✅

Drag-and-drop an image to extract dominant colors.

- [x] Drag-and-drop zone or file picker
- [x] Extract dominant colors from image (10 clusters)
- [x] Use color quantization algorithm — k-means in RGB space
- [x] Preview extracted colors before adding to palette
- [x] Click or drag to batch-toggle swatch selection
- [x] Dynamic "add N colors" button (disabled when none selected)

**Implementation:** `ExtractView.tsx` tab-strip view (X key). Canvas API scales image to max 150px, samples every 3rd opaque pixel, runs k-means (k=10, 20 iterations) to produce hex centroids. Drag-to-toggle uses `mousedown` mode ref + `mouseenter` handler. Full palette handled: replaces palette entirely when at MAX_COLORS capacity.

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

## Palette Visualization / Preview Mode ✅

Full-screen preview overlay (toggle with `F` key when in palette view; `Esc` or click-outside to dismiss). `PalettePreviewOverlay.tsx`.

### UI ✅
- [x] `F` key opens palette preview when `activeView === 'palette'` (context-aware, same pattern as `E`)
- [x] Top bar: mode switcher + close (moved from bottom for consistency)
- [x] Smooth fade in/out transition
- [x] Preview button added to Controls toolbar (mouse access)

### ~~Mosaic Mode~~ — scrapped
Color bars look better. Struck.

### UI Elements Mode — shadcn Dashboard ✅
Live dashboard mockup driven by palette color roles.

**Color role pickers (top bar)**
- [x] Role swatches in top bar for background, foreground, accent — click to reassign from current palette
- [x] Auto-assign on open via luminance heuristic (lightest → background, darkest → foreground, most saturated → primary/accent)
- [ ] Full role set: `card`, `secondary`, `border`, `muted` (deferred — top-bar space constrained)
- [ ] "copy CSS vars" button exports `--background: #hex; --primary: #hex; …`

**Mock dashboard** ✅
- [x] shadcn-flavored layout: sidebar with nav links + icons, top header, content area with stat cards + data table skeleton
- [x] All surfaces driven by role assignments as CSS custom properties — updates live
- [x] No real data, no external assets — all placeholder shapes and text

**Font selector** ✅ (lazy-loaded via Google Fonts at runtime)
- [x] `Inter` — neutral/modern (default)
- [x] `Playfair Display` — editorial/luxury (serif, magazine)
- [x] `Space Grotesk` — tech/geometric (startup)
- [x] `Syne` — bold/expressive (display/statement)
- [x] `Nunito` — friendly/rounded (consumer apps)
- [x] `JetBrains Mono` — dev/technical (terminal aesthetic)
- [x] Fade transition after font loads (avoids FOUT flicker)

### Title Design Mode ✅
- [x] Large display typography using palette colors for heading, subheading, accent
- [x] Three layout presets: hero (editorial left-aligned), editorial (blog post flow with nav/byline), poster (giant display type)
- [x] Editable placeholder text (click to edit inline)
- [x] Color role pickers in top bar (heading, background, accent) with direction="down" popover
- [x] Layout persists in localStorage

**Implementation:** Canvas API for mosaic. CSS custom properties for UI elements live theming. Google Fonts `<link>` injected at runtime for font switching (applied to mockup only, not the rest of the app).

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

## Color Harmony Score ✅

A live readout showing how harmonious the current palette is, based on color theory fundamentals.

### Metrics ✅
- [x] Hue distribution — best-fit score against known harmony templates (complementary, triadic, etc.)
- [x] Saturation balance — standard deviation of saturation values
- [x] Lightness spread — range of lightness values
- [x] Relationship detection — pairwise hue angle comparison to known patterns (±15° tolerance)

### Display ✅
- [x] Collapsible row below the palette (not a full panel)
- [x] Human-readable label: "complementary", "analogous", "balanced", "varied", "inconsistent", "discordant"
- [x] Numeric score (0–100) with per-metric breakdown (hue quality, sat consistency, lightness range)
- [x] Updates live as colors change
- [x] Keyboard shortcut: `Y` to toggle visibility

### Edge cases ✅
- [x] Single color: shows "—" (score 0, hidden)
- [x] Two colors: limited analysis (hue + contrast only)
- [x] All identical colors: score 0 / "—"

**Implementation:** `HarmonyScore.tsx` collapsible row, `calculateHarmonyScore()` in `colorTheory.ts`. `bestFitHueScore()` scores against 6 hue templates (mono, complement, split-complement, triadic, tetradic, analogous). Weights: hue quality 45%, sat consistency 25%, lightness range 30%. +15 bonus when a named relationship is detected (capped at 100). `Y` key wired in `useKeyboardShortcuts`.

---

## ✅ Palette Collections and Tags

Organize saved palettes into collections and tag them for easy retrieval.

- [x] Add tags when saving a palette (comma-separated or pill input)
- [x] Suggested tags from existing tags with autocomplete dropdown
- [x] Filter saved palettes by tag in the Open dialog
- [x] Search saved palettes by name or tag
- [x] Create/rename/delete collections (tab-based grouping with confirmation dialogs)
- [x] Inline palette editing (name, tags, collection assignment)
- [x] Migrate existing saved palettes (add empty tags array, backward compatible)
- [x] Export/import collections alongside palettes in JSON files
- [x] Create collections from save dialog (inline "+ new" button)
- [x] Paste comma-separated tags to split into pills
- [x] Tag character limit (24), alphabetical sorting, scrollable container
- [x] Duplicate collection names rejected with notification
- [x] Clear search (X button), clear tag filters affordance
- [x] Stale tag filters pruned on collection switch
- [x] Delete-collection dialog blocks keyboard nav
- [x] Empty state hides chrome when zero palettes saved

**Implementation:** `SavedPalette` extended with `tags: string[]` and `collection?: string` (collection name as key, no UUIDs). `PaletteCollection` type: `{ name: string; createdAt: string }`. `TagPillInput.tsx` reusable component with autocomplete, paste splitting, alphabetical sorting, max-height scroll. Collection tabs in `OpenDialog.tsx` with Framer Motion layout animations, scroll indicators, and inline rename (double-click). `SaveDialog.tsx` always shows collection section with inline creation. All stored in localStorage under `color-palette:saved` (palettes) and `color-palette:collections` (collections).

---

## Session Palette History ✅

A visual timeline of every palette state generated during the current session. Solves the "that palette from 15 rerolls ago looked great" problem.

- [x] Thumbnail strip showing recent palette states as small color bars
- [x] Appears as a collapsible row above or below the main palette
- [x] Click any thumbnail to restore that palette state
- [x] Restoring from history pushes to undo stack (non-destructive)
- [x] Auto-captures on: reroll, preset apply, add/delete color, edit color, reorder
- [x] Deduplication: don't store consecutive identical states
- [x] Cap at ~50 entries to keep memory bounded
- [x] Session-only — not persisted to localStorage (intentional: keeps it lightweight)
- [x] Keyboard shortcut: `H` to toggle history strip visibility

### Display
- [x] Each thumbnail: 4-5 thin vertical color bars, ~40px wide
- [x] Hover preview: tooltip with hex codes
- [x] Current state highlighted with border/ring
- [x] Smooth horizontal scroll with overflow

**Implementation:** `PaletteHistory.tsx` collapsible strip. Snapshots stored in `App.tsx` state, captured on every palette push. `H` key wired in `useKeyboardShortcuts`.

---

## Gradient Generator ✅

A second workspace view (palette ↔ gradient), accessible via a compact vertical tab strip on the right edge of the main content area. Palette colors seed the gradient stops; stops auto-update when the palette changes. Keyboard shortcut `E` is context-aware (opens palette export in palette view, gradient export in gradient view).

### Architecture decisions
- **Navigation**: Vertical tab strip (right edge), compact dots → hover expands to labels. Quick opacity crossfade (150ms Framer AnimatePresence) between views.
- **Stop bar**: Click empty space to place stop at that position; drag handle to move; X appears on hover to delete. Min 2 stops. Collision guard: can't place within ~2% of another stop.
- **Color source**: Each stop is either palette-linked (auto-updates when palette rerolls) or custom (fixed hex). Color picker shows current palette swatches.
- **Default**: All palette colors seeded as stops, evenly distributed (first=0%, last=100%).
- **Angle**: Slider + numeric input for linear gradient.
- **v1 scope**: Linear gradient only. Radial/conic modularly designed for later.
- **GRD (Photoshop binary)**: Deferred — research task required before implementing.

### Export formats (v1)
- CSS `linear-gradient(...)` — copy to clipboard
- SVG file — `<linearGradient>` block
- PNG gradient strip — ~800×100px raster
- Tailwind — `bg-gradient-to-r from-[…] via-[…] to-[…]`

### Deferred
- [ ] Radial gradient type
- [ ] Conic gradient type
- [ ] GIMP `.ggr` format
- [ ] **Photoshop `.grd`** — *research task first*: audit binary format spec (Adobe devnet), find if any JS encoder exists, estimate implementation complexity. Only implement if feasible without a native dependency.

---

### Gradient Preview Mode

Full-screen gradient preview overlay (toggle with `F` key when in gradient view — same pattern as palette preview). `GradientPreviewOverlay.tsx` to be created alongside `PalettePreviewOverlay.tsx`. Wiring: `showGradientPreviewOverlay` state in `App.tsx`, `F` key becomes context-aware (gradient view → gradient preview, palette view → palette preview).

#### UI
- [ ] `F` key context-aware: opens gradient preview when `activeView === 'gradient'`
- [ ] Bottom bar: mode switcher + close; gradient map mode also has blend mode selector + opacity slider
- [ ] `Esc` or click-outside dismisses

#### Mode 1: Fullscreen Fill
- [ ] Gradient fills the entire viewport, no chrome
- [ ] Regenerate button cycles through angle variants (0°, 45°, 90°, 135°, 180°, 270°)

#### Mode 2: Background Composition
- [ ] Gradient rendered as a full-page background behind placeholder content (hero heading + body text + CTA button)
- [ ] Text color auto-assigned by contrast against gradient endpoints
- [ ] Editable placeholder text

#### Mode 3: Gradient on Text
- [ ] Large display text with CSS `background-clip: text` + `color: transparent` — gradient fills the letterforms
- [ ] High impact for hero headings, logos
- [ ] Editable placeholder text
- [ ] Font selector (shared with palette preview modes)

#### Mode 4: Gradient Map (flagship)
True gradient map applied to an image — luminance of each pixel mapped to the gradient's color range, same as Photoshop's Gradient Map adjustment layer.

- [ ] Built-in stock photos: 2–3 curated options, no network fetch — bundled as data URIs or imported assets (portrait, landscape, abstract)
- [ ] "bring your own image" — drag/drop or file picker, any resolution (downscaled for canvas performance before processing)
- [ ] Blend mode selector: `normal`, `multiply`, `screen`, `overlay`, `soft light`, `hard light`, `color` (7 modes)
- [ ] Opacity slider (0–100%) for the gradient map layer over the original image
- [ ] Canvas API implementation: `getImageData` → per-pixel luminance (0.299R + 0.587G + 0.114B) → look up gradient color at that position → `putImageData`
- [ ] Regenerates on gradient change — debounced ~150ms to avoid canvas thrashing
- [ ] "reset image" button to discard BYOI and return to stock

**Implementation:** Canvas API for gradient map pixel processing. CSS `background-clip: text` for mode 3. Blend modes via CSS `mix-blend-mode` on a canvas overlay element. Stock photos bundled as compressed data URIs to avoid network dependency.

### Implementation Checkpoints

#### CP1–CP9 — All checkpoints complete ✅

**Implementation notes:**
- `src/helpers/gradientGenerator.ts` — types (`GradientStop`, `LinearGradientConfig`, `GradientConfig`), `initStopsFromPalette`, CSS/SVG/PNG/Tailwind generators. 24 tests in `src/__tests__/helpers/gradientGenerator.test.ts`.
- `src/hooks/useGradientStops.ts` — full stop CRUD with collision guard (2%), min-2-stops enforcement, palette sync, angle clamp. 23 tests in `src/__tests__/hooks/useGradientStops.test.ts`.
- `src/components/GradientStopBar.tsx` — click-to-add, pointer-capture drag, X-on-hover delete, selected stop highlight + position label.
- `src/components/StopColorPicker.tsx` — palette swatches + custom hex input popover, closes on outside click/Escape, flips alignment past 70%.
- `src/components/GradientView.tsx` — 140px preview bar, stop bar + picker, angle slider+input, CSS preview, reset + export buttons.
- `src/components/ViewTabStrip.tsx` — compact dots, hover expands labels leftward, `fixed right-6 top-1/2` positioned.
- `src/components/GradientExportDialog.tsx` — CSS/Tailwind/SVG/PNG export, keyboard nav via `useListKeyboardNav`, confirmation screen, Tailwind >3-stop warning.
- `App.tsx` — `activeView`, `isGradientExportDialog`, `gradientState`, `handleSwitchView`, `syncPaletteColors` effect, `AnimatePresence` view fade, context-aware `E` key, `closeAllDialogs` + `isAnyDialogOpen` updated.
- `useKeyboardShortcuts.ts` — `E` description updated to "export palette / gradient".

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

## Community Sharing Platform (Deferred — Requires Backend)

A lightweight social palette gallery where users can browse, share, and discover palettes published by other people. Think "community presets" — not a full social network, just a curated feed of color palettes, optionally behind a supporter paywall.

**Core philosophy:** This is purely additive — it does NOT paywall any existing features. Every tool, every export format, every accessibility feature — free, forever. If users organically create a subreddit, Discord, or forum to trade shareable links, that's great — we will not compete with that. This is a thank-you for supporters, not a tollbooth.

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

### ~~Social Embeds / OG Images~~ → Decoupled from PalettePort

**Moved up to its own section: "OG Images / Social Embeds (Cloudflare Worker)"** — ships independently on Cloudflare Workers free tier, no Vercel migration needed. See the dedicated plan above.

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
15. ~~**Mobile / Responsive Design**~~ ✅ Separate repo (`color-palette-mobile`) — Framer Motion incompatible with touch add-color
16. ~~**PNG / Image Export** - Social sharing, mood boards; Canvas API for raster, SVG for vector~~ ✅ Done!
17. ~~**Gradient Generator**~~ ✅ Done! Vertical tab strip, stop bar, palette-linked stops, CSS/SVG/PNG/Tailwind export
17. ~~**Palette Visualization**~~ ✅ Done! Title design (hero/editorial/poster) + shadcn UI elements mockup + font selector
18. ~~**Color Harmony Score**~~ ✅ Done! Collapsible row, 0–100 score, hue/sat/lightness metrics, relationship detection, Y key
19. ~~**Session Palette History** - Solves real reroll regret, low-medium effort~~ ✅ Done!
20. ~~**Palette Collections and Tags** - Natural save/open evolution, medium effort~~ ✅ Done!
21. ~~**Inline Color Editing** - Replace edit dialog with in-place hex input~~ ✅ Done!
22. ~~**Extract from Image**~~ ✅ Done! Canvas API + k-means (k=10), drag-to-toggle swatch selection
23. ~~**Documentation Pages** - About, user guide, changelog — static, no backend~~ ✅ Done!
24. **IndexedDB Migration** - Low priority, not needed yet
25. **Community Sharing Platform** - Requires full backend, deferred indefinitely

---

## Landing Page

A standalone marketing page to anchor the launch — lives at the root domain (or a subdomain) and links to the app.

### Goal
Communicate the value prop in seconds: "the best free color palette tool, no sign-up required." Convert curious visitors into active users.

### Sections
- [ ] Hero — animated live palette + headline + single CTA ("open the app")
- [ ] Feature highlights — 4–6 key features with short copy and visual (screenshot or live demo snippet): palette generation, export formats, gradient generator, extract from image, palette preview, harmony score
- [ ] "Everything free" callout — no sign-up, no paywall, works offline, runs in the browser
- [ ] Keyboard shortcuts teaser — show 5–6 power-user shortcuts to signal depth
- [ ] Footer — link to app, GitHub, changelog

### Design direction
- Monospace throughout (matches app aesthetic)
- Dark/neutral palette — let the color palette demos supply the color
- Animated hero: palette circles that cycle through example palettes on load
- No stock photos, no generic gradients — the tool's own output is the visual

### Technical
- [ ] Separate repo or `/landing` subfolder — keep it decoupled from the app bundle
- [ ] Static HTML/CSS/JS or a minimal framework (Astro, Next.js static export)
- [ ] OG meta tags: title, description, og:image (palette screenshot)
- [ ] og:image generator — static or dynamic (Vercel OG / Satori)
- [ ] Analytics (Plausible or simple `umami` — no cookies)

---

---

## Custom Domain (paletteport.com)

When the domain is purchased, wire up the full integration. The first-visit landing flow is already implemented — these are the remaining production steps.

- [ ] **FIRST:** Restore `!isLocal` guard in `index.html` inline script (currently removed for local testing — see `TODO` comment on line ~12)
- [ ] Add `CNAME` file to repo root with contents `paletteport.com` (GitHub Pages custom domain)
- [ ] Change `vite.config.ts` `base` from `'/color-palette/'` to `'/'`
- [ ] Update all 3 CTA `href` values in `public/landing/final.html` from `/color-palette/` to `/`
- [ ] Update `<title>` in `index.html` from `Color Palette` to `PalettePort`
- [ ] Update favicon if desired

**Already done:** first-visit detection in `index.html` (redirects new users to `landing/final.html`), localStorage key set on all CTAs, `main.tsx` marks user as visited on app load.

---

*All features are client-side only. No backend, no accounts, no paywalls — except PalettePort.*
