import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronLeft, ChevronRight, AlertTriangle, GitBranch, Building2, Calendar, Tag, Shield, ChevronDown } from 'lucide-react'
import { searchDevices, getDevice, type DeviceRow } from '../api'
import { PredicateChainViz } from '../components/PredicateChainViz'
import type { PredicateChainNode } from '../types'

const DEVICE_CLASSES = ['', '1', '2', '3']
const CLASS_LABELS: Record<string, string> = { '': 'All Classes', '1': 'Class I', '2': 'Class II', '3': 'Class III' }

// Strip OCR artifacts and extract the most meaningful sentences
function cleanDescription(raw: string): string {
  const cleaned = raw
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/Page\s+\d+\s+of\s+\d+/gi, '')
    .replace(/www\.\S+/gi, '')
    .replace(/\d{5}-\d{4}/g, '')
    .replace(/\d{5}\s+\w[\w\s,]{0,30}(Avenue|Street|Blvd|Drive|Road)/gi, '')
    .replace(/\n{2,}/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

  // Split into sentences, keep meaningful medical/device ones
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) ?? [cleaned]
  const medicalKeywords = /device|intended|use|patient|diagnosis|treat|monitor|measure|detect|surgical|implant|catheter|sensor|signal|pressure|flow|cardiac|blood|tissue|bone|nerve|imaging|test|specimen|sample|glucose|oxygen/i
  const good = sentences.filter(s => s.length > 40 && medicalKeywords.test(s))
  const result = (good.length > 0 ? good : sentences.filter(s => s.length > 30))
    .slice(0, 4).join(' ').trim()
  return result.substring(0, 480)
}

