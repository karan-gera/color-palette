# PalettePort

PalettePort is a client-side color workflow application built with React and TypeScript. It combines palette generation, color-theory operations, accessibility analysis, gradient authoring, image extraction, and export tooling in a static web application with no backend.

[Open the public alpha](https://paletteport.app/) · Current release: `0.23.0-alpha.1`

The alpha targets desktop browsers. Mobile visitors can continue into the desktop interface, but responsive-layout QA is not part of the current release gate.

## Engineering overview

- React 19 application built by Vite 7
- strict TypeScript with the `@/` alias mapped to `src/`
- Tailwind CSS v4 and Radix/shadcn primitives for the UI layer
- custom hooks for palette history, view state, dialogs, keyboard routing, and gradient state
- pure helpers for color math, contrast, extraction, naming, persistence, URL state, and file generation
- Vitest + jsdom for helper, hook, and targeted component tests
- browser-only persistence through `localStorage`; no API, account system, analytics, or runtime environment variables

The application is deployable as static assets from `dist/`. Vite injects the version from `package.json` as `__APP_VERSION__` at build time.

## Local development

The repository does not currently pin a Node.js version. Vite 7 requires Node.js `20.19+` or `22.12+`. Install dependencies from the lockfile:

```bash
git clone https://github.com/karan-gera/paletteport.git
cd paletteport
npm ci
npm run dev
```

Vite serves the app at `http://localhost:5173` by default. No `.env` file or external service is required.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server with HMR |
| `npm run build` | Run the TypeScript project build, then create `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint across the repository |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:coverage` | Run tests with V8 coverage thresholds and an HTML report |

Before handing off a code change, run:

```bash
npm run build
npm run lint
npm test
npm run dev
```

The last command is the manual browser smoke test. The minimum smoke covers color creation, keyboard routing, save/open, palette and image export, and an undo/redo round trip.

## Architecture

```text
src/main.tsx
  └─ error, reduced-motion, and mobile boundaries
      └─ src/App.tsx
          ├─ hooks/       state machines and interaction orchestration
          ├─ components/  views, dialogs, overlays, and UI primitives
          └─ helpers/     color algorithms and browser integrations
```

`App.tsx` is the composition root. Domain state is split into focused hooks instead of a global store:

- `usePaletteColors` owns the current palette, stable color IDs, locks, relationships, and undo/redo integration.
- `useGradientStops` maintains gradient stops and keeps palette-linked stops synchronized.
- `useViewNavigation`, `useUIPanels`, and `useDialogState` coordinate view and overlay state.
- `useKeyboardShortcuts` centralizes global keyboard routing and suppresses shortcuts while the user is typing or a modal workflow is active.
- `useHistory` provides the generic history state machine used by palette editing.

Logic that does not require React belongs in `src/helpers/`. This keeps color conversion, WCAG calculations, export encoders, image sampling, storage, and URL serialization independently testable.

### Repository layout

```text
src/
├── components/          application UI and shadcn/Radix primitives
├── helpers/             pure domain logic and browser adapters
├── hooks/               reusable state and interaction logic
├── lib/                 shared low-level utilities
├── __tests__/
│   ├── helpers/         one test module per helper
│   ├── hooks/           renderHook state-machine tests
│   ├── components/      targeted boundary/dialog tests
│   └── future/          explicit test debt and planned behavior
├── App.tsx              application composition root
├── main.tsx             React entry point and top-level boundaries
└── index.css            Tailwind import, tokens, themes, and global CSS
public/
├── landing/index.html   standalone marketing route
├── fonts/               self-hosted application and preview fonts
└── favicon.svg
```

## Runtime data model

Palette data stays in the browser. The primary `localStorage` records are:

| Key | Contents |
| --- | --- |
| `color-palette:saved` | named palettes, tags, collection membership, and save timestamps |
| `color-palette:collections` | collection names and creation timestamps |
| `color-palette:history` | capped palette history plus the active index and session timestamp |

History is capped at 2,048 entries. After an eight-hour session timeout, stored history remains available for inspection but is not restored as the active palette state.

Shared palettes use URL query parameters rather than server storage:

```text
?colors=ff5733-3498db-2ecc71&locked=1-0-1
```

The saved-palette backup format is versioned as `1.0` JSON. Import code performs structural validation and migrates older records that do not have tags.

## Testing strategy

Tests concentrate on deterministic domain behavior and hook state machines, where regressions can silently produce incorrect colors or corrupt persistence. Add tests alongside every new helper or hook:

```text
src/helpers/colorTheory.ts
src/__tests__/helpers/colorTheory.test.ts

src/hooks/useHistory.ts
src/__tests__/hooks/useHistory.test.ts
```

The suite runs in jsdom with shared setup from `src/__tests__/setup.ts`. Coverage includes `src/helpers`, `src/hooks`, and `src/lib`, with enforced thresholds configured in `vitest.config.ts`. Browser-owned APIs such as canvas image decoding, downloads, clipboard access, and the EyeDropper API still require an isolated Chromium smoke test.

See [TESTING.md](TESTING.md) for the test inventory, regression rationale, mocks, and browser-review cases.

## Contribution conventions

- Keep TypeScript strict and use `@/` imports for code under `src/`.
- Put reusable state transitions in hooks and non-React domain logic in helpers.
- Add regression coverage for every bug fix.
- Keep user-visible interface copy lowercase; code samples and identifiers are exempt.
- Register new shortcuts in `SHORTCUT_GROUPS` and document them in the in-app help.
- Document every shipped feature in `src/components/DocsOverlay.tsx`, add its changelog entry, and update `TODO.md` last.
- Do not include unrelated working-tree changes in a commit.

Read [AGENTS.md](AGENTS.md) for the completion checklist and workflow, and [CLAUDE.md](CLAUDE.md) for architecture, naming, and component conventions.

## Product surface

The current desktop application supports:

- palette generation from seven color relationships and eight presets
- lock-aware rerolling, direct editing, variations, reordering, and session history
- saved palettes with tags, collections, JSON backup, and URL sharing
- CSS, JSON, Tailwind, SCSS, image, and art-application export paths
- gradient construction and export
- image-based palette extraction and browser color picking
- WCAG contrast analysis, color-vision-deficiency simulation, and harmony scoring
- keyboard-driven operation and reduced-motion support

The in-app help overlay is the canonical user-facing reference for workflows and shortcuts.

## Release status

The project is in public alpha. Release gates, audit findings, performance work, and deferred mobile scope are tracked in [TODO.md](TODO.md), [AUDIT.md](AUDIT.md), and [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md).

## License

[MIT](LICENSE) © 2026 Kaydigit LLC
