import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { NavHeader } from '../components/NavHeader'
import { buildSeo } from '../lib/seo'
import { useSite } from '../context/siteState'

export function HomePage() {
  const { state } = useSite()
  const seo = buildSeo(state)

  useEffect(() => {
    const prev = document.title
    document.title = 'LinkedIn → Launch Site'
    return () => {
      document.title = prev
    }
  }, [])

  return (
    <div className="min-h-dvh bg-white">
      <NavHeader />
      <main className="mx-auto max-w-5xl px-4 py-14">
        <p className="text-sm font-medium text-slate-600">Work in progress</p>
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Turn profile data into a ship-ready personal site
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-slate-600">
          LinkedIn → Launch Site is a guided workflow: bring LinkedIn-sourced data (with
          clear fallbacks), optionally enrich with a resume PDF, generate a grounded static
          page, iterate in a structured editor, and publish to GitHub Pages.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/workspace"
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Open workspace
          </Link>
          <a
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            href="https://docs.github.com/pages"
            target="_blank"
            rel="noreferrer"
          >
            GitHub Pages docs
          </a>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Grounded inputs',
              body: 'LinkedIn API where allowed, official export, paste-to-import, and resume PDF merge (planned).',
            },
            {
              title: 'Structured editing',
              body: 'Reorder sections, toggle blocks, edit fields, swap themes—without rewriting the whole product in chat.',
            },
            {
              title: 'Static by default',
              body: 'SEO helpers (title, description, Open Graph) and a Pages-friendly export path (build pipeline next).',
            },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-base font-semibold text-slate-900">{c.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-950 p-6 text-slate-100">
          <p className="text-sm font-semibold">Live SEO preview (from current sample state)</p>
          <p className="mt-2 text-sm text-slate-300">{seo.title}</p>
          <p className="mt-2 text-sm text-slate-400">{seo.description}</p>
        </div>
      </main>
    </div>
  )
}
