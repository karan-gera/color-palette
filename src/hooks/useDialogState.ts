import { useState, useCallback, useEffect, type Dispatch, type SetStateAction } from 'react'
import { getSavedPalettes, type SavedPalette } from '@/helpers/storage'

export type UseDialogStateReturn = {
  isOpenDialog: boolean
  setIsOpenDialog: Dispatch<SetStateAction<boolean>>
  savedPalettes: SavedPalette[]
  setSavedPalettes: Dispatch<SetStateAction<SavedPalette[]>>
  isSaveDialog: boolean
  setIsSaveDialog: Dispatch<SetStateAction<boolean>>
  isExportDialog: boolean
  setIsExportDialog: Dispatch<SetStateAction<boolean>>
  exportInitialView: 'selecting' | 'image'
  setExportInitialView: Dispatch<SetStateAction<'selecting' | 'image'>>
  isGradientExportDialog: boolean
  setIsGradientExportDialog: Dispatch<SetStateAction<boolean>>
  pendingPreset: string | null
  setPendingPreset: Dispatch<SetStateAction<string | null>>
  pendingExtractColors: string[] | null
  setPendingExtractColors: Dispatch<SetStateAction<string[] | null>>
  handleOpen: () => void
  handleSave: () => void
  handleImageExport: () => void
  isAnyOpen: boolean
  closeAll: () => void
}

export function useDialogState(): UseDialogStateReturn {
  const [isOpenDialog, setIsOpenDialog] = useState(false)
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([])
  const [isSaveDialog, setIsSaveDialog] = useState(false)
  const [isExportDialog, setIsExportDialog] = useState(false)
  const [exportInitialView, setExportInitialView] = useState<'selecting' | 'image'>('selecting')
  const [isGradientExportDialog, setIsGradientExportDialog] = useState(false)
  const [pendingPreset, setPendingPreset] = useState<string | null>(null)
  const [pendingExtractColors, setPendingExtractColors] = useState<string[] | null>(null)

  useEffect(() => {
    if (isOpenDialog) setSavedPalettes(getSavedPalettes())
  }, [isOpenDialog])

  const handleOpen = useCallback(() => setIsOpenDialog(true), [])
  const handleSave = useCallback(() => setIsSaveDialog(true), [])
  const handleImageExport = useCallback(() => {
    setExportInitialView('image')
    setIsExportDialog(true)
  }, [])

  const closeAll = useCallback(() => {
    setIsOpenDialog(false)
    setIsSaveDialog(false)
    setIsExportDialog(false)
    setIsGradientExportDialog(false)
    setPendingPreset(null)
    setPendingExtractColors(null)
  }, [])

  const isAnyOpen =
    isOpenDialog ||
    isSaveDialog ||
    isExportDialog ||
    isGradientExportDialog ||
    pendingPreset !== null ||
    pendingExtractColors !== null

  return {
    isOpenDialog,
    setIsOpenDialog,
    savedPalettes,
    setSavedPalettes,
    isSaveDialog,
    setIsSaveDialog,
    isExportDialog,
    setIsExportDialog,
    exportInitialView,
    setExportInitialView,
    isGradientExportDialog,
    setIsGradientExportDialog,
    pendingPreset,
    setPendingPreset,
    pendingExtractColors,
    setPendingExtractColors,
    handleOpen,
    handleSave,
    handleImageExport,
    isAnyOpen,
    closeAll,
  }
}
