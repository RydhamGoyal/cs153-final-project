# Data-build pipeline

These scripts reconstruct everything the app needs from public sources: the SQLite
database, the predicate graph, and the FAISS embedding index. You only need this if you
want to rebuild the data from scratch. Most people should just download the prebuilt
data bundle (see the root README, "Run locally"); it is the same output these scripts
produce.

Run everything from the repo root, with your `.env` filled in.

## Steps

| # | Script | What it does | Output |
|---|--------|--------------|--------|
| 1 | `01_download_data.sh` | Download the openFDA 510(k) bulk file and unzip it. | `data/raw/` |
| 2 | `02_import_to_db.py` | Import the JSON into SQLite (175,013 devices). | `data/db/510k.db` |
| 3 | `03_download_product_codes.py` | Add the FDA device-classification table (product code to class/regulation). | DB table |
| 4 | `04_fetch_innolitics.py` | For each device, fetch OCR text via the Innolitics API and extract cited predicate K-numbers. | `description_text` + `predicate_edges` |
| 5 | `06_build_embeddings.py` | Embed all device descriptions with `all-MiniLM-L6-v2` and build the FAISS index. | `data/embeddings/` |
| 6 | `07_run_evaluation.py` | Evaluate retrieval against ground-truth predicate pairs (Hit@k, MRR). | `data/eval/` |

That is the recommended path. Step 4 needs an `INNOLITICS_API_KEY` in `.env` and is
rate-limited to 1 request/second, so it is the slow part.

## Alternative for step 4 (no Innolitics key)

If you do not have an Innolitics key, the predicate graph can instead be built from FDA
summary PDFs:

- `04_scrape_pdfs.py` downloads 510(k) summary PDFs.
- `05_extract_predicates.py` parses them with `pdfplumber` and extracts cited K-numbers.

Note: direct FDA PDF access is now frequently blocked (HTTP 403). When that happens,
`05b_seed_predicates.py` seeds the `predicate_edges` table with a set of manually verified,
real predicate relationships so the graph and evaluation still have genuine data to work
with. Run `05b` after `05` if scraping returns few edges.

## Script reference

```
01_download_data.sh        openFDA bulk download + unzip
02_import_to_db.py         JSON to SQLite
03_download_product_codes.py  FDA classification table
04_fetch_innolitics.py     OCR text + predicate edges via Innolitics API   (recommended)
04_scrape_pdfs.py          download 510(k) summary PDFs                     (alternative)
05_extract_predicates.py   extract predicate K-numbers from PDFs            (alternative)
05b_seed_predicates.py     seed verified predicate edges when scraping is blocked
06_build_embeddings.py     build the FAISS index
07_run_evaluation.py       retrieval evaluation (Hit@k, MRR)
```
