# PalettePort release TODO

Last updated: 2026-09-12

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

- 457 active tests pass.
- 42 TODO tests remain: 4 real future gradient cases and 38 stale cases for
  shipped behavior.
- Coverage: 87.01% statements, 80.59% branches, 85.21% functions, 87.93% lines.
- Storage is 96.42% covered by line; image export is 99.18%; image extraction is
  100% covered by line.
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
- The 2026-09-12 dependency triage cleared all production and development audit
  findings without a direct-dependency major-version upgrade.
- The share-link documentation uses commas, while the encoder uses hyphens.
- Competitor copy contains stale or overbroad claims. The dated evidence and safe
  replacements are in `COMPETITOR_RESEARCH.md`.
- The production URL is `https://paletteport.app/`; DNS and GitHub Pages custom
  domain activation remain before the address is live.
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

- [x] **A-01 P0 — freeze the desktop scope and production URL. ✅**
  - Production URL selected and registered: `https://paletteport.app/`.
  - Root deployment is implemented: Vite uses `/`, the app owns `/` without a
    first-visit redirect, root-relative assets replace `/color-palette/` paths,
    canonical/Open Graph URLs use the production domain, and `public/CNAME`
    declares the custom domain.
  - First visits open directly into the workspace with a one-time orientation
    dialog for help and keyboard shortcuts.
  - The optional promotional page remains directly available at `/landing/`.
  - Spaceship DNS points the apex to all four GitHub Pages addresses, `www` to
    `karan-gera.github.io`, and retains the GitHub verification TXT record.
  - GitHub verified the domain, accepted the repository custom domain, completed
    its DNS check, and has HTTPS enforcement enabled.
  - The 2026-09-12 production smoke test verified the root app and share URL,
    favicon, Open Graph image, core font, optional `/landing/` page, and `www`
    redirect against the successful `main` Pages deployment.
  - Vite `base`, redirect behavior, `CNAME`, landing links, canonical URL, Open
    Graph URLs, favicon, and title have been reconciled for the root domain.
  - Mobile is explicitly unsupported/deferred in the app, About page, and README.
- [x] **A-02 P0 — restore palette reroll fades. ✅**
  - The regression came from the CVD opacity rule overriding the circle's broader
    transition; the shared `.cvd-color` rule now explicitly interpolates the
    background, border, and foreground colors over 200 ms.
  - Reroll-one, reroll-all, and relationship changes retain every color ID; preset
    changes retain IDs for stationary circles so existing DOM nodes can interpolate.
  - Reduced-motion CSS removes the color transition, while inline editing remains
    immediate so typed color previews do not lag.
  - Added regression coverage for palette and preset identity preservation and
    verified the rendered transitions in isolated Chromium.
- [x] **A-03 P0 — add release identity and license.**
  - Add the actual MIT `LICENSE` file.
  - Choose a SemVer prerelease and align `package.json`, docs, and changelog.
  - Release identity is `0.22.0-alpha.1`; Vite injects the package version into
    the About page and changelog so the displayed value stays aligned.
- [x] **A-04 P0 — replace or remove dead external actions. ✅**
  - Replace `https://github.com/your-repo/issues` with the real issue tracker.
  - Give About-page feature-request and donation controls real destinations or
    remove them.
  - Export fallback and About requests now open the repository's real new-issue
    route; source, star, and MIT license actions point to verified GitHub pages.
  - Donation copy was removed until a suitable support platform is selected.
- [x] **A-05 P0 — triage dependencies. ✅**
  - Re-run `npm audit` and `npm audit --omit=dev`.
  - Patch production findings without breaking the build.
  - Document accepted findings with package, advisory, exposure, and revisit date.
  - Updated Vite within major 7 and Vitest/UI/coverage within major 4, then
    refreshed vulnerable transitive packages within their declared ranges.
  - Both full and production-only audits report zero findings; no advisories are
    accepted or deferred.
- [x] **A-06 P0 — make public claims match observed behavior. ✅**
  - Replace “works offline” with “runs in your browser” until beta offline gates pass.
  - Correct the share-link delimiter example.
  - Replace “unlimited storage” with “no app-level save limit; browser storage applies.”
  - Fix remaining uppercase UI copy covered by the lowercase convention.
  - About now states that offline startup is not guaranteed and that browser
    storage limits apply; the static landing comparison no longer claims
    unlimited saves.
  - Share documentation now matches the encoder's hyphen-separated colors and
    lock values.
  - Documentation, shortcut, export, dialog, and preview-control labels follow
    the lowercase convention; code output and preview artwork keep intentional case.
- [ ] **A-07 P0 — replace the stale competitor matrix.**
  - Use the conservative comparison in `COMPETITOR_RESEARCH.md`.
  - Include source URLs and the research date with quota or price facts.
  - Render unknown as unknown, not as feature absence.
- [x] **A-08 P1 — refresh the About page. ✅**
  - Rework the content and visual hierarchy around what PalettePort does, who it
    is for, the desktop-only alpha scope, browser-local storage, and project
    attribution.
  - Keep the injected release version and license details accurate, and
    coordinate link and claim fixes with A-04 and A-06 instead of duplicating
    conflicting copy.
  - Keep all user-visible prose lowercase and verify every external action,
    keyboard navigation, focus behavior, and layout at supported desktop zooms.
  - Replaced the sales-style feature wall and competitor scorecard with a focused
    purpose, capability, data/limits, alpha-scope, and project-link structure.
  - Split About into its own component while preserving lazy Help/About loading.
  - Verified link destinations, tab order, focus containment, reduced-motion
    treatment, and no horizontal overflow at 100%, 125%, 150%, and 200% zoom equivalents.
