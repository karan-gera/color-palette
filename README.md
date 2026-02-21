# Color Palette Generator

Free color palette tool. No accounts, no ads, no paywalls. Everything runs in your browser and stays on your device.

**[Try it live →](https://karan-gera.github.io/color-palette/)**

## What it does

- Generate colors using color theory relationships (complementary, analogous, triadic, etc.)
- Lock colors to keep them while rerolling others
- Copy in 6 formats: hex, rgb, hsl, css variable, tailwind, scss
- Export to code (css, json, tailwind, scss) and art apps (photoshop, procreate, gimp, etc.)
- Check WCAG contrast ratios for accessibility
- Preview color blindness simulations (deuteranopia, protanopia, tritanopia, achromatopsia)
- See color names from a 4,000+ entry database
- Full keyboard control — every action has a shortcut

## Quick start

```bash
git clone https://github.com/karan-gera/color-palette.git
cd color-palette
npm install
npm run dev
```

Open `http://localhost:5173`.

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `A` / `Space` | Add a color |
| `R` | Reroll all unlocked |
| `1-9, 0` | Lock/unlock color by position |
| `Z` | Undo |
| `Shift+Z` | Redo |
| `S` | Save palette |
| `O` | Open saved palette |
| `C` | Copy share link |
| `E` | Export palette |
| `/` | Show all shortcuts |

## Tech stack

- React 19, TypeScript, Vite
- Tailwind CSS v4, shadcn/ui
- Framer Motion for animations
- All color math is custom (HSL/hex conversion, color relationships, contrast calculations)
- Browser localStorage for persistence — no server

## Privacy

Your palettes stay on your device. No accounts, no analytics, no server. Data lives in localStorage and never leaves your browser unless you export it yourself.

## License

MIT
