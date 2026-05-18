import { Link, NavLink } from 'react-router-dom'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200',
    isActive
      ? 'bg-slate-900 text-white'
      : 'text-slate-700 hover:bg-slate-100',
  ].join(' ')

export function NavHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="font-semibold tracking-tight text-slate-900">
          LinkedIn → Launch Site
        </Link>
        <nav className="flex items-center gap-1" aria-label="Primary">
          <NavLink to="/" end className={linkClass}>
            Overview
          </NavLink>
          <NavLink to="/workspace" className={linkClass}>
            Workspace
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
