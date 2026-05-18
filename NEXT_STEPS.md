# Next steps (for course staff & repo readers)

This document is meant to sit alongside the scaffold in GitHub so TAs can see **where the project is going** and how it connects to the **progress update** (product narrative, workflow, and infrastructure asks).

---

## Where things stand now

The repo contains a **client-side scaffold**: typed profile model, workspace UI (edit fields, reorder/hide sections, themes), live preview, minimal JSON import, and SEO head-snippet preview. **Not yet built:** real ingestion from LinkedIn, resume PDF parsing, crawling or summarizing external links, backend services, or automated static export to GitHub Pages.

---

## Target user flow (v1 product definition)

End state: a guided flow where the user supplies **grounding sources**, the system **normalizes** them into a structured site model, and the **editor + templates** turn that into a polished, mobile-responsive personal landing page.

### Inputs (what the user provides)

1. **LinkedIn profile URL** (e.g. `https://www.linkedin.com/in/...`)  
   - **Preferred:** official LinkedIn data path where allowed (OAuth / export), with **explicit fallbacks** (paste profile sections, upload export ZIP) when the API does not expose full content.  
   - Parsed into structured fields: headline, about, experience, education, skills, featured links, etc.

2. **Resume PDF (optional but recommended)**  
   - Text extraction + layout-aware parsing where feasible; used to **fill gaps**, resolve conflicts (e.g. date mismatches), and add bullets not present on LinkedIn.

3. **GitHub profile URL (optional)**  
   - Pull pinned repos, descriptions, languages, and links to READMEs or project sites **via the public GitHub API** (no scraping of private data).  
   - Map into a “Projects” or “Open source” section on the landing page.

4. **Additional artifact links (0–N)**  
   - Personal sites, portfolios, papers (OpenReview / arXiv), demos, blogs, talk recordings, etc.  
   - User pastes arbitrary HTTPS URLs they want considered “in scope” for the site.

### Processing (what the system does)

1. **Fetch & extract** content from each source within rate limits and robots/terms of service.  
2. **Merge** into a single canonical `SiteModel` / `Profile` (with provenance: which field came from which source).  
3. **Discovery pass (optional user toggle):** “Find more about me online”  
   - Start from **user-approved seeds** (name + affiliation + GitHub handle + LinkedIn slug), run **constrained search** (e.g. programmatic web search APIs), fetch candidate pages, **score** relevance, and present a **shortlist for human confirmation** before merging anything into the public site.  
   - This keeps the workflow **grounded** and avoids silently ingesting wrong-person content.

### Output (what the user gets)

- A **default beautiful template** (and later: theme variants) with strong typography, spacing, responsive layout, accessibility, and motion that respects `prefers-reduced-motion`.  
- **SEO defaults:** `<title>`, meta description, Open Graph / Twitter cards, canonical URL.  
- **Static export** suitable for **GitHub Pages** (or similar): `dist/` or generated HTML per deploy, plus short docs for enabling Pages.

### Iteration (after first generation)

- Same **structured workspace** as today: reorder sections, toggle blocks, edit text, swap themes, regenerate **one section at a time** with constraints tied to the source bundle (not “rewrite my whole life in chat”).

---

## Making landing pages look “really nice” (UI/UX plan)

**Primary lever for course implementation:** treat visual quality as a **first-class deliverable**: design tokens (color, type, spacing, radii, shadows), 2–3 **opinionated** personal-site templates, and component-level polish (focus states, contrast, responsive breakpoints).

**Optional assistant tooling (not a runtime dependency):** the MIT-licensed [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) skill (install via their CLI, e.g. `uipro init --ai cursor`) is a **design-intelligence aid while coding**—it helps choose palettes, typography pairings, layout patterns, and anti-patterns to avoid. It does **not** ship inside the app; it speeds up **human-directed** UI work so templates stay cohesive and professional.

Concrete engineering tasks:

