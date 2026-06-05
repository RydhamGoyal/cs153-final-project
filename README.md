# Vera: FDA 510(k) Predicate Intelligence Platform

**Live: https://64-227-97-126.sslip.io**

Vera turns a plain-language description of a medical device into a complete FDA 510(k)
regulatory analysis (predicate recommendation, substantial-equivalence scoring against
21 CFR 807.87(f), and the device's full clearance genealogy back to 1976) in under 30
seconds. The same task takes a regulatory consultant days to weeks at $400-600/hr.

It runs on the complete openFDA 510(k) database (**175,013 cleared devices**) enriched
with **22,497 predicate relationships** reconstructed from real submission documents,
an agentic LLM pipeline, a domain-specialized fine-tuned model, and a live, navigable
rendering of the entire FDA regulatory citation graph.

---

## Motivation

Last summer I worked in the **Stanford Neurosurgery Department**, building generative
modeling pipelines to assess stroke risk. That research put me deep inside the world of
medical-device documentation, and I kept running into the FDA 510(k) clearance process
and the sheer inefficiency of it. To bring a device to market, a manufacturer must prove
it is "substantially equivalent" to a *predicate* device already cleared by the FDA.
Finding the right predicate is a manual slog: consultants billing hundreds of dollars an
hour read through a 175,000-device database and hundreds of pages of dense PDFs, and a
wrong choice means a rejected submission and months of delay.

I kept thinking there had to be a viable, intelligent solution to this, that the entire
process was begging to be turned into software. When CS 153 gave me the chance to run a
**one-person lab** and build an agentic system end to end, I took it as the opportunity
to finally deliver something I'd seen a real use case for firsthand.

**That is where Vera Labs was born.** *Vera* comes from the Latin for "true," which is
fitting, because the platform's entire job is to establish a verifiable *truth* about a
device: its real regulatory lineage, its genuine substantial equivalence, and the actual
chain of clearances it descends from. Not a guess, not a consultant's intuition, but a
traceable, evidence-backed answer grounded in 50 years of real FDA decisions.

---

## The problem, quantified

- A 510(k) submission takes **3 to 6 months**; predicate research alone is **2 to 4
  weeks** of consultant time.
- Consultants bill **$400-600/hr**; predicate discovery for a single device runs
  **$25,000 to $80,000**.
- A **wrong predicate means a rejected submission**, costing months of delay worth $200K+
  in opportunity cost and re-work.

There is no integrated, intelligent tool that does end-to-end predicate discovery,
equivalence analysis, and regulatory-lineage exploration in one place. Existing products
do text search, or QMS document management, or consulting, but not the actual reasoning.

---

## Three tools, one platform

| Tool | What it does |
|------|--------------|
| **Navigator** | Describe a device; a 5-agent LangGraph pipeline classifies it, retrieves candidate predicates, maps their ancestry, scores substantial equivalence against 21 CFR 807.87(f), and returns a structured recommendation with a required-testing checklist. A live model toggle switches the SE-analysis engine between Llama 3.3 70B and the fine-tuned Qwen2.5-7B. |
| **Predicate Network** | The entire FDA citation graph (10,123 connected devices, 11,791 edges) rendered live in the browser with a force-directed physics simulation on a raw canvas. A full-height **Network Intelligence** panel surfaces the most-cited hubs, 40-year "regulatory dynasties," and cross-category bridges, each with quantified economic impact. |
| **Device Database** | Every FDA-cleared device since 1976, searchable and filterable by name, applicant, product code, and class, each with full regulatory metadata and an expandable predicate ancestry chain. |

---

## System architecture

### The agentic pipeline (LangGraph)

The core is a **LangGraph `StateGraph`**: five specialized agents that each read from and
write to a shared, typed state object, run in sequence with full provenance.

1. **Classification.** An LLM identifies the FDA product code, device class (I/II/III),
   CFR regulation number, and advisory committee from the free-text description.
2. **Retrieval (hybrid and self-correcting).** SQL filters by exact product code, then
   FAISS performs semantic search over **171,463 sentence embeddings**
   (`all-MiniLM-L6-v2`, 384-dim, `IndexFlatIP`). A semantic-validation step catches a
   mis-classification: if SQL hits average cosine similarity < 0.25 against the query,
   the system flags the product code as wrong and falls back to pure semantic search.
   This is **autonomous error correction, with no human in the loop.**
3. **Chain Explorer.** A **recursive SQL CTE** walks the directed `predicate_edges` graph
   backward, hop by hop, mapping each candidate's full ancestry until it reaches a root
   device with no known predicate (often a device cleared in the late 1970s under the
   original 510(k) framework).
4. **SE Analysis.** Scores each candidate against the FDA's substantial-equivalence
   standard, emitting structured JSON with calibrated, rubric-enforced scores
   (90+ identical, 70 to 85 minor differences, 40 to 69 significant, under 40
   incompatible) to prevent score collapse. **This is the step the fine-tuned model
   serves.**
5. **Report Generator.** Synthesizes everything into a recommendation with a narrative
   summary, risk factors, and a required-testing checklist.

Per-agent timing metadata is captured and surfaced live in the UI.

### The data foundation

The full openFDA 510(k) database was imported into SQLite with compound indexes. The hard
part, and the part nobody else has, is the **predicate graph**: predicate relationships
are not in the structured data. They had to be reconstructed by OCR-parsing **10,000 real
510(k) submission PDFs** (via the Innolitics API) and extracting cited K-numbers, yielding
22,497 confirmed directed edges. All 171,463 device descriptions were embedded locally
with `all-MiniLM-L6-v2` for semantic retrieval.

### The Predicate Network visualization

The entire connected graph (~10k nodes, ~12k edges) is rendered **live in the browser**
on a raw HTML5 canvas (not SVG, not a library) because 10,000 DOM nodes is unusable.
A `d3-force` physics simulation (link springs, Barnes-Hut N-body repulsion, collision,
a custom boundary force) lets the graph self-organize; device categories emerge as visual
clusters from pure citation structure, and the most-cited predicates surface as hubs. All
hot-path state lives in refs (never React state) so the 60fps render loop and mouse
interaction never trigger re-renders. Nodes are batch-drawn by device class (4 fill calls
regardless of node count) with viewport culling.

The **Network Intelligence** panel computes, from the graph, insights no flat database
exposes:
- **Hubs:** the most-cited predicates in FDA history, with an estimated dollar value of
  the regulatory work they've collectively enabled.
- **Dynasties:** devices cleared before 1995 still cited as predicates today, the founding
  documents of entire device categories, with their decades-long citation span.
- **Bridges:** devices cited across the most distinct product categories, universal
  regulatory anchors connecting otherwise separate parts of the graph.

### The fine-tuned model

`Qwen2.5-7B-Instruct` fine-tuned via **QLoRA** (rank-16, 4-bit NF4, all 7 projection
modules) on **7,500 FDA-derived examples**: 5,515 confirmed positive SE pairs extracted
from real submissions, plus 2,000 synthetic cross-category negatives to prevent the model
from collapsing to "always equivalent." Trained on a Modal A10G GPU with LlamaFactory:
train loss **0.00108**, eval loss **0.00290**, 2,493 steps in 1h52m. The resulting adapter
is **154MB, 0.53% of the base model's parameters.**

It is served as an OpenAI-compatible **vLLM** endpoint on Modal (`finetune/modal_serve.py`),
scale-to-zero so it only costs compute when called. The Navigator's model toggle routes
the SE-analysis agent to it; if the endpoint is cold or unavailable, the app
**transparently falls back to OpenRouter** so it never breaks, and surfaces which model
actually served the request.

---

## Engineering highlights

- **Reconstructed a 22,497-edge regulatory graph** from unstructured PDFs via OCR, the
  data asset that makes everything else possible.
- **Autonomous self-correction** in retrieval: the system detects and fixes its own
  classification errors using embedding-space confidence.
- **10k-node force graph at interactive frame rates** in a browser, via raw-canvas batch
  rendering, viewport culling, and ref-based hot-path state.
- **End-to-end fine-tuning** from dataset construction to QLoRA training on cloud GPU to
  scale-to-zero vLLM serving with graceful degradation.
- **One-command production deploy** to a live HTTPS URL (Docker plus Caddy auto-TLS).

## Tech stack

LangGraph, FastAPI, FAISS, sentence-transformers, SQLite, OpenRouter (Llama 3.3 70B),
Qwen2.5-7B + QLoRA, LlamaFactory, Modal, vLLM, React 18, TypeScript, Vite, d3-force,
Framer Motion, Caddy, Docker.

---

## Running it

### Just open the live URL (recommended)

The link at the top works in any browser. No setup.

### Run locally

**Prerequisites:** Python 3.11+, Node.js 20+, ~600MB free disk for the DB and embeddings.

```bash
pip install -r requirements.txt
cd frontend && npm install && cd ..

cp .env.example .env          # add your OPENROUTER_API_KEY

# Get the data bundle (SQLite DB + FAISS index, ~306MB, too large for git)
# and unzip it at the repo root so data/db/510k.db and data/embeddings/ exist:
curl -L -o data-bundle.zip \
  https://github.com/RydhamGoyal/cs153-final-project/releases/download/data-v1/vera-data-bundle.zip
unzip -o data-bundle.zip && rm data-bundle.zip

bash start.sh                 # backend :8000 + frontend :5173
```

Open http://localhost:5173. To rebuild the data from scratch instead of downloading it,
the `setup/` scripts (`01_` through `07_`) reconstruct the database, predicate graph, and
FAISS index from the openFDA API (about 30 to 60 min).

### Deploy your own

See **[deploy/README.md](deploy/README.md)** for a 20-minute guide to a live HTTPS URL on
DigitalOcean. After setup it is one command: `bash deploy/deploy.sh <droplet-ip>`.

---

## Project layout

```
backend/    FastAPI app, LangGraph pipeline, 5 agents, FAISS + SQLite access
frontend/   React + Vite SPA (Navigator, Predicate Network, Device Database, About)
finetune/   QLoRA training (modal_train.py) + vLLM serving (modal_serve.py)
data/       SQLite DB + FAISS index (not in git, see "Run locally" for the data bundle)
setup/      One-time data-build pipeline (openFDA to DB to predicate graph to embeddings)
deploy/     Docker/Caddy deploy script + guide
```

## About

Designed and built by **Rydham Goyal** as a one-person lab for Stanford CS 153. The
architecture, domain research, predicate-graph reconstruction, fine-tuning dataset, and
system design are all original work. LLM inference uses OpenRouter-hosted Llama models and
a self-trained Qwen2.5-7B LoRA adapter.

## References

- openFDA Device API: https://open.fda.gov/apis/device/510k/
- FDA predicate selection guidance: https://www.fda.gov/medical-devices/premarket-notification-510k/how-find-and-effectively-use-predicate-devices
- Predicate analysis inspiration: https://github.com/wcedmisten/510k.fyi
