// MethodologyPage.tsx: About tab: platform capabilities, architecture, and the fine-tune showcase.
import React, { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Database, Search, GitBranch, Scale, Zap, BarChart3, Play, RotateCcw } from 'lucide-react'
import { FeatureShowcase } from '../components/FeatureShowcase'

// ─── Real training data (every 10 steps, A10G, 3 epochs) ─────────────────────
const TRAIN_LOSS: [number, number][] = [
  [10,1.8089],[20,1.7501],[30,1.4872],[40,0.9692],[50,0.5595],[60,0.2355],[70,0.1358],
  [80,0.0239],[90,0.0097],[100,0.0105],[120,0.0083],[140,0.0058],[160,0.0057],[180,0.0072],
  [200,0.0055],[230,0.0028],[260,0.0047],[290,0.0038],[320,0.0031],[350,0.0041],[380,0.004],
  [410,0.006],[440,0.0055],[470,0.0025],[500,0.0047],[530,0.0036],[560,0.0046],[590,0.0041],
  [620,0.0047],[650,0.0057],[680,0.0042],[710,0.0041],[740,0.0045],[770,0.0045],[800,0.0045],
  [830,0.0042],[860,0.0043],[890,0.0039],[920,0.0042],[950,0.0045],[980,0.0036],[1010,0.0031],
  [1040,0.0039],[1070,0.0033],[1100,0.004],[1130,0.0037],[1160,0.0023],[1190,0.0037],
  [1220,0.0033],[1250,0.0043],[1280,0.0053],[1310,0.0033],[1340,0.0035],[1370,0.0033],
  [1400,0.0058],[1430,0.0047],[1460,0.0047],[1490,0.0038],[1520,0.0042],[1550,0.0029],
  [1580,0.0043],[1610,0.0038],[1640,0.0032],[1670,0.0055],[1700,0.004],[1730,0.0038],
  [1760,0.0028],[1790,0.0053],[1820,0.0019],[1850,0.004],[1880,0.0037],[1910,0.0041],
  [1940,0.0036],[1970,0.0043],[2000,0.005],[2030,0.003],[2060,0.0036],[2090,0.0046],
  [2120,0.0042],[2150,0.0043],[2180,0.0045],[2210,0.0028],[2240,0.0034],[2270,0.0045],
  [2300,0.0039],[2330,0.0036],[2360,0.0042],[2390,0.0037],[2420,0.0043],[2450,0.0041],[2490,0.003],
]
const EVAL_LOSS: [number, number][] = [
  [200,0.00432],[400,0.00347],[600,0.00333],[800,0.00323],[1000,0.00318],
  [1200,0.00303],[1400,0.00296],[1600,0.00294],[1800,0.00297],[2000,0.00290],[2200,0.00295],[2400,0.00296],
]
const EPOCH_STEPS = [831, 1662]

// ─── Pipeline stages ──────────────────────────────────────────────────────────
const STAGES = [
  { key: 'classify', label: 'Classify',      desc: 'Product code · Device class · CFR reg.', color: '#60a5fa', bg: 'rgba(59,130,246,0.15)', icon: '🔬' },
  { key: 'retrieve', label: 'Retrieve',      desc: 'SQL + FAISS semantic search',             color: '#818cf8', bg: 'rgba(99,102,241,0.15)', icon: '🔍' },
  { key: 'map',      label: 'Map Ancestry',  desc: 'Recursive CTE graph traversal',           color: '#a78bfa', bg: 'rgba(139,92,246,0.15)', icon: '🌲' },
  { key: 'analyze',  label: 'Analyze SE',    desc: '21 CFR 807.87(f) comparison',             color: '#c084fc', bg: 'rgba(192,132,252,0.15)', icon: '⚖️' },
  { key: 'report',   label: 'Report',        desc: 'Structured recommendation',               color: '#e879f9', bg: 'rgba(232,121,249,0.15)', icon: '📋' },
]

