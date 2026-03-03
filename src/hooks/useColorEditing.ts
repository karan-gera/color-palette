import { useState, useCallback, type Dispatch, type SetStateAction } from 'react'

type Params = {
  current: string[] | undefined
  push: (colors: string[]) => void
}

export type UseColorEditingReturn = {
  editIndex: number | null
  variationsIndex: number | null
  setEditIndex: Dispatch<SetStateAction<number | null>>
  setVariationsIndex: Dispatch<SetStateAction<number | null>>
  openEdit: (index: number) => void
  openVariations: (index: number) => void
  handleEditSave: (index: number, newHex: string) => void
  replaceColorFromVariation: (index: number, newHex: string) => void
  isAnyOpen: boolean
  closeAll: () => void
}

export function useColorEditing({ current, push }: Params): UseColorEditingReturn {
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [variationsIndex, setVariationsIndex] = useState<number | null>(null)

  const openEdit = useCallback((index: number) => {
    setVariationsIndex(null)
    setEditIndex(index)
  }, [])

  const openVariations = useCallback((index: number) => {
    setEditIndex(null)
    setVariationsIndex(index)
  }, [])

  const handleEditSave = useCallback((index: number, newHex: string) => {
    const base = current ?? []
    const next = [...base]
    next[index] = newHex
    push(next)
    setEditIndex(null)
  }, [current, push])

  const replaceColorFromVariation = useCallback((index: number, newHex: string) => {
    const next = [...(current ?? [])]
    next[index] = newHex
    push(next)
    setVariationsIndex(null)
  }, [current, push])

  const closeAll = useCallback(() => {
    setEditIndex(null)
    setVariationsIndex(null)
  }, [])

  return {
    editIndex,
    variationsIndex,
    setEditIndex,
    setVariationsIndex,
    openEdit,
    openVariations,
    handleEditSave,
    replaceColorFromVariation,
    isAnyOpen: editIndex !== null || variationsIndex !== null,
    closeAll,
  }
}
