import { useMemo, useState } from 'react'
import { buildSeo, defaultSiteUrl, renderHeadHtml } from '../lib/seo'
import { useSite } from '../context/siteState'

export function ExportPanel() {
  const { state } = useSite()
  const [copied, setCopied] = useState(false)
  const seo = useMemo(() => buildSeo(state), [state])
  const siteUrl = defaultSiteUrl()
  const head = useMemo(() => renderHeadHtml(seo, siteUrl), [seo, siteUrl])

  async function copyHead() {
    try {
      await navigator.clipboard.writeText(head)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Export & SEO (stub)</h2>
      <p className="mt-2 text-sm text-slate-600">
        The final product will generate a static bundle for GitHub Pages. For now, this
        panel previews the HTML head tags your publish pipeline should emit from{' '}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">SiteState</code>.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void copyHead()}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          {copied ? 'Copied' : 'Copy head snippet'}
        </button>
        <span className="text-xs text-slate-500">OG image uses `/og-placeholder.svg`</span>
      </div>

      <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-slate-950 p-3 text-xs leading-relaxed text-slate-100">
        <code>{head}</code>
      </pre>

      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700">
        <li>
          Run <code className="rounded bg-slate-100 px-1">npm run build</code> to produce{' '}
          <code className="rounded bg-slate-100 px-1">dist/</code>.
        </li>
        <li>
          Push <code className="rounded bg-slate-100 px-1">dist/</code> to a{' '}
          <code className="rounded bg-slate-100 px-1">gh-pages</code> branch or enable GitHub
          Actions (planned).
        </li>
        <li>
          Turn on GitHub Pages for the branch and set the site URL used in absolute OG tags.
        </li>
      </ol>
    </section>
  )
}
