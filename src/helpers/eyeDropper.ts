export const hasEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window

export async function pickColorNative(): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dropper = new (window as any).EyeDropper()
    const result = await dropper.open()
    return result.sRGBHex
  } catch {
    return null
  }
}