// ─── Conveyor belt ────────────────────────────────────────────────────────────
function ConveyorBelt() {
  const [progress, setProgress] = useState(0)
  const startRef = useRef<number | null>(null)
  const DURATION = 7000
  useEffect(() => {
    let id: number
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      setProgress(((ts - startRef.current) % DURATION) / DURATION)
      id = requestAnimationFrame(animate)
    }
    id = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(id)
  }, [])
  const stagePos = [0.12, 0.28, 0.44, 0.60, 0.76]
  const active = stagePos.findIndex(p => Math.abs(progress - p) < 0.07)
  return (
    <div style={{ padding: '40px 32px 24px', background: 'rgba(0,0,0,0.2)', borderRadius: 20, margin: '0 24px', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 32 }}>Live Pipeline Simulation</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, padding: '0 24px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: 48, right: 48, height: 1, background: 'rgba(255,255,255,0.06)', zIndex: 0 }} />
        {STAGES.map((s, i) => {
          const isActive = active === i, isPast = progress > stagePos[i] + 0.08
          return (
            <div key={s.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1 }}>
              <motion.div animate={isActive ? { boxShadow: [`0 0 0px ${s.color}`, `0 0 20px ${s.color}`, `0 0 0px ${s.color}`], borderColor: s.color } : {}} transition={{ duration: 0.4, repeat: isActive ? Infinity : 0 }}
                style={{ width: 52, height: 52, borderRadius: 14, background: isPast ? s.bg : isActive ? s.bg : 'rgba(255,255,255,0.03)', border: `1px solid ${isPast ? s.color + '60' : isActive ? s.color : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, transition: 'all 0.3s' }}>
                {s.icon}
              </motion.div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? s.color : isPast ? '#94a3b8' : '#475569', transition: 'color 0.3s' }}>{s.label}</div>
                <div style={{ fontSize: 10, color: '#334155', marginTop: 2, maxWidth: 90, lineHeight: 1.3 }}>{s.desc}</div>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ position: 'relative', height: 64, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 16, left: 0, right: 0, height: 32, background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <motion.div animate={{ x: [0, -40] }} transition={{ duration: 1, ease: 'linear', repeat: Infinity }}
            style={{ position: 'absolute', inset: 0, width: '200%', backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 2px, transparent 2px, transparent 20px)' }} />
          {[4, 20, 36, 52, 68, 84].map(pct => (
            <div key={pct} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: `${pct}%`, width: 6, height: 24, borderRadius: 3, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }} />
          ))}
        </div>
        <div style={{ position: 'absolute', top: 8, left: `calc(${progress * 100}% - 50px)`, width: 100, height: 48 }}>
          <div style={{ width: '100%', height: '100%', background: active !== -1 || progress > 0.18 ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${progress > 0.18 ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: '4px 6px', transition: 'background 0.3s, border-color 0.3s' }}>
            <span style={{ fontSize: 14 }}>🏥</span>
            <span style={{ fontSize: 9, color: progress > 0.82 ? '#93c5fd' : '#64748b', fontFamily: 'monospace', fontWeight: 600 }}>{progress > 0.82 ? 'K213431' : 'Device'}</span>
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        {active >= 0 ? <span style={{ fontSize: 12, color: STAGES[active].color }}>Running: {STAGES[active].label}...</span>
          : progress > 0.85 ? <span style={{ fontSize: 12, color: '#4ade80' }}>✓ Recommendation generated</span>
          : <span style={{ fontSize: 12, color: '#334155' }}>Processing device submission...</span>}
      </div>
    </div>
  )
}

function TechCard({ icon, title, color, colorRaw, tags, children }: { icon: React.ReactNode; title: string; color: string; colorRaw: string; tags: string[]; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `rgba(${colorRaw},0.15)`, border: `1px solid rgba(${colorRaw},0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{title}</span>
      </div>
      <div style={{ fontSize: 13, color: 'rgba(148,163,184,0.75)', lineHeight: 1.75, marginBottom: 14 }}>{children}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {tags.map(t => <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: `rgba(${colorRaw},0.08)`, border: `1px solid rgba(${colorRaw},0.15)`, color }}>{t}</span>)}
      </div>
    </div>
  )
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, decimals = 0, duration = 1800 }: { to: number; decimals?: number; duration?: number }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(to * eased)
      if (p < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [inView, to, duration])
  return <span ref={ref}>{val.toFixed(decimals)}</span>
}

// ─── Loss curve ───────────────────────────────────────────────────────────────
function LossCurve() {
  const containerRef = useRef<HTMLDivElement>(null)
  const trainRef = useRef<SVGPathElement>(null)
  const inView = useInView(containerRef, { once: true, amount: 0.4 })
  const rafRef = useRef(0)
  const W = 760, H = 200, PL = 46, PR = 20, PT = 16, PB = 40

  const xs = (s: number) => PL + (s / 2493) * (W - PL - PR)
  // Log scale: covers 10^-3 to 10^0.35 (~1.8 → 0.001), making the post-convergence
  // region clearly visible instead of appearing flat.
  const LOG_MAX = 0.35, LOG_MIN = -3.2
  const ys = (l: number) => {
    const logL = Math.log10(Math.max(l, 0.0006))
    return PT + (1 - (logL - LOG_MIN) / (LOG_MAX - LOG_MIN)) * (H - PT - PB)
  }

  const d = TRAIN_LOSS.map(([s, l], i) => `${i === 0 ? 'M' : 'L'}${xs(s).toFixed(1)} ${ys(l).toFixed(1)}`).join(' ')
  const dArea = `${d} L${xs(2490).toFixed(1)} ${ys(0.0006)} L${xs(10).toFixed(1)} ${ys(0.0006)} Z`

  useEffect(() => {
    if (!inView || !trainRef.current) return
    const len = trainRef.current.getTotalLength()
    trainRef.current.style.strokeDasharray = `${len}`
    trainRef.current.style.strokeDashoffset = `${len}`
    const dur = 2800, t0 = performance.now()
    const animate = (now: number) => {
      const p = Math.min((now - t0) / dur, 1)
      const e = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p
      if (trainRef.current) trainRef.current.style.strokeDashoffset = `${len * (1 - e)}`
      if (p < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [inView])

  // Y-axis ticks (log scale)
  const yTicks = [1.0, 0.1, 0.01, 0.003, 0.001]

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="trainGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="6%" stopColor="#f97316" />
            <stop offset="14%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
          <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <clipPath id="chartClip">
            <rect x={PL} y={PT} width={W - PL - PR} height={H - PT - PB} />
          </clipPath>
        </defs>

        {/* Y-axis label */}
        <text x={10} y={PT + (H - PT - PB) / 2} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#334155" transform={`rotate(-90, 10, ${PT + (H - PT - PB) / 2})`}>Loss (log scale)</text>

        {/* Grid */}
        {yTicks.map(v => (
          <g key={v}>
            <line x1={PL} y1={ys(v)} x2={W - PR} y2={ys(v)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={PL - 6} y={ys(v)} textAnchor="end" dominantBaseline="middle" fontSize="9" fill="#334155">
              {v < 0.01 ? v.toFixed(3) : v < 0.1 ? v.toFixed(2) : v.toFixed(1)}
            </text>
          </g>
        ))}

        {/* Epoch markers */}
        {EPOCH_STEPS.map((step, i) => (
          <g key={step}>
            <line x1={xs(step)} y1={PT} x2={xs(step)} y2={H - PB} stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3 3" />
            <text x={xs(step) + 4} y={PT + 10} fontSize="9" fill="#334155">Epoch {i + 2}</text>
          </g>
        ))}

        {/* Area */}
        <path d={dArea} fill="url(#areaGrad)" clipPath="url(#chartClip)" />

        {/* Train loss line */}
        <path ref={trainRef} d={d} fill="none" stroke="url(#trainGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" clipPath="url(#chartClip)" />

        {/* Eval dots */}
        {EVAL_LOSS.map(([step, loss]) => (
          <circle key={step} cx={xs(step)} cy={ys(loss)} r="3.5" fill="#fbbf24" fillOpacity="0.9" />
        ))}

        {/* "Rapid task specialisation" annotation */}
        <line x1={xs(90)} y1={PT} x2={xs(90)} y2={H - PB} stroke="rgba(99,102,241,0.4)" strokeWidth="1.5" />
        <rect x={xs(90) + 4} y={PT + 2} width={122} height={32} rx="5" fill="rgba(8,12,22,0.9)" stroke="rgba(99,102,241,0.3)" strokeWidth="1" />
        <text x={xs(90) + 10} y={PT + 13} fontSize="9" fill="#818cf8" fontWeight="600">Task specialisation complete</text>
        <text x={xs(90) + 10} y={PT + 25} fontSize="9" fill="#475569">1.8 → 0.003 in 90 steps</text>

        {/* X axis */}
        <line x1={PL} y1={H - PB} x2={W - PR} y2={H - PB} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        {[0, 500, 1000, 1500, 2000, 2493].map(s => (
          <text key={s} x={xs(s)} y={H - PB + 14} textAnchor="middle" fontSize="9" fill="#334155">
            {s === 2493 ? '2493' : s === 0 ? '' : s}
          </text>
        ))}
        <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="9" fill="#334155">Training Steps</text>

        {/* Legend */}
        <g transform={`translate(${W - PR - 170}, ${PT + 2})`}>
          <line x1={0} y1={5} x2={18} y2={5} stroke="url(#trainGrad)" strokeWidth="2.5" />
          <text x={22} y={9} fontSize="9" fill="#94a3b8">Train loss</text>
          <circle cx={4} cy={22} r="3.5" fill="#fbbf24" />
          <text x={22} y={25} fontSize="9" fill="#94a3b8">Eval loss</text>
        </g>
      </svg>
    </div>
  )
}

// ─── LoRA architecture diagram ────────────────────────────────────────────────
function LoRADiagram() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inView = useInView(containerRef, { once: false })
  const frameRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = 400 * dpr; canvas.height = 260 * dpr
    canvas.style.width = '400px'; canvas.style.height = '260px'
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    // Particles along LoRA paths
    const particles: { x: number; y: number; t: number; path: 'base' | 'lora' }[] = []
    for (let i = 0; i < 18; i++) {
      particles.push({ x: 0, y: 0, t: Math.random(), path: i < 10 ? 'base' : 'lora' })
    }

    const draw = () => {
      if (!inView) { rafRef.current = requestAnimationFrame(draw); return }
      frameRef.current++
      ctx.clearRect(0, 0, 400, 260)

      // Background
      ctx.fillStyle = 'rgba(6,9,18,0)'
      ctx.fillRect(0, 0, 400, 260)

      // ── BASE WEIGHTS (W) ─────────────────────────────────────────────────────
      const wX = 14, wY = 40, wW = 90, wH = 180
      // Frozen lock icon effect
      ctx.fillStyle = 'rgba(30,41,59,0.8)'
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 1
      roundRect(ctx, wX, wY, wW, wH, 10)
      ctx.fill(); ctx.stroke()

      // Grid cells (frozen weights as dim grid)
      const cols = 9, rows = 12
      const cw = (wW - 12) / cols, ch = (wH - 12) / rows
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const alpha = 0.04 + Math.random() * 0.04
        ctx.fillStyle = `rgba(99,102,241,${alpha})`
        ctx.fillRect(wX + 6 + c * cw + 1, wY + 6 + r * ch + 1, cw - 2, ch - 2)
      }

      // Lock icon
      ctx.font = '18px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('🔒', wX + wW / 2, wY + wH / 2 - 10)
      ctx.font = 'bold 9px monospace'
      ctx.fillStyle = '#334155'
      ctx.fillText('7.6B params', wX + wW / 2, wY + wH / 2 + 8)
      ctx.fillText('FROZEN', wX + wW / 2, wY + wH / 2 + 20)

      // Label
      ctx.font = 'bold 10px system-ui'; ctx.fillStyle = '#475569'; ctx.textAlign = 'center'
      ctx.fillText('Base Model W', wX + wW / 2, wY - 10)

      // ── LORA ADAPTERS ─────────────────────────────────────────────────────────
      const aX = 130, aY = 50, aW = 32, aH = 160
      const bX = 174, bY = 50, bW = 130, bH = 32

      // Matrix A glow
      const gradA = ctx.createLinearGradient(aX, aY, aX, aY + aH)
      gradA.addColorStop(0, 'rgba(99,102,241,0.3)'); gradA.addColorStop(1, 'rgba(139,92,246,0.3)')
      ctx.fillStyle = gradA; ctx.strokeStyle = 'rgba(99,102,241,0.6)'; ctx.lineWidth = 1.5
      roundRect(ctx, aX, aY, aW, aH, 6); ctx.fill(); ctx.stroke()
      ctx.font = 'bold 8px monospace'; ctx.fillStyle = '#818cf8'; ctx.textAlign = 'center'
      ctx.fillText('A', aX + aW / 2, aY + aH / 2 - 6)
      ctx.font = '8px monospace'; ctx.fillStyle = '#475569'
      ctx.fillText('4096', aX + aW / 2, aY + aH / 2 + 4)
      ctx.fillText('×16', aX + aW / 2, aY + aH / 2 + 14)

      // Matrix B glow
      const gradB = ctx.createLinearGradient(bX, bY, bX + bW, bY)
      gradB.addColorStop(0, 'rgba(139,92,246,0.3)'); gradB.addColorStop(1, 'rgba(168,85,247,0.3)')
      ctx.fillStyle = gradB; ctx.strokeStyle = 'rgba(139,92,246,0.6)'; ctx.lineWidth = 1.5
      roundRect(ctx, bX, bY, bW, bH, 6); ctx.fill(); ctx.stroke()
      ctx.font = 'bold 8px monospace'; ctx.fillStyle = '#a78bfa'; ctx.textAlign = 'center'
      ctx.fillText('B', bX + bW / 2, bY + 12)
      ctx.font = '8px monospace'; ctx.fillStyle = '#475569'
      ctx.fillText('16 × 4096', bX + bW / 2, bY + 23)

      // LoRA label
      ctx.font = 'bold 10px system-ui'; ctx.fillStyle = '#8b5cf6'; ctx.textAlign = 'center'
      ctx.fillText('LoRA Adapters  Δ=B·A', 200, wY - 10)
      ctx.font = '9px system-ui'; ctx.fillStyle = '#475569'
      ctx.fillText('rank=16  ·  154 MB  ·  0.53% of params', 200, wY + 2)

      // ── FORMULA + OUTPUT ─────────────────────────────────────────────────────
      const outX = 320, outY = 40, outW = 64, outH = 180
      const gradOut = ctx.createLinearGradient(outX, outY, outX, outY + outH)
      gradOut.addColorStop(0, 'rgba(34,197,94,0.15)'); gradOut.addColorStop(1, 'rgba(34,197,94,0.05)')
      ctx.fillStyle = gradOut; ctx.strokeStyle = 'rgba(34,197,94,0.35)'; ctx.lineWidth = 1.5
      roundRect(ctx, outX, outY, outW, outH, 10); ctx.fill(); ctx.stroke()
      ctx.font = 'bold 10px monospace'; ctx.fillStyle = '#4ade80'; ctx.textAlign = 'center'
      ctx.fillText('h(x)', outX + outW / 2, outY + outH / 2 - 6)
      ctx.font = '8px monospace'; ctx.fillStyle = '#334155'
      ctx.fillText('Wx+ΔWx', outX + outW / 2, outY + outH / 2 + 8)
      ctx.font = 'bold 10px system-ui'; ctx.fillStyle = '#475569'
      ctx.fillText('Output', outX + outW / 2, outY - 10)

      // ── PARTICLES ────────────────────────────────────────────────────────────
      for (const p of particles) {
        p.t = (p.t + 0.004) % 1
        let px: number, py: number, alpha: number
        if (p.path === 'base') {
          // Path: input (left) → W matrix → output
          px = wX + wW + (outX - wX - wW - 16) * p.t
          py = 130
          alpha = 0.25
          ctx.fillStyle = `rgba(255,255,255,${alpha})`
        } else {
          // Path: input → A → B → sum → output (U-shape through LoRA)
          if (p.t < 0.3) {
            px = aX + aW + (aX + aW / 2 - (aX + aW)) * (p.t / 0.3) // moving into A
            py = aY + aH / 2
          } else if (p.t < 0.7) {
            const q = (p.t - 0.3) / 0.4
            px = aX + aW / 2 + (bX - aX - aW / 2) * Math.min(q, 1)
            py = aY + aH / 2 + (bY + bH / 2 - aY - aH / 2) * Math.min(q * 2, 1)
          } else {
            const q = (p.t - 0.7) / 0.3
            px = bX + bW / 2 + (outX - bX - bW / 2) * q
            py = bY + bH / 2
          }
          alpha = 0.7
          ctx.fillStyle = `rgba(139,92,246,${alpha})`
        }
        ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill()
      }

      // ── ARROWS ───────────────────────────────────────────────────────────────
      // Base path arrow
      drawArrow(ctx, wX + wW + 4, 130, outX - 4, 130, 'rgba(255,255,255,0.12)')
      // LoRA path: A → B
      drawArrow(ctx, aX + aW + 3, aY + aH / 2, bX - 3, bY + bH / 2, 'rgba(99,102,241,0.4)')
      // B → output
      drawArrow(ctx, bX + bW + 3, bY + bH / 2, outX - 4, 130, 'rgba(139,92,246,0.4)')
      // Plus sign
      ctx.font = 'bold 16px monospace'
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.textAlign = 'center'
      ctx.fillText('+', outX - 14, 135)

      // Bottom: target modules
      ctx.font = '8px monospace'; ctx.fillStyle = '#334155'; ctx.textAlign = 'left'
      const modules = ['q_proj', 'k_proj', 'v_proj', 'o_proj', 'up_proj', 'down_proj', 'gate_proj']
      modules.forEach((m, i) => {
        const mx = 14 + i * 54, my = 245
        ctx.fillStyle = 'rgba(99,102,241,0.15)'
        roundRect(ctx, mx, my - 8, 50, 14, 3); ctx.fill()
        ctx.fillStyle = '#6366f1'; ctx.fillText(m, mx + 4, my + 2)
      })
      ctx.fillStyle = '#334155'; ctx.textAlign = 'left'
      ctx.font = '8px system-ui'
      ctx.fillText('Target modules:', 14, 230)

      rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [inView])

  return (
    <div ref={containerRef} style={{ display: 'flex', justifyContent: 'center' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  )
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r); ctx.closePath()
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath()
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
  const angle = Math.atan2(y2 - y1, x2 - x1)
  ctx.fillStyle = color; ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - 6 * Math.cos(angle - 0.4), y2 - 6 * Math.sin(angle - 0.4))
  ctx.lineTo(x2 - 6 * Math.cos(angle + 0.4), y2 - 6 * Math.sin(angle + 0.4))
  ctx.closePath(); ctx.fill()
}

// ─── Before / After demo ──────────────────────────────────────────────────────
const BASE_TOKENS = [
  'Based', ' on', ' the', ' information', ' provided', ',', ' this', ' device', ' appears',
  ' to', ' have', ' some', ' similarities', ' with', ' K162032', '.', ' Both', ' devices',
  ' are', ' medical', ' monitoring', ' instruments', ' that', ' may', ' share', ' overlapping',
  ' intended', ' uses', '.', ' To', ' determine', ' substantial', ' equivalence', ',', ' further',
  ' analysis', ' of', ' technological', ' characteristics', ' would', ' be', ' needed', '.',
  ' Consulting', ' a', ' regulatory', ' specialist', ' familiar', ' with', ' 510(k)', ' requirements',
  ' is', ' strongly', ' recommended', '.',
]

const FINE_TOKENS = [
  '{', '\n  "same_intended_use":', ' true', ',',
  '\n  "same_intended_use_explanation":', ' "Both', ' devices', ' are', ' CGMs',
  ' for', ' real-time', ' interstitial', ' glucose', ' monitoring',
  ' under', ' 21', ' CFR', ' 862.1345',',', ' indications', ' are', ' functionally', ' identical."',',',
  '\n  "same_technological_characteristics":', ' false', ',',
  '\n  "technological_differences":', ' [',
  '\n    "Factory-calibrated', ' vs.', ' fingerstick', ' calibration',
  ' required', ' for', ' K162032"', ',',
  '\n    "14-day', ' vs.', ' 7-day', ' sensor', ' wear"',
  '\n  ]', ',',
  '\n  "raises_safety_questions":', ' false', ',',
  '\n  "se_likelihood_score":', ' 87', ',',
  '\n  "recommendation":', ' "viable"', ',',
  '\n  "recommendation_reasoning":', ' "Differences', ' do', ' not', ' raise',
  ' new', ' safety', ' questions', ' per', ' 21', ' CFR', ' 807.100(b)(2)(ii).',
  ' K162032', ' established', ' the', ' SE', ' pathway', ' for',
  ' factory-calibrated', ' CGMs."',
  '\n}',
]

function BeforeAfterDemo() {
  const [phase, setPhase] = useState<'idle' | 'base' | 'fine' | 'done'>('idle')
  const [baseIdx, setBaseIdx] = useState(0)
  const [fineIdx, setFineIdx] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runDemo = () => {
    if (phase !== 'idle' && phase !== 'done') return
    setPhase('base'); setBaseIdx(0); setFineIdx(0)
  }

  const reset = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setPhase('idle'); setBaseIdx(0); setFineIdx(0)
  }

  useEffect(() => {
    if (phase === 'base') {
      if (baseIdx < BASE_TOKENS.length) {
        timerRef.current = setTimeout(() => setBaseIdx(i => i + 1), 55)
      } else {
        timerRef.current = setTimeout(() => setPhase('fine'), 300)
      }
    }
    if (phase === 'fine') {
      if (fineIdx < FINE_TOKENS.length) {
        timerRef.current = setTimeout(() => setFineIdx(i => i + 1), 28)
      } else {
        setPhase('done')
      }
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [phase, baseIdx, fineIdx])

  const baseText = BASE_TOKENS.slice(0, baseIdx).join('')
  const fineText = FINE_TOKENS.slice(0, fineIdx).join('')
  const isRunning = phase === 'base' || phase === 'fine'

  return (
    <div style={{ background: 'rgba(6,9,18,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>Live Model Comparison</div>
          <div style={{ fontSize: 12, color: '#475569' }}>Query: "Analyze SE for a factory-calibrated CGM vs predicate K162032"</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={runDemo} disabled={isRunning}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: isRunning ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: isRunning ? '#334155' : 'white', border: 'none', cursor: isRunning ? 'not-allowed' : 'pointer' }}>
            <Play className="w-3 h-3" />
            {phase === 'idle' ? 'Run Demo' : phase === 'done' ? 'Run Again' : 'Running...'}
          </button>
          {phase !== 'idle' && (
            <button onClick={reset} style={{ width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', cursor: 'pointer' }}>
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Two panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {/* Base model */}
        <div style={{ padding: '20px 24px', borderRight: '1px solid rgba(255,255,255,0.06)', minHeight: 240 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Base Qwen2.5-7B</span>
            {phase !== 'idle' && (
              <span style={{ fontSize: 10, color: '#334155', marginLeft: 'auto' }}>
                {baseIdx}/{BASE_TOKENS.length} tokens
              </span>
            )}
          </div>
          <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13, color: '#94a3b8', lineHeight: 1.8, minHeight: 180 }}>
            {phase === 'idle' ? (
              <span style={{ color: '#334155', fontStyle: 'italic' }}>Output will appear here...</span>
            ) : (
              <>
                {baseText}
                {(phase === 'base') && <span style={{ borderRight: '2px solid #f97316', animation: 'blink 1s infinite' }}> </span>}
              </>
            )}
          </div>
          {phase === 'done' && (
            <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['Vague', 'No JSON', 'No CFR cite', 'Generic advice'].map(t => (
                <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Fine-tuned */}
        <div style={{ padding: '20px 24px', background: 'rgba(99,102,241,0.04)', minHeight: 240 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fine-tuned Qwen2.5-7B</span>
            {phase !== 'idle' && (
              <span style={{ fontSize: 10, color: '#334155', marginLeft: 'auto' }}>
                {fineIdx}/{FINE_TOKENS.length} tokens
              </span>
            )}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 11.5, color: '#a5b4fc', lineHeight: 1.9, minHeight: 180, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {phase === 'idle' ? (
              <span style={{ color: '#334155', fontStyle: 'italic', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13 }}>Output will appear here...</span>
            ) : (phase === 'base' && fineIdx === 0) ? (
              <span style={{ color: '#334155', fontStyle: 'italic', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13 }}>Waiting for base model to finish...</span>
            ) : (
              <>
                <span style={{ color: '#94a3b8' }}>{fineText}</span>
                {(phase === 'fine') && <span style={{ borderRight: '2px solid #4ade80' }}> </span>}
              </>
            )}
          </div>
          {phase === 'done' && (
            <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['Structured JSON', '21 CFR cited', 'SE score: 87', 'Actionable'].map(t => (
                <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80' }}>{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Full fine-tune section ────────────────────────────────────────────────────
function FineTuneSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const inView = useInView(sectionRef, { once: true, amount: 0.1 })

  return (
    <motion.div
      ref={sectionRef}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{ marginTop: 48, borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(99,102,241,0.2)', background: 'linear-gradient(135deg, rgba(6,9,18,0.95) 0%, rgba(15,10,35,0.95) 100%)', boxShadow: '0 0 80px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.06)' }}>

      {/* Section header */}
      <div style={{ padding: '32px 32px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 100, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Fine-Tuned</span>
            </div>
            <span style={{ fontSize: 11, color: '#334155' }}>Modal A10G · LlamaFactory · QLoRA</span>
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#f0f6ff', letterSpacing: '-0.02em', marginBottom: 8 }}>
            Domain-Specialized SE Analysis
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(148,163,184,0.7)', maxWidth: 560, lineHeight: 1.7 }}>
            Qwen2.5-7B-Instruct fine-tuned on 7,500 FDA-derived examples via QLoRA, learning the precise
            structured output format, regulatory citation style, and domain vocabulary of 510(k) SE analysis.
          </p>
        </div>

        {/* Spec card */}
        <div style={{ flexShrink: 0, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 20px', minWidth: 200 }}>
          {[
            { label: 'Base model', val: 'Qwen2.5-7B-Instruct' },
            { label: 'Method',     val: 'QLoRA (4-bit NF4)' },
            { label: 'Rank',       val: 'r=16, α=32' },
            { label: 'Targets',    val: 'All 7 proj. layers' },
            { label: 'Hardware',   val: 'Modal A10G GPU' },
            { label: 'Framework',  val: 'LlamaFactory 0.9.2' },
          ].map(({ label, val }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 7, alignItems: 'baseline' }}>
              <span style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', textAlign: 'right' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, margin: '28px 32px', background: 'rgba(255,255,255,0.04)', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { label: 'Train Loss', val: 0.00108, dec: 5, suffix: '', color: '#4ade80' },
          { label: 'Eval Loss',  val: 0.00290, dec: 5, suffix: '', color: '#60a5fa' },
          { label: 'Examples',   val: 7500,    dec: 0, suffix: '',  color: '#a78bfa' },
          { label: 'Steps',      val: 2493,    dec: 0, suffix: '',  color: '#fbbf24' },
          { label: 'Adapter',    val: 154,     dec: 0, suffix: ' MB', color: '#f472b6' },
        ].map(({ label, val, dec, suffix, color }) => (
          <div key={label} style={{ padding: '20px 16px', textAlign: 'center', background: 'rgba(8,12,22,0.6)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
              <Counter to={val} decimals={dec} duration={1600} />{suffix}
            </div>
            <div style={{ fontSize: 10, color: '#475569', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Loss curve */}
      <div style={{ margin: '0 32px 28px' }}>
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Training Dynamics</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
          <span style={{ fontSize: 10, color: '#334155' }}>3 epochs · 2,493 steps · 1h 52m</span>
        </div>
        <div style={{ background: 'rgba(6,9,18,0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '12px 12px 0', overflow: 'hidden' }}>
          <LossCurve />
        </div>
      </div>

      {/* LoRA diagram + dataset */}
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 16, margin: '0 32px 28px' }}>
        {/* LoRA */}
        <div style={{ background: 'rgba(6,9,18,0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '16px 12px 8px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 8 }}>
            LoRA Architecture
          </div>
          <LoRADiagram />
        </div>

        {/* Dataset */}
        <div style={{ background: 'rgba(6,9,18,0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '20px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
            Training Data Composition
          </div>

          {[
            { label: 'Positive SE pairs',   n: 5515, total: 7515, color: '#4ade80', desc: 'FDA-verified equivalence, OCR-extracted from real 510(k) submissions' },
            { label: 'Synthetic negatives', n: 2000, total: 7515, color: '#f97316', desc: 'Cross-category pairings to prevent score collapse' },
          ].map(({ label, n, total, color, desc }) => (
            <div key={label} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>{label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color }}>{n.toLocaleString()}</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 100, overflow: 'hidden', marginBottom: 6 }}>
                <motion.div
                  initial={{ width: 0 }} animate={inView ? { width: `${(n / total) * 100}%` } : {}}
                  transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  style={{ height: '100%', background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 100 }}
                />
              </div>
              <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.4 }}>{desc}</div>
            </div>
          ))}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16, display: 'flex', gap: 20 }}>
            {[
              { label: 'Source', val: 'openFDA 510(k) DB' },
              { label: 'OCR',    val: 'Innolitics API' },
              { label: 'Format', val: 'Alpaca (instruction)' },
            ].map(({ label, val }) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Before / After demo */}
      <div style={{ margin: '0 32px 32px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Output Quality: Base vs. Fine-tuned
        </div>
        <BeforeAfterDemo />
      </div>
    </motion.div>
  )
}

// ─── Agent State Flow ─────────────────────────────────────────────────────────
const AGENT_STATE_NODES = [
  {
    label: 'Classification',
    model: 'Llama 3.3 70B',
    latency: '3-5 s',
    color: '#60a5fa',
    border: 'rgba(59,130,246,0.35)',
    bg: 'rgba(59,130,246,0.08)',
    writes: ['product_code: "QEH"', 'device_class: "II"', 'cfr_reg: "880.2860"', 'committee: "GEN"'],
  },
  {
    label: 'Retrieval',
    model: 'SQL + FAISS',
    latency: '1-2 s',
    color: '#818cf8',
    border: 'rgba(99,102,241,0.35)',
    bg: 'rgba(99,102,241,0.08)',
    writes: ['candidates: Device[25]', 'semantic_scores: float[]', 'self_corrected: bool', 'fallback_used: bool'],
  },
  {
    label: 'Chain Explorer',
    model: 'Recursive CTE',
    latency: '< 1 s',
    color: '#a78bfa',
    border: 'rgba(139,92,246,0.35)',
    bg: 'rgba(139,92,246,0.08)',
    writes: ['chains: ChainNode[][]', 'max_depth: number', 'root_devices: string[]', 'ancestor_map: Map'],
  },
  {
    label: 'SE Analysis',
    model: 'Llama 3.3 70B ×3',
    latency: '10-18 s',
    color: '#c084fc',
    border: 'rgba(192,132,252,0.35)',
    bg: 'rgba(192,132,252,0.08)',
    writes: ['se_score: 0-100', 'same_use: boolean', 'tech_diffs: string[]', 'recommendation: str'],
  },
  {
    label: 'Report Generator',
    model: 'Llama 3.3 70B',
    latency: '5-8 s',
    color: '#e879f9',
    border: 'rgba(232,121,249,0.35)',
    bg: 'rgba(232,121,249,0.08)',
    writes: ['top_predicate: Device', 'narrative: string', 'risk_factors: str[]', 'testing_checklist: str[]'],
  },
]

function AgentStateFlow() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  return (
    <div ref={ref} style={{ margin: '28px 24px 0', background: 'rgba(0,0,0,0.2)', borderRadius: 20, padding: '24px 20px', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 20 }}>
        LangGraph Typed State, What Each Agent Reads &amp; Writes
      </p>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
        {AGENT_STATE_NODES.map((node, i) => (
          <React.Fragment key={node.label}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.35, delay: i * 0.1 }}
              style={{ flex: '1 1 0', minWidth: 0, background: node.bg, border: `1px solid ${node.border}`, borderRadius: 12, padding: '12px 10px' }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: node.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{node.label}</div>
              <div style={{ fontSize: 9, color: '#475569', marginBottom: 8 }}>{node.model} · {node.latency}</div>
              {node.writes.map(w => (
                <div key={w} style={{ fontFamily: 'monospace', fontSize: 8.5, color: '#64748b', background: 'rgba(0,0,0,0.35)', borderRadius: 4, padding: '2px 5px', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w}</div>
              ))}
            </motion.div>
            {i < AGENT_STATE_NODES.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: i * 0.1 + 0.2 }}
                style={{ display: 'flex', alignItems: 'center', flexShrink: 0, padding: '0 3px' }}
              >
                <div style={{ width: 12, height: 1, background: 'rgba(255,255,255,0.12)' }} />
                <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '6px solid rgba(255,255,255,0.12)' }} />
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 10, color: '#1e293b' }}>
        All agents share one TypedDict, each node reads upstream results and appends its own output. Total latency: ~20-35 s end-to-end.
      </div>
    </div>
  )
}

// ─── Design Decisions ─────────────────────────────────────────────────────────
const DESIGN_DECISIONS = [
  {
    chose: 'LangGraph StateGraph',
    over: 'LCEL chains / bare asyncio',
    reason: 'Typed shared state lets each agent read upstream results without coupling. The graph is inspectable, you can pause at any node, replay from a checkpoint, or add conditional branches without touching other agents.',
    color: '#a78bfa', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)',
  },
  {
    chose: 'FAISS IndexFlatIP',
    over: 'ChromaDB · Pinecone · HNSW',
    reason: '171k × 384-dim embeddings fit in ~250 MB RAM. Exact exhaustive search takes < 80 ms, approximate indexes trade recall for speed we don\'t need. Zero external services, fully reproducible.',
    color: '#60a5fa', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)',
  },
  {
    chose: 'QLoRA rank-16 (NF4)',
    over: 'Full fine-tune · LoRA fp16',
    reason: '4-bit NF4 quantization cuts GPU memory by ~75% vs fp16 LoRA. Runs on a single A10G (24 GB) in 1 h 52 m. The 154 MB adapter overlays any base checkpoint, no custom serving infra needed.',
    color: '#c084fc', bg: 'rgba(192,132,252,0.08)', border: 'rgba(192,132,252,0.2)',
  },
  {
    chose: 'Qwen2.5-7B-Instruct',
    over: 'Llama 3.1 8B · Mistral 7B',
    reason: 'Stronger structured JSON output reliability at the 7B scale. SE analysis demands valid parseable JSON every call, Qwen2.5 closes brackets and follows the schema consistently; Llama 3.1 8B required extra post-processing fallbacks.',
    color: '#f472b6', bg: 'rgba(244,114,182,0.08)', border: 'rgba(244,114,182,0.2)',
  },
  {
    chose: 'SQLite + recursive CTE',
    over: 'PostgreSQL · Neo4j',
    reason: '22 k predicate edges is simple enough to walk with recursive SQL. SQLite ships as one file, zero infrastructure cost, and handles all 175 k device queries under 50 ms with compound indexes. No graph DB needed.',
    color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)',
  },
  {
    chose: 'all-MiniLM-L6-v2',
    over: 'OpenAI ada-002 · BGE-large',
    reason: '384-dim vectors at 22 ms/batch on CPU. All 171 k descriptions embedded locally in ~45 min, no API cost, no rate limits. Cosine similarity generalises well to FDA device text despite the domain gap from general-purpose training.',
    color: '#818cf8', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)',
  },
]

function DesignDecisions() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.1 })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{ marginTop: 40 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>Key Design Decisions</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
        <span style={{ fontSize: 11, color: '#334155', whiteSpace: 'nowrap' }}>Why X over Y</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {DESIGN_DECISIONS.map(d => (
          <div key={d.chose} style={{ background: d.bg, border: `1px solid ${d.border}`, borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: d.color, marginBottom: 3 }}>✓ {d.chose}</div>
              <div style={{ fontSize: 11, color: '#475569' }}>over {d.over}</div>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.72)', lineHeight: 1.65, margin: 0 }}>{d.reason}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function MethodologyPage() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#f0f6ff', marginBottom: 12, letterSpacing: '-0.02em' }}>About Vera</h1>
        <p style={{ fontSize: 15, color: 'rgba(148,163,184,0.7)', maxWidth: 560, margin: '0 auto' }}>
          Platform capabilities, technical architecture, and the research behind the product
        </p>
      </div>

      {/* Platform Capabilities */}
      <div style={{ marginBottom: 40, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '24px 28px' }}>
        <FeatureShowcase title="Platform Capabilities" />
      </div>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f0f6ff', marginBottom: 8, letterSpacing: '-0.02em' }}>Technical Architecture</h2>
        <p style={{ fontSize: 14, color: 'rgba(148,163,184,0.6)', maxWidth: 500, margin: '0 auto' }}>
          How Vera transforms a device description into a regulatory recommendation
        </p>
      </div>

      <ConveyorBelt />
      <AgentStateFlow />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 40 }}>
        <TechCard icon={<Database className="w-4 h-4" />} title="Data Infrastructure" color="#60a5fa" colorRaw="59,130,246"
          tags={['174k device records','22,497 predicate edges','SQLite + indexed','Innolitics OCR API','10k documents parsed']}>
          Full openFDA 510(k) database in SQLite with compound indexes. Predicate relationships extracted
          from 10,000 real submission documents via Innolitics OCR API, each parsed to identify cited K-numbers.
        </TechCard>

        <TechCard icon={<Search className="w-4 h-4" />} title="Hybrid Retrieval + Self-Correction" color="#818cf8" colorRaw="99,102,241"
          tags={['FAISS IndexFlatIP','171k embeddings','all-MiniLM-L6-v2','Semantic validation','Auto-fallback on σ<0.25']}>
          SQL filters by product code; FAISS searches 171,463 sentence embeddings for semantic similarity.
          Auto-corrects bad product code classifications if cosine similarity &lt;0.25, no user intervention.
        </TechCard>

        <TechCard icon={<GitBranch className="w-4 h-4" />} title="Predicate Graph Traversal" color="#a78bfa" colorRaw="139,92,246"
          tags={['Recursive CTE','Directed graph','Multi-hop','Back to 1976']}>
          <span>Ancestry mapped via recursive SQL CTE walking the predicate_edges directed graph backwards , 
          each hop surfaces the predicate-of-predicate until reaching a root device from the original 510(k) era.</span>
          <div style={{ background:'rgba(0,0,0,0.3)',borderRadius:8,padding:'8px 12px',fontFamily:'monospace',fontSize:11,color:'#64748b',border:'1px solid rgba(255,255,255,0.05)',marginTop:10 }}>
            <span style={{color:'#6366f1'}}>WITH RECURSIVE</span> chain <span style={{color:'#6366f1'}}>AS</span> (<br/>
            &nbsp;<span style={{color:'#4ade80'}}>SELECT</span> k, pred_k, <span style={{color:'#f59e0b'}}>0</span> depth &nbsp;<span style={{color:'#6366f1'}}>UNION ALL</span><br/>
            &nbsp;<span style={{color:'#4ade80'}}>SELECT</span> e.k, e.pred_k, c.depth+<span style={{color:'#f59e0b'}}>1</span><br/>
            &nbsp;<span style={{color:'#6366f1'}}>FROM</span> edges e <span style={{color:'#6366f1'}}>JOIN</span> chain c <span style={{color:'#6366f1'}}>ON</span> ...
          </div>
        </TechCard>

        <TechCard icon={<Zap className="w-4 h-4" />} title="LangGraph Orchestration" color="#22d3ee" colorRaw="6,182,212"
          tags={['LangGraph StateGraph','5 specialized agents','Typed shared state','Per-agent timing','Llama 3.3 70B']}>
          Five agents run as a LangGraph StateGraph where each node reads and writes typed shared state.
          Classification informs retrieval; retrieval informs chain exploration; chains inform SE analysis.
          Timing metadata captured per-agent and surfaced live in the progress tracker.
        </TechCard>

        <TechCard icon={<Scale className="w-4 h-4" />} title="SE Analysis Engine" color="#4ade80" colorRaw="34,197,94"
          tags={['21 CFR 807.87(f)','Structured JSON output','Score rubric enforcement','1500-char context','Differentiated ranking']}>
          Each candidate scored against FDA's 21 CFR 807.87(f) standard. Scoring enforces differentiation:
          ≥90 identical, 70-85 minor differences, 40-69 significant, &lt;40 incompatible, preventing score collapse.
        </TechCard>

        <TechCard icon={<BarChart3 className="w-4 h-4" />} title="Evaluation Framework" color="#fbbf24" colorRaw="251,191,36"
          tags={['Hit@1 · Hit@3 · Hit@5','Mean Reciprocal Rank','Ground truth FDA pairs','171k candidate pool']}>
          Retrieval evaluated against ground-truth predicate pairs from real submissions: does the correct FDA
          predicate appear in the top-1, 3, or 5 FAISS results? MRR measures average reciprocal rank across all queries.
        </TechCard>
      </div>

      {/* Fine-tuning showcase */}
      <FineTuneSection />

      <DesignDecisions />

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  )
}
