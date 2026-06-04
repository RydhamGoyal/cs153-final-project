import React from 'react'
import { motion } from 'framer-motion'
import { Microscope, Loader2, ArrowRight, FileText, Stethoscope } from 'lucide-react'

interface Props {
  deviceDescription: string
  indicationsForUse: string
  loading: boolean
  onDeviceDescriptionChange: (v: string) => void
  onIndicationsForUseChange: (v: string) => void
  onAnalyze: () => void
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(2,6,16,0.55)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: '14px 16px',
  fontSize: 14,
  color: '#e2e8f0',
  resize: 'none',
  outline: 'none',
  fontFamily: 'Inter, system-ui, sans-serif',
  lineHeight: 1.65,
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.35)',
}

const labelStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  fontSize: 11, fontWeight: 600, color: '#60a5fa',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
}

export const DeviceInput: React.FC<Props> = ({
  deviceDescription,
  indicationsForUse,
  loading,
  onDeviceDescriptionChange,
  onIndicationsForUseChange,
  onAnalyze,
}) => {
  const canSubmit = deviceDescription.trim().length > 0 && indicationsForUse.trim().length > 0 && !loading

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'rgba(59,130,246,0.6)'
    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12), inset 0 1px 3px rgba(0,0,0,0.35)'
  }
  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'rgba(255,255,255,0.09)'
    e.target.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.35)'
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-3xl mx-auto mt-6 px-6"
    >
      <div style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.03) 100%)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 20,
        padding: 28,
        boxShadow: '0 16px 50px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.06) inset',
      }}>

        {/* Card header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 22, paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(99,102,241,0.2))', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Microscope className="w-4 h-4" style={{ color: '#93c5fd' }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f6ff', letterSpacing: '-0.01em' }}>Device Analysis</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>Both fields power the substantial-equivalence report</div>
          </div>
        </div>

        <div className="mb-5">
          <label style={labelStyle}>
            <FileText style={{ width: 12, height: 12 }} /> Device Description
          </label>
          <textarea
            style={textareaStyle}
            placeholder="Describe your device: materials, operating principles, key components, how it achieves its function..."
            value={deviceDescription}
            onChange={e => onDeviceDescriptionChange(e.target.value)}
            rows={5}
            disabled={loading}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>

        <div className="mb-7">
          <label style={labelStyle}>
            <Stethoscope style={{ width: 12, height: 12 }} /> Indications for Use
          </label>
          <textarea
            style={textareaStyle}
            placeholder="The specific condition, purpose, patient population, and body part..."
            value={indicationsForUse}
            onChange={e => onIndicationsForUseChange(e.target.value)}
            rows={3}
            disabled={loading}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>

        <motion.button
          onClick={onAnalyze}
          disabled={!canSubmit}
          whileHover={canSubmit ? { scale: 1.01, y: -1 } : {}}
          whileTap={canSubmit ? { scale: 0.99 } : {}}
          style={canSubmit ? {
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            boxShadow: '0 4px 24px rgba(59,130,246,0.45), 0 1px 0 rgba(255,255,255,0.12) inset',
            color: 'white',
            fontWeight: 600,
            fontSize: 14,
            padding: '14px 24px',
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
          } : {
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            background: 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.25)',
            fontWeight: 600,
            fontSize: 14,
            padding: '14px 24px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.07)',
            cursor: 'not-allowed',
          }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Microscope className="w-4 h-4" />
              Analyze Device
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </div>
    </motion.section>
  )
}
