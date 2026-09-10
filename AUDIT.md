# PalettePort ship audit

Last reviewed: 2026-09-06
Original audit baseline: `5f77c12`
Implemented in PRs: `#1` accessibility, `#2` hook dependencies, `#3` local preview fonts, `#4` audit and research

This is the durable release-readiness record for the desktop application. Update the status boxes as work lands so questions such as “what is left from the audit?” can be answered from the repository rather than chat history.

The constrained-device measurements, budgets, and optimization order are preserved in [`PERFORMANCE_AUDIT.md`](PERFORMANCE_AUDIT.md).
The active release gates are maintained in [`TODO.md`](TODO.md), with a filterable report view in [`RELEASE_ROADMAP.html`](RELEASE_ROADMAP.html).

## Current release assessment

The desktop product is feature-complete enough for a v1, and the deployed core workflows function. It still needs a focused release-hardening cycle before being treated as launch-ready. Mobile work is explicitly deferred.

Mobile UI and responsive redesign are excluded from this audit and deferred until after the desktop release. This document intentionally does not track machine-local branch or stash locations.

## Desktop launch blockers

- [x] Fix the unreachable `shift+cmd/ctrl+e` image-export shortcut and add regression coverage for `useKeyboardShortcuts`.
- [ ] Replace the placeholder `https://github.com/your-repo/issues` request link in `ExportDialog.tsx`.
- [x] Complete the core accessibility pass:
  - [x] Keep the closed docs overlay out of the tab order and accessibility tree; add appropriate modal semantics and focus behavior while open.
  - [x] Add accessible names to icon-only controls in the header, presets, palette actions, editing actions, and delete actions.
  - [x] Associate save/open and gradient labels with their controls.
  - [x] Add dialog descriptions where required by Radix.
  - [x] Give the custom gradient export overlay modal semantics, escape handling, focus containment, and focus restoration.
  - [x] Remove duplicate CVD SVG filter IDs.
- [x] Remove the five Google Fonts runtime requests from `PalettePreviewOverlay.tsx`. Official Latin variable WOFF2 files and their OFL licenses are now self-hosted under `public/fonts/preview`.
- [ ] Either add and test an offline boot/cache strategy or replace the broad “works offline” claim with the narrower, verified “runs in your browser” / local-first language.
- [ ] Add an actual MIT `LICENSE` file and reconcile package version `0.0.0` with the in-app changelog version.
- [ ] Triage and patch dependency findings. The audit baseline was 16 findings: 3 critical, 11 high, 1 moderate, and 1 low; `npm audit --omit=dev` still reported 6 high findings.
- [x] Make deployment depend on build, zero-unexpected-warning lint, and tests. Pull requests run the same quality gate before merge.
- [ ] Decide whether v1 ships at the existing GitHub Pages URL or at `paletteport.com`. A custom-domain launch additionally requires DNS, `CNAME`, Vite base-path, canonical/OG URL, and landing-link changes.

## Documentation and product-claim fixes

- [ ] Correct the share-link example in `DocsOverlay.tsx`; implementation uses hyphen-separated colors, while the example uses commas.
- [ ] Remove, source, or date-stamp the competitor matrix. Its Coolors `$99` claim and several plan/feature limits are stale. Current first-party research and replacement recommendations are preserved in `COMPETITOR_RESEARCH.md`.
- [ ] Correct remaining user-visible capitalization that violates the lowercase UI convention.
- [ ] Make the About-page feature-request and donation language point to real destinations or remove it.
- [x] Rewrite `TODO.md` as an active alpha/beta/v1 roadmap. Release work now has stable task IDs and acceptance criteria; speculative product work is explicitly deferred. `RELEASE_ROADMAP.html` presents the same release gates and audit findings as a read-only engineering report.

## Tests and release hardening

- [ ] Convert TODO tests for already-shipped color harmony, image extraction, collections, visualization, and session-history features into real tests. Only the four deferred gradient-type stubs are genuinely future work.
  - Progress: color harmony is now covered by 14 active tests; its 17 stale TODO cases were removed.
- [ ] Add coverage for `useKeyboardShortcuts`, storage/migrations, image extraction/export, collections, theme/dialog state, color editing, and palette-state hooks.
  - Progress: keyboard shortcuts, storage/migrations, collection persistence, image export, theme, dialog, CVD, and core palette state now have direct coverage.
- [ ] Raise critical helper coverage. The honest all-helper/hook baseline is now 81.70% statements and 76.03% branches; storage is 96.42% lines and image export is 99.18%. Image extraction remains untested, and several small hooks remain at 0%.
- [ ] Add a desktop error boundary so a component failure cannot blank the entire application.
- [ ] Lazy-load the largest optional surfaces, especially docs, preview/visualization, export, and extraction. Baseline production JavaScript was 1.318 MB minified / 384 KB gzip in one chunk.
- [ ] Meet the constrained-device budgets in `PERFORMANCE_AUDIT.md`: ≤175 KB gzip initial JavaScript, ≤275 KB initial transfer, <2.5 s slow-4G LCP, <0.05 CLS, and a working offline reload.
- [ ] Respect `prefers-reduced-motion` across Framer Motion and CSS transitions.
- [ ] Move image sampling and k-means clustering off the main thread; the 6× CPU trace contained a 170 ms extraction task.
- [ ] Pin or document the supported Node version to avoid local Node 24 versus CI Node 20 drift.

## Verified working at audit time

- [x] `npm run build` passed.
- [x] `npm test` passed with 398 active tests; 4 deferred future tests and 50 stale TODO cases remained.
- [x] `npm run lint` exited successfully with only the accepted `CircleWipeOverlay.tsx` exception.
- [x] Add, lock, reroll, relationship, history, save, open, and restore workflows worked in a clean browser session.
- [x] Palette export, image-export configuration, gradient editing, and gradient-export surfaces rendered and operated.
- [x] Helium Chromium smoke test confirmed that native `shift+command+e` opens image export after adding a color.
- [x] Helium performance audit recorded cold-load, low-power, poor-network, code-coverage, layout-shift, interaction, extraction, and offline evidence.
- [x] The landing page rendered without desktop horizontal overflow and its CTAs worked.
- [x] The live GitHub Pages root, landing page, and static OG image returned successfully; recent deployment runs were green.
- [x] Current competitor research, first-party source links, publish-safe claims, and replacement comparison copy are preserved in `COMPETITOR_RESEARCH.md`.

## Explicitly deferred until after desktop v1

- Mobile UI and responsive redesign.
- Dynamic per-palette OG-image generation.
- IndexedDB migration unless real storage pressure is demonstrated.
- Community accounts/backend features.
- Radial/conic gradients and additional specialist export formats.

## Recommended release order

1. Freeze desktop feature scope and choose the production URL.
2. Finish correctness, accessibility, privacy, and legal blockers.
3. Patch dependencies and add deployment quality gates.
4. Fill the highest-risk test gaps and perform a clean-browser regression pass.
5. Address initial-load bundle cost and add failure containment.
6. Ship desktop v1, then resume mobile UI work.
