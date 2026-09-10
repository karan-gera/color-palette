# PalettePort release TODO

Last updated: 2026-09-10

This file is the active release backlog. `AUDIT.md`, `PERFORMANCE_AUDIT.md`,
`TESTING.md`, and `COMPETITOR_RESEARCH.md` contain the evidence behind it.
Update this file when work lands; do not add duplicate speculative plans here.
`RELEASE_ROADMAP.html` is the filterable read-only report view.

## Status conventions

- `[ ]` open
- `[x]` verified complete in the current release branch
- **P0** blocks the named release
- **P1** should land in the named release; moving it requires a written decision
- **P2** may move without blocking the release
- Every completed engineering item must satisfy the checks in `AGENTS.md`.

## Current state

### Verified foundations

- [x] Core desktop workflows operate: generate, lock, reroll, relationships,
      undo/redo, save/open, restore, share, export, gradient, and extraction.
- [x] Core accessibility pass: modal semantics and focus behavior, accessible
      control names and labels, closed-overlay isolation, and unique CVD filter IDs.
- [x] Preview fonts are installed locally and bundled; the app makes no runtime
      Google Fonts request.
- [x] Pull-request and deployment workflows run lint, coverage, tests, and build.
- [x] Isolated/headless Chromium is the default test browser; use Helium only when
      existing personal-browser state is required. Never use Waterfox.
- [x] Audit records are persisted in `AUDIT.md`, `PERFORMANCE_AUDIT.md`, and
      `COMPETITOR_RESEARCH.md`.

### Test baseline

- 419 active tests pass.
- 42 TODO tests remain: 4 real future gradient cases and 38 stale cases for
  shipped behavior.
- Coverage: 81.98% statements, 76.00% branches, 78.49% functions, 82.73% lines.
- Storage is 96.42% covered by line; image export is 99.18%; image extraction is
  88.00% covered by line.
- Build passes. Lint passes with the accepted `CircleWipeOverlay.tsx` warning.

### Performance baseline

Measured in Helium 0.15.5.1 / Chromium 151 against the live GitHub Pages build.

| Measurement | Current | Release target |
| --- | ---: | ---: |
| Initial JavaScript | 386–389 KB gzip | <= 175 KB gzip |
| Complete initial transfer | about 481 KB | <= 275 KB |
| JavaScript unused after startup | 52.2% | track; reduce through real splits |
| Initial DOM | 1,246 elements | < 700 elements |
| Closed docs subtree | 514 elements | 0 while closed |
| Slow-4G + 4x CPU LCP | 2.55 s | < 2.5 s |
| Slow-4G + 4x CPU CLS | 0.10–0.19 | < 0.05 |
| Slow-4G + 4x CPU blocking | 86–96 ms | < 200 ms |
| 400 Kbps + 6x CPU LCP | 9.28 s | useful shell < 1.5 s; core interactive < 5 s |
| 400 Kbps + 6x CPU load | 11.18 s | diagnostic only |
| Image-extraction longest task at 6x CPU | 170 ms | < 50 ms |
| Cold/warm offline reload | fails | both pass |

The static landing page reaches LCP in 772 ms on the worst profile, with 0.040
CLS and no long tasks. The constraint is the app startup path, not the base CSS.

### Other audit findings

- The runtime bundle is one 1.323 MB minified chunk. Recharts, closed dialogs,
  documentation, and the full color-name database are loaded at startup.
- Share-link colors are applied after the empty first render and cause a layout
  spring. Font swaps also move the keyboard-hints region.
- Roughly 100 motion/transition sites ignore `prefers-reduced-motion`.
- Image extraction still blocks the main thread; worker migration remains B-05.
- There is no service worker. “works offline” is currently a false claim.
- `ExportDialog.tsx` contains a placeholder GitHub issue URL.
- The repository lacks an MIT `LICENSE`; package version `0.0.0` disagrees with
  the in-app `0.20` changelog.
- The audit found six high-severity production dependency findings after omitting
  dev dependencies. Re-run before remediation because advisories change.
- The share-link documentation uses commas, while the encoder uses hyphens.
- Competitor copy contains stale or overbroad claims. The dated evidence and safe
  replacements are in `COMPETITOR_RESEARCH.md`.
- The production URL/domain is unresolved. GitHub Pages and `paletteport.com`
  require different base paths, canonical URLs, landing links, and DNS setup.
- Mobile layout and mobile UI are explicitly outside the desktop release scope.

## Release model

The functional product already exceeds an MVP. An MVP is a scope-validation
concept, not a stability label, so there is no separate MVP milestone here.

### Public alpha

Externally accessible and useful, but explicitly under test. Features or stored
data formats may change. Known limitations are documented. Alpha must not ship
known P0 correctness, security, legal, accessibility, or false-claim defects.

Recommended next release: a desktop-only public alpha after all `A-*` tasks pass.
Offline support may remain absent in alpha only if every offline claim is removed.

### Public beta

Feature scope is frozen and expected to survive into v1. The remaining work is
bug fixing and compatibility. The constrained-device and offline requirements are
beta gates, not optional polish.

