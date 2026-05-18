import type { Profile } from '../types/site'

function isString(v: unknown): v is string {
  return typeof v === 'string'
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every(isString)
}

function isSocial(v: unknown): v is Profile['social'] {
  if (!Array.isArray(v)) return false
  return v.every(
    (x) =>
      x &&
      typeof x === 'object' &&
      isString((x as { label?: unknown }).label) &&
      isString((x as { url?: unknown }).url),
  )
}

function isExperiences(v: unknown): v is Profile['experiences'] {
  if (!Array.isArray(v)) return false
  return v.every((x) => {
    if (!x || typeof x !== 'object') return false
    const o = x as Record<string, unknown>
    return (
      isString(o.id) &&
      isString(o.title) &&
      isString(o.company) &&
      isString(o.dates) &&
      Array.isArray(o.bullets) &&
      o.bullets.every(isString)
    )
  })
}

function isEducation(v: unknown): v is Profile['education'] {
  if (!Array.isArray(v)) return false
  return v.every((x) => {
    if (!x || typeof x !== 'object') return false
    const o = x as Record<string, unknown>
    return (
      isString(o.id) &&
      isString(o.school) &&
      isString(o.degree) &&
      isString(o.dates)
    )
  })
}

export function parseProfileJson(raw: string): Profile | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null
  const o = parsed as Record<string, unknown>
  if (!isString(o.fullName) || !isString(o.headline)) return null

  const profile: Profile = {
    fullName: o.fullName,
    headline: o.headline,
    location: isString(o.location) ? o.location : '',
    summary: isString(o.summary) ? o.summary : '',
    experiences: isExperiences(o.experiences) ? o.experiences : [],
    skills: isStringArray(o.skills) ? o.skills : [],
    education: isEducation(o.education) ? o.education : [],
    social: isSocial(o.social) ? o.social : [],
  }
  return profile
}