// ── Expanded device detail panel (inline dropdown) ──────────────────────────
function DeviceDetail({ kNumber }: { kNumber: string }) {
  const [data, setData] = useState<{ device: Record<string, string | number | null>; predicate_chain: PredicateChainNode[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getDevice(kNumber)
      .then(d => { setData(d as { device: Record<string, string | number | null>; predicate_chain: PredicateChainNode[] }); setLoading(false) })
      .catch(() => setLoading(false))
  }, [kNumber])

  const device = data?.device ?? {}
  const chain = data?.predicate_chain ?? []

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      style={{ overflow: 'hidden' }}
    >
      <div style={{
        margin: '0 8px 6px 8px',
        background: 'rgba(59,130,246,0.05)',
        border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: 12,
        padding: '20px 20px 16px',
      }}>
        {loading ? (
          <p style={{ fontSize: 13, color: '#334155' }}>Loading...</p>
        ) : !data ? (
          <p style={{ fontSize: 13, color: '#f87171' }}>Could not load device details.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Left: metadata */}
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {device.product_code && (
                  <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: 'white' }}>
                    {device.product_code}
                  </span>
                )}
                {device.device_class && (
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, fontWeight: 600,
                    background: device.device_class === '3' ? 'rgba(239,68,68,0.12)' : device.device_class === '2' ? 'rgba(59,130,246,0.1)' : 'rgba(34,197,94,0.1)',
                    color: device.device_class === '3' ? '#f87171' : device.device_class === '2' ? '#60a5fa' : '#4ade80',
                    border: `1px solid ${device.device_class === '3' ? 'rgba(239,68,68,0.2)' : device.device_class === '2' ? 'rgba(59,130,246,0.2)' : 'rgba(34,197,94,0.2)'}`,
                  }}>Class {device.device_class}</span>
                )}
                {Number(device.recall_count) > 0 && (
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle className="w-3 h-3" /> {device.recall_count} recall{Number(device.recall_count) > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {([
                  { icon: <Building2 className="w-3.5 h-3.5" />, label: 'Applicant', val: device.applicant },
                  { icon: <Calendar className="w-3.5 h-3.5" />, label: 'Decision Date', val: device.decision_date },
                  { icon: <Tag className="w-3.5 h-3.5" />, label: 'Regulation', val: device.regulation_number },
                  { icon: <Shield className="w-3.5 h-3.5" />, label: 'Committee', val: device.advisory_committee_description },
                ] as { icon: React.ReactNode; label: string; val: string | number | null | undefined }[]).filter(f => f.val).map(({ icon, label, val }) => (
                  <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: '#475569', marginTop: 1, flexShrink: 0 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 1 }}>{label}</div>
                      <div style={{ fontSize: 13, color: '#cbd5e1' }}>{String(val)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {device.description_text && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Summary</div>
                  <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7, margin: 0 }}>
                    {cleanDescription(String(device.description_text))}
                    {String(device.description_text).length > 480 ? '…' : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Right: predicate chain */}
            <div>
              {chain.length > 0 ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <GitBranch className="w-3.5 h-3.5" style={{ color: '#6366f1' }} />
                    <span style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Predicate Ancestry
                    </span>
                    <span style={{ fontSize: 10, color: '#334155' }}>{chain.length} devices</span>
                  </div>
                  <div style={{ borderRadius: 10, overflow: 'hidden', height: 220, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <PredicateChainViz chainNodes={chain} highlightKNumber={kNumber} compact />
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#334155', fontSize: 13 }}>
                  No predicate chain found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function DatabasePage() {
  const [query, setQuery] = useState('')
  const [productCode, setProductCode] = useState('')
  const [deviceClass, setDeviceClass] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{ total: number; devices: DeviceRow[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedK, setExpandedK] = useState<string | null>(null)

  const LIMIT = 25

  const doSearch = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    setExpandedK(null)
    try {
      const result = await searchDevices({ search: query, product_code: productCode, device_class: deviceClass, page: p, limit: LIMIT })
      setData(result)
      setPage(p)
    } catch {
      setError('Failed to load devices. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }, [query, productCode, deviceClass])

  useEffect(() => {
    const timer = setTimeout(() => doSearch(1), 300)
    return () => clearTimeout(timer)
  }, [query, productCode, deviceClass, doSearch])

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px' }}>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#f0f6ff', marginBottom: 6, letterSpacing: '-0.02em' }}>Device Database</h1>
        <p style={{ fontSize: 14, color: 'rgba(148,163,184,0.65)' }}>
          Browse 174,000+ FDA-cleared devices. Click any row to expand details.
        </p>
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <Search className="w-4 h-4" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input type="text" placeholder="Search device name, K-number, applicant..." value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, fontSize: 14, color: '#e2e8f0', outline: 'none', fontFamily: 'Inter, sans-serif' }}
            onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none' }}
          />
        </div>
        <input type="text" placeholder="Product code (e.g. DQA)" value={productCode}
          onChange={e => setProductCode(e.target.value.toUpperCase())}
          style={{ width: 180, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, fontSize: 14, color: '#e2e8f0', outline: 'none', fontFamily: 'monospace' }}
          onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.5)' }}
          onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.09)' }}
        />
        <select value={deviceClass} onChange={e => setDeviceClass(e.target.value)}
          style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, fontSize: 14, color: '#94a3b8', outline: 'none', fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
          {DEVICE_CLASSES.map(c => <option key={c} value={c} style={{ background: '#0f172a' }}>{CLASS_LABELS[c]}</option>)}
        </select>
      </div>

      {data && (
        <div style={{ fontSize: 12, color: '#475569', marginBottom: 12 }}>
          {data.total.toLocaleString()} devices · page {page} of {totalPages.toLocaleString()}
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, color: '#f87171', fontSize: 13 }}>{error}</div>
      )}

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 160px 70px 70px 100px 52px 28px', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
          {['K-Number', 'Device Name', 'Applicant', 'Code', 'Class', 'Date', 'Recall', ''].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
          ))}
        </div>

        {loading && <div style={{ padding: '32px', textAlign: 'center', color: '#334155', fontSize: 13 }}>Loading...</div>}

        {!loading && data?.devices.map((device, i) => {
          const isOpen = expandedK === device.k_number
          return (
            <div key={device.k_number}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.01 }}
                onClick={() => setExpandedK(isOpen ? null : device.k_number)}
                style={{
                  display: 'grid', gridTemplateColumns: '110px 1fr 160px 70px 70px 100px 52px 28px',
                  padding: '11px 16px', cursor: 'pointer',
                  borderBottom: isOpen ? 'none' : '1px solid rgba(255,255,255,0.04)',
                  background: isOpen ? 'rgba(59,130,246,0.06)' : 'transparent',
                  borderLeft: `2px solid ${isOpen ? 'rgba(59,130,246,0.4)' : 'transparent'}`,
                  transition: 'background 0.12s, border-color 0.12s',
                  alignItems: 'center',
                }}
                onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
                onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: isOpen ? '#93c5fd' : '#60a5fa' }}>{device.k_number}</span>
                <span style={{ fontSize: 13, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>{device.device_name}</span>
                <span style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>{device.applicant || '—'}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#818cf8' }}>{device.product_code || '—'}</span>
                <span>
                  {device.device_class ? (
                    <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                      background: device.device_class === '3' ? 'rgba(239,68,68,0.12)' : device.device_class === '2' ? 'rgba(59,130,246,0.1)' : 'rgba(34,197,94,0.1)',
                      color: device.device_class === '3' ? '#f87171' : device.device_class === '2' ? '#60a5fa' : '#4ade80',
                      border: `1px solid ${device.device_class === '3' ? 'rgba(239,68,68,0.2)' : device.device_class === '2' ? 'rgba(59,130,246,0.2)' : 'rgba(34,197,94,0.2)'}`,
                    }}>{device.device_class}</span>
                  ) : '—'}
                </span>
                <span style={{ fontSize: 11, color: '#475569' }}>{device.decision_date ? device.decision_date.substring(0, 10) : '—'}</span>
                <span>
                  {device.recall_count > 0
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><AlertTriangle className="w-3 h-3" style={{ color: '#f87171' }} /><span style={{ fontSize: 11, color: '#f87171' }}>{device.recall_count}</span></span>
                    : <span style={{ fontSize: 11, color: '#1e293b' }}>—</span>}
                </span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', justifyContent: 'center', color: isOpen ? '#60a5fa' : '#334155' }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.span>
              </motion.div>

              <AnimatePresence>
                {isOpen && <DeviceDetail kNumber={device.k_number} />}
              </AnimatePresence>
            </div>
          )
        })}

        {!loading && data?.devices.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#334155', fontSize: 13 }}>No devices found.</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button onClick={() => doSearch(page - 1)} disabled={page <= 1}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 8, fontSize: 13, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: page <= 1 ? '#334155' : '#94a3b8', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>
            <ChevronLeft className="w-3.5 h-3.5" /> Prev
          </button>
          <span style={{ fontSize: 13, color: '#475569', padding: '0 8px' }}>Page {page} of {totalPages.toLocaleString()}</span>
          <button onClick={() => doSearch(page + 1)} disabled={page >= totalPages}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 8, fontSize: 13, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: page >= totalPages ? '#334155' : '#94a3b8', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
