import type { Profile, SiteState } from '../types/site'
import { DEFAULT_SECTION_ORDER } from '../types/site'

// Demo seed summarized from public LinkedIn; verify before publishing a live site.
export const SAMPLE_PROFILE: Profile = {
  fullName: 'Rydham Goyal',
  headline: 'Deep learning @ Stanford · SAIL · previously @ xAI',
  location: 'San Francisco Bay Area',
  summary:
    'Stanford undergraduate focused on deep learning, generative modeling, and product-minded engineering. Researching long-context memory for personal agents at SAIL (Stanford NLP / SALT Lab) with Prof. Diyi Yang. Previously built diffusion-based neuroimaging models at Stanford Neurosurgery, shipped as a software engineer at xAI, and contributes to campus product communities (Product Pathways Stanford, Google Developers Student Club). Reach out: rydham@stanford.edu',
  experiences: [
    {
      id: 'exp-sail',
      title: 'Undergraduate student researcher',
      company: 'Stanford Artificial Intelligence Laboratory (SAIL)',
      dates: 'Mar 2026 – Present',
      bullets: [
        'Researching long-context memory for personal agents under Prof. Diyi Yang, advised by Vishakh Padmakumar at the SALT Lab in the Stanford NLP Group.',
      ],
    },
    {
      id: 'exp-xai',
      title: 'Software engineer',
      company: 'xAI',
      dates: 'Jan 2026 – Feb 2026',
      bullets: [
        'Talent Engineering (Palo Alto, CA).',
      ],
    },
    {
      id: 'exp-neuro',
      title: 'Machine learning researcher',
      company: 'Stanford Neurosurgery',
      dates: 'Jun 2025 – Dec 2025',
      bullets: [
        'Developed diffusion-based deep learning models to predict post-acetazolamide (post-vasodilator) MRI from pre-scan data for non-invasive stroke-risk assessment.',
        'Trained and evaluated on Stanford clinical MRI data using PyTorch, TensorFlow, NVIDIA MONAI, and modern generative modeling stacks (incl. HPC / Marlowe).',
      ],
    },
    {
      id: 'exp-pareto',
      title: 'Pareto Fellow',
      company: 'Pareto Holdings',
      dates: 'Jan 2026 – Present',
      bullets: ['Working with some very talented folks.'],
    },
    {
      id: 'exp-pathways',
      title: 'Leadership team',
      company: 'Product Pathways Stanford',
      dates: 'Oct 2025 – Present',
      bullets: [
        'Helping build the biggest product community at Stanford.',
      ],
    },
    {
      id: 'exp-gdsc',
      title: 'Product development engineer',
      company: 'Google Developers Student Club (Stanford University)',
      dates: 'Dec 2024 – Present',
      bullets: [
        'Building a financial-literacy experience with mock trading, digestible market news, and ML-assisted user support.',
        'Leading development of an AI + music collaboration with Stanford DJ Society: a smart DJ training plug-in for lyric- and beat-aware transition suggestions.',
      ],
    },
  ],
  skills: [
    'PyTorch',
    'TensorFlow',
    'NVIDIA MONAI',
    'Diffusion models',
    'Deep learning',
    'Neuroimaging',
    'NLP / agents',
    'Product development',
    'ML research',
    'Generative modeling',
  ],
  education: [
    {
      id: 'edu-stanford',
      school: 'Stanford University',
      degree: "B.S. Computer Science (relevant coursework in algorithms, systems, probability, ML, and economics)",
      dates: '2023 – 2027',
    },
    {
      id: 'edu-hs',
      school: 'JG International School',
      degree: 'High school diploma (CIE IGCSE, Cambridge AS Levels; SAT 1540)',
      dates: '2019 – 2023',
    },
  ],
  social: [
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/rydham-goyal/' },
    { label: 'Email', url: 'mailto:rydham@stanford.edu' },
    { label: 'Stanford profile', url: 'https://profiles.stanford.edu/rydham-goyal' },
    { label: 'OpenReview', url: 'https://openreview.net/profile?id=~Rydham_Goyal1' },
  ],
}

export function createInitialSiteState(): SiteState {
  return {
    profile: SAMPLE_PROFILE,
    theme: 'slate',
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    hiddenSections: [],
  }
}
