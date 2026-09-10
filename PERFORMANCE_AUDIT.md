# PalettePort performance audit

Last reviewed: 2026-09-10

This is the durable performance record for the desktop application. The goal is not merely to perform well on the development machine. The core palette workflow should remain readable and usable on a slow connection and a low-power device.

Release ownership for these findings is tracked by task ID in [`TODO.md`](TODO.md). The measured baselines and release gates are also available in [`RELEASE_ROADMAP.html`](RELEASE_ROADMAP.html).

Mobile layout remains deferred, but mobile-class network and CPU constraints are in scope here because laptop users also encounter them.

## Assessment

The app is fast on a good machine and connection. A five-color reroll still updates within 75 ms with a six-times CPU slowdown, and the live app makes only first-party requests.

Cold startup is not ready for constrained users. The production app requires a 389 KB compressed JavaScript file before it can show meaningful content. On the poor-network profile below, the page remained without meaningful content for about 9.3 seconds. More than half of the downloaded JavaScript was unused after the initial screen settled.

The app also does not start offline, even immediately after a successful online visit. The current in-app statement that the tool “works offline” is false.

## Test setup

- Browser: Helium 0.15.5.1, Chromium 151
- Viewport: 1194 × 1018 CSS pixels at device-pixel ratio 2
- Target: live GitHub Pages deployment
- Page: cold-cache five-color share link, which exercises a realistic populated palette
- Collection: Chrome DevTools Protocol navigation, paint, layout-shift, long-task, network, code-coverage, and performance metrics
- Each load was observed for three seconds after the load event

These are controlled lab results, not field telemetry. The application correctly has no analytics, so there is no real-user performance dataset yet.

### Profiles

| Profile | Network | CPU |
|---|---|---|
| local machine | unthrottled | normal |
| low power | unthrottled | 6× slowdown |
| slow 4G | 1.6 Mbps down, 750 Kbps up, 150 ms latency | 4× slowdown |
| poor network | 400 Kbps down, 200 Kbps up, 400 ms latency | 6× slowdown |

## Measured results

### A-10 optional-surface split

Measured locally from production builds of `main` at `22e71eb` and
`perf/lazy-optional-surfaces` on 2026-09-10. Gzip values in the first table are
Vite's build output; transfer estimates use deterministic `gzip -9` output plus
the three initially requested core WOFF2 fonts. Browser checks used an isolated
Chromium preview at 1280 × 800 with a five-color share URL. DOM size is the
number of elements returned by `document.querySelectorAll('*')` after the
palette settled.

| Initial-load measurement | Before | After | Change |
|---|---:|---:|---:|
| JavaScript, minified | 1,323.40 kB | 821.23 kB | −502.17 kB (−38.0%) |
| JavaScript, gzip | 386.25 kB | 252.37 kB | −133.88 kB (−34.7%) |
| Estimated initial transfer | 474.3 kB | 341.2 kB | −133.1 kB (−28.1%) |
| Populated document elements | 1,257 | 731 | −526 (−41.8%) |
| Closed documentation subtree | 526 | 0 | −526 (−100%) |

The production build now emits these entry and async assets (Vite-reported
sizes):

| Asset | Loading boundary | Minified | Gzip |
|---|---|---:|---:|
| `index.html` | initial | 3.92 kB | 1.43 kB |
| `index.css` | initial | 84.65 kB | 14.00 kB |
| `index` | initial | 821.23 kB | 252.37 kB |
| `DocsOverlay` | documentation open | 77.54 kB | 17.05 kB |
| `PalettePreviewOverlay` | palette preview open | 423.49 kB | 117.66 kB |
| `chart-column` | shared by the two async surfaces | 0.42 kB | 0.30 kB |

The initial browser resource graph requested only `index`, the stylesheet, and
the three core fonts. It did not request `DocsOverlay`,
`PalettePreviewOverlay`, the shared async icon chunk, Recharts, or its bundled
D3 dependencies. Opening documentation requested only the documentation and
shared icon chunks. Opening palette preview then requested the preview chunk,
which contains Recharts and the `victory-vendor` D3 modules. This split comes
from `React.lazy` imports and conditional mounting; no manual chunk rules were
added.

Docs retained its modal dialog semantics, focus trap, Escape dismissal, and
focus restoration after moving to conditional mounting. Both lazy surfaces
provide a full-screen, polite `role="status"` loading fallback marked
`aria-busy="true"` while their chunks are fetched.

### Cold application load

| Profile | FCP | LCP | DOM content loaded | Load | Blocking time | CLS |
|---|---:|---:|---:|---:|---:|---:|
| local machine | 164 ms | 164 ms | 105 ms | 155 ms | 0 ms | 0.003 |
| low power | 588 ms | 588 ms | 343 ms | 587 ms | 141 ms | 0.102 |
| slow 4G | 2.55 s | 2.55 s | 2.38 s | 2.97 s | 86–96 ms | 0.10–0.19 |
| poor network | 9.28 s | 9.28 s | 8.97 s | 11.18 s | 309 ms | 0.104 |

