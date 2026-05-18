import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExportPanel } from '../components/ExportPanel'
import { LandingPreview } from '../components/LandingPreview'
import { NavHeader } from '../components/NavHeader'
import {
  ProfileForm,
  SectionControls,
  ThemePicker,
} from '../components/WorkspaceSidebar'
import { orderedVisibleSections } from '../context/siteDisplay'
import { useSite } from '../context/siteState'
import { buildSeo } from '../lib/seo'
import { parseProfileJson } from '../lib/profileJson'

export function WorkspacePage() {
  const { state, setProfile, reset } = useSite()
  const visible = useMemo(() => orderedVisibleSections(state), [state])
  const seo = useMemo(() => buildSeo(state), [state])
  const [rawJson, setRawJson] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)

  function applyJson() {
    const parsed = parseProfileJson(rawJson)
    if (!parsed) {
      setJsonError('Could not parse profile JSON. Ensure required fields like fullName and headline exist.')
      return
    }
    setJsonError(null)
    setProfile(parsed)
  }

  return (
    <div className="min-h-dvh bg-slate-100">
      <NavHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Customization workspace
          </h1>
          <p className="max-w-3xl text-sm text-slate-600">
            This is the structured editor shell: edit grounded fields, reorder sections, swap
            themes, and preview the landing page without a general-purpose chat UI. Import
            from LinkedIn / resume isn’t wired up yet. JSON paste checks a minimal{' '}
            <code className="rounded bg-white px-1 py-0.5 text-xs">Profile</code> shape.
          </p>
          <p className="text-xs text-slate-500">
            Browser tab title while editing:{' '}
            <span className="font-medium text-slate-700">{seo.title}</span>
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="space-y-4">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Import</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Later: OAuth / LinkedIn export / resume PDF merge. For now, paste a JSON
                    profile object.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
                >
                  Reset sample
                </button>
              </div>

              <textarea
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
                rows={6}
                placeholder='{"fullName":"…","headline":"…","location":"…","summary":"…","experiences":[],"skills":[],"education":[],"social":[]}'
                className="mt-3 w-full resize-y rounded-md border border-slate-200 px-3 py-2 font-mono text-xs outline-none ring-slate-900/10 focus:ring-4"
              />
              {jsonError ? (
                <p className="mt-2 text-xs text-red-700">{jsonError}</p>
              ) : null}
              <button
                type="button"
                onClick={applyJson}
                className="mt-3 w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Apply JSON profile
              </button>
            </section>

            <ProfileForm />
            <SectionControls />
            <ThemePicker />
            <ExportPanel />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-800">Preview</p>
              <Link
                to="/"
                className="text-sm font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900"
              >
                Back to overview
              </Link>
            </div>
            <LandingPreview state={state} visibleSections={visible} />
          </div>
        </div>
      </main>
    </div>
  )
}
