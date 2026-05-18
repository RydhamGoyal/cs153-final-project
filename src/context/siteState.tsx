/* Context modules conventionally export a Provider plus a hook. */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { createInitialSiteState } from '../data/sampleProfile'
import type {
  Profile,
  SectionId,
  SiteState,
  ThemeId,
} from '../types/site'

type Action =
  | { type: 'reset' }
  | { type: 'setTheme'; theme: ThemeId }
  | { type: 'setProfile'; profile: Profile }
  | { type: 'patchProfile'; patch: Partial<Profile> }
  | { type: 'toggleSection'; section: SectionId }
  | { type: 'moveSection'; section: SectionId; direction: -1 | 1 }

function siteReducer(state: SiteState, action: Action): SiteState {
  switch (action.type) {
    case 'reset':
      return createInitialSiteState()
    case 'setTheme':
      return { ...state, theme: action.theme }
    case 'setProfile':
      return { ...state, profile: action.profile }
    case 'patchProfile':
      return { ...state, profile: { ...state.profile, ...action.patch } }
    case 'toggleSection': {
      const hidden = new Set(state.hiddenSections)
      if (hidden.has(action.section)) hidden.delete(action.section)
      else hidden.add(action.section)
      return { ...state, hiddenSections: [...hidden] }
    }
    case 'moveSection': {
      const order = [...state.sectionOrder]
      const i = order.indexOf(action.section)
      if (i === -1) return state
      const j = i + action.direction
      if (j < 0 || j >= order.length) return state
      ;[order[i], order[j]] = [order[j], order[i]]
      return { ...state, sectionOrder: order }
    }
    default:
      return state
  }
}

type SiteContextValue = {
  state: SiteState
  reset: () => void
  setTheme: (theme: ThemeId) => void
  setProfile: (profile: Profile) => void
  patchProfile: (patch: Partial<Profile>) => void
  toggleSection: (section: SectionId) => void
  moveSection: (section: SectionId, direction: -1 | 1) => void
}

const SiteContext = createContext<SiteContextValue | null>(null)

export function SiteProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(siteReducer, undefined, createInitialSiteState)

  const reset = useCallback(() => dispatch({ type: 'reset' }), [])
  const setTheme = useCallback(
    (theme: ThemeId) => dispatch({ type: 'setTheme', theme }),
    [],
  )
  const setProfile = useCallback(
    (profile: Profile) => dispatch({ type: 'setProfile', profile }),
    [],
  )
  const patchProfile = useCallback(
    (patch: Partial<Profile>) => dispatch({ type: 'patchProfile', patch }),
    [],
  )
  const toggleSection = useCallback(
    (section: SectionId) => dispatch({ type: 'toggleSection', section }),
    [],
  )
  const moveSection = useCallback(
    (section: SectionId, direction: -1 | 1) =>
      dispatch({ type: 'moveSection', section, direction }),
    [],
  )

  const value = useMemo(
    () => ({
      state,
      reset,
      setTheme,
      setProfile,
      patchProfile,
      toggleSection,
      moveSection,
    }),
    [state, reset, setTheme, setProfile, patchProfile, toggleSection, moveSection],
  )

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function useSite() {
  const ctx = useContext(SiteContext)
  if (!ctx) throw new Error('useSite must be used within SiteProvider')
  return ctx
}
