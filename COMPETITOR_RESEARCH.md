# PalettePort competitor research

Last researched: **2026-09-06**

Scope: desktop web palette generation and adjacent color workflows

Status: research reference; re-check plan pages before publishing price or quota claims

## Executive summary

PalettePort has a credible free-product position, but the current comparison copy overstates it and contains several demonstrably stale claims. The strongest honest message is not "every competitor lacks these tools." It is:

> a broad palette workflow with no account, no feature gates, and no app-level save limit — including 10-color palettes, accessibility checks, image extraction, gradients, previews, and code/art-app exports — in one browser-based tool.

The defensible advantages are the combination of features, local-first storage, lack of account requirement, breadth of export formats, and keyboard-oriented workflow. Individual competitors equal or exceed PalettePort in particular areas:

- Realtime Colors is also 100% free and combines contextual preview, contrast feedback, shortcuts, and broad web export.
- Adobe Color offers free color-wheel, CVD preview, contrast, image extraction, and gradient tools, with strong Adobe integration.
- Paletton already provides CVD simulation, WCAG checks, contextual previews, and numerous export formats.
- Colorffy's free plan now claims access to all generators plus unlimited palettes and gradients; its standalone contrast checker supports WCAG 2.1 and APCA.
- Coolors' free quotas remain meaningfully tighter, but its current Pro plan tops out at 10 palette colors, not infinity, and the `$99` figure in PalettePort is obsolete.

Public copy should therefore compare a small number of precise, sourced plan facts and describe everything else as a PalettePort capability. Avoid red-X claims for features that were not found in a competitor's marketing page; "not documented" is not the same as "does not exist."

## Methodology

- Reviewed current PalettePort claims in:
  - `src/components/DocsOverlay.tsx`
  - `public/landing/index.html`
  - `TODO.md`
- Verified PalettePort capabilities against current helpers, hooks, and components in this repository.
- Checked official public product, pricing, feature, and documentation pages in an unauthenticated US session.
- Preferred explicit plan-page language over inference from a navigation link or the mere presence of a tool page.
- Recorded ambiguity as **unclear** or **not documented** rather than treating it as absence.
- Did not create accounts, start trials, make purchases, or inspect paid-only product screens.

Prices, quotas, and plan packaging can change or be localized. The evidence below is a dated snapshot, not a permanent guarantee.

## Problems in the current PalettePort comparison

### Claims that are incorrect or materially stale

| Current claim | Finding | Recommended action |
| --- | --- | --- |
| Coolors: `5 free, ∞ pro ($99)` colors | Current Coolors pricing says up to 5 colors on Free and up to 10 on Pro. The `$99` lifetime card remains only as commented-out HTML; the active offer is a subscription. | Replace with `5 free / 10 pro`; keep price in a dated footnote, not the cell. |
| Coolors Pro: `$3.49/mo` | Current rendered US offer is `$5` month-to-month or `$36/year` (`$3/mo` equivalent). Pricing is dynamically rendered and may vary by region. | Remove `$3.49` everywhere. Prefer `paid pro plan` or date-stamp exact prices. |
| Colorffy: max 5 colors | The official pricing page does not state a per-palette swatch cap. It does state unlimited custom palettes and gradients on Basic. | Mark per-palette size `not stated`; do not publish `5`. |
| Colorffy: contrast checker is Pro | Colorffy exposes a public WCAG 2.1/APCA contrast checker, and Basic says it includes access to all tools. | Treat the checker as available on Free; distinguish free tool access from paid exports. |
| Colorffy: image extraction `free (limited)` | Basic includes all tools, while Pro specifically unlocks advanced image-extractor layouts. | Say `included; advanced layouts pro` if this detail is worth keeping. |
| Adobe Color is effectively paywalled behind Creative Cloud | Adobe's official Color/Express pages provide color wheel, contrast, CVD preview, image extraction, and gradient creation with "Get Started for Free" language. Applying palettes automatically to designs is identified as paid. | Remove the blanket paywall claim. Compare account/integration requirements instead. |
| Realtime Colors has no export | Its official page documents CSS, SCSS, PNG, ZIP, QR, custom code, shades, gradients, and unlimited export. | Remove this claim. Realtime Colors is a serious free alternative. |
| Paletton has no export formats or accessibility tools | Paletton's official page documents HTML, CSS, LESS, XML, text, PNG, ACO, and GPL exports, multiple CVD simulations, and WCAG pairwise contrast checking. | Remove both claims. Do not use "dated UI" as an objective product fact. |
| Color Hunt is browse-only | Color Hunt has an official four-color palette creation page as well as discovery/collections. It is still inspiration-first, but not literally browse-only. | Say `curation-first, fixed four-color creation` if mentioned. |
| PalettePort works offline | Local processing and local storage are true. Full offline availability is not guaranteed without a service worker/cache policy; prior runtime Google Font requests made the claim even weaker. | Publish `runs in your browser` and `no account required`. Only claim offline after a defined offline test and caching implementation. |
| PalettePort has unlimited saves | There is no app-level numerical quota, but browser `localStorage` is finite and domain/browser-specific. | Say `no app-level save limit; browser storage applies`. |