- Lock a **design system** (CSS variables or Tailwind theme extensions) for personal-brand sites.  
- Build **section components** (Hero, About, Experience, Projects, Writing, etc.) with consistent rhythm and accessible markup.  
- Add **OG image** generation or curated defaults per theme.  
- Run a short **accessibility pass** (contrast, focus order, keyboard nav) before demos.

---

## Workflow improvements (beyond the current scaffold)

| Area | Next step |
| --- | --- |
| **Onboarding** | Single “Create site” wizard: paste URLs → upload resume → confirm permissions → preview. |
| **Provenance** | Every field shows a small “source” chip (LinkedIn / resume / GitHub / user link / search candidate). |
| **Conflict resolution** | When two sources disagree, surface a **diff UI** instead of silent overwrite. |
| **Search / discovery** | Optional step: query + rank + **user confirm** before merge; log what was rejected for debugging. |
| **Regeneration** | Per-section “rewrite” that must **cite** allowed sources (no new uncited facts). |
| **Export** | One-click ZIP or GitHub Action that publishes static output to Pages. |

---

## Suggested implementation order (milestones)

1. **Ingestion MVP:** LinkedIn URL → manual paste / export path + resume PDF text extraction → merged JSON.  
2. **GitHub section:** public API → Projects block in `SiteModel` + preview.  
3. **Extra links:** fetch Open Graph metadata + optional readable article extraction for summaries.  
4. **Discovery (robust search):** gated assistant with confirmation + rate limits.  
5. **Visual polish:** templates + themes + OG; use UI UX Pro Max during development as needed.  
6. **Ship path:** static build + Pages documentation + optional CI.

---

## Resources & compute (for the **progress update form**)

You can paste or adapt the following when asked about **compute / APIs / extra resources**.

### What you need in the near term (likely **no** special GPU quota)

- **Small always-on or on-demand backend** (Docker on a **DigitalOcean** Droplet or **App Platform**) for: OAuth token exchange (if used), file upload (resume), caching fetch results, and optional calls to **LLM APIs** for summarization / section copy. Typical dev/student traffic fits comfortably within the **$250 DigitalOcean** allocation; scale the Droplet if uploads or builds get heavy.

- **Optional edge layer:** **Cloudflare Workers** (and **Workers KV** / **R2** for uploads) for rate limiting, auth handoff, and hiding third-party API keys from the browser. **Workers AI** is relevant if you want **open-weight** models at the edge for cheap summarization/classification; it is **not** required if you call hosted APIs (OpenAI, Anthropic, etc.) from the backend instead.

### APIs and external services (budget + keys, not “campus GPU”)

- **LinkedIn / identity:** plan for **official** flows where possible; budget for any **vendor search** or **LLM** API you use for extraction/summarization.  
- **GitHub:** **public REST API** (rate limits apply; fine for MVP).  
- **Web discovery:** a **search API** (e.g. provider with programmatic access) plus strict **confirmation UX**; avoid unbounded scraping.

### When to ask course partners for **extra** resources

Request **additional credits or GPU** only if you commit to one of these:

- Large-scale **fine-tuning** or batch GPU inference on proprietary datasets, or  
- Heavy **video / multimodal** processing, or  
- Running your **own** large open models 24/7 instead of using Workers AI / hosted APIs.

For the scope described in this doc (grounded personal sites + structured editor + static export), **DO + Cloudflare defaults are usually sufficient**; call out expansion only if you expand into training or high-volume crawling.

### One-line summary for the form

> **MVP:** static frontend + small DO backend for uploads and API orchestration; optional Cloudflare Workers for edge and secrets; LLM/search as paid APIs. **GPU / extra quota:** only if we add custom model training or large-scale crawling beyond bounded search-with-confirmation.

---

## References

- UI UX Pro Max (design skill for implementation time): [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)  
- Course infra mentions: **DigitalOcean** student credits, **Cloudflare for Startups** (Workers AI and broader Cloudflare stack).
