# CLAUDE.md — AI Agent Style Guide

This document provides guidance for AI agents working on the **Color Palette Generator** codebase.

---

## Project Overview

A modern, interactive color palette generator built with React 19, TypeScript, Vite, Tailwind CSS, and shadcn/ui. Users can create, edit, lock, and save color palettes using various color theory relationships (complementary, analogous, triadic, etc.).

### Key Features
- Hero color generation with click-to-add
- Color theory relationships (complementary, analogous, triadic, tetradic, split-complementary, monochromatic, random)
- Undo/redo history management
- Color locking to preserve colors during rerolls
- Save/load palettes to localStorage
- Export/import palettes as JSON files
- 3-way theme toggle (light/gray/dark)

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 19 |
| Language | TypeScript (strict mode) |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State | React hooks + custom `useHistory` hook |
| Storage | Browser localStorage |
| Icons | Lucide React |

---

## File Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── toggle.tsx
│   │   ├── toggle-group.tsx
│   │   └── tooltip.tsx
│   ├── Header.tsx
│   ├── Controls.tsx
│   ├── ThemeToggle.tsx
│   ├── PaletteItem.tsx
│   ├── AddColor.tsx
│   ├── Hero.tsx
│   ├── AnimatedPaletteItem.tsx
│   ├── AnimatedPaletteContainer.tsx
│   ├── GlobalColorRelationshipSelector.tsx
│   ├── EditColorDialog.tsx
│   ├── SaveDialog.tsx
│   ├── OpenDialog.tsx
│   ├── NotificationModal.tsx
│   └── LockIcon.tsx
├── hooks/
│   ├── useHistory.ts    # Undo/redo state management
│   └── useTheme.ts      # 3-way theme management
├── helpers/
│   ├── colorTheory.ts   # HSL/hex conversion, color relationships
│   └── storage.ts       # localStorage utilities
├── lib/
│   └── utils.ts         # shadcn cn() utility
├── App.tsx              # Main app component
├── index.css            # Tailwind imports + theme variables
└── main.tsx             # Entry point
```

---

## Path Aliases

The project uses `@/` as an alias for `src/`:

```tsx
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'
```

---

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Components | `PascalCase` | `PaletteItem.tsx` |
| Hooks | `useCamelCase` | `useTheme.ts` |
| Helper files | `camelCase` | `colorTheory.ts` |
| State variables | `camelCase` | `lockedStates` |
| Constants | `UPPER_CASE` | `STORAGE_KEY` |
| Type definitions | `PascalCase` | `type SavedPalette` |
| Props types | `ComponentNameProps` | `type ControlsProps` |

---

## Theme System

### 3-Way Theme Toggle: light / gray / dark

```tsx
type Theme = 'light' | 'gray' | 'dark'
```

- **light**: Off-white background, dark text
- **gray**: 50% neutral gray background, light text
- **dark**: Near-black background, light text

### Resolution Order
1. Check localStorage for stored preference
2. Fall back to OS `prefers-color-scheme`
3. Default to `gray` if no preference detected

### Usage

```tsx
import { useTheme } from '@/hooks/useTheme'

function MyComponent() {
  const { theme, setTheme } = useTheme()
  // theme is 'light' | 'gray' | 'dark'
}
```

Theme is applied via `data-theme` attribute on `<html>`:
```css
[data-theme="dark"] { ... }
[data-theme="gray"] { ... }
[data-theme="light"] { ... }
```

---

## Styling Guidelines

### Tailwind CSS
Use Tailwind utility classes for all styling:

```tsx
<div className="flex items-center gap-2 p-4 bg-card rounded-lg border">
  ...
</div>
```

### shadcn/ui Components
Import from `@/components/ui/`:

```tsx
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
```

### Typography
- **Font family**: Monospace everywhere (`font-mono` class)
- **Text transform**: Lowercase for buttons (`lowercase` class)

### Color Circles (Hero Pattern)
The main color circles use this pattern:

```tsx
<button
  className="size-[200px] rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer transition-all duration-500"
  style={{
    backgroundColor: color,
    borderColor: textColor,
  }}