### Claims that are too broad to defend

- "The free tier beats their paid tier."
- "Every action has a shortcut" unless a release checklist proves literal coverage.
- "No competitor offers art-app exports" without testing every export dialog and version.
- Red-X `n/a` cells based only on a missing marketing-page mention.
- Privacy claims about competitor uploads or telemetry without reviewing current privacy policies and actual network behavior.
- "No ads" claims for competitors unless their current plan page states it explicitly.
- "AI-only" for Khroma: generation is AI-personalized, but the product also supports search, saving, multiple views, codes, and accessibility ratings.

## Recommended competitor set

### Public comparison set

Keep the published comparison narrow enough to re-verify regularly:

1. **Coolors** — category leader and clearest freemium quota comparison.
2. **Colorffy** — closest broad freemium tool suite for designers/developers.
3. **Realtime Colors** — strongest free contextual-preview/web-export comparison.
4. **Adobe Color** — major free ecosystem alternative with accessibility and extraction tools.

If four competitor columns are too wide, publish Coolors and Colorffy in the table and describe Realtime Colors and Adobe Color in surrounding copy. PalettePort should not pretend those alternatives do not exist.

### Research/watch set

- **Paletton** — strong classical color theory, accessibility, preview, and art-app export baseline.
- **Khroma** — personalized AI discovery, unlimited saved library, multiple preview modes, code, and WCAG pair ratings.
- **Huemint** — ML-generated contextual palettes for brands, websites, illustrations, and uploaded flat designs.
- **Colormind** — neural palette generation, image upload, and website-context preview.
- **Leonardo** — target-contrast design-system scales, colorblind-safe generation, SVG/CSS/design-token output.
- **ColorKit** — free palette, gradient, contrast, and image-extraction tool suite; relevant direct newcomer.
- **Canva Colors** — free image-to-palette acquisition funnel into Canva's design ecosystem.
- **Color Hunt** — discovery/community competitor with fixed four-color creation.
- **Happy Hues** — curated colors shown in real interface context rather than a full generator.
- **ColorSpace** — lightweight palette and two-/three-color gradient generator.

## First-party evidence

All sources were accessed on **2026-09-06** unless noted otherwise.

### Direct competitors