### v1

Stable supported release. Public URL, versioning, compatibility scope, release
notes, and operational checks are fixed and documented. No known high-severity
release issue remains.

## Public alpha gate

### Release decisions and correctness

- [ ] **A-01 P0 — freeze the desktop scope and production URL.**
  - Choose GitHub Pages path or `paletteport.com`.
  - Reconcile Vite `base`, redirect guard, `CNAME`, landing links, canonical URL,
    Open Graph URLs, and favicon/title for that choice.
  - Record mobile as unsupported/deferred rather than partially supported.
- [ ] **A-02 P0 — restore palette reroll fades.**
  - Locate the regression in the animated palette path.
  - Verify reroll-all, reroll-one, preset, and relationship changes.
  - Verify reduced-motion mode is immediate rather than animated.
- [ ] **A-03 P0 — add release identity and license.**
  - Add the actual MIT `LICENSE` file.
  - Choose a SemVer prerelease and align `package.json`, docs, and changelog.
- [ ] **A-04 P0 — replace or remove dead external actions.**
  - Replace `https://github.com/your-repo/issues` with the real issue tracker.
  - Give About-page feature-request and donation controls real destinations or
    remove them.
- [ ] **A-05 P0 — triage dependencies.**
  - Re-run `npm audit` and `npm audit --omit=dev`.
  - Patch production findings without breaking the build.
  - Document accepted findings with package, advisory, exposure, and revisit date.
- [ ] **A-06 P0 — make public claims match observed behavior.**
  - Replace “works offline” with “runs in your browser” until beta offline gates pass.
  - Correct the share-link delimiter example.
  - Replace “unlimited storage” with “no app-level save limit; browser storage applies.”
  - Fix remaining uppercase UI copy covered by the lowercase convention.
- [ ] **A-07 P0 — replace the stale competitor matrix.**
  - Use the conservative comparison in `COMPETITOR_RESEARCH.md`.
  - Include source URLs and the research date with quota or price facts.
  - Render unknown as unknown, not as feature absence.

### Failure containment and constrained-device minimum

- [ ] **A-08 P0 — add a desktop error boundary.**
  - Preserve a readable recovery screen instead of a blank app.
  - Provide reload/reset guidance without deleting local data automatically.
  - Add a regression test for the fallback path.
- [ ] **A-09 P0 — respect reduced-motion preferences.**
  - Configure Framer Motion to respect the user preference.
  - Add CSS reduction for nonessential transitions and animations.
  - Test add, delete, reroll, view changes, docs, and dialogs with reduction enabled.
- [ ] **A-10 P0 — remove the worst startup-only work.**
  - Dynamically import and conditionally mount `DocsOverlay`.
  - Dynamically import `PalettePreviewOverlay` so Recharts/D3 leave the initial chunk.
  - Keep the closed documentation subtree out of the DOM.
  - Record before/after gzip size, initial transfer, and DOM count.
- [x] **A-11 P0 — cover and fix image-extraction correctness. ✅**
  - Extract quantization into a directly testable module.
  - Activate the stale extraction tests, including transparency and determinism.
  - Deduplicate centroids and handle requests larger than the distinct-color count.
  - Worker migration is a beta performance task unless the alpha implementation
    remains visibly blocking in the 6x CPU check.
  - Implemented a deterministic, weighted k-means helper that ignores transparent
    pixels, returns unique colors, and caps output at the distinct-color count.
  - Activated 21 pixel-level tests; extraction now has 88.00% line coverage.

### Alpha verification

- [ ] **A-12 P0 — cut and verify an alpha candidate.**
  - `npm run build`, `npm run lint`, `npm test`, and `npm run test:coverage` pass.
  - Helium clean-profile smoke: add, lock, reroll, relationship, undo/redo,
    save/open, share, export, image export, gradient, extraction, reload.
  - Keyboard-only smoke covers the same core workflow where applicable.
  - Screen-reader/focus smoke covers dialogs, overlays, notifications, and errors.
  - Live Pages assets and links return successfully; no unexpected third-party
    runtime requests appear.
  - Publish known alpha constraints: desktop only and no offline boot.

## Public beta gate

- [ ] **B-01 P0 — finish startup code splitting.**
  - Split gradient preview/export, image export, extraction, save/open, and other
    infrequently opened surfaces.
  - Defer or worker-load the color-name database.
  - Meet <= 175 KB gzip initial JavaScript and <= 275 KB initial transfer.
- [ ] **B-02 P0 — add an accessible pre-React app shell.**
  - Inline only the minimal HTML/CSS needed for a useful loading state.
  - Avoid duplicate screen-reader announcements when React mounts.
  - On 400 Kbps + 6x CPU: useful content < 1.5 s and core interactive < 5 s.
- [ ] **B-03 P0 — remove startup layout instability.**
  - Decode share-link state before the first palette render.
  - Disable the initial hydrated-palette layout spring.
  - Avoid eagerly rendering the 159-node keyboard reference.
  - Add metric-adjusted fallbacks or use `font-display: optional` where appropriate.
  - Meet CLS < 0.05 and initial DOM < 700.
