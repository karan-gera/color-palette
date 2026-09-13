import type { HelpSearchEntry } from '@/helpers/helpSearch'

export const HELP_CONTENT: HelpSearchEntry[] = [
  { id: 'getting-started', title: 'getting started', section: 'basics', summary: 'add colors, lock the ones you want to keep, and reroll the rest.', keywords: ['begin', 'new palette', 'random'], shortcuts: ['a', 'space', 'r'], related: ['palette', 'relationships', 'keyboard'] },
  { id: 'palette', title: 'palette', section: 'basics', summary: 'lock, reroll, edit, delete, and copy individual colors.', keywords: ['swatch', 'circle', 'hex'], shortcuts: ['1-9, 0'], related: ['edit-mode', 'variations', 'copy-formats'] },
  { id: 'undo-redo', title: 'undo & redo', section: 'basics', summary: 'move backward or forward through palette changes in the current session.', keywords: ['history', 'revert', 'mistake'], shortcuts: ['z', 'shift+z'], related: ['palette', 'getting-started'] },
  { id: 'relationships', title: 'color relationships', section: 'basics', summary: 'generate colors using complementary, analogous, triadic, and other hue relationships.', keywords: ['theory', 'complementary', 'analogous', 'triadic'], shortcuts: ['q'], related: ['presets', 'harmony'] },
  { id: 'presets', title: 'presets', section: 'basics', summary: 'generate palettes in pastel, neon, earth, jewel, warm, cool, and muted styles.', keywords: ['style', 'pastel', 'neon', 'earth'], shortcuts: ['p', 'shift+p'], related: ['relationships', 'palette'] },
  { id: 'save-open', title: 'save & open', section: 'storage', summary: 'save palettes in this browser and open them again later.', keywords: ['recover', 'lost', 'find', 'local storage'], shortcuts: ['s', 'o'], related: ['collections', 'tags', 'backup'] },
  { id: 'collections', title: 'collections', section: 'storage', summary: 'group saved palettes and filter the open and save dialogs.', keywords: ['folder', 'organize', 'group'], related: ['save-open', 'tags'] },
  { id: 'tags', title: 'tags', section: 'storage', summary: 'label saved palettes and combine tags with text and collection filters.', keywords: ['label', 'search', 'filter'], related: ['collections', 'save-open'] },
  { id: 'backup', title: 'import / export palettes', section: 'storage', summary: 'back up all saved palettes to json or restore them in another browser.', keywords: ['restore', 'json', 'transfer', 'backup'], related: ['save-open', 'export'] },
  { id: 'copy-formats', title: 'copy formats', section: 'copy & share', summary: 'copy colors as hex, rgb, hsl, css variables, tailwind, or scss.', keywords: ['clipboard', 'code', 'developer'], related: ['share', 'export'] },
  { id: 'share', title: 'share via url', section: 'copy & share', summary: 'copy a link containing the palette colors and lock state.', keywords: ['send', 'link', 'collaborate'], shortcuts: ['c'], related: ['copy-formats', 'export'] },
  { id: 'export', title: 'export', section: 'export', summary: 'send a palette to code, image, and design-tool formats.', keywords: ['download', 'css', 'svg', 'png', 'adobe'], shortcuts: ['e', 'shift+command+e'], related: ['copy-formats', 'share', 'gradient'] },
  { id: 'edit-mode', title: 'edit mode', section: 'color tools', summary: 'enter exact hex, hsl, or oklch values and pick a color from the screen.', keywords: ['exact', 'change', 'picker'], shortcuts: ['shift+alt+1-9, 0'], related: ['color-picker', 'variations'] },
  { id: 'gradient', title: 'gradient generator', section: 'color tools', summary: 'arrange palette-linked or custom color stops and export the gradient.', keywords: ['linear', 'stop', 'angle'], shortcuts: ['g', 'e'], related: ['export', 'palette'] },
  { id: 'preview', title: 'palette preview', section: 'color tools', summary: 'test colors in bars, title designs, posters, and interface examples.', keywords: ['mockup', 'ui', 'design'], shortcuts: ['f'], related: ['contrast', 'harmony'] },
  { id: 'extract', title: 'extract from image', section: 'color tools', summary: 'find dominant colors in an image and choose which ones to add.', keywords: ['photo', 'picture', 'upload', 'sample'], shortcuts: ['x'], related: ['palette', 'edit-mode'] },
  { id: 'color-picker', title: 'color picker', section: 'color tools', summary: 'pick a color from the screen or use the operating-system picker.', keywords: ['eyedropper', 'pipette', 'sample'], shortcuts: ['i'], related: ['edit-mode', 'palette'] },
  { id: 'color-naming', title: 'color naming', section: 'color tools', summary: 'view the nearest descriptive and css color names for each swatch.', keywords: ['name', 'label', 'css named'], related: ['palette', 'copy-formats'] },
  { id: 'variations', title: 'variations', section: 'color tools', summary: 'generate tints, shades, and tones from one palette color.', keywords: ['lighter', 'darker', 'tint', 'shade', 'tone'], shortcuts: ['v then 1-9, 0'], related: ['edit-mode', 'palette'] },
  { id: 'harmony', title: 'harmony score', section: 'color tools', summary: 'review hue spacing, saturation consistency, and lightness range.', keywords: ['balanced', 'discordant', 'score'], shortcuts: ['y'], related: ['relationships', 'contrast'] },
  { id: 'reduced-motion', title: 'reduced motion', section: 'accessibility', summary: 'understand how paletteport follows the operating-system motion preference.', keywords: ['animation', 'movement', 'accessibility'], related: ['theme', 'color-blindness'] },
  { id: 'color-blindness', title: 'color blindness', section: 'accessibility', summary: 'simulate common color-vision differences on palette colors.', keywords: ['cvd', 'deuteranopia', 'protanopia', 'tritanopia'], shortcuts: ['shift+t'], related: ['contrast', 'preview'] },
  { id: 'contrast', title: 'contrast checker', section: 'accessibility', summary: 'compare palette pairs against wcag aa, aaa, and large-text thresholds.', keywords: ['readability', 'hard to read', 'ratio', 'text'], shortcuts: ['k', 'shift+k'], related: ['color-blindness', 'preview'] },
  { id: 'theme', title: 'theme', section: 'reference', summary: 'switch between light, gray, and dark workspace themes.', keywords: ['appearance', 'mode'], shortcuts: ['t'], related: ['reduced-motion', 'contrast'] },
  { id: 'keyboard', title: 'keyboard shortcuts', section: 'reference', summary: 'view every keyboard command grouped by palette, file, view, and general actions.', keywords: ['hotkey', 'command', 'key', 'faster'], shortcuts: ['?'], related: ['getting-started'] },
]

export const HELP_SECTIONS = ['basics', 'storage', 'copy & share', 'export', 'color tools', 'accessibility', 'reference']

export function getHelpEntry(pageId: string) {
  return HELP_CONTENT.find((entry) => entry.id === pageId)
}
