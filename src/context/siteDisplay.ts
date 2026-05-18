import type { SectionId, SiteState } from '../types/site'
import { DEFAULT_SECTION_ORDER } from '../types/site'

export function sectionLabel(id: SectionId): string {
  switch (id) {
    case 'hero':
      return 'Hero'
    case 'about':
      return 'About'
    case 'experience':
      return 'Experience'
    case 'skills':
      return 'Skills'
    case 'education':
      return 'Education'
    case 'contact':
      return 'Links'
    default:
      return id
  }
}

export function orderedVisibleSections(state: SiteState): SectionId[] {
  const hidden = new Set(state.hiddenSections)
  const known = new Set(DEFAULT_SECTION_ORDER)
  const ordered = state.sectionOrder.filter((id) => known.has(id))
  return ordered.filter((id) => !hidden.has(id))
}
