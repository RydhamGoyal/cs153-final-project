# Project summary (draft)

Stuff I can reuse when writing updates; not meant to be fancy.

## Idea

**LinkedIn → Launch Site:** take LinkedIn-ish profile data plus optional resume, optional GitHub, and optional other links, merge into something structured, and spit out a **personal landing page** you can host as static files (thinking GitHub Pages). Big difference from a generic chat builder is a **fixed editor** (sections, themes, fields) so you’re not re-explaining the whole product every time.

## Where I’m at

Right now it’s a **working React/Vite app**: types for profile + site layout, sample data, home + workspace routes, live preview, reorder/hide sections, two themes, edit a few headline fields, paste JSON with basic validation, copy a generated `<head>` snippet. The messy parts—real LinkedIn integration, PDF parsing, crawling other URLs, LLM “rewrite this section,” auto-deploy—are still ahead.

## Next up

- Ingestion: LinkedIn + resume + GitHub + arbitrary links → one merged model with sane conflict handling.  
- Nicer templates and polish (see `NEXT_STEPS.md`).  
- Real static export / Pages flow when the generator exists.

## Repo

- https://github.com/RydhamGoyal/cs153-final-project  
- SSH: `git@github.com:RydhamGoyal/cs153-final-project.git`  

Repo root = this app (not nested inside a bigger monorepo).
