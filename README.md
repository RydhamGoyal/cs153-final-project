# LinkedIn → Launch Site

**GitHub:** [RydhamGoyal/cs153-final-project](https://github.com/RydhamGoyal/cs153-final-project)

Turn profile-ish inputs into a **personal landing page**, tweak it in a **structured editor**, and eventually ship **static files** (GitHub Pages–friendly build).

More detail on planned flow and UI work: [`NEXT_STEPS.md`](./NEXT_STEPS.md).

## Quick start

```bash
cd linkedin-launch-site
npm install
npm run dev
```

Production build (relative paths so it works as a GitHub Pages project site):

```bash
npm run build
npm run preview
```

Output is in `dist/`.

## What’s in the tree so far

| Area | Status |
| --- | --- |
| Core types (`Profile`, sections, `SiteState`) | In place |
| Sample profile + reset | In place |
| Workspace: fields, reorder/hide sections, two themes | In place |
| Live landing preview | In place |
| SEO snippet + copy to clipboard | Rough / preview |
| JSON profile paste | Minimal validation |
| LinkedIn / resume / real deploy | Not built yet |

## Layout (code)

- `src/types/site.ts` — shared types  
- `src/context/siteState.tsx` — provider + reducer  
- `src/context/siteDisplay.ts` — section ordering helpers  
- `src/components/LandingPreview.tsx` — “published” preview  
- `src/lib/seo.ts` — head snippet from state  
- `src/lib/profileJson.ts` — JSON import guardrails  

## Optional design helper (not shipped to users)

[ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) is a MIT-licensed Cursor skill you can install with their CLI (`uipro init --ai cursor`) if you want extra UI/UX prompts while building. It’s dev-only, not a runtime dependency.