>
  ...
</button>
```

### CSS Variables
Theme variables are defined in `index.css` using OKLCH color space:

```css
:root {
  --background: oklch(0.98 0 0);
  --foreground: oklch(0.15 0 0);
  --border: oklch(0.88 0 0);
  /* ... */
}
```

Access in Tailwind: `bg-background`, `text-foreground`, `border-border`

---

## Component Patterns

### Functional Components Only
All components are functional with hooks. No class components.

```tsx
export default function ComponentName({ prop1, prop2 }: ComponentNameProps) {
  return <div>...</div>
}
```

### Props Typing
Define props as a type above the component:

```tsx
type ControlsProps = {
  onOpen: () => void
  onSave: () => void
  canUndo: boolean
  canRedo: boolean
}

export default function Controls({ onOpen, onSave, canUndo, canRedo }: ControlsProps) {
  // ...
}
```

### Dialog Pattern
Use shadcn Dialog with controlled state:

```tsx
<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle className="font-mono lowercase">title</DialogTitle>
    </DialogHeader>
    {/* content */}
    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>cancel</Button>
      <Button onClick={onSave}>save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## State Management

### History/Undo-Redo
Use the `useHistory<T>` hook for any state that needs undo/redo:

```tsx
const {
  history,
  current,
  canUndo,
  canRedo,
  push,      // Add new state (overwrites future)
  undo,
  redo,
  replace,   // Replace entire history
} = useHistory<string[]>({ initialHistory: [], initialIndex: -1 })
```

### Local Component State
Use `useState` for UI-only state (dialogs, hover states, form inputs).

---

## Color Theory Implementation

### HSL Operations
All color math happens in HSL space. Hex is for display/storage only.

```tsx
import { hexToHsl, hslToHex, generateRelatedColor } from '@/helpers/colorTheory'
```

### Color Relationships
```tsx
type ColorRelationship = 
  | 'complementary'     // 180° apart
  | 'analogous'         // ±30° apart
  | 'triadic'           // 120° apart
  | 'tetradic'          // 90° apart (square)
  | 'split-complementary' // 150° or 210° apart
  | 'monochromatic'     // Same hue, vary S/L
  | 'random'
```

---

## Storage Patterns

### localStorage Key
All palettes stored under: `'color-palette:saved'`
Theme preference stored under: `'color-palette:theme'`

### SavedPalette Type
```tsx
type SavedPalette = {
  id: string        // UUID
  name: string
  colors: string[]  // Hex values
  savedAt: string   // ISO date
}
```

---

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Type-check and build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

---

## Code Quality Checklist

Before completing any task, verify:

- [ ] No TypeScript errors (`npm run build`)
- [ ] No ESLint warnings (`npm run lint`)
- [ ] Components use Tailwind classes (no inline styles except dynamic colors)
- [ ] UI text is lowercase for buttons/labels
- [ ] Monospace font preserved (`font-mono` class)
- [ ] Transitions are smooth (`transition-all duration-300` typically)
- [ ] Uses shadcn/ui components where applicable

---

## Adding shadcn/ui Components

```bash
npx shadcn@latest add [component-name]
```

Components are added to `src/components/ui/`.

---

## Anti-Patterns to Avoid

| Don't | Do Instead |
|-------|------------|
| Use `any` type | Use proper types or `unknown` |
| Create class components | Use functional components |
| Use CSS Modules | Use Tailwind classes |
| Build custom UI primitives | Use shadcn/ui components |
| Mutate state directly | Use setter functions |
| Skip null checks | Handle `undefined`/`null` cases |
| Use `interface` | Use `type` for consistency |
| Add emojis to UI | Keep text minimal and monospace |

---

## Dependencies

Core:
- `react` / `react-dom` (19.x)
- `tailwindcss` (4.x)
- `lucide-react` - Icons

UI Components (shadcn/ui):
- `@radix-ui/react-dialog`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-toggle`
- `@radix-ui/react-toggle-group`
- `@radix-ui/react-tooltip`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`
