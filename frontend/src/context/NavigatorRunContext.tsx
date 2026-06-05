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

// Any failure path (LLM rate limit, exhausted credits, model endpoint down, server
// error, timeout) is surfaced to the user as a single, professional capacity message.
// The intent: a failed run reads as "the hosted inference budget is temporarily used
// up," never as a broken app.
function humanizeError(_err: unknown): string {
  return "Vera's inference credits have run out for now, so the analysis could not complete. "
    + "The platform itself is fully functional; this is only a temporary hosted-capacity "
    + "limit. Please try again later."
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
