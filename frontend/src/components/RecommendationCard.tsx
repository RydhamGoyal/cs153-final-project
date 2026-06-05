// RecommendationCard.tsx: Headline result card: the recommended predicate device and its classification.
import React from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, AlertTriangle, CheckSquare, Sparkles } from 'lucide-react'
import type { Recommendation, Classification } from '../types'

const CONFIDENCE_CONFIG = {
  high: { label: 'High Confidence', color: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)', text: '#4ade80' },
  medium: { label: 'Medium Confidence', color: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.3)', text: '#fbbf24' },
  low: { label: 'Low Confidence', color: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', text: '#f87171' },
}

interface Props {
  recommendation: Recommendation
  classification: Classification
}

export const RecommendationCard: React.FC<Props> = ({ recommendation, classification }) => {
  const confConfig = CONFIDENCE_CONFIG[recommendation.confidence_level] ?? CONFIDENCE_CONFIG.medium

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-7xl mx-auto mt-8 px-4"
    >
      <div
        className="rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(99,102,241,0.05) 50%, rgba(7,11,19,0.8) 100%)',
          border: '1px solid rgba(59,130,246,0.25)',
          boxShadow: '0 0 60px rgba(59,130,246,0.1), 0 8px 32px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}
          >
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <h2 className="text-base font-semibold text-slate-100">Regulatory Recommendation</h2>
          <div className="ml-auto flex-shrink-0">
            <span
              className="text-xs px-3 py-1 rounded-full font-medium"
              style={{
                background: confConfig.color,
                border: `1px solid ${confConfig.border}`,
                color: confConfig.text,
              }}
            >
              {confConfig.label}
            </span>
          </div>
        </div>

        {/* Classification badges */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span
            className="px-3 py-1 rounded-lg text-xs font-mono font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
          >
            {classification.product_code}
          </span>
          <span
            className="px-3 py-1 rounded-lg text-xs font-medium"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1' }}
          >
            Class {classification.device_class}
          </span>
          <span
            className="px-3 py-1 rounded-lg text-xs"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}
          >
            {classification.regulation_number}
          </span>
          <span
            className="px-3 py-1 rounded-lg text-xs capitalize"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}
          >
            {classification.advisory_committee_description}
          </span>
        </div>

        {/* Primary recommendation */}
        <div
          className="rounded-xl p-4 mb-5"
          style={{
            background: 'rgba(59,130,246,0.07)',
            border: '1px solid rgba(59,130,246,0.2)',
          }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest">
              Recommended Predicate
            </p>
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="font-mono text-2xl font-bold text-blue-300">
              {recommendation.recommended_predicate_k_number}
            </span>
            <span className="text-slate-300 text-sm">{recommendation.recommended_predicate_name}</span>
          </div>
        </div>

        {/* Narrative */}
        <p className="text-sm text-slate-300 leading-relaxed mb-5">
          {recommendation.narrative_summary}
        </p>

        {/* Risks + Testing grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendation.key_risks.length > 0 && (
            <div
              className="rounded-xl p-4"
              style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.12)' }}
            >
              <div className="flex items-center gap-1.5 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Key Risks</h3>
              </div>
              <ul className="space-y-1.5">
                {recommendation.key_risks.map((risk, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="text-amber-500/60 mt-0.5 flex-shrink-0">•</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendation.required_testing.length > 0 && (
            <div
              className="rounded-xl p-4"
              style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)' }}
            >
              <div className="flex items-center gap-1.5 mb-3">
                <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Required Testing</h3>
              </div>
              <ul className="space-y-1.5">
                {recommendation.required_testing.map((test, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="text-blue-500/50 mt-0.5 flex-shrink-0">☐</span>
                    {test}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Alternatives */}
        {recommendation.alternative_predicates.filter(Boolean).length > 0 && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs text-slate-600 font-medium mb-2">Alternative Predicates</p>
            <div className="flex flex-wrap gap-2">
              {recommendation.alternative_predicates.filter(Boolean).map((k) => (
                <span
                  key={k}
                  className="font-mono text-xs px-2.5 py-1 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.section>
  )
}
