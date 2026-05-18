import type { ReactNode } from 'react'
import type { SectionId, SiteState } from '../types/site'

const themeShell: Record<SiteState['theme'], string> = {
  slate: 'bg-slate-50 text-slate-900',
  warm: 'bg-amber-50 text-stone-900',
}

const cardClass: Record<SiteState['theme'], string> = {
  slate: 'rounded-2xl border border-slate-200/80 bg-white shadow-sm',
  warm: 'rounded-2xl border border-amber-200/80 bg-white shadow-sm',
}

const mutedClass: Record<SiteState['theme'], string> = {
  slate: 'text-slate-600',
  warm: 'text-stone-600',
}

const pillClass: Record<SiteState['theme'], string> = {
  slate: 'rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-800',
  warm: 'rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-stone-800',
}

export function LandingPreview({
  state,
  visibleSections,
}: {
  state: SiteState
  visibleSections: SectionId[]
}) {
  const { profile, theme } = state
  const shell = themeShell[theme]
  const card = cardClass[theme]
  const muted = mutedClass[theme]
  const pill = pillClass[theme]

  const blocks = new Map<SectionId, ReactNode>([
    [
      'hero',
      <section key="hero" className={`${card} p-8 sm:p-10`}>
        <p className={`text-sm font-medium uppercase tracking-wide ${muted}`}>
          {profile.location}
        </p>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          {profile.fullName}
        </h1>
        <p className={`mt-3 max-w-2xl text-pretty text-lg ${muted}`}>
          {profile.headline}
        </p>
      </section>,
    ],
    [
      'about',
      <section key="about" className={`${card} p-8 sm:p-10`}>
        <h2 className="text-lg font-semibold">About</h2>
        <p className={`mt-3 max-w-prose text-pretty leading-relaxed ${muted}`}>
          {profile.summary}
        </p>
      </section>,
    ],
    [
      'experience',
      <section key="experience" className={`${card} p-8 sm:p-10`}>
        <h2 className="text-lg font-semibold">Experience</h2>
        <ul className="mt-4 space-y-6">
          {profile.experiences.map((job) => (
            <li key={job.id}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <div>
                  <p className="font-medium">{job.title}</p>
                  <p className={`text-sm ${muted}`}>{job.company}</p>
                </div>
                <p className={`text-sm ${muted}`}>{job.dates}</p>
              </div>
              <ul className={`mt-3 list-disc space-y-1 pl-5 text-sm ${muted}`}>
                {job.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>,
    ],
    [
      'skills',
      <section key="skills" className={`${card} p-8 sm:p-10`}>
        <h2 className="text-lg font-semibold">Skills</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {profile.skills.map((s) => (
            <span key={s} className={pill}>
              {s}
            </span>
          ))}
        </div>
      </section>,
    ],
    [
      'education',
      <section key="education" className={`${card} p-8 sm:p-10`}>
        <h2 className="text-lg font-semibold">Education</h2>
        <ul className="mt-4 space-y-4">
          {profile.education.map((e) => (
            <li key={e.id}>
              <p className="font-medium">{e.school}</p>
              <p className={`text-sm ${muted}`}>
                {e.degree} · {e.dates}
              </p>
            </li>
          ))}
        </ul>
      </section>,
    ],
    [
      'contact',
      <section key="contact" className={`${card} p-8 sm:p-10`}>
        <h2 className="text-lg font-semibold">Links</h2>
        <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {profile.social.map((s) => (
            <li key={s.url}>
              <a
                className="text-sm font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-900"
                href={s.url}
                target="_blank"
                rel="noreferrer"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </section>,
    ],
  ])

  return (
    <div className={`${shell} min-h-[720px] rounded-xl`}>
      <div className="mx-auto max-w-3xl space-y-6 p-6 sm:p-8">
        {visibleSections.map((id) => blocks.get(id)).filter(Boolean)}
      </div>
    </div>
  )
}
