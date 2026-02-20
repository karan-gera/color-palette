/**
 * Determines whether to auto-scroll to an element after a panel expands.
 * Extracted for testability — the actual scrollIntoView call happens in the component.
 */
export function shouldScrollOnExpand(isExpanding: boolean): boolean {
  return isExpanding
}

/**
 * Delay (ms) before scrolling after panel expansion.
 * Allows the expand animation to start before scrolling begins.
 */
export const SCROLL_DELAY_MS = 350
