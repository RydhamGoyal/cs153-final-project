# Progress report (template)

Fill in the bracketed items, then paste into your submission form.

## 1. High-level idea (what you are building now)

**LinkedIn → Launch Site** is a guided product that turns a person’s LinkedIn-derived profile data and optional resume PDF into a **grounded, ready-to-publish personal landing page** with minimal free-form prompting. Users bring data through OAuth/API where permitted, with **explicit fallbacks** (paste sections, LinkedIn’s official export). A **structured customization workspace** lets them reorder sections, toggle blocks, edit fields, swap themes, and (later) regenerate specific sections. The target ship path is a **static site** with sensible SEO defaults (title, meta description, Open Graph) and **GitHub Pages** (or similar static hosting).

## 2. Current progress (2–3 sentences)

The repository now contains a **working frontend scaffold**: a typed `Profile` / `SiteState` model, a seeded sample profile, a two-route app (**overview** + **workspace**), a **live responsive preview** of the landing page, basic **section reordering and visibility toggles**, **two visual themes**, **field editing** for core copy, a **minimal JSON import** path for “bring your own profile object,” and an **SEO head snippet preview** with copy-to-clipboard. The LinkedIn connector, resume PDF ingestion, LLM-based regeneration, and automated static export/deploy pipeline are **intentionally not implemented yet**; the scaffold makes the product shape demoable for checkpoints.

## 3. What you plan to implement next

1. **Ingestion layer:** LinkedIn strategy (API/export/paste), resume PDF text extraction, and merging rules so the page stays **grounded** in source material.  
2. **Publishing:** deterministic static generation (per-user `index.html` + assets), optional **GitHub Action** to publish `dist/` to Pages, and clearer OG image handling per deployment URL.  
3. **Editor upgrades:** richer forms for nested experience bullets, drag-and-drop ordering, per-section “regenerate” with explicit citations/constraints, and theme expansion.

## 4. Link to your code

- **Repository:** https://github.com/RydhamGoyal/cs153-final-project  
- **Clone (SSH):** `git@github.com:RydhamGoyal/cs153-final-project.git`

The project root on GitHub **is** this app folder (Vite/React app at repo root, not a monorepo parent).

## 5. Compute / infrastructure needs

**Near-term (scaffold + light backend):** no GPU requirement. A small **VM or managed container** on DigitalOcean (App Platform or Droplet) is enough if you add a thin API for OAuth token exchange, file upload (resume), and optional LLM calls—well within typical **$250** student credits for development and modest traffic.

**If using LLMs for section regeneration:** prefer **hosted inference APIs** first (OpenAI/Anthropic/etc.) from that same small backend; request **Cloudflare Workers** (+ **Workers AI**) if you want edge-hosted orchestration, caching, and rate limiting. Workers AI fits **open-weight** models within the program’s Workers AI credit pool; if you need **custom fine-tuning or large batch GPU jobs**, note that explicitly and request an expansion.

**Not expected to need:** large persistent databases for v1 if the editor remains client-first and export is static JSON → HTML; a simple object store or GitHub-as-source-of-truth may suffice.
