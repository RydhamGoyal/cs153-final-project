import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import type { SEAnalysis } from '../types'

const RECOMMENDATION_CONFIG = {
  strong: { label: 'Strong Match', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)', text: '#4ade80' },
  viable: { label: 'Viable', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)', text: '#60a5fa' },
  weak: { label: 'Weak', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)', text: '#fbbf24' },
  not_recommended: { label: 'Not Recommended', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', text: '#f87171' },
}

interface SECardProps {
  analysis: SEAnalysis
  index: number
}

const SECard: React.FC<SECardProps> = ({ analysis, index }) => {
  const recConfig = RECOMMENDATION_CONFIG[analysis.recommendation] ?? RECOMMENDATION_CONFIG.weak

  const scoreGradient =
    analysis.se_likelihood_score >= 70
      ? 'linear-gradient(90deg, #22c55e, #4ade80)'
      : analysis.se_likelihood_score >= 40
      ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
      : 'linear-gradient(90deg, #ef4444, #f87171)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="rounded-xl p-5 flex flex-col gap-4"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(16px)',
        cursor: 'default',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-mono text-sm font-bold text-blue-400">
            {analysis.candidate_k_number}
          </span>
          <p className="text-sm text-slate-300 mt-0.5 leading-tight">{analysis.candidate_name}</p>
        </div>
        <span
          className="flex-shrink-0 text-xs px-2.5 py-1 rounded-lg font-medium"
          style={{ background: recConfig.bg, border: `1px solid ${recConfig.border}`, color: recConfig.text }}
        >
          {recConfig.label}
        </span>
      </div>

      {/* Score bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-slate-500">SE Likelihood Score</span>
          <span className="text-sm font-bold text-slate-200">{analysis.se_likelihood_score}/100</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${analysis.se_likelihood_score}%` }}
            transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full"
            style={{ background: scoreGradient }}
          />
        </div>
      </div>

      {/* Intended use */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          {analysis.same_intended_use
            ? <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          }
          <span className="text-xs font-medium text-slate-400">Intended Use</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed pl-5">{analysis.same_intended_use_explanation}</p>
      </div>

      {/* Tech characteristics */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          {analysis.same_technological_characteristics
            ? <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          }
          <span className="text-xs font-medium text-slate-400">Technological Characteristics</span>
        </div>
        {analysis.technological_differences.length > 0 && (
          <ul className="text-xs text-slate-500 pl-5 space-y-0.5">
            {analysis.technological_differences.slice(0, 3).map((diff, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-slate-600 flex-shrink-0 mt-0.5">•</span>
                {diff}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Required testing */}
      {analysis.additional_testing_required.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-xs font-medium text-slate-400">Required Testing</span>
          </div>
          <ul className="text-xs text-slate-500 space-y-0.5">
            {analysis.additional_testing_required.map((test, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-amber-500/50 flex-shrink-0 mt-0.5">•</span>
                {test}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}

interface Props {
  analyses: SEAnalysis[]
}

export const SEAnalysisPanel: React.FC<Props> = ({ analyses }) => {
  if (analyses.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto mt-8 px-4"
    >
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
        Substantial Equivalence Analysis
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {analyses.map((analysis, i) => (
          <SECard key={analysis.candidate_k_number} analysis={analysis} index={i} />
        ))}
      </div>
    </motion.section>
  )
}
