export type SectionId =
  | 'hero'
  | 'about'
  | 'experience'
  | 'skills'
  | 'education'
  | 'contact'

export type ThemeId = 'slate' | 'warm'

export interface Experience {
  id: string
  title: string
  company: string
  dates: string
  bullets: string[]
}

export interface Education {
  id: string
  school: string
  degree: string
  dates: string
}

export interface SocialLink {
  label: string
  url: string
}

export interface Profile {
  fullName: string
  headline: string
  location: string
  summary: string
  experiences: Experience[]
  skills: string[]
  education: Education[]
  social: SocialLink[]
}

export interface SiteState {
  profile: Profile
  theme: ThemeId
  sectionOrder: SectionId[]
  hiddenSections: SectionId[]
}

export const DEFAULT_SECTION_ORDER: SectionId[] = [
  'hero',
  'about',
  'experience',
  'skills',
  'education',
  'contact',
]