- [ ] **B-04 P0 — implement reliable offline startup.**
  - Add a versioned service worker scoped to the deployed app path.
  - Precache the shell, hashed core assets, favicon, and core fonts.
  - Add SPA navigation fallback, old-cache cleanup, and documented update behavior.
  - Automate cold-offline and warm-offline Chromium tests.
  - Restore offline copy only after both tests pass.
- [ ] **B-05 P0 — move extraction off the main thread.**
  - Run sampling and k-means in a Web Worker using transferable buffers.
  - Preserve accessible progress, cancellation, and failure states.
  - Keep the longest extraction task below 50 ms at 6x CPU.
- [ ] **B-06 P0 — enforce performance budgets in CI.**
  - Fail on initial gzip JS > 175 KB and initial transfer > 275 KB.
  - Pin Chromium and sample slow-4G + 4x CPU runs multiple times.
  - Require LCP < 2.5 s, CLS < 0.05, and blocking time < 200 ms.
  - Run cold/warm offline checks in the same gate.
- [ ] **B-07 P1 — retire shipped-feature test debt.**
  - Replace the remaining 50 stale TODOs for collections, visualization, and
    session history with direct tests.
  - Leave only four explicitly future gradient tests.
  - Raise critical helper/hook coverage to >= 85% lines; keep `useHistory` >= 90%.
- [ ] **B-08 P1 — pin the supported Node version.**
  - Align local development and CI instead of relying on Node 24 locally and 20 in CI.
- [ ] **B-09 P1 — run compatibility and zoom checks.**
  - Use isolated/headless Chromium by default; use Helium only when existing
    personal-browser state is required. Never use Waterfox.
  - Verify keyboard, pointer, downloads, clipboard, font loading, CVD filters,
    service worker updates, and offline behavior.
  - Verify desktop layouts at 100%, 125%, 150%, and 200% zoom.
- [ ] **B-10 P1 — burn down alpha feedback.**
  - Classify issues by correctness, accessibility, data loss, performance, and UX.
  - Resolve all P0/P1 items or document an explicit deferral before beta.

## v1 gate

- [ ] **V-01 P0 — stabilize the production address.**
  - Complete DNS/base-path/canonical work for the selected URL.
  - Verify direct app, landing, share, and offline navigation URLs.
- [ ] **V-02 P0 — finalize release metadata.**
  - Remove prerelease suffix; align package, changelog, Help/About, and tags.
  - Publish release notes with supported browsers and known non-goals.
- [ ] **V-03 P0 — close high-severity release issues.**
  - No open data-loss, correctness, accessibility, security, or constrained-device
    performance issue rated P0/P1.
- [ ] **V-04 P1 — verify repeat-visit caching.**
  - If the host permits it, serve hashed assets immutable for one year and keep
    HTML short-lived.
  - Load preview-only fonts only when a preview requires them.
- [ ] **V-05 P1 — run the complete release matrix.**
  - Clean and existing-storage profiles in isolated Chromium; use Helium only
    when the scenario genuinely requires personal-browser state.
  - Online, slow-4G, poor-network, warm-offline, and cold-offline.
  - Normal and reduced motion; keyboard-only and pointer input.
- [ ] **V-06 P1 — re-check external facts.**
  - Re-verify competitor plan claims and source dates.
  - Check every external link and every public privacy/storage/offline claim.

## Deferred beyond desktop v1

These items are recorded but do not block alpha, beta, or v1 unless explicitly
promoted into a release gate.

- Mobile UI/responsive redesign and real-device QA.
- Dynamic per-palette Open Graph images and Cloudflare bot rewriting.
- IndexedDB migration unless measured storage pressure justifies it.
- Radial/conic gradients and additional `.ggr` / `.grd` exports.
- Expanded preview role set, preview CSS-variable export, and gradient preview modes.
- Keyboard color reordering after a deliberate focus model is defined.
- Community accounts, backend, payments, moderation, and enterprise features.
- Landing-page redesign or analytics. The current static landing page is already
  the fastest measured surface; do not make it part of the app bundle.

## Release checklist template

Copy this block into the release issue and attach evidence rather than checking it
optimistically in this file.

- [ ] Scope and version are frozen.
- [ ] All milestone P0/P1 tasks are closed or explicitly deferred.
- [ ] Build, lint, tests, and coverage pass from a clean install.
- [ ] Helium primary smoke passes.
- [ ] Isolated Chromium regression smoke passes for beta/v1; any required
      personal-session check passes in Helium.
- [ ] Accessibility and reduced-motion smoke passes.
- [ ] Performance and offline budgets pass for beta/v1.
- [ ] Dependency audit is reviewed.
- [ ] Public claims, links, license, changelog, and version agree.
- [ ] Rollback path and service-worker update behavior are documented.

## Maintenance rule

When a task lands, check it here only after its acceptance criteria and the
`AGENTS.md` completion checklist pass. Put measurements and investigation detail
in the relevant audit document, then update the baseline table here. New work must
be assigned to alpha, beta, v1, or deferred; unowned idea dumps do not belong in
this file.
