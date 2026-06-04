"""
Fetch 510(k) OCR markdown text from the Innolitics FDA Device Explorer API.
Replaces the PDF scraping + predicate extraction pipeline (scripts 04 + 05).

For each K-number in the devices table this script:
  1. Calls GET /api/v1/devices/{k_number}
  2. Extracts markdown_content from the best available document
  3. Stores it in devices.description_text
  4. Runs the predicate K-number regex over the text → populates predicate_edges

Rate-limited to 1 request/second to stay within API credit budget.
Skips K-numbers that already have description_text populated.
Commits to SQLite every 50 records so progress survives interruption.

Usage:
    python setup/04_fetch_innolitics.py           # default: 3000 devices
    python setup/04_fetch_innolitics.py --limit 500
    python setup/04_fetch_innolitics.py --all      # every K-number (slow)

Requires INNOLITICS_API_KEY in .env
"""
import sqlite3
import os
import re
import time
import argparse
import requests
from tqdm import tqdm
from dotenv import load_dotenv

load_dotenv()

DB_PATH = "data/db/510k.db"
API_BASE = "https://fda.innolitics.com/api/v1"
RATE_LIMIT_SECS = 1.0
COMMIT_EVERY = 50

K_NUMBER_PATTERN = re.compile(r'\bK\d{6}\b', re.IGNORECASE)
PREDICATE_KEYWORDS = [
    'predicate device',
    'predicate devices',
    'substantially equivalent to',
    'legally marketed device',
    'previously cleared',
    'predicates',
    'primary predicate',
]


def get_api_key() -> str:
    key = os.getenv("INNOLITICS_API_KEY", "")
    if not key:
        raise RuntimeError(
            "INNOLITICS_API_KEY not set. Add it to your .env file."
        )
    return key


def fetch_device(k_number: str, api_key: str) -> dict | None:
    """Call the device details endpoint. Returns parsed JSON or None on error."""
    url = f"{API_BASE}/devices/{k_number}"
    headers = {"Authorization": f"Bearer {api_key}"}
    try:
        resp = requests.get(url, headers=headers, timeout=30)
        if resp.status_code == 404:
            return None
        if resp.status_code == 429:
            # Respect rate limit — wait longer and retry once
            time.sleep(5)
            resp = requests.get(url, headers=headers, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except Exception:
        return None


def extract_markdown(data: dict) -> str | None:
    """
    Pull markdown_content from the best available document.
    Priority: summary > decision_summary. Only uses status='generated'.
    """
    docs = data.get("documents", [])
    # Prefer summary, then decision_summary
    for preferred_type in ("summary", "decision_summary"):
        for doc in docs:
            if (doc.get("document_type") == preferred_type
                    and doc.get("markdown_status") == "generated"
                    and doc.get("markdown_content")):
                return doc["markdown_content"]
    return None


def find_predicate_knumbers(text: str, source_k: str) -> list[str]:
    """
    Find K-numbers in text that are likely predicates.
    Strategy 1: K-numbers appearing near predicate keywords.
    Strategy 2: First K-number in the doc that isn't the source device.
    """
    lines = text.split('\n')
    predicate_knumbers: list[str] = []

    for i, line in enumerate(lines):
        line_lower = line.lower()
        if any(kw in line_lower for kw in PREDICATE_KEYWORDS):
            context = '\n'.join(lines[max(0, i - 1):i + 4])
            for k in K_NUMBER_PATTERN.findall(context):
                k_upper = k.upper()
                if k_upper != source_k.upper() and k_upper not in predicate_knumbers:
                    predicate_knumbers.append(k_upper)

    if not predicate_knumbers:
        for k in K_NUMBER_PATTERN.findall(text):
            k_upper = k.upper()
            if k_upper != source_k.upper():
                predicate_knumbers.append(k_upper)
                break

    return predicate_knumbers


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=3000,
                        help="Max number of devices to fetch (default: 3000)")
    parser.add_argument("--all", action="store_true",
                        help="Fetch all K-numbers (ignores --limit)")
    args = parser.parse_args()

    api_key = get_api_key()

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get valid K-numbers for cross-reference validation
    cursor.execute("SELECT k_number FROM devices")
    valid_k_numbers = {row[0].upper() for row in cursor.fetchall()}
    print(f"Loaded {len(valid_k_numbers)} K-numbers from database")

    # Select devices to fetch — SESE decisions, most recent first, skip already fetched
    limit_clause = "" if args.all else f"LIMIT {args.limit}"
    cursor.execute(f"""
        SELECT k_number FROM devices
        WHERE decision_code = 'SESE'
        AND (description_text IS NULL OR description_text = '')
        ORDER BY decision_date DESC
        {limit_clause}
    """)
    k_numbers = [row[0] for row in cursor.fetchall()]
    print(f"Fetching {len(k_numbers)} devices from Innolitics API...")
    print(f"Rate limit: {RATE_LIMIT_SECS}s/request → estimated {len(k_numbers) // 60} minutes\n")

    fetched = 0
    text_found = 0
    edges_added = 0
    errors = 0

    for i, k_number in enumerate(tqdm(k_numbers, desc="Fetching")):
        data = fetch_device(k_number, api_key)
        fetched += 1

        if data is None:
            errors += 1
        else:
            markdown = extract_markdown(data)

            if markdown:
                text_found += 1

                # Store up to 8000 chars — FAISS only uses the first 500 for embeddings,
                # but fine-tuning needs more context to capture SE analysis sections
                cursor.execute(
                    "UPDATE devices SET description_text = ? WHERE k_number = ? COLLATE NOCASE",
                    (markdown[:8000], k_number)
                )

                # Extract and store predicate edges
                predicates = find_predicate_knumbers(markdown, k_number)
                valid_predicates = [p for p in predicates if p in valid_k_numbers]

                for pred_k in valid_predicates:
                    try:
                        cursor.execute("""
                            INSERT OR IGNORE INTO predicate_edges
                            (k_number, predicate_k_number, confidence)
                            VALUES (?, ?, 'high')
                        """, (k_number.upper(), pred_k))
                        edges_added += 1
                    except sqlite3.Error:
                        pass

        # Commit every N records so progress is saved on interruption
        if (i + 1) % COMMIT_EVERY == 0:
            conn.commit()

        time.sleep(RATE_LIMIT_SECS)

    conn.commit()

    cursor.execute("SELECT COUNT(*) FROM devices WHERE description_text IS NOT NULL AND description_text != ''")
    total_with_text = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM predicate_edges WHERE confidence = 'high'")
    total_edges = cursor.fetchone()[0]
    conn.close()

    print(f"\nDone.")
    print(f"  Devices fetched:       {fetched}")
    print(f"  With markdown text:    {text_found}")
    print(f"  API errors / no data:  {errors}")
    print(f"  Predicate edges added: {edges_added}")
    print(f"  Total devices with text in DB:   {total_with_text}")
    print(f"  Total predicate edges in DB:     {total_edges}")


if __name__ == "__main__":
    main()
