import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, Compass, BookOpen, Database, Network, ArrowLeft } from 'lucide-react'

const TABS = [
  { path: '/app', label: 'Navigator', icon: <Compass className="w-3.5 h-3.5" /> },
  { path: '/app/methodology', label: 'Methodology', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { path: '/app/database', label: 'Device Database', icon: <Database className="w-3.5 h-3.5" /> },
  { path: '/app/network', label: 'Predicate Network', icon: <Network className="w-3.5 h-3.5" /> },
]

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path: string) =>
    path === '/app' ? location.pathname === '/app' : location.pathname.startsWith(path)

  return (
    <>
      <div id="bg-orb-1" />
      <div id="bg-orb-2" />
      <div id="bg-orb-3" />
      <div id="bg-grid" />

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* Top nav */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(6,9,18,0.8)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', gap: 8 }}>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 16, flexShrink: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                boxShadow: '0 0 14px rgba(59,130,246,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Activity className="w-3.5 h-3.5 text-white" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f6ff', whiteSpace: 'nowrap' }}>Vera Labs</span>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)', marginRight: 8 }} />

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 2, flex: 1 }}>
              {TABS.map(tab => {
                const active = isActive(tab.path)
                return (
                  <button
                    key={tab.path}
                    onClick={() => navigate(tab.path)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 8,
                      fontSize: 13, fontWeight: active ? 600 : 400,
                      color: active ? '#e2e8f0' : '#64748b',
                      background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                      border: 'none', cursor: 'pointer',
                      transition: 'all 0.15s',
                      position: 'relative',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#94a3b8' }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#64748b' }}
                  >
                    <span style={{ color: active ? '#60a5fa' : 'inherit' }}>{tab.icon}</span>
                    {tab.label}
                    {active && (
                      <motion.div
                        layoutId="tab-indicator"
                        style={{
                          position: 'absolute', bottom: -1, left: 8, right: 8, height: 2,
                          background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
                          borderRadius: 2,
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Back to home */}
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8,
                fontSize: 12, color: '#475569',
                background: 'transparent', border: 'none', cursor: 'pointer',
                transition: 'color 0.15s', flexShrink: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
              onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
            >
              <ArrowLeft className="w-3 h-3" /> Home
            </button>
          </div>
        </nav>

        {/* Page content */}
        <div style={{ flex: 1 }}>
          <Outlet />
        </div>
      </div>
    </>
  )
}
