import { sectionLabel } from '../context/siteDisplay'
import { useSite } from '../context/siteState'

export function ProfileForm() {
  const { state, patchProfile } = useSite()
  const { profile } = state

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Profile fields</h2>
      <p className="mt-2 text-sm text-slate-600">
        Quick edits for the progress demo. Later: bind every field, nested roles, and
        resume-backed suggestions.
      </p>

      <div className="mt-4 space-y-3">
        <label className="block text-xs font-medium text-slate-700">
          Full name
          <input
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none ring-slate-900/10 focus:ring-4"
            value={profile.fullName}
            onChange={(e) => patchProfile({ fullName: e.target.value })}
          />
        </label>
        <label className="block text-xs font-medium text-slate-700">
          Headline
          <input
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none ring-slate-900/10 focus:ring-4"
            value={profile.headline}
            onChange={(e) => patchProfile({ headline: e.target.value })}
          />
        </label>
        <label className="block text-xs font-medium text-slate-700">
          Location
          <input
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none ring-slate-900/10 focus:ring-4"
            value={profile.location}
            onChange={(e) => patchProfile({ location: e.target.value })}
          />
        </label>
        <label className="block text-xs font-medium text-slate-700">
          Summary
          <textarea
            rows={5}
            className="mt-1 w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-sm outline-none ring-slate-900/10 focus:ring-4"
            value={profile.summary}
            onChange={(e) => patchProfile({ summary: e.target.value })}
          />
        </label>
      </div>
    </section>
  )
}

export function SectionControls() {
  const { state, toggleSection, moveSection } = useSite()

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Sections</h2>
      <p className="mt-2 text-sm text-slate-600">
        Reorder with arrows, toggle visibility. Drag-and-drop is a later upgrade.
      </p>

      <ul className="mt-4 space-y-2">
        {state.sectionOrder.map((id) => {
          const hidden = state.hiddenSections.includes(id)
          return (
            <li
              key={id}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {sectionLabel(id)}
                </p>
                <p className="text-xs text-slate-500">{hidden ? 'Hidden' : 'Visible'}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-100"
                  onClick={() => moveSection(id, -1)}
                  aria-label={`Move ${sectionLabel(id)} up`}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-100"
                  onClick={() => moveSection(id, 1)}
                  aria-label={`Move ${sectionLabel(id)} down`}
                >
                  Down
                </button>
                <button
                  type="button"
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-100"
                  onClick={() => toggleSection(id)}
                >
                  {hidden ? 'Show' : 'Hide'}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function ThemePicker() {
  const { state, setTheme } = useSite()

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Theme</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {(
          [
            { id: 'slate' as const, label: 'Slate (cool)' },
            { id: 'warm' as const, label: 'Paper (warm)' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            className={[
              'rounded-full border px-3 py-1.5 text-sm font-medium transition',
              state.theme === t.id
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>
    </section>
  )
}