| Product | Current free/paid position | Explicitly documented relevant capabilities | Unknowns and cautions | First-party sources |
| --- | --- | --- | --- | --- |
| **Coolors** | Free has ads, palettes up to 5 colors, 10 saved palettes, 1 project, 1 collection, and 5 saved colors. Pro removes ads, raises palettes to 10 colors, and makes saves/projects/collections unlimited. Rendered US pricing showed `$5/month` or `$36/year` (`$3/month` equivalent). | Free image picker and standalone contrast checker are publicly accessible. Pro pricing explicitly includes palette contrast, variations, and advanced exports. | Do not conflate the free standalone contrast checker with the paid palette-wide contrast workflow. Current pricing does not support `∞` palette colors. Pricing is dynamically localized. | [Pricing](https://coolors.co/pricing), [Contrast checker](https://coolors.co/contrast-checker), [Image picker](https://coolors.co/image-picker), [Gradient maker](https://coolors.co/gradient-maker) |
| **Colorffy** | Basic is free forever with all color generators, unlimited custom palettes and gradients, and up to 3 collections. Pro is `$5/month` and adds unlimited collections, advanced exports, app tokens, wallpapers, team features, and an ad-free experience. | Public WCAG 2.1/APCA contrast checker; palettes, gradients, light/dark themes, image tools; paid web/code/image/app-token exports are extensively documented. | The public plan copy does not state a per-palette swatch limit. The annual price was not present in the extracted current plan content, so `$3.33/month annual` should be rechecked before use. | [Pricing](https://colorffy.com/about/pricing), [Contrast checker](https://colorffy.com/contrast-checker) |
| **Adobe Color / Adobe Express** | Official pages use "Get Started for Free." Saving goes to a Creative Cloud library; automatically applying a palette to designs is explicitly described as paid. | Interactive harmony wheel, live design preview, CVD simulation, WCAG contrast checker, image palette extraction, and image gradient extraction. Gradient palettes support 2–15 colors. | A free Adobe account may be required for library saving and Express handoff. Export formats and anonymous persistence need hands-on account-state testing before comparison. | [Color](https://color.adobe.com/), [Color wheel](https://color.adobe.com/create/color-wheel), [Contrast](https://color.adobe.com/create/color-contrast-analyzer), [Image extraction](https://color.adobe.com/create/image), [Image gradient](https://color.adobe.com/create/image-gradient) |
| **Realtime Colors** | Officially says `100% Free! Forever.` and `Export all you want.` | Five design-role colors shown on a real website, font pairing, WCAG-style contrast lights, CSS/Tailwind/SCSS/custom code, shades, gradients, QR, PNG/ZIP download, share link, and keyboard shortcuts for major actions. | Saved palette library, CVD simulation, image extraction, and offline behavior are not documented on the main page. It loads Google Fonts and analytics, but this research did not perform a privacy-policy audit. | [Product](https://www.realtimecolors.com/), [Contrast docs](https://www.realtimecolors.com/docs/contrast-checker), [Export docs](https://www.realtimecolors.com/docs/exporting) |
| **Paletton** | Public web tool; no paid plan was found on its main product page. Advertising/affiliate elements are present. | One to four hues with five shades each, classical harmony modes, contextual previews, CVD/daltonism simulations, WCAG pairwise contrast, and HTML/CSS/LESS/XML/text/PNG/ACO/GPL exports. | Account/save behavior and current maintenance cadence are unclear. Avoid subjective claims such as "dated" in factual tables. | [Product and feature description](https://paletton.com/) |
| **Khroma** | Publicly usable product; no pricing page or paid plan was found during this pass. | Personalized AI generation, limitless palettes, unlimited saved library, typography/gradient/palette/custom-image views, color names, HEX/RGB/CSS, and WCAG accessibility ratings for pairs. | No-account behavior, storage location, export-file formats, image extraction, CVD, and offline behavior are not stated on the public landing page. | [Product](https://www.khroma.co/) |

### Adjacent and missing alternatives

| Product | Why it matters | Verified capabilities | First-party sources |
| --- | --- | --- | --- |
| **Huemint** | Context-aware palette generation competes with PalettePort's preview and harmony story. | ML palettes for brand/site/illustration templates; color locking; creativity control; custom flat-design upload; explicit modeling of foreground/background/accent relationships. | [Product](https://huemint.com/), [Methodology](https://huemint.com/about/) |
| **Colormind** | Simple free AI generation and contextual website palette testing. | Five-color neural generation, locked colors, image upload, Bootstrap/site preview templates, and public API documentation. | [Product](http://colormind.io/), [Image upload](http://colormind.io/image/), [Method](http://colormind.io/blog/generating-color-palettes-with-deep-learning) |
| **Leonardo** | Strong accessibility/design-token alternative rather than inspiration generator. | Target-contrast scale generation, adaptive themes, colorblind-safe palettes, alpha-aware comparison, SVG output, CSS custom properties, and W3C-style design tokens. | [Product](https://leonardocolor.io/) |
| **ColorKit** | Broad free suite overlaps directly with several PalettePort acquisition keywords. | Free palette generator, gradient maker, contrast checker, gradient-palette generator, and palette-from-image tool. | [Product](https://colorkit.co/), [Palette generator](https://colorkit.co/color-palette-generator/), [Contrast](https://colorkit.co/contrast-checker/), [Image palette](https://colorkit.co/color-palette-from-image/) |
| **Canva Colors** | Major image-extraction entry point connected to a full design product. | Upload a photo to create a palette, browse named combinations, and hand colors into Canva. | [Color palette generator](https://www.canva.com/colors/color-palette-generator/) |
| **Color Hunt** | Inspiration/community substitute for users who want ready-made palettes. | Browse/like/collect community palettes and create a fixed four-color palette for submission. | [Browse](https://colorhunt.co/), [Create](https://colorhunt.co/create) |
| **Happy Hues** | Competes specifically with contextual visualization. | Curated palettes applied to real interface sections with usage guidance. | [Product](https://www.happyhues.co/) |
| **ColorSpace** | Lightweight SEO competitor for quick palette and gradient jobs. | Palette generation from a seed color and two-/three-color gradient tools. | [Palette generator](https://mycolor.space/), [Gradient](https://mycolor.space/gradient.php), [Three-color gradient](https://mycolor.space/gradient3.php) |

## Capability comparison suitable for internal decisions

This table is deliberately conservative. `Not documented` means the feature was not confirmed from the cited first-party public pages, not that it is absent.

| Dimension | PalettePort | Coolors Free | Colorffy Basic | Adobe Color | Realtime Colors |
| --- | --- | --- | --- | --- | --- |
| Price | Free; no tiers in current app | Free with ads | Free forever; ad-free is Pro benefit | Core Color tools promoted as free | 100% free forever |
| Palette size | Up to 10 | Up to 5 | Per-palette count not stated | Main palette commonly 5; image gradients 2–15 | 5 semantic design roles |
| Saving | No app-level numerical cap; local browser storage | Up to 10 cloud palettes | Unlimited custom palettes; up to 3 collections | Creative Cloud library | Library not documented; share link available |
| Account needed for core generation | No | No | No | No for tool entry; account likely for library/Express handoff | No |
| Account needed to save | No | Account-plan quota applies | Account-plan features | Creative Cloud library | Not documented |
| Contrast | Palette/background matrix and WCAG levels | Standalone checker free; palette contrast Pro | WCAG 2.1 and APCA checker | WCAG checker and live preview | Contrast lights for design roles |
| CVD | Four live simulations | Available in generator; current plan status not stated | Not documented | Multiple CVD previews | Not documented |
| Image extraction | Included; processed in browser | Included in Free | Tool included; advanced layouts Pro | Included | Not documented |
| Gradients | Editable stops plus CSS/Tailwind/SVG/PNG | Public gradient tools | Generators included; advanced exports Pro | Image gradient, 2–15 colors | Gradient code/export tools |
| Context preview | Title layouts, dashboard/UI mockup, chart | Visualizer exists; plan details should be rechecked | Not verified | Live design preview | Core product experience |
| Code export | CSS vars, Tailwind, SCSS, JSON and more | Advanced exports Pro | Advanced code exports Pro | Codes/download behavior varies by tool | CSS, Tailwind, SCSS, custom code |
| Art-app files | ASE, ACO, GPL, Procreate, Paint.NET | Exact current set not verified | App token exports Pro; traditional swatch files not documented | Adobe workflow integration; raw format set not verified | Not documented |
| Keyboard | Broad in-app shortcut catalog | Generator shortcuts available | Not documented | Not documented | Major controls advertise shortcuts |
| Data model | Local-first; no backend/account | Account-backed cloud quotas for saves | Account-backed plans for saves/collections | Creative Cloud library | Share-link workflow; persistence not documented |

## Claims safe to publish

The following are strong and verifiable from the current PalettePort codebase:

- `free, with no paid tier or feature gates`
- `no account required`
- `up to 10 colors in a palette`
- `save palettes and organize them with collections and tags in your browser`
- `no app-level limit on saved palettes; browser storage limits apply`
- `export code, images, and native palette files for common art apps`
- `check WCAG contrast across palette colors and standard backgrounds`
- `preview four color-vision-deficiency simulations`
- `extract dominant colors from an image in the browser`
- `build and export linear gradients`
- `preview colors in layouts and UI components before implementation`
- `use a documented keyboard-oriented workflow`
- `no generative AI is used by the product`
- `palette data stays in the browser unless the user exports or shares it`

Use `local-first` rather than `unlimited cloud storage`. Use `runs in your browser` rather than `works offline` until offline boot, fonts, and cached assets have a defined and tested guarantee.

## Claims to avoid or remove

- Remove `$99`, `$3.49/mo`, `∞ pro` colors, and `Colorffy max 5`.
- Remove `Colorffy contrast checker: pro`.
- Remove `Adobe Color is effectively paywalled`.
- Remove `Realtime Colors: no export`.
- Remove `Paletton: no exports / no accessibility tools`.
- Replace `Color Hunt: browse-only` with a narrower description.
- Remove blanket statements that competitors have no keyboard coverage, no naming, no previews, or no art-app export unless tested against a dated build.
- Do not say PalettePort categorically beats a competitor's paid tier.
- Do not publish exact competitor prices without an `as of` date and a recurring re-verification owner.
- Do not state that PalettePort has literally unlimited storage.
- Do not state full offline support merely because computations are client-side.

## Suggested concise public comparison

### Preferred table

This version uses only high-confidence plan facts and avoids red-X claims:

| | PalettePort | Coolors Free | Colorffy Basic |
| --- | --- | --- | --- |
| palette size | up to 10 | up to 5 | not stated |
| saved palettes | no app-level count limit; stored locally | up to 10 | unlimited; up to 3 collections |
| account needed to save | no | yes | yes |
| integrated palette contrast | included | pro | standalone checker included |
| advanced code exports | included | pro | pro |
| image extraction | included | included | included; advanced layouts pro |
| ads in the workspace | none | yes | ad-free is a pro benefit |
| paid feature gates | none | yes | yes |

Footnote:

> competitor plans checked september 6, 2026. plan details can change; see coolors and colorffy pricing pages.

### Preferred positioning copy

Short:

> ten-color palettes, local saves, accessibility checks, image extraction, gradients, previews, and production-ready exports. no account, no ads, no feature gates.

Longer:

> PalettePort keeps the whole palette workflow in one free browser tool: generate up to ten colors, organize local saves, check contrast and color-vision simulations, extract from images, build gradients, preview real layouts, and export for code or art apps. there is no account to create and no upgrade screen waiting behind the next button.

Privacy-safe variant:

> your palette data is stored in your browser and is only put into a file or share link when you choose to export or share it.

Avoid `zero compromises`: competitors have strengths PalettePort does not attempt to match, including cloud collaboration, community discovery, native apps, plugins, AI generation, and deep design-suite integration.

## Maintenance recommendation

- Put the research date and source links next to the comparison in code or content metadata.
- Re-check direct competitors at every PalettePort release and at least quarterly.
- Prefer quota/plan facts over subjective feature scoring.
- Keep an `unknown` state in the comparison data model; do not render unknown as a red X.
- Separate `standalone tool exists` from `integrated palette workflow is included`.
- Test claims in a signed-out browser because pricing pages and features may differ for authenticated users.
- Screenshot or archive the rendered pricing state internally when changing public comparison copy.

## Source index

- Coolors: <https://coolors.co/pricing>
- Coolors contrast: <https://coolors.co/contrast-checker>
- Coolors image picker: <https://coolors.co/image-picker>
- Colorffy: <https://colorffy.com/about/pricing>
- Colorffy contrast: <https://colorffy.com/contrast-checker>
- Adobe Color: <https://color.adobe.com/>
- Adobe color wheel: <https://color.adobe.com/create/color-wheel>
- Adobe contrast: <https://color.adobe.com/create/color-contrast-analyzer>
- Adobe image extraction: <https://color.adobe.com/create/image>
- Adobe image gradient: <https://color.adobe.com/create/image-gradient>
- Realtime Colors: <https://www.realtimecolors.com/>
- Paletton: <https://paletton.com/>
- Khroma: <https://www.khroma.co/>
- Huemint: <https://huemint.com/about/>
- Colormind: <http://colormind.io/>
- Leonardo: <https://leonardocolor.io/>
- ColorKit: <https://colorkit.co/>
- Canva Colors: <https://www.canva.com/colors/color-palette-generator/>
- Color Hunt: <https://colorhunt.co/>
- Happy Hues: <https://www.happyhues.co/>
- ColorSpace: <https://mycolor.space/>
