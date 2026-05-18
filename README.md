# LinkedIn → Launch Site

**GitHub:** [RydhamGoyal/cs153-final-project](https://github.com/RydhamGoyal/cs153-final-project)

Guided workflow scaffold: **profile data in → grounded personal landing page → structured editor → static publish path** (GitHub Pages–friendly).

**Roadmap & TA-facing narrative:** see [`NEXT_STEPS.md`](./NEXT_STEPS.md) (product flow, UI/UX plan including optional [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) skill, artifact discovery, and **compute/resources** language for progress forms).

## Quick start

```bash
cd linkedin-launch-site
npm install
npm run dev
```

- **Overview:** [http://localhost:5173/](http://localhost:5173/)
- **Workspace:** [http://localhost:5173/workspace](http://localhost:5173/workspace)

Production build (relative asset paths for GitHub Pages project sites):

```bash
npm run build
npm run preview
```

Output lives in `dist/`.

## What exists in this scaffold

| Area | Status |
| --- | --- |
| Core types (`Profile`, sections, `SiteState`) | Implemented |
| Sample profile + reset | Implemented |
| Workspace: edit headline fields, reorder/hide sections, two themes | Implemented |
| Live landing preview | Implemented |
| SEO snippet (title, description, OG) + copy-to-clipboard | Stub / preview |
| JSON profile paste (minimal validation) | Stub import |
| LinkedIn OAuth / export / resume PDF | Not built yet |
| ZIP export / GitHub Actions deploy | Not built yet |

## Architecture (high level)

- **`src/types/site.ts`** — shared types for profile + layout state.
- **`src/context/siteState.tsx`** — `SiteProvider` + `useSite` reducer-driven state.
- **`src/context/siteDisplay.ts`** — pure helpers (section labels, visible order).
- **`src/components/LandingPreview.tsx`** — presentational “published site” view.
- **`src/lib/seo.ts`** — builds head-tag snippet from `SiteState`.
- **`src/lib/profileJson.ts`** — minimal JSON import validation.

## Optional design tooling (not bundled)

For AI-assisted UI polish while you implement, you can install the MIT-licensed [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) via their CLI (`uipro init --ai cursor`). It is **developer tooling**, not a runtime dependency of this app. If you vendor or copy substantial material, cite the repo in your course write-up.