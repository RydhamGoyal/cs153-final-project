// Landing.tsx: Public landing page: hero, tech carousel, problem, the three tools, and CTA.
import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion'
import { Activity, ArrowRight, ChevronDown, Shield, Search, GitBranch, Scale, FileText, CheckCircle, AlertTriangle, Zap, Database, Clock, BarChart3 } from 'lucide-react'
// Import only the icons we use so the whole simple-icons set isn't bundled.
import {
  siLangchain, siMeta, siPytorch, siHuggingface, siModal, siFastapi,
  siSqlite, siReact, siTypescript, siD3, siVite, siFramer, siPython,
} from 'simple-icons'

// ─── Counting number animation ───────────────────────────────────────────────
function CountUp({ to, suffix = '', duration = 2 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const count = useMotionValue(0)
  const rounded = useTransform(count, v => Math.round(v).toLocaleString() + suffix)

  useEffect(() => {
    if (inView) {
      animate(count, to, { duration, ease: 'easeOut' })
    }
  }, [inView, to, duration])

  return <motion.span ref={ref}>{rounded}</motion.span>
}

// ─── Animated predicate chain diagram ────────────────────────────────────────
const CHAIN_NODES = [
  { k: 'K240078', name: 'Handheld Pulse Oximeter', year: '2024', company: 'Shenzhen Witleaf' },
  { k: 'K213431', name: 'Pulse Oximeter, Wireless', year: '2021', company: 'Nonin Medical' },
  { k: 'K192665', name: 'Fingertip Pulse Oximeter', year: '2019', company: 'Masimo Corp.' },
  { k: 'K150234', name: 'Pulse Oximeter', year: '2015', company: 'Nellcor Puritan' },
]

function PredicateChainDiagram() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <div ref={ref} className="relative">
      {/* Browser chrome frame */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Browser top bar */}
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['#ef4444','#f59e0b','#22c55e'].map(c => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />
            ))}
          </div>
          <div style={{
            flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 6,
            padding: '3px 10px', fontSize: 11, color: 'rgba(148,163,184,0.6)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            veralabs.ai/app
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Predicate Ancestry Chain
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {CHAIN_NODES.map((node, i) => (
              <React.Fragment key={node.k}>
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: i * 0.2, duration: 0.4 }}
                  style={{
                    background: i === 0
                      ? 'rgba(59,130,246,0.12)'
                      : 'rgba(255,255,255,0.03)',
                    border: i === 0
                      ? '1px solid rgba(59,130,246,0.3)'
                      : '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: i === 0 ? '#60a5fa' : '#94a3b8' }}>
                      {node.k}
                    </span>
                    <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 2 }}>{node.name}</div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>{node.company}</div>
                  </div>
                  <div style={{
                    fontSize: 11, padding: '3px 8px', borderRadius: 6,
                    background: 'rgba(255,255,255,0.05)', color: '#64748b',
                  }}>{node.year}</div>
                </motion.div>

                {i < CHAIN_NODES.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ delay: i * 0.2 + 0.3 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 16 }}
                  >
                    <div style={{ width: 1, height: 20, background: 'rgba(99,102,241,0.3)' }} />
                    <span style={{ fontSize: 10, color: '#6366f1', opacity: 0.7 }}>substantially equivalent to</span>
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── App mockup for "How it works" ────────────────────────────────────────────
function ResultMockup() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <div ref={ref}>
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['#ef4444','#f59e0b','#22c55e'].map(c => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />
            ))}
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '3px 10px', fontSize: 11, color: 'rgba(148,163,184,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
            veralabs.ai
          </div>
        </div>
        <div style={{ padding: 20 }}>
          {/* Recommendation */}
          <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Recommended Predicate</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: '#93c5fd' }}>K213431</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Handheld Pulse Oximeter</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {['DQA', 'Class II', '21 CFR 870.2700'].map(b => (
                <span key={b} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}>{b}</span>
              ))}
            </div>
          </div>
          {/* SE cards */}
          {[
            { k: 'K213431', name: 'Handheld Pulse Oximeter', score: 80, rec: 'Viable' },
            { k: 'K230172', name: 'Pulse Oximeter', score: 75, rec: 'Viable' },
          ].map((c, i) => (
            <motion.div
              key={c.k}
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15 + 0.3 }}
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#60a5fa', fontWeight: 600 }}>{c.k}</span>
                <span style={{ fontSize: 10, color: '#60a5fa', background: 'rgba(59,130,246,0.1)', padding: '1px 6px', borderRadius: 4 }}>{c.rec}</span>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>{c.name}</div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={inView ? { width: `${c.score}%` } : {}}
                  transition={{ delay: i * 0.15 + 0.6, duration: 0.8 }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #6366f1)', borderRadius: 4 }}
                />
              </div>
              <div style={{ fontSize: 10, color: '#475569', marginTop: 4, textAlign: 'right' }}>{c.score}/100</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`max-w-7xl mx-auto px-6 py-24 ${className}`}>
      {children}
    </section>
  )
}

