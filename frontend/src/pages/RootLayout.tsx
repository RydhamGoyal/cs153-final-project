import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, Compass, BookOpen, Database, Network } from 'lucide-react'

const TABS = [
  { path: '/app', label: 'Navigator', icon: <Compass className="w-3.5 h-3.5" /> },
  { path: '/app/network', label: 'Predicate Network', icon: <Network className="w-3.5 h-3.5" /> },
  { path: '/app/database', label: 'Device Database', icon: <Database className="w-3.5 h-3.5" /> },
  { path: '/app/about', label: 'About', icon: <BookOpen className="w-3.5 h-3.5" /> },
]

export function RootLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  // Exact match only — prevents /app matching /app/database etc.
  const isActive = (path: string) => location.pathname === path

  return (
    <>
      <div id="bg-orb-1" />
      <div id="bg-orb-2" />
      <div id="bg-orb-3" />
      <div id="bg-grid" />

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <nav style={{
          position: 'fixed', top: 16, left: 0, right: 0, zIndex: 50,
          display: 'flex', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 10px',
            background: 'rgba(10,15,28,0.8)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.11)',
            borderRadius: 100,
            boxShadow: '0 8px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset',
            pointerEvents: 'all',
          }}>

            {/* Logo */}
            <div
              onClick={() => navigate('/')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px 4px 6px', cursor: 'pointer', flexShrink: 0 }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: 9,
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                boxShadow: '0 0 14px rgba(59,130,246,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Activity className="w-3.5 h-3.5 text-white" />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#f0f6ff', whiteSpace: 'nowrap' }}>Vera Labs</span>
            </div>

            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 2 }}>
              {TABS.map(tab => {
                const active = isActive(tab.path)
                return (
                  <button
                    key={tab.path}
                    onClick={() => navigate(tab.path)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '8px 16px', borderRadius: 100,
                      fontSize: 14, fontWeight: active ? 600 : 400,
                      color: active ? '#e2e8f0' : '#64748b',
                      background: 'transparent',
                      border: 'none', cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      position: 'relative',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#94a3b8' }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#64748b' }}
                  >
                    {/* Sliding pill background */}
                    {active && (
                      <motion.div
                        layoutId="nav-pill"
                        style={{
                          position: 'absolute', inset: 0, borderRadius: 100,
                          background: 'rgba(255,255,255,0.1)',
                          boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset',
                        }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span style={{ position: 'relative', color: active ? '#60a5fa' : 'inherit', opacity: active ? 1 : 0.6 }}>
                      {tab.icon}
                    </span>
                    <span style={{ position: 'relative' }}>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </nav>

        <div style={{ flex: 1, paddingTop: 72 }}>
          <Outlet />
        </div>
      </div>
    </>
  )
}
