import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { savePalette } from '@/helpers/storage'
import { useDialogState } from '@/hooks/useDialogState'

describe('useDialogState', () => {
  it('starts with every dialog closed', () => {
    const { result } = renderHook(() => useDialogState())

    expect(result.current.isAnyOpen).toBe(false)
    expect(result.current.savedPalettes).toEqual([])
    expect(result.current.exportInitialView).toBe('selecting')
  })

  it('opens the palette list and refreshes saved palettes', () => {
    savePalette(['#ff0000'], 'Saved')
    const { result } = renderHook(() => useDialogState())

    act(() => result.current.handleOpen())

    expect(result.current.isOpenDialog).toBe(true)
    expect(result.current.savedPalettes.map(palette => palette.name)).toEqual(['Saved'])
    expect(result.current.isAnyOpen).toBe(true)
  })

  it('opens the save dialog', () => {
    const { result } = renderHook(() => useDialogState())

    act(() => result.current.handleSave())

    expect(result.current.isSaveDialog).toBe(true)
    expect(result.current.isAnyOpen).toBe(true)
  })

  it('opens export directly in image mode', () => {
    const { result } = renderHook(() => useDialogState())

    act(() => result.current.handleImageExport())

    expect(result.current.isExportDialog).toBe(true)
    expect(result.current.exportInitialView).toBe('image')
  })

  it('counts pending confirmation state as open', () => {
    const { result } = renderHook(() => useDialogState())

    act(() => result.current.setPendingPreset('pastel'))
    expect(result.current.isAnyOpen).toBe(true)

    act(() => {
      result.current.setPendingPreset(null)
      result.current.setPendingExtractColors(['#ff0000'])
    })
    expect(result.current.isAnyOpen).toBe(true)
  })

  it('closes every dialog and clears pending state', () => {
    const { result } = renderHook(() => useDialogState())

    act(() => {
      result.current.setIsOpenDialog(true)
      result.current.setIsSaveDialog(true)
      result.current.setIsExportDialog(true)
      result.current.setIsGradientExportDialog(true)
      result.current.setPendingPreset('neon')
      result.current.setPendingExtractColors(['#ff0000'])
    })
    act(() => result.current.closeAll())

    expect(result.current.isAnyOpen).toBe(false)
    expect(result.current.isOpenDialog).toBe(false)
    expect(result.current.isSaveDialog).toBe(false)
    expect(result.current.isExportDialog).toBe(false)
    expect(result.current.isGradientExportDialog).toBe(false)
    expect(result.current.pendingPreset).toBeNull()
    expect(result.current.pendingExtractColors).toBeNull()
  })
})