FCP is first contentful paint. LCP is largest contentful paint. CLS measures unexpected movement; 0.1 or less is the usual “good” boundary. The slow-4G layout result varied between runs because the palette layout spring and font swaps finish in a different order.

For comparison, the static landing page on the poor-network profile reached FCP and LCP in 772 ms, with 0.040 CLS and no long tasks. The landing page proves the visual design itself is not the problem. The application startup path is.

### Initial transfer

The populated app made seven first-party requests and transferred about 481 KB:

| Resource | Transfer | Share |
|---|---:|---:|
| JavaScript | 389 KB | 81% |
| Three core fonts | 75 KB | 16% |
| CSS | 14.6 KB | 3% |
| HTML and favicon | 2.1 KB | <1% |

The resources expand to about 1.48 MB after decompression. No analytics, advertising, Google Fonts, or other third-party request appeared. That is a strong result and should remain a release invariant.

GitHub Pages currently serves even hashed JavaScript and CSS with `Cache-Control: max-age=600`. A repeat visit may revalidate after ten minutes. There is no service worker to provide a reliable cached navigation.

The first visit to the root is also redirected to the static landing page by inline browser JavaScript. That requires two document requests instead of one and adds another round trip on a high-latency connection. If the production URL keeps a landing page, serve it directly at the entry URL rather than discovering the redirect in the browser.

### Code actually needed at startup

The production build emits one JavaScript file:

- 1,323 KB minified
- 386 KB gzip in the local production build
- 389 KB transferred by the live deployment

Chrome precise coverage reported 632 KB used and 690 KB unused three seconds after the populated palette settled. In other words, 52.2% of the initial JavaScript was downloaded even though it was not executed by the initial workflow.

An independent minified bundle breakdown identified the largest groups:

| Group | Approximate minified contribution | Why it is present initially |
|---|---:|---|
| Recharts | 250 KB | Imported by the optional palette preview |
| Application components | 225 KB | All views, docs, and dialogs are eagerly imported |
| `color-name-list` | 175 KB | The complete name database is eagerly imported and converted to Oklab |
| React DOM | 174 KB | Core runtime |
| Motion DOM + Framer Motion | 124 KB | Core and optional animations |

The breakdown comes from a separate esbuild diagnostic and is directional rather than a byte-for-byte map of Vite’s gzip output. It is enough to identify the first split: Recharts and the preview UI should not be in the startup chunk.

### Startup DOM

The initial populated screen contains 1,246 DOM elements.

- The closed documentation overlay contributes 514 descendants—41% of the document—even though it is inert and hidden from assistive technology.
- The keyboard-hints region contributes 159 descendants and is expanded by default.
- The hidden docs are also 79 KB of minified application component code before their dependencies.

`DocsOverlay` is rendered unconditionally and hidden with opacity/transform. This fixed its accessibility exposure but retained its parse, render, style, memory, and DOM cost.

### Layout stability

The initial share-link palette is loaded in an effect after the empty palette has already rendered. Framer Motion then scales the palette container from the empty layout to the populated layout. That container produced the dominant layout shift in the slow-4G trace.

The keyboard-hints groups also shifted when the custom fonts completed. The app defines `font-display: swap`, which avoids invisible text but does not provide metric-compatible fallback values.

### Interaction and heavy work

- Five-color reroll with a 6× CPU slowdown: DOM update in 74 ms. This is acceptable.
- The following 800 ms of reroll animation consumed about 220 ms of main-thread task time, with 11 layouts and 61 style recalculations.
- Extracting colors from the bundled 1200 × 630 OG image with a 6× CPU slowdown took 309 ms and produced 58 ms and 170 ms long tasks.
- The extraction result contained duplicate centroids, so the existing stale deduplication test describes a real correctness gap as well as unnecessary work.

Image scaling and k-means clustering currently run synchronously on the main thread inside `ExtractView.tsx`. The 150 × 150 cap prevents a much worse result, but a 170 ms task is still enough to freeze input and animation on a constrained device.

### Motion preference

The application contains roughly 100 animation, transition, spring, and layout-animation sites. There is no `prefers-reduced-motion` CSS rule, Framer `MotionConfig reducedMotion="user"`, or equivalent hook.

This is both an accessibility issue and a low-power issue. A user asking the operating system for less motion should not pay for repeated spring layout work.

### Offline behavior

There is no service worker or application cache strategy.

Two Helium checks failed with `net::ERR_INTERNET_DISCONNECTED`:

1. Opening the app cold while offline.
2. Reloading the same app URL offline immediately after a successful online visit with browser caching enabled.

Local processing and local storage are working as intended, but they do not make the application available offline. Until an app shell is implemented and tested, publish “runs in your browser” rather than “works offline.”

## Ranked work

### P0 — reduce cold-start JavaScript

