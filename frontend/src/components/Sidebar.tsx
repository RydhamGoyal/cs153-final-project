import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Trash2, ChevronLeft, ChevronRight, Activity } from 'lucide-react'
import type { HistoryEntry } from '../types'

interface Props {
  isOpen: boolean
  onToggle: () => void
  entries: HistoryEntry[]
  activeId: string | null
  onSelect: (entry: HistoryEntry) => void
  onClear: () => void
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export const Sidebar: React.FC<Props> = ({ isOpen, onToggle, entries, activeId, onSelect, onClear }) => {
  return (
    <div style={{ position: 'relative', flexShrink: 0, padding: '12px 0 12px 12px', height: '100%', display: 'flex', alignItems: 'stretch', boxSizing: 'border-box' }}>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.aside
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 248, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: 248,
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            {/* Sidebar header */}
            <div style={{
              padding: '16px 16px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock className="w-3.5 h-3.5" style={{ color: '#64748b' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  History
                </span>
                {entries.length > 0 && (
                  <span style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 100,
                    background: 'rgba(59,130,246,0.15)', color: '#60a5fa',
                    border: '1px solid rgba(59,130,246,0.2)',
                  }}>{entries.length}</span>
                )}
              </div>
              {entries.length > 0 && (
                <button
                  onClick={onClear}
                  title="Clear history"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4, borderRadius: 6, display: 'flex' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Entries */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {entries.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <Activity className="w-6 h-6" style={{ color: '#1e293b', margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 12, color: '#334155', lineHeight: 1.6 }}>
                    Your analyzed devices will appear here
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {entries.map((entry) => {
                    const isActive = entry.id === activeId
                    const productCode = entry.result?.classification?.product_code
                    const predicate = entry.result?.recommendation?.recommended_predicate_k_number

                    return (
                      <motion.button
                        key={entry.id}
                        onClick={() => onSelect(entry)}
                        whileHover={{ x: 2 }}
                        style={{
                          width: '100%', textAlign: 'left', background: isActive
                            ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
                          border: isActive
                            ? '1px solid rgba(59,130,246,0.25)' : '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                        }}
                        onMouseLeave={e => {
                          if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                        }}
                      >
                        {/* Device description */}
                        <p style={{
                          fontSize: 12, color: isActive ? '#bfdbfe' : '#94a3b8',
                          lineHeight: 1.4, marginBottom: 7, fontWeight: isActive ? 500 : 400,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {entry.deviceDescription}
                        </p>

                        {/* Badges */}
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
                          {productCode && (
                            <span style={{
                              fontSize: 10, padding: '1px 6px', borderRadius: 4,
                              background: isActive ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)',
                              color: isActive ? '#93c5fd' : '#64748b',
                              border: isActive ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.08)',
                              fontFamily: 'monospace', fontWeight: 600,
                            }}>
                              {productCode}
                            </span>
                          )}
                          {predicate && (
                            <span style={{
                              fontSize: 10, padding: '1px 6px', borderRadius: 4,
                              background: 'rgba(99,102,241,0.1)', color: '#a5b4fc',
                              border: '1px solid rgba(99,102,241,0.2)',
                              fontFamily: 'monospace',
                            }}>
                              → {predicate}
                            </span>
                          )}
                        </div>

                        <span style={{ fontSize: 10, color: '#334155' }}>
                          {timeAgo(entry.timestamp)}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        style={{
          position: 'absolute',
          top: 20,
          right: isOpen ? -14 : -14,
          zIndex: 10,
          width: 28, height: 28,
          borderRadius: '50%',
          background: 'rgba(10,15,28,0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#64748b',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
        onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
      >
        {isOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}
