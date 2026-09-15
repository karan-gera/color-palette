import { useCallback, useMemo, useReducer } from 'react'

type UseHistoryArgs<T> = {
  initialHistory: T[]
  initialIndex: number
  shouldResetNavigation?: (previous: T | undefined, next: T | undefined) => boolean
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

const alwaysResetNavigation = () => true

function getNavigationEpoch<T>(
  state: HistoryState<T>,
  nextHistory: T[],
  nextIndex: number,
  shouldResetNavigation: (previous: T | undefined, next: T | undefined) => boolean,
): number {
  return shouldResetNavigation(state.history[state.index], nextHistory[nextIndex])
    ? state.navigationEpoch + 1
    : state.navigationEpoch
}

function historyReducer<T>(
  state: HistoryState<T>,
  action: HistoryAction<T>,
  shouldResetNavigation: (previous: T | undefined, next: T | undefined) => boolean,
): HistoryState<T> {
  switch (action.type) {
    case 'PUSH': {
      const trimmed = state.index < state.history.length - 1
        ? state.history.slice(0, state.index + 1)
        : state.history
      return { ...state, history: [...trimmed, action.value], index: state.index + 1 }
    }
    case 'UNDO': {
      if (state.index <= 0) return state
      const index = state.index - 1
      return {
        ...state,
        index,
        navigationEpoch: getNavigationEpoch(state, state.history, index, shouldResetNavigation),
      }
    }
    case 'REDO': {
      if (state.index >= state.history.length - 1) return state
      const index = state.index + 1
      return {
        ...state,
        index,
        navigationEpoch: getNavigationEpoch(state, state.history, index, shouldResetNavigation),
      }
    }
    case 'REPLACE': {
      if (action.history.length === 0) {
        return {
          history: [],
          index: -1,
          navigationEpoch: getNavigationEpoch(state, [], -1, shouldResetNavigation),
        }
      }
      const target = typeof action.index === 'number' ? action.index : action.history.length - 1
      const index = Math.max(-1, Math.min(target, action.history.length - 1))
      return {
        history: action.history,
        index,
        navigationEpoch: getNavigationEpoch(state, action.history, index, shouldResetNavigation),
      }
    }
    case 'JUMP_TO': {
      if (state.history.length === 0) return state
      const index = Math.max(0, Math.min(action.index, state.history.length - 1))
      return index === state.index
        ? state
        : {
            ...state,
            index,
            navigationEpoch: getNavigationEpoch(state, state.history, index, shouldResetNavigation),
          }
    }
    default:
      return state
  }
}

export function useHistory<T>({
  initialHistory,
  initialIndex,
  shouldResetNavigation = alwaysResetNavigation,
}: UseHistoryArgs<T>): UseHistoryReturn<T> {
  const reducer = useCallback(
    (state: HistoryState<T>, action: HistoryAction<T>) =>
      historyReducer(state, action, shouldResetNavigation),
    [shouldResetNavigation],
  )
  const [state, dispatch] = useReducer(reducer, {
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
