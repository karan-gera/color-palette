# Color Palette Generator

A modern, interactive color palette generator built with React, TypeScript, and Vite. Create, edit, and save beautiful color palettes with advanced color theory relationships and a clean, monospace design aesthetic.

## Features

### Interactive Color Creation
- **Hero Color Generation**: Click the large circle to generate a random starting color
- **Smart Color Relationships**: Choose from multiple color theory relationships:
  - Complementary
  - Analogous  
  - Triadic
  - Tetradic
  - Split-complementary
  - Monochromatic
  - Random
- **Individual Color Controls**: Edit, reroll, or delete individual colors
- **Color Locking**: Lock colors to prevent changes during global rerolls

### Advanced Controls
- **Undo/Redo**: Full history tracking with undo and redo functionality
- **Global Reroll**: Generate entire new palettes based on selected color relationships
- **Manual Color Editing**: Click "edit" to input specific hex values
- **Save & Load**: Save palettes locally and reload them later

### Modern Design
- **Dark/Light Theme**: Toggle between themes with smooth transitions
- **Monospace Typography**: Clean, developer-friendly aesthetic
- **Responsive Layout**: Works seamlessly across different screen sizes
- **Smooth Animations**: Polished interactions with CSS transitions

### Persistence
- **Local Storage**: Automatically saves palettes to your browser
- **Palette Management**: Name, save, and organize multiple palettes
- **Export Ready**: Copy hex values for use in your projects

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd color-palette
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## How to Use

1. **Generate a Starting Color**: Click the large circle to create a random color
2. **Choose Relationships**: Use the dropdown to select how new colors relate to your base color
3. **Add Colors**: The palette will automatically generate colors based on your selected relationship
4. **Fine-tune**: 
   - Lock colors you want to keep with the lock icon
   - Edit individual colors by clicking "edit"
   - Reroll individual colors with "reroll"
   - Delete unwanted colors with "delete"
5. **Save Your Work**: Use the "save" button to store palettes for later use
6. **Load Saved Palettes**: Use the "open" button to browse and load saved palettes

## Technical Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS Modules with CSS custom properties
- **State Management**: React hooks with custom history management
- **Color Theory**: Custom HSL/hex conversion and relationship algorithms
- **Storage**: Browser localStorage for persistence

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx       # App header with theme toggle
│   ├── Controls.tsx     # Undo/redo/save/open controls  
│   ├── Hero.tsx         # Main color circle
│   ├── PaletteItem.tsx  # Individual color items
│   └── ...             # Additional UI components
├── hooks/
│   └── useHistory.ts    # Undo/redo state management
├── helpers/
│   ├── colorTheory.ts   # Color relationship algorithms
│   └── storage.ts       # localStorage utilities
└── index.css           # Global styles and theme variables
```

## Color Theory Implementation

The app implements several color harmony relationships:

- **Complementary**: Colors opposite on the color wheel (180° apart)
- **Analogous**: Adjacent colors on the color wheel (30° apart)
- **Triadic**: Three colors equally spaced on the color wheel (120° apart)
- **Tetradic**: Four colors forming a rectangle on the color wheel
- **Split-complementary**: Base color plus two colors adjacent to its complement
- **Monochromatic**: Variations in saturation and lightness of a single hue

## License

This project is open source and available under the MIT License.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- TypeScript strict mode enabled
- Functional components with hooks
- CSS Modules for styling
- Monospace typography throughout
- Consistent naming conventions (PascalCase for components, camelCase for variables)

---

Built with ❤️ using React, TypeScript, and modern web technologies.