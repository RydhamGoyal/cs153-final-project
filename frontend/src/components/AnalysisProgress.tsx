// AnalysisProgress.tsx: Live progress tracker: shows each of the 5 agents completing as an analysis runs.
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Circle, Loader2, Cpu } from 'lucide-react'
import type { ProcessingStep } from '../types'
import type { ModelMode } from '../api'

const PIPELINE_STEPS = [
  { key: 'classification', label: 'Classifying device', icon: '🔬', description: 'Product code, device class, regulation' },
  { key: 'retrieval', label: 'Retrieving candidate predicates', icon: '🔍', description: 'FDA database + semantic search' },
  { key: 'chain_exploration', label: 'Mapping predicate ancestry chains', icon: '🌲', description: 'Genealogy of prior clearances' },
  { key: 'se_analysis', label: 'Analyzing substantial equivalence', icon: '⚖️', description: 'LLM-powered SE comparison' },
  { key: 'report', label: 'Generating recommendation', icon: '📋', description: 'Final structured report' },
]

interface Props {
  completedSteps: ProcessingStep[]
  loading: boolean
  modelMode?: ModelMode
}

// Live banner shown while a run is in flight. For the fine-tuned model it explains the
// one-time GPU cold start so the user is never left wondering during the ~60-90s spin-up.
const WarmupBanner: React.FC<{ modelMode?: ModelMode }> = ({ modelMode }) => {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const finetuned = modelMode === 'finetuned'
  // The fine-tuned engine may cold-start; flag it once we pass the usual fast-path window.
  const coldStart = finetuned && elapsed >= 12

  const accent = finetuned ? '#818cf8' : '#60a5fa'
  const bg = finetuned ? 'rgba(99,102,241,0.09)' : 'rgba(59,130,246,0.07)'
  const border = finetuned ? 'rgba(99,102,241,0.25)' : 'rgba(59,130,246,0.18)'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: bg, border: `1px solid ${border}`, marginBottom: 16 }}>
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: `${accent}22`, border: `1px solid ${accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Cpu className="w-4 h-4" style={{ color: accent }} />
      </motion.div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
          {finetuned
            ? (coldStart ? 'Starting the fine-tuned engine...' : 'Running on the fine-tuned Qwen2.5-7B...')
            : 'Running the 5-agent pipeline...'}
        </div>
        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2, lineHeight: 1.45 }}>
          {coldStart
            ? 'First run after idle spins up a dedicated GPU, this can take up to ~90 seconds. Later runs are fast.'
            : finetuned
              ? 'Domain-specialized inference, typically 20 to 40 seconds.'
              : 'Five specialized agents run in sequence, typically 20 to 40 seconds.'}
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: accent, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
        {elapsed}s
      </div>
    </div>
  )
}

export const AnalysisProgress: React.FC<Props> = ({ completedSteps, loading, modelMode }) => {
  const completedKeys = new Set(completedSteps.map(s => s.step))
  const currentStepIndex = PIPELINE_STEPS.findIndex(s => !completedKeys.has(s.key))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-3xl mx-auto mt-8 px-4"
    >
      <div
        className="rounded-2xl p-6"
        style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {loading && <WarmupBanner modelMode={modelMode} />}

        <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-5">
          Analysis Pipeline
        </p>

        <div className="space-y-2">
          {PIPELINE_STEPS.map((step, idx) => {
            const isCompleted = completedKeys.has(step.key)
            const isActive = loading && idx === currentStepIndex
            const completedData = completedSteps.find(s => s.step === step.key)

            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300"
                style={{
                  background: isActive
                    ? 'rgba(59,130,246,0.08)'
                    : isCompleted
                    ? 'rgba(34,197,94,0.06)'
                    : 'rgba(255,255,255,0.02)',
                  border: isActive
                    ? '1px solid rgba(59,130,246,0.2)'
                    : isCompleted
                    ? '1px solid rgba(34,197,94,0.15)'
                    : '1px solid transparent',
                }}
              >
                {/* Status icon */}
                <div className="flex-shrink-0 w-5 h-5">
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      >
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </motion.div>
                    ) : isActive ? (
                      <motion.div key="loader">
                        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                      </motion.div>
                    ) : (
                      <motion.div key="circle">
                        <Circle className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.15)' }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Step icon */}
                <span className="text-base w-5 flex-shrink-0">{step.icon}</span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    isCompleted ? 'text-green-300' :
                    isActive ? 'text-blue-300' :
                    'text-slate-500'
                  }`}>
                    {step.label}
                  </p>
                  {isCompleted && completedData && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-xs text-slate-500 mt-0.5 truncate"
                    >
                      {completedData.label}
                    </motion.p>
                  )}
                  {!isCompleted && !isActive && (
                    <p className="text-xs text-slate-600 mt-0.5">{step.description}</p>
                  )}
                  {isActive && (
                    <p className="text-xs text-blue-400/70 mt-0.5">{step.description}</p>
                  )}
                </div>

                {/* Duration */}
                {completedData && (
                  <span className="text-xs text-slate-600 flex-shrink-0">
                    {completedData.duration_ms}ms
                  </span>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
