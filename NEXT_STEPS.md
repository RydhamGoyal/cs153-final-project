# Next steps

Personal notes on where I’m taking this after the current UI shell.

## What works today

The app is a **frontend-only** slice: typed profile + layout state, workspace (edit copy, reorder/hide sections, two themes), live preview, stub JSON import, and a basic SEO head snippet you can copy. There’s no real LinkedIn pull, resume parsing, link fetching, backend, or automated GitHub Pages deploy yet.

## Full flow I’m building toward

Rough picture of the product:

1. **LinkedIn URL** — pull what’s allowed (OAuth or export); if that’s thin, fall back to pasting sections or uploading LinkedIn’s export.
2. **Resume PDF** — extract text (and whatever structure I can get) to fill gaps and fix inconsistencies vs LinkedIn.
3. **GitHub URL** — use the public API for pins, descriptions, languages; surface a projects-style section.
4. **Other links** — personal sites, papers, demos, blogs: user drops URLs they want considered; fetch Open Graph / readable text where it makes sense.

Then: merge everything into one structured model with **clear provenance** (where each bit came from), optional **“find more about me”** behind a search + **you pick what actually gets merged** so it doesn’t silently grab wrong-person stuff.

Output: a **static** personal page (GitHub Pages–friendly `dist/`), good defaults for title / description / OG, and the same structured editor to tweak layout and copy after the first pass.

## Making the pages actually look good

I want a small set of **strong default templates** (type, spacing, color, motion that respects reduced motion) instead of generic “AI landing page” vibes.

I’m also looking at [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) as **optional Cursor-side tooling** (`uipro init --ai cursor`) for palette / typography / layout ideas while I write components—it’s not bundled into the shipped app.

Concrete build order on the UI side: nail tokens + 1–2 themes, ship solid section components (hero, experience, projects, etc.), then nicer OG handling.

## Workflow upgrades I care about

- One simple **onboarding path** (URLs + resume → preview).
- **Source tags** on fields when merging LinkedIn / resume / GitHub / pasted links.
- **Conflicts** between sources shown explicitly instead of overwriting quietly.
- **Export** — zip or a small script / Action to push static output to Pages.

## Implementation order (rough)

1. Ingestion MVP: LinkedIn path + resume PDF → merged JSON in the client or a tiny service.  
2. GitHub projects section via public API.  
3. Extra URLs: metadata + light extraction.  
4. Optional discovery: search → rank → confirm.  
5. Visual pass + templates (UI UX Pro Max only as a helper while coding).  
6. Static build + Pages writeup / automation.

## Links

- [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (optional dev-time design helper)