- [x] **A-09 P1 — redesign the Help page from the ground up. ✅**
  - Audit the existing information architecture, navigation, demos, and copy
    against the tasks people actually need to complete.
  - Replace the current Help experience with a clearer structure and interaction
    model rather than incrementally restyling the existing two-column browser.
  - Rewrite the content in concise lowercase prose, preserve complete shortcut
    and feature coverage, and make navigation fully keyboard and screen-reader
    accessible.
  - Keep Help lazy-loaded and out of the closed-overlay DOM so the redesign does
    not regress the startup and DOM budgets established by A-12 and B-01.
  - Validate the new experience with task-based desktop usability, focus, zoom,
    and reduced-motion smoke tests.
  - Replaced the narrow two-column browser with a responsive manual layout that
    uses a persistent page index, a wide reading surface, and a contextual rail
    for page sections, shortcuts, and related pages.
  - Added fuzzy help search across page titles, descriptions, feature synonyms,
    and keyboard shortcuts, with keyboard selection and direct page navigation.
  - Expanded help search intent mapping across every page with workflow phrases,
    creative-app names, file formats, acronyms, alternate spellings, and typo-tolerant routing.
    Exact aliases now rank ahead of incidental prose, and table-driven regressions cover
    representative tasks across the complete manual.
  - Help remains part of the lazy documentation chunk and the closed overlay
    remains outside the DOM. Verified the layout and interaction model at the
    supported desktop zoom equivalents with reduced motion enabled and disabled.
  - Magenta documentation accents use separate light, gray, and dark tokens so
    dark themes keep large surfaces low-luminance and reserve brighter pink for
    text, focus, and small active controls.

### Failure containment and constrained-device minimum

- [x] **A-10 P0 — add a desktop error boundary. ✅**
  - Preserve a readable recovery screen instead of a blank app.
  - Provide reload/reset guidance without deleting local data automatically.
  - Add a regression test for the fallback path.
  - Added a root-level class error boundary with retry and reload actions, a local-data safety note, and a development-only `?test-error-boundary=1` trigger for manual review.
  - Added regression coverage for fallback rendering, retry data preservation, and delegated reload behavior.
- [ ] **A-11 P0 — respect reduced-motion preferences.**
  - Configure Framer Motion to respect the user preference.
  - Add CSS reduction for nonessential transitions and animations.
  - Test add, delete, reroll, view changes, docs, and dialogs with reduction enabled.
- [ ] **A-12 P0 — remove the worst startup-only work.**
  - Dynamically import and conditionally mount `DocsOverlay`.
  - Dynamically import `PalettePreviewOverlay` so Recharts/D3 leave the initial chunk.
  - Keep the closed documentation subtree out of the DOM.
  - Record before/after gzip size, initial transfer, and DOM count.
- [x] **A-13 P0 — cover and fix image-extraction correctness. ✅**
  - Extract quantization into a directly testable module.
  - Activate the stale extraction tests, including transparency and determinism.
  - Deduplicate centroids and handle requests larger than the distinct-color count.
  - Worker migration is a beta performance task unless the alpha implementation
    remains visibly blocking in the 6x CPU check.
  - Implemented a deterministic, weighted k-means helper that ignores transparent
    pixels, returns unique colors, and caps output at the distinct-color count.
  - Activated 29 pixel-level tests, including the canvas sampling bridge and
    duplicate-centroid repair; extraction now has 100% line coverage.

### ✅ Alpha verification

- [x] **A-14 P0 — cut and verify an alpha candidate. ✅**
  - `npm run build`, `npm run lint`, `npm test`, and `npm run test:coverage` pass.
  - Helium clean-profile smoke: add, lock, reroll, relationship, undo/redo,
    save/open, share, export, image export, gradient, extraction, reload.
  - Keyboard-only smoke covers the same core workflow where applicable.
  - Screen-reader/focus smoke covers dialogs, overlays, notifications, and errors.
  - Live Pages assets and links return successfully; no unexpected third-party
    runtime requests appear.
  - Publish known alpha constraints: desktop only and no offline boot.
  - Verified `0.22.0-alpha.1` from a temporary Helium profile against the local
    production build; the full mouse and keyboard workflows above completed,
    including PNG extraction, clipboard sharing, downloads, and reload persistence.
  - Added reusable modal focus containment for palette and gradient previews,
    with regression coverage for initial focus, tab trapping, escape, and focus
    restoration. Transient notifications now announce through a polite status region.
  - Final gates: 510 tests pass; coverage is 87.48% statements and 88.43% lines.
    The live app, landing page, fonts, images, lazy chunks, repository, and issue
    link return successfully, and observed app resources remain same-origin.
  - Desktop-only and no-offline-boot constraints are published in the readme and
    in-app about/changelog content.

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
- Select a support or donation platform before adding donation controls or copy.
- Landing-page redesign or analytics.
  - The current static page remains available at `/landing/`, but is not part of
    the first-visit flow and must be redesigned before it is reconsidered there.
  - Move competitive positioning to the landing page rather than About; rebuild
    its comparison from dated, sourced claims in `COMPETITOR_RESEARCH.md`.
  - Keep it outside the app bundle; it remains the fastest measured surface.

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
