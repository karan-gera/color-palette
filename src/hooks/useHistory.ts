import { useCallback, useMemo, useReducer } from 'react'

type UseHistoryArgs<T> = {
  initialHistory: T[]
  initialIndex: number
}

type UseHistoryReturn<T> = {
  history: T[]
  index: number
  current: T | undefined
  canUndo: boolean
  canRedo: boolean
  navigationEpoch: number
  push: (value: T) => void
  undo: () => void
  redo: () => void
  replace: (nextHistory: T[], nextIndex?: number) => void
  jumpTo: (targetIndex: number) => void
}

type HistoryState<T> = {
  history: T[]
  index: number
  navigationEpoch: number
}

type HistoryAction<T> =
  | { type: 'PUSH'; value: T }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'REPLACE'; history: T[]; index?: number }
  | { type: 'JUMP_TO'; index: number }

function historyReducer<T>(state: HistoryState<T>, action: HistoryAction<T>): HistoryState<T> {
  switch (action.type) {
    case 'PUSH': {
      const trimmed = state.index < state.history.length - 1
        ? state.history.slice(0, state.index + 1)
        : state.history
      return { ...state, history: [...trimmed, action.value], index: state.index + 1 }
    }
    case 'UNDO':
      return state.index > 0
        ? { ...state, index: state.index - 1, navigationEpoch: state.navigationEpoch + 1 }
        : state
    case 'REDO':
      return state.index < state.history.length - 1
        ? { ...state, index: state.index + 1, navigationEpoch: state.navigationEpoch + 1 }
        : state
    case 'REPLACE': {
      if (action.history.length === 0) {
        return { history: [], index: -1, navigationEpoch: state.navigationEpoch + 1 }
      }
      const target = typeof action.index === 'number' ? action.index : action.history.length - 1
      return {
        history: action.history,
        index: Math.max(-1, Math.min(target, action.history.length - 1)),
        navigationEpoch: state.navigationEpoch + 1,
      }
    }
    case 'JUMP_TO': {
      if (state.history.length === 0) return state
      const index = Math.max(0, Math.min(action.index, state.history.length - 1))
      return index === state.index
        ? state
        : { ...state, index, navigationEpoch: state.navigationEpoch + 1 }
    }
    default:
      return state
  }
}

export function useHistory<T>({ initialHistory, initialIndex }: UseHistoryArgs<T>): UseHistoryReturn<T> {
  const [state, dispatch] = useReducer(historyReducer<T>, {
    history: initialHistory,
    index: initialIndex,
    navigationEpoch: 0,
  })
  const { history, index, navigationEpoch } = state

  const current = useMemo(() => history[index], [history, index])
  const canUndo = index > 0
  const canRedo = index >= 0 && index < history.length - 1

  const push = useCallback((value: T) => dispatch({ type: 'PUSH', value }), [])
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), [])
  const redo = useCallback(() => dispatch({ type: 'REDO' }), [])
  const replace = useCallback((nextHistory: T[], nextIndex?: number) =>
    dispatch({ type: 'REPLACE', history: nextHistory, index: nextIndex }), [])
  const jumpTo = useCallback((targetIndex: number) => dispatch({ type: 'JUMP_TO', index: targetIndex }), [])

  return { history, index, current, canUndo, canRedo, navigationEpoch, push, undo, redo, replace, jumpTo }
}

