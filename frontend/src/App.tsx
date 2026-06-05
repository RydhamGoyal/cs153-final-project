import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { useNavigatorRun } from './context/NavigatorRunContext'
import type { AnalysisResult } from './types'
import { DeviceInput } from './components/DeviceInput'
import { AnalysisProgress } from './components/AnalysisProgress'
import { PredicateChainViz } from './components/PredicateChainViz'
import { SEAnalysisPanel } from './components/SEAnalysisPanel'
import { RecommendationCard } from './components/RecommendationCard'

interface AppProps {
  // Pass a result to display a history entry (null = clear display; undefined = use run context)
  preloadedResult?: AnalysisResult | null
  preloadedDescription?: string
  preloadedIfu?: string
}

export default function App({ preloadedResult, preloadedDescription, preloadedIfu }: AppProps = {}) {
  const { run, startRun, modelMode } = useNavigatorRun()

  // Form fields, initialise from preloaded prop, or fall back to last run's values (handles tab-switch return)
  const [deviceDescription, setDeviceDescription] = useState(preloadedDescription ?? run.description)
  const [indicationsForUse, setIndicationsForUse] = useState(preloadedIfu ?? run.ifu)
  const [activeChainKey, setActiveChainKey] = useState<string | null>(null)

  // Derived from context, preloadedResult overrides when viewing a history entry
  const loading = run.isRunning
  const error = run.error
  const result = preloadedResult !== undefined ? preloadedResult : run.result

  // Sync form fields when parent loads an example or history entry
  useEffect(() => {
    if (preloadedDescription !== undefined) setDeviceDescription(preloadedDescription)
    if (preloadedIfu !== undefined) setIndicationsForUse(preloadedIfu)
  }, [preloadedDescription, preloadedIfu])

  // Set active chain key whenever the displayed result changes
  useEffect(() => {
    if (!result) { setActiveChainKey(null); return }
    const recommended = result.recommendation?.recommended_predicate_k_number
    if (recommended && result.predicate_chains[recommended]) setActiveChainKey(recommended)
    else setActiveChainKey(Object.keys(result.predicate_chains)[0] ?? null)
  }, [result])

  const handleAnalyze = () => {
    if (!deviceDescription.trim() || !indicationsForUse.trim()) return
    startRun(deviceDescription, indicationsForUse)
  }

  const completedSteps = result?.processing_steps ?? []
  const chainNodes = activeChainKey ? (result?.predicate_chains[activeChainKey] ?? []) : []

  return (
    <div style={{ paddingBottom: 60 }}>
      <DeviceInput
        deviceDescription={deviceDescription}
        indicationsForUse={indicationsForUse}
        loading={loading}
        onDeviceDescriptionChange={setDeviceDescription}
        onIndicationsForUseChange={setIndicationsForUse}
        onAnalyze={handleAnalyze}
      />

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="max-w-3xl mx-auto mt-4 px-6">
            <div className="flex items-start gap-3 rounded-xl p-4"
              style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.22)' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: '#fcd34d' }}>Temporarily at capacity</p>
                <p className="text-sm mt-0.5" style={{ color: 'rgba(252,211,77,0.75)' }}>{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(loading || (result && completedSteps.length > 0)) && (
        <AnalysisProgress completedSteps={completedSteps} loading={loading} modelMode={modelMode} />
      )}

      <AnimatePresence>
        {result && !loading && (
          <>
            {result.model_info && (
              <div className="max-w-3xl mx-auto mt-4 px-6">
                {result.model_info.used === 'finetuned' ? (
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                    style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 5px #4ade80' }} />
                    Substantial equivalence analyzed by the fine-tuned Qwen2.5-7B model
                  </div>
                ) : result.model_info.used === 'openrouter_fallback' ? (
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                    style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fcd34d' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24' }} />
                    The fine-tuned endpoint is warming up, this analysis was served by Llama 3.3 70B. Try again shortly for the fine-tuned model.
                  </div>
                ) : null}
              </div>
            )}

            <RecommendationCard recommendation={result.recommendation} classification={result.classification} />

            {chainNodes.length > 0 && (
              <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }} className="max-w-7xl mx-auto mt-8 px-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: 'rgba(100,116,139,1)' }}>
                    Predicate Ancestry Chain
                  </h2>
                  {Object.keys(result.predicate_chains).length > 1 && (
                    <div className="flex gap-2 flex-wrap">
                      {Object.keys(result.predicate_chains).map(k => (
                        <button key={k} onClick={() => setActiveChainKey(k)}
                          className="font-mono text-xs px-3 py-1 rounded-lg transition-all duration-150"
                          style={activeChainKey === k ? {
                            background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white',
                            border: '1px solid transparent', boxShadow: '0 2px 12px rgba(59,130,246,0.3)',
                          } : {
                            background: 'rgba(255,255,255,0.04)', color: 'rgba(100,116,139,1)',
                            border: '1px solid rgba(255,255,255,0.08)',
                          }}>
                          {k}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs italic mb-4 leading-relaxed" style={{ color: 'rgba(71,85,105,1)' }}>
                  "Each arrow means 'was cleared as substantially equivalent to.' Every device cleared
                  since 1976 traces its regulatory authorization back through this kind of chain."
                </p>
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                  <PredicateChainViz chainNodes={chainNodes}
                    highlightKNumber={result.recommendation?.recommended_predicate_k_number} />
                </div>
              </motion.section>
            )}

            {result.se_analysis.length > 0 && <SEAnalysisPanel analyses={result.se_analysis} />}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