function FadeIn({ children, delay = 0, direction = 'up' }: { children: React.ReactNode; delay?: number; direction?: 'up' | 'left' | 'right' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const initial = direction === 'up' ? { opacity: 0, y: 32 } : direction === 'left' ? { opacity: 0, x: -32 } : { opacity: 0, x: 32 }

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : initial}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

// ─── Tech Stack Carousel ──────────────────────────────────────────────────────
type SimpleIcon = { path: string }
type TechItem =
  | { name: string; icon: SimpleIcon; color: string }
  | { name: string; abbr: string;     color: string }

const TECH_ITEMS: TechItem[] = [
  { name: 'LangGraph',              icon: siLangchain,   color: '#7FC8FF' },
  { name: 'Llama 3.3 70B',          icon: siMeta,        color: '#0082FB' },
  { name: 'Qwen2.5-7B',             abbr: 'Q',           color: '#f472b6' },
  { name: 'PyTorch',                icon: siPytorch,     color: '#EE4C2C' },
  { name: 'HuggingFace PEFT',       icon: siHuggingface, color: '#FFD21E' },
  { name: 'FAISS',                  abbr: 'FA',          color: '#60a5fa' },
  { name: 'Sentence Transformers',  abbr: 'ST',          color: '#818cf8' },
  { name: 'LlamaFactory',           abbr: 'LF',          color: '#fbbf24' },
  { name: 'Modal',                  icon: siModal,       color: '#7FEE64' },
  { name: 'OpenRouter',             abbr: 'OR',          color: '#34d399' },
  { name: 'FastAPI',                icon: siFastapi,     color: '#009688' },
  { name: 'SQLite',                 icon: siSqlite,      color: '#44A8C8' },
  { name: 'openFDA',                abbr: 'FDA',         color: '#4ade80' },
  { name: 'React 18',               icon: siReact,       color: '#61DAFB' },
  { name: 'TypeScript',             icon: siTypescript,  color: '#3178C6' },
  { name: 'D3-force',               icon: siD3,          color: '#F9A03C' },
  { name: 'Vite',                   icon: siVite,        color: '#646CFF' },
  { name: 'Framer Motion',          icon: siFramer,      color: '#9D9DF5' },
  { name: 'Python',                 icon: siPython,      color: '#3776AB' },
  { name: 'QLoRA (r=16)',           abbr: 'QL',          color: '#c084fc' },
]

function TechPill({ item }: { item: TechItem }) {
  const icon = 'icon' in item ? item.icon : undefined
  const { name, color } = item
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '7px 14px 7px 9px',
      borderRadius: 100,
      border: `1px solid ${color}22`,
      background: `${color}0d`,
      flexShrink: 0,
      cursor: 'default',
    }}>
      {icon ? (
        <svg viewBox="0 0 24 24" width={15} height={15} fill={color} style={{ flexShrink: 0, display: 'block' }}>
          <path d={icon.path} />
        </svg>
      ) : (
        <div style={{
          width: 20, height: 20, borderRadius: 5, flexShrink: 0,
          background: `${color}1a`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: ('abbr' in item && item.abbr.length > 2) ? 7 : 8.5,
          fontWeight: 700, fontFamily: 'monospace', color,
        }}>
          {'abbr' in item ? item.abbr : name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <span style={{ fontSize: 12, fontWeight: 500, color, whiteSpace: 'nowrap' }}>{name}</span>
    </div>
  )
}

function TechCarousel() {
  const items = [...TECH_ITEMS, ...TECH_ITEMS]
  return (
    <>
      <style>{`
        @keyframes techMarquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .tech-marquee { animation: techMarquee 52s linear infinite; }
        .tech-marquee:hover { animation-play-state: paused; }
      `}</style>
      <div style={{ padding: '24px 0 32px' }}>
        <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'rgba(71,85,105,0.75)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 18 }}>
          Built with open source
        </p>
        <div style={{
          overflow: 'hidden',
          maskImage: 'linear-gradient(to right, transparent 0%, black 9%, black 91%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 9%, black 91%, transparent 100%)',
        }}>
          <div className="tech-marquee" style={{ display: 'flex', gap: 10, width: 'max-content' }}>
            {items.map((item, i) => <TechPill key={i} item={item} />)}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Main Landing component ───────────────────────────────────────────────────
export function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ overflowX: 'hidden' }}>

        {/* ── HERO ── */}
        <div style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px 60px', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
              color: '#93c5fd', fontSize: 12, padding: '6px 14px', borderRadius: 100,
              marginBottom: 32,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#60a5fa', display: 'inline-block' }} className="animate-pulse" />
              Agentic AI · 174,000 FDA devices · Live system
            </div>

            <h1 style={{ fontSize: 'clamp(36px, 7vw, 80px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 24, color: '#f0f6ff', maxWidth: 900 }}>
              FDA regulatory clearance{' '}
              <span style={{
                backgroundImage: 'linear-gradient(135deg, #60a5fa 0%, #818cf8 40%, #c084fc 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                intelligence, automated
              </span>
            </h1>

            <p style={{ fontSize: 18, color: 'rgba(148,163,184,0.85)', lineHeight: 1.7, maxWidth: 640, margin: '0 auto 48px' }}>
              Every medical device cleared since 1976 traces its FDA authorization back through a chain of predicate devices.
              Finding the right one used to cost weeks and thousands of dollars. Now it takes seconds.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <motion.button
                onClick={() => navigate('/app')}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                  color: 'white', fontSize: 15, fontWeight: 600,
                  padding: '14px 28px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  boxShadow: '0 6px 28px rgba(59,130,246,0.45)',
                }}
              >
                Launch Navigator <ArrowRight className="w-4 h-4" />
              </motion.button>
              <button
                onClick={() => document.getElementById('problem')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94a3b8', fontSize: 15, fontWeight: 500,
                  padding: '14px 28px', borderRadius: 12, cursor: 'pointer',
                }}
              >
                Learn more <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            style={{ position: 'absolute', bottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
          >
            <span style={{ fontSize: 11, color: 'rgba(100,116,139,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>scroll</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
            >
              <ChevronDown className="w-4 h-4" style={{ color: 'rgba(100,116,139,0.5)' }} />
            </motion.div>
          </motion.div>
        </div>

        {/* ── TECH STACK CAROUSEL ── */}
        <TechCarousel />

        {/* ── PROBLEM ── */}
        <div id="problem" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Section>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
              <FadeIn direction="left">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 12, padding: '4px 12px', borderRadius: 100, marginBottom: 24 }}>
                  <AlertTriangle className="w-3 h-3" /> The Problem
                </div>
                <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#f0f6ff', marginBottom: 24 }}>
                  Medical device clearance is a{' '}
                  <span style={{ color: '#f87171' }}>$500/hr</span>{' '}
                  manual process
                </h2>
                <p style={{ fontSize: 15, color: 'rgba(148,163,184,0.8)', lineHeight: 1.8, marginBottom: 20 }}>
                  The FDA's 510(k) clearance pathway requires manufacturers to prove their device is
                  "substantially equivalent" to a previously cleared predicate device.
                </p>
                <p style={{ fontSize: 15, color: 'rgba(148,163,184,0.8)', lineHeight: 1.8, marginBottom: 32 }}>
                  Finding the right predicate currently requires regulatory consultants billing at $500/hr,
                  weeks of manual research through the FDA's 174,000-device database, and reading hundreds of
                  pages of dense regulatory documents.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    'Average 510(k) submission takes 3-6 months',
                    'Predicate search alone: 2-4 weeks of consultant time',
                    'Wrong predicate = rejected submission = months of delay',
                  ].map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171' }} />
                      </div>
                      <span style={{ fontSize: 14, color: '#94a3b8' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </FadeIn>

              <FadeIn direction="right" delay={0.2}>
                <PredicateChainDiagram />
              </FadeIn>
            </div>
          </Section>
        </div>

        {/* ── THREE PRODUCTS ── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Section>
            <FadeIn>
              <div style={{ textAlign: 'center', marginBottom: 56 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: 12, padding: '4px 12px', borderRadius: 100, marginBottom: 20 }}>
                  <Activity className="w-3 h-3" /> The Platform
                </div>
                <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#f0f6ff', marginBottom: 16 }}>
                  Three tools, one platform
                </h2>
                <p style={{ fontSize: 15, color: 'rgba(148,163,184,0.7)', maxWidth: 500, margin: '0 auto' }}>
                  Built for the full 510(k) workflow, from initial predicate search to regulatory documentation.
                </p>
              </div>
            </FadeIn>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {[
                {
                  path: '/app',
                  icon: <Search className="w-5 h-5" />,
                  accent: '#3b82f6', accentRgb: '59,130,246',
                  name: 'Navigator',
                  tagline: 'Find your predicate in seconds',
                  desc: 'Describe your medical device and get a complete substantial equivalence analysis powered by a 5-agent AI pipeline, with predicate ancestry mapped back to 1976.',
                  bullets: ['SE analysis in under 30 seconds', 'Predicate ancestry chain visualization', 'Regulatory recommendation with testing checklist'],
                  cta: 'Launch Navigator',
                },
                {
                  path: '/app/network',
                  icon: <GitBranch className="w-5 h-5" />,
                  accent: '#6366f1', accentRgb: '99,102,241',
                  name: 'Predicate Network',
                  tagline: '50 years of regulatory lineage, live',
                  desc: 'The entire FDA 510(k) citation graph rendered in real time. 10,123 devices, 11,791 relationships. Explore hub nodes, regulatory dynasties, and cross-category bridges.',
                  bullets: ['Force-directed graph with live physics', 'Network Intelligence: hubs, dynasties, bridges', 'Click any node for full regulatory record'],
                  cta: 'Explore Network',
                },
                {
                  path: '/app/database',
                  icon: <Database className="w-5 h-5" />,
                  accent: '#8b5cf6', accentRgb: '139,92,246',
                  name: 'Device Database',
                  tagline: 'Search 175,013 FDA-cleared devices',
                  desc: 'The complete openFDA 510(k) database, searchable and filterable. Every device since 1976 with full regulatory metadata, predicate ancestry chains, and recall history.',
                  bullets: ['Search by name, applicant, product code', 'Predicate ancestry chain for any device', 'Filter by device class and regulation'],
                  cta: 'Browse Database',
                },
              ].map((product, i) => (
                <FadeIn key={product.name} delay={i * 0.1}>
                  <div style={{
                    background: `linear-gradient(160deg, rgba(${product.accentRgb},0.06) 0%, rgba(0,0,0,0) 60%)`,
                    border: `1px solid rgba(${product.accentRgb},0.18)`, borderRadius: 20, padding: '28px 24px',
                    display: 'flex', flexDirection: 'column', height: '100%', transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = `rgba(${product.accentRgb},0.35)`)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = `rgba(${product.accentRgb},0.18)`)}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `rgba(${product.accentRgb},0.12)`, border: `1px solid rgba(${product.accentRgb},0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: product.accent, marginBottom: 18 }}>
                      {product.icon}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#f0f6ff', marginBottom: 6, letterSpacing: '-0.01em' }}>{product.name}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: product.accent, marginBottom: 14 }}>{product.tagline}</div>
                    <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.72)', lineHeight: 1.7, marginBottom: 20, flex: 1 }}>{product.desc}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                      {product.bullets.map(b => (
                        <div key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ width: 14, height: 14, borderRadius: '50%', background: `rgba(${product.accentRgb},0.15)`, border: `1px solid rgba(${product.accentRgb},0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: product.accent }} />
                          </div>
                          <span style={{ fontSize: 13, color: '#94a3b8' }}>{b}</span>
                        </div>
                      ))}
                    </div>
                    <motion.button onClick={() => navigate(product.path)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      style={{ width: '100%', padding: '11px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, background: `rgba(${product.accentRgb},0.12)`, border: `1px solid rgba(${product.accentRgb},0.25)`, color: product.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {product.cta} <ArrowRight className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </FadeIn>
              ))}
            </div>
          </Section>
        </div>

        {/* ── HOW IT WORKS ── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Section>
            <FadeIn>
              <div style={{ textAlign: 'center', marginBottom: 64 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: 12, padding: '4px 12px', borderRadius: 100, marginBottom: 20 }}>
                  <Zap className="w-3 h-3" /> How It Works
                </div>
                <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#f0f6ff', marginBottom: 16 }}>
                  5-agent AI pipeline
                </h2>
                <p style={{ fontSize: 15, color: 'rgba(148,163,184,0.7)', maxWidth: 560, margin: '0 auto' }}>
                  A LangGraph state machine orchestrates five specialized agents that classify, retrieve, analyze, and report, all in under 30 seconds.
                </p>
              </div>
            </FadeIn>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { icon: <Search className="w-4 h-4" />, num: '01', title: 'Classify', desc: 'LLM identifies the FDA product code, device class (I/II/III), CFR regulation number, and advisory committee from your device description.', color: '#60a5fa' },
                  { icon: <Database className="w-4 h-4" />, num: '02', title: 'Retrieve', desc: 'Hybrid search combines SQL filtering by product code with FAISS semantic search over 174,000 device embeddings to surface the most similar cleared devices.', color: '#818cf8' },
                  { icon: <GitBranch className="w-4 h-4" />, num: '03', title: 'Map Ancestry', desc: 'Recursive SQL graph traversal walks the predicate_edges table backwards through history, mapping the full genealogy of each candidate device back to 1976.', color: '#a78bfa' },
                  { icon: <Scale className="w-4 h-4" />, num: '04', title: 'Analyze SE', desc: 'Domain-specialized LLM compares intended use, technological characteristics, and safety considerations against the FDA\'s 21 CFR 807.87(f) substantial equivalence standard.', color: '#c084fc' },
                  { icon: <FileText className="w-4 h-4" />, num: '05', title: 'Report', desc: 'Final LLM call synthesizes all analysis into a structured recommendation with narrative summary, key risks, required testing checklist, and alternative predicates.', color: '#e879f9' },
                ].map((step, i) => (
                  <FadeIn key={step.num} delay={i * 0.08}>
                    <div style={{
                      display: 'flex', gap: 16, padding: '16px 20px',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 12,
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: `rgba(${step.color === '#60a5fa' ? '59,130,246' : step.color === '#818cf8' ? '99,102,241' : step.color === '#a78bfa' ? '139,92,246' : step.color === '#c084fc' ? '192,132,252' : '232,121,249'},0.15)`,
                        border: `1px solid ${step.color}33`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: step.color,
                      }}>
                        {step.icon}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(100,116,139,0.7)', letterSpacing: '0.05em' }}>{step.num}</span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{step.title}</span>
                        </div>
                        <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.7)', lineHeight: 1.65 }}>{step.desc}</p>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>

              <div style={{ position: 'sticky', top: 100 }}>
                <FadeIn direction="right" delay={0.3}>
                  <ResultMockup />
                </FadeIn>
              </div>
            </div>
          </Section>
        </div>

        {/* ── THE SCALE ── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Section>
            <FadeIn>
              <div style={{ textAlign: 'center', marginBottom: 56 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80', fontSize: 12, padding: '4px 12px', borderRadius: 100, marginBottom: 20 }}>
                  <BarChart3 className="w-3 h-3" /> The Data
                </div>
                <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#f0f6ff', marginBottom: 16 }}>
                  Real FDA data, at scale
                </h2>
                <p style={{ fontSize: 15, color: 'rgba(148,163,184,0.7)', maxWidth: 500, margin: '0 auto' }}>
                  Built on the complete openFDA 510(k) database, enriched with OCR text and predicate relationships extracted from actual submission documents.
                </p>
              </div>
            </FadeIn>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { to: 174000, suffix: '+', label: 'Cleared Devices Indexed', sublabel: 'Complete openFDA database', icon: <Database className="w-5 h-5" />, color: '#60a5fa' },
                { to: 22497, suffix: '', label: 'Predicate Edges Mapped', sublabel: 'Real clearance relationships', icon: <GitBranch className="w-5 h-5" />, color: '#818cf8' },
                { to: 50, suffix: ' years', label: 'Clearance History', sublabel: '1976 to present', icon: <Clock className="w-5 h-5" />, color: '#a78bfa' },
                { to: 3, suffix: '', label: 'Device Classes', sublabel: 'Class I, II, and III', icon: <Shield className="w-5 h-5" />, color: '#c084fc' },
              ].map(({ to, suffix, label, sublabel, icon, color }, i) => (
                <FadeIn key={label} delay={i * 0.1}>
                  <div style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16, padding: '28px 24px', textAlign: 'center',
                    backdropFilter: 'blur(20px)',
                  }}>
                    <div style={{ color, display: 'flex', justifyContent: 'center', marginBottom: 16 }}>{icon}</div>
                    <div style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 800, color: '#f0f6ff', lineHeight: 1, marginBottom: 10 }}>
                      <CountUp to={to} suffix={suffix} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#475569' }}>{sublabel}</div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </Section>
        </div>

        {/* ── METHODOLOGY ── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Section>
            <FadeIn>
              <div style={{ textAlign: 'center', marginBottom: 56 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.15)', color: '#94a3b8', fontSize: 12, padding: '4px 12px', borderRadius: 100, marginBottom: 20 }}>
                  <FileText className="w-3 h-3" /> Technical Architecture
                </div>
                <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#f0f6ff', marginBottom: 16 }}>
                  What's under the hood
                </h2>
                <p style={{ fontSize: 15, color: 'rgba(148,163,184,0.7)', maxWidth: 560, margin: '0 auto' }}>
                  A breakdown of every technical layer, from data infrastructure to model fine-tuning.
                </p>
              </div>
            </FadeIn>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Row 1: Data pipeline */}
              <FadeIn delay={0.05}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Database className="w-4 h-4" style={{ color: '#60a5fa' }} />
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>Data Infrastructure</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.7)', lineHeight: 1.7, marginBottom: 16 }}>
                      Full openFDA 510(k) database imported into SQLite with custom indexes across K-number,
                      product code, and decision date. Predicate relationships extracted from 10,000 real submission
                      documents via Innolitics OCR API at 1 req/s, each document parsed with regex to identify
                      cited predicate K-numbers. 22,497 confirmed predicate edges stored as a directed graph.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {['174k device records', '22,497 predicate edges', 'SQLite + indexed', 'Innolitics OCR', '10k documents parsed'].map(t => (
                        <span key={t} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', color: '#93c5fd' }}>{t}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Search className="w-4 h-4" style={{ color: '#818cf8' }} />
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>Hybrid Retrieval with Self-Correction</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.7)', lineHeight: 1.7, marginBottom: 16 }}>
                      Retrieval combines SQL filtering (exact product code match) with FAISS semantic search
                      over 171,463 sentence embeddings. A semantic validation step catches classification errors:
                      if SQL results have average cosine similarity &lt; 0.25 against the query, the system flags
                      the product code as wrong and falls back to pure semantic search, automatically
                      self-correcting without user intervention.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {['FAISS IndexFlatIP', '171k embeddings', 'all-MiniLM-L6-v2', 'Semantic validation', 'Auto-fallback'].map(t => (
                        <span key={t} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', color: '#a5b4fc' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </FadeIn>

              {/* Row 2: Graph traversal + LangGraph */}
              <FadeIn delay={0.1}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <GitBranch className="w-4 h-4" style={{ color: '#a78bfa' }} />
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>Predicate Graph Traversal</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.7)', lineHeight: 1.7, marginBottom: 12 }}>
                      Predicate ancestry is mapped using a recursive Common Table Expression (CTE) in SQL
                      that walks the directed predicate graph backwards through generations. Starting from a
                      candidate device, it traces every predicate-of-predicate relationship until reaching
                      a root device with no known predicate, often a device cleared in the late 1970s or 1980s
                      under the original 510(k) framework.
                    </p>
                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, color: '#64748b', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 14 }}>
                      <span style={{ color: '#6366f1' }}>WITH RECURSIVE</span> chain <span style={{ color: '#6366f1' }}>AS</span> (<br />
                      &nbsp;&nbsp;<span style={{ color: '#4ade80' }}>SELECT</span> k, predicate_k, <span style={{ color: '#f59e0b' }}>0</span> depth<br />
                      &nbsp;&nbsp;<span style={{ color: '#6366f1' }}>UNION ALL</span><br />
                      &nbsp;&nbsp;<span style={{ color: '#4ade80' }}>SELECT</span> e.k, e.predicate_k, c.depth+<span style={{ color: '#f59e0b' }}>1</span><br />
                      &nbsp;&nbsp;<span style={{ color: '#6366f1' }}>FROM</span> edges e <span style={{ color: '#6366f1' }}>JOIN</span> chain c ...
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {['Recursive CTE', 'Directed graph', 'Back to 1976', 'Multi-hop traversal'].map(t => (
                        <span key={t} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', color: '#c4b5fd' }}>{t}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap className="w-4 h-4" style={{ color: '#22d3ee' }} />
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>LangGraph Orchestration</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.7)', lineHeight: 1.7, marginBottom: 16 }}>
                      The 5-agent pipeline is built as a LangGraph <code style={{ fontSize: 11, background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4, color: '#94a3b8' }}>StateGraph</code> where
                      each node is a specialized agent that reads from and writes to a shared typed state object.
                      Agents run sequentially with full state passed between them, the classification output
                      informs retrieval, which informs chain exploration, which informs SE analysis.
                      Timing metadata is captured per-agent and surfaced in the UI.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {['LangGraph StateGraph', '5 specialized agents', 'Typed shared state', 'Per-agent timing', 'Llama 3.3 70B'].map(t => (
                        <span key={t} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)', color: '#67e8f9' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </FadeIn>

              {/* Row 3: SE Analysis + Fine-tuning (full width) */}
              <FadeIn delay={0.15}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Scale className="w-4 h-4" style={{ color: '#4ade80' }} />
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>SE Analysis Engine</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.7)', lineHeight: 1.7, marginBottom: 16 }}>
                      Substantial equivalence scoring uses a domain-prompted LLM with structured JSON output.
                      Each candidate is evaluated against FDA's 21 CFR 807.87(f) standard: same intended use,
                      same technological characteristics, and safety question analysis. Scores are calibrated
                      with explicit rubric enforcement (≥90: identical, 70-85: minor differences, 40-69: significant,
                      &lt;40: incompatible) to prevent score collapse where all candidates receive the same score.
                      Up to 1,500 characters of description context passed per device.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {['21 CFR 807.87(f)', 'Structured JSON output', 'Score rubric enforcement', '1500-char context', 'Differentiated ranking'].map(t => (
                        <span key={t} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', color: '#86efac' }}>{t}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(99,102,241,0.04))',
                    border: '1px solid rgba(59,130,246,0.15)',
                    borderRadius: 16, padding: 28,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BarChart3 className="w-4 h-4" style={{ color: '#60a5fa' }} />
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>Domain Fine-tuning</span>
                      <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 100, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)', color: '#93c5fd' }}>Qwen2.5 7B</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.7)', lineHeight: 1.7, marginBottom: 16 }}>
                      A Qwen2.5-7B-Instruct model is fine-tuned via QLoRA on a curated dataset of 7,500 examples
                      derived from real FDA clearance data. Training set includes 5,515 confirmed positive SE pairs
                      (both devices with OCR description text, FDA-verified equivalence) and ~2,000 synthetic
                      negative examples (cross-category device pairings) to prevent the model from collapsing
                      to always predicting "strong match." Trained on Modal A10G GPU using LlamaFactory.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {['QLoRA 4-bit', '7,500 examples', 'Positive + negative pairs', 'Modal A10G', 'LlamaFactory', 'Real FDA ground truth'].map(t => (
                        <span key={t} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', color: '#93c5fd' }}>{t}</span>
                      ))}
                    </div>
                  </div>

                </div>
              </FadeIn>

            </div>
          </Section>
        </div>

        {/* ── CTA ── */}
        <Section>
          <FadeIn>
            <div style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(99,102,241,0.08) 50%, rgba(139,92,246,0.06) 100%)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: 24, padding: '64px 48px', textAlign: 'center',
              boxShadow: '0 0 80px rgba(59,130,246,0.08)',
            }}>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#f0f6ff', marginBottom: 16 }}>
                Ready to find your predicate?
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(148,163,184,0.7)', marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
                Describe your medical device and get a complete regulatory recommendation in seconds, not weeks.
              </p>
              <motion.button
                onClick={() => navigate('/app')}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                  color: 'white', fontSize: 16, fontWeight: 600,
                  padding: '16px 36px', borderRadius: 14, border: 'none', cursor: 'pointer',
                  boxShadow: '0 8px 32px rgba(59,130,246,0.5)',
                }}
              >
                Launch Navigator <ArrowRight className="w-5 h-5" />
              </motion.button>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 40 }}>
                {[
                  { icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Free to use' },
                  { icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'No account required' },
                  { icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Results in under 30 seconds' },
                ].map(({ icon, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(100,116,139,0.8)' }}>
                    <span style={{ color: '#4ade80' }}>{icon}</span>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </Section>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity className="w-3 h-3 text-white" />
            </div>
            <span style={{ fontSize: 13, color: 'rgba(100,116,139,0.7)' }}>Vera Labs</span>
          </div>
          <span style={{ fontSize: 12, color: 'rgba(71,85,105,0.7)' }}>Built with LangGraph · FAISS · Llama 3.3 70B · openFDA</span>
        </div>
    </div>
  )
}