- [ ] Dynamically import and conditionally mount `DocsOverlay`.
- [ ] Dynamically import `PalettePreviewOverlay`; keep Recharts and its D3 stack out of the initial chunk.
- [ ] Split gradient preview/export, image export, extraction, and infrequently opened save/open dialogs.
- [ ] Defer the full color-name database or move lookup into a worker-loaded chunk. Do not precompute roughly 4,000 Oklab entries before an empty palette needs a name.
- [ ] Confirm the main chunk shrinks through actual dynamic imports. A manual Rollup chunk alone does not help if startup still requests it.

Target: at most 175 KB gzip for initial JavaScript and 275 KB for the complete initial app transfer.

### P0 — implement reliable offline start

- [ ] Add a versioned service worker scoped to `/color-palette/`.
- [ ] Precache the HTML shell, hashed core JavaScript/CSS, favicon, and core fonts.
- [ ] Use a navigation fallback for the SPA and remove old caches during activation.
- [ ] Decide and document the update behavior so a stale cache cannot silently pin users to a broken build.
- [ ] Add automated cold-offline and warm-offline Helium/Chromium tests.
- [ ] Remove or narrow the current “works offline” copy until both tests pass.

### P1 — show useful content before React starts

- [ ] Put a small, accessible app shell inside `#root` in `index.html` with the product name and loading state. React can replace it on mount.
- [ ] Keep its critical styles inline and tiny so it paints with the HTML response.
- [ ] Ensure the shell is removed cleanly and does not create a duplicate screen-reader announcement.

Target on the poor-network profile: useful shell content within 1.5 seconds and an interactive core palette within 5 seconds.

### P1 — remove startup layout shifts and hidden DOM

- [ ] Decode share-link colors before the first palette render instead of replacing the empty palette in an effect.
- [ ] Disable initial layout springs for the first hydrated palette.
- [ ] Do not mount the documentation tree while it is closed.
- [ ] Reconsider expanding the 159-node keyboard reference before the first paint; preserve onboarding without making it part of the critical render.
- [ ] Add metric-adjusted font fallbacks or use `font-display: optional` where a late font swap is not worth a shift.

Targets: CLS below 0.05 and fewer than 700 elements in the initial populated document.

### P1 — respect reduced motion and low-power rendering

- [ ] Wrap Framer Motion in `MotionConfig reducedMotion="user"`.
- [ ] Add a `prefers-reduced-motion: reduce` rule for CSS transitions and animations.
- [ ] Replace layout springs with immediate state changes when reduced motion is active.
- [ ] Test add, delete, reroll, view switching, docs, and dialogs with reduced motion enabled.

### P1 — move image extraction off the main thread

- [ ] Extract the quantization code from `ExtractView.tsx` into a tested module.
- [ ] Run sampling and k-means in a Web Worker; use transferable pixel buffers.
- [ ] Deduplicate centroids and stop requesting more clusters than useful distinct colors.
- [ ] Keep progress, cancellation, image-load failure, and worker failure accessible.

Target: no extraction task longer than 50 ms on the 6× CPU profile.

### P2 — improve repeat visits and font behavior

- [ ] If deployment moves behind a configurable CDN, serve hashed assets with a one-year immutable cache policy.
- [ ] Keep HTML short-lived so releases update promptly.
- [ ] Evaluate whether the 25 KB serif italic file is worth a separate startup request for the stylized wordmark.
- [ ] Load preview fonts only when their selected preview actually needs them; keep all preview fonts out of the app shell cache.

## Performance gates

Add these after the first optimization change so later features cannot quietly restore the current cost:

- [ ] Fail CI when initial JavaScript exceeds 175 KB gzip.
- [ ] Fail CI when the full initial transfer exceeds 275 KB under the production asset graph.
- [ ] Run a Chromium lab check on a populated palette at 4× CPU and slow 4G.
- [ ] Require LCP below 2.5 seconds, CLS below 0.05, and blocking time below 200 ms in that profile.
- [ ] Run cold-offline and warm-offline navigation tests.
- [ ] Keep image extraction’s longest task below 50 ms at 6× CPU.
- [ ] Keep a manual Helium pass for animation smoothness, reduced motion, export, and image extraction.

Use a small gzip-size script for the deterministic bundle budget. Use Lighthouse CI or Playwright/CDP for the browser budgets, but pin the browser version and run several samples because layout-shift and timing results vary.

## Recommended order

1. Split preview/Recharts and docs; conditionally mount closed surfaces.
2. Add the inline app shell and initialize share links before first render.
3. Add reduced-motion behavior and fix initial palette layout shift.
4. Implement and test the service-worker app shell.
5. Extract image quantization into a worker and activate its stale tests.
6. Add CI budgets, then tune fonts and CDN caching.

Do not start by shaving a few kilobytes from CSS. CSS is 3% of the transfer and 86% of its rule bytes are used on the populated initial screen. The single JavaScript chunk, blank app shell, offline failure, and main-thread extraction are the work that materially affects constrained users.
