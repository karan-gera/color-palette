# PalettePort ship audit

Last reviewed: 2026-09-06
Original audit baseline: `5f77c12`
Implemented in PRs: `#1` accessibility, `#2` hook dependencies, `#3` local preview fonts, `#4` audit and research

This is the durable release-readiness record for the desktop application. Update the status boxes as work lands so questions such as “what is left from the audit?” can be answered from the repository rather than chat history.

## Current release assessment

The desktop product is feature-complete enough for a v1, and the deployed core workflows function. It still needs a focused release-hardening cycle before being treated as launch-ready. Mobile work is explicitly deferred.

Mobile UI and responsive redesign are excluded from this audit and deferred until after the desktop release. This document intentionally does not track machine-local branch or stash locations.

## Desktop launch blockers

- [ ] Fix the unreachable `shift+cmd/ctrl+e` image-export shortcut and add regression coverage for `useKeyboardShortcuts`.
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
- [ ] Make deployment depend on build, zero-unexpected-warning lint, and tests. The current Pages workflow runs only install and build before deployment.
- [ ] Decide whether v1 ships at the existing GitHub Pages URL or at `paletteport.com`. A custom-domain launch additionally requires DNS, `CNAME`, Vite base-path, canonical/OG URL, and landing-link changes.

## Documentation and product-claim fixes

- [ ] Correct the share-link example in `DocsOverlay.tsx`; implementation uses hyphen-separated colors, while the example uses commas.
- [ ] Remove, source, or date-stamp the competitor matrix. Its Coolors `$99` claim and several plan/feature limits are stale. Current first-party research and replacement recommendations are preserved in `COMPETITOR_RESEARCH.md`.
- [ ] Correct remaining user-visible capitalization that violates the lowercase UI convention.
- [ ] Make the About-page feature-request and donation language point to real destinations or remove it.
- [ ] Rewrite `TODO.md` as an active roadmap. It currently contains 141 unchecked items and contradictory/stale entries for fades, OG metadata, the landing page, naming, and mobile ownership.

## Tests and release hardening

- [ ] Convert TODO tests for already-shipped color harmony, image extraction, collections, visualization, and session-history features into real tests. Only the four deferred gradient-type stubs are genuinely future work.
- [ ] Add coverage for `useKeyboardShortcuts`, storage/migrations, image extraction/export, collections, theme/dialog state, color editing, and palette-state hooks.
- [ ] Raise critical helper coverage. Baseline coverage was 74.6% statements and 64.8% branches; storage was about 54% lines.
- [ ] Add a desktop error boundary so a component failure cannot blank the entire application.
- [ ] Lazy-load the largest optional surfaces, especially docs, preview/visualization, export, and extraction. Baseline production JavaScript was 1.318 MB minified / 384 KB gzip in one chunk.
- [ ] Pin or document the supported Node version to avoid local Node 24 versus CI Node 20 drift.

## Verified working at audit time

- [x] `npm run build` passed.
- [x] `npm test` passed with 289 active tests; 71 tests remained TODO.
- [x] `npm run lint` exited successfully with only the accepted `CircleWipeOverlay.tsx` exception.
- [x] Add, lock, reroll, relationship, history, save, open, and restore workflows worked in a clean browser session.
- [x] Palette export, image-export configuration, gradient editing, and gradient-export surfaces rendered and operated.
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
