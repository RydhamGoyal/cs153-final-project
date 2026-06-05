import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { analyzeDevice, type ModelMode } from '../api'
import type { AnalysisResult } from '../types'

export interface RunState {
  runId: string
  isRunning: boolean
  result: AnalysisResult | null
  error: string | null
  description: string
  ifu: string
}

interface RunCtxValue {
  run: RunState
  modelMode: ModelMode
  setModelMode: (m: ModelMode) => void
  startRun: (description: string, ifu: string) => void
  clearRun: () => void
}

const RunCtx = createContext<RunCtxValue | null>(null)

const IDLE: RunState = {
  runId: '', isRunning: false, result: null, error: null, description: '', ifu: '',
}

function humanizeError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  if (raw.includes('Network') || raw.includes('ECONNREFUSED') || raw.includes('fetch'))
    return 'Could not reach the analysis server. Please ensure the backend is running.'
  if (raw.includes('429') || raw.toLowerCase().includes('rate limit'))
    return 'The AI model is temporarily rate-limited. Please wait 30 seconds and try again.'
  if (raw.includes('timeout') || raw.includes('Timeout'))
    return 'Analysis timed out, the pipeline can take up to 40 s. Please try again.'
  if (raw.includes('500') || raw.includes('Internal'))
    return 'The server encountered an error during analysis. Please try again.'
  return 'Analysis could not complete. Please try again in a moment.'
}

export function NavigatorRunProvider({ children }: { children: ReactNode }) {
  const [run, setRun] = useState<RunState>(IDLE)
  const [modelMode, setModelMode] = useState<ModelMode>('openrouter')

  // startRun intentionally never cancels, it lives here in context which never unmounts.
  // Switching tabs, refreshing the Navigator component, etc. cannot interrupt it.
  const startRun = useCallback(async (description: string, ifu: string) => {
    const runId = `run-${Date.now()}-${Math.random().toString(36).slice(7)}`
    setRun({ runId, isRunning: true, result: null, error: null, description, ifu })
    try {
      const data = await analyzeDevice(description, ifu, modelMode)
      setRun({ runId, isRunning: false, result: data, error: null, description, ifu })
    } catch (err) {
      setRun({ runId, isRunning: false, result: null, error: humanizeError(err), description, ifu })
    }
  }, [modelMode])

  const clearRun = useCallback(() => setRun(IDLE), [])

  return (
    <RunCtx.Provider value={{ run, modelMode, setModelMode, startRun, clearRun }}>
      {children}
    </RunCtx.Provider>
  )
}

export function useNavigatorRun() {
  const ctx = useContext(RunCtx)
  if (!ctx) throw new Error('useNavigatorRun must be used within NavigatorRunProvider')
  return ctx
}
