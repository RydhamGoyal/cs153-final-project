import type { SiteState } from '../types/site'

export type SeoSnippet = {
  title: string
  description: string
  ogTitle: string
  ogDescription: string
  ogType: string
}

export function buildSeo(state: SiteState): SeoSnippet {
  const { profile } = state
  const title = `${profile.fullName} — ${profile.headline}`
  const description =
    profile.summary.length > 160
      ? `${profile.summary.slice(0, 157)}…`
      : profile.summary

  return {
    title,
    description,
    ogTitle: profile.fullName,
    ogDescription: description,
    ogType: 'profile',
  }
}

export function renderHeadHtml(seo: SeoSnippet, siteUrl: string): string {
  const image = `${siteUrl.replace(/\/$/, '')}/og-placeholder.svg`
  return [
    `<title>${escapeHtml(seo.title)}</title>`,
    `<meta name="description" content="${escapeHtml(seo.description)}" />`,
    `<meta property="og:title" content="${escapeHtml(seo.ogTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(seo.ogDescription)}" />`,
    `<meta property="og:type" content="${escapeHtml(seo.ogType)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join('\n')
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function defaultSiteUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return 'https://your-username.github.io/your-repo'
}
