// FeatureShowcase.tsx: Platform-capability pills with per-feature info popovers (used on the About page).
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Network, Database, GitBranch, Search, FileText, Route, Clock, BarChart3, X, Info } from 'lucide-react'

const FEATURES = [
  {
    id: 'pipeline', name: '5-Agent Pipeline', status: 'live' as const,
    icon: <Zap className="w-3.5 h-3.5" />, color: '#60a5fa',
    short: 'Full SE analysis in under 30 seconds',
    detail: 'A LangGraph state machine orchestrates 5 specialized AI agents in sequence: (1) Classification identifies your product code, device class, and CFR regulation; (2) Retrieval combines SQL filtering with FAISS semantic search over 171,463 embeddings; (3) Chain Explorer maps predicate ancestry via recursive SQL; (4) SE Analysis scores each candidate against 21 CFR 807.87(f); (5) Report Generator synthesizes a structured recommendation. Total latency: 20-35 seconds.',
  },
  {
    id: 'network', name: 'Predicate Network', status: 'live' as const,
    icon: <Network className="w-3.5 h-3.5" />, color: '#818cf8',
    short: '10,123 FDA devices as a live force graph',
    detail: 'The entire FDA 510(k) regulatory graph rendered live in the browser using D3-force physics simulation on an HTML5 canvas. 10,123 well-connected devices and 11,791 predicate relationships, extracted from 10,000 real submission documents via OCR. Physics forces: link springs, N-body repulsion, collision, boundary containment. Hub nodes emerge naturally from citation frequency.',
  },
  {
    id: 'database', name: '175k Device Database', status: 'live' as const,
    icon: <Database className="w-3.5 h-3.5" />, color: '#4ade80',
    short: 'Every FDA-cleared device since 1976',
    detail: 'The complete openFDA 510(k) database, imported into SQLite with compound indexes. Searchable and filterable by device name, K-number, applicant, product code, and device class. Every device record includes regulation number, advisory committee, decision date, and expandable predicate ancestry chain. 175,013 cleared devices total.',
  },
  {
    id: 'finetune', name: 'Domain Fine-tuned AI', status: 'live' as const,
    icon: <BarChart3 className="w-3.5 h-3.5" />, color: '#a78bfa',
    short: 'Qwen2.5-7B trained on 7,500 FDA examples',
    detail: 'Qwen2.5-7B-Instruct fine-tuned via QLoRA (rank-16, NF4) on 7,500 FDA-derived SE analysis examples: 5,515 confirmed positive SE pairs extracted from real submissions, plus 2,000 synthetic negatives to prevent score collapse. Trained on Modal A10G GPU using LlamaFactory. Train loss: 0.00108, Eval loss: 0.00290. 154MB adapter, 0.53% of total parameters.',
  },
  {
    id: 'retrieval', name: 'Hybrid Retrieval', status: 'live' as const,
    icon: <Search className="w-3.5 h-3.5" />, color: '#fbbf24',
    short: 'SQL + FAISS with self-correction',
    detail: 'Two-stage retrieval: SQL filters by exact product code match, then FAISS searches 171,463 sentence embeddings (all-MiniLM-L6-v2, 384-dim) for semantic similarity. A self-correction layer detects bad product code classifications: if SQL results have average cosine similarity < 0.25, the system flags the classification and falls back to pure semantic search automatically.',
  },
  {
    id: 'memo', name: 'Regulatory Memo Export', status: 'soon' as const,
    icon: <FileText className="w-3.5 h-3.5" />, color: '#f97316',
    short: 'One-click 510(k) SE memo as PDF',
    detail: 'Export the full Navigator analysis as a formatted PDF substantial equivalence memo, structured in the style used by regulatory consultants for actual 510(k) submissions. Includes device classification, predicate identification, SE comparison table, technological differences analysis, and recommended testing checklist. Regulatory consultants charge $2,000+ for this document.',
  },
  {
    id: 'path', name: 'Shortest Path Finder', status: 'soon' as const,
    icon: <Route className="w-3.5 h-3.5" />, color: '#34d399',
    short: 'Trace the chain between any two devices',
    detail: 'Given any two K-numbers, find and animate the shortest regulatory citation path connecting them through the predicate graph. Uses BFS over the predicate_edges table. Reveals unexpected cross-category regulatory lineage and shows how modern devices inherit their clearance authority from pioneering devices decades earlier.',
  },
  {
    id: 'timeline', name: 'Year Timeline Filter', status: 'soon' as const,
    icon: <Clock className="w-3.5 h-3.5" />, color: '#ec4899',
    short: 'Watch the FDA graph grow from 1976',
    detail: 'A dynamic year slider that filters the predicate network by clearance date. Drag from 1976 to 2024 and watch the FDA regulatory graph assemble in real time: entire device categories appearing as the regulatory framework evolved, clusters forming as product families developed, and hub nodes accumulating citations over decades.',
  },
  {
    id: 'competitive', name: 'Competitive Landscape', status: 'soon' as const,
    icon: <GitBranch className="w-3.5 h-3.5" />, color: '#c084fc',
    short: 'Who else cleared in your product code?',
    detail: 'After Navigator analysis, surfaces all devices cleared in the same product code in recent years: competitor names, applicant companies, decision dates, and clearance trends. Shows whether your product code is an active, well-trodden regulatory pathway or a newer, less-established category.',
  },
]

function FeatureCard({ feat }: { feat: typeof FEATURES[0] }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '7px 10px 7px 9px', borderRadius: 100,
        background: feat.status === 'live' ? `${feat.color}0d` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${feat.status === 'live' ? feat.color + '25' : 'rgba(255,255,255,0.08)'}`,
      }}>
        <span style={{ color: feat.status === 'live' ? feat.color : '#475569' }}>{feat.icon}</span>
        <span style={{ fontSize: 12, fontWeight: 500, color: feat.status === 'live' ? feat.color : '#475569', whiteSpace: 'nowrap' }}>
          {feat.name}
        </span>
        <span style={{
          fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 100,
          background: feat.status === 'live' ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)',
          color: feat.status === 'live' ? '#4ade80' : '#334155',
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {feat.status === 'live' ? 'Live' : 'Soon'}
        </span>
        <button ref={btnRef} onClick={() => setOpen(o => !o)}
          style={{ width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: open ? `${feat.color}25` : 'rgba(255,255,255,0.06)', border: 'none', color: open ? feat.color : '#475569', cursor: 'pointer', flexShrink: 0, padding: 0 }}>
          <Info style={{ width: 10, height: 10 }} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}
            style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 100, width: 320, background: 'rgba(8,12,22,0.98)', backdropFilter: 'blur(24px)', border: `1px solid ${feat.color}25`, borderRadius: 14, padding: '16px', boxShadow: '0 16px 48px rgba(0,0,0,0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ color: feat.color }}>{feat.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{feat.name}</span>
              </div>
              <button onClick={() => setOpen(false)} style={{ width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X style={{ width: 10, height: 10 }} />
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.8)', lineHeight: 1.65, margin: 0 }}>{feat.detail}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FeatureShowcase({ title = 'Platform Capabilities' }: { title?: string }) {
  const live = FEATURES.filter(f => f.status === 'live')
  const soon = FEATURES.filter(f => f.status === 'soon')
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {live.map(f => <FeatureCard key={f.id} feat={f} />)}
        {soon.map(f => <FeatureCard key={f.id} feat={f} />)}
      </div>
    </div>
  )
}
