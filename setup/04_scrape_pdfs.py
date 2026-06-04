"""
Download 510(k) summary PDFs for a subset of devices.
Focus on devices from 2010-2024 where a summary (not just statement) is available.
We target ~3000 PDFs for fine-tuning data + predicate extraction.
The PDF URL pattern is: https://www.accessdata.fda.gov/cdrh_docs/pdf{2-digit-year}/{K_NUMBER}.pdf
"""
import sqlite3
import requests
import os
import time
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor, as_completed

DB_PATH = "data/db/510k.db"
PDF_DIR = "data/pdfs"
MAX_PDFS = 3000
WORKERS = 8


def get_pdf_url(k_number: str) -> str:
    """Construct the FDA PDF URL for a given K-number."""
    # K-numbers look like K243854 (K + 2-digit year + 4 digits)
    # PDF URL: https://www.accessdata.fda.gov/cdrh_docs/pdf24/K243854.pdf
    year_digits = k_number[1:3]  # e.g., "24" from K243854
    return f"https://www.accessdata.fda.gov/cdrh_docs/pdf{year_digits}/{k_number}.pdf"


def download_pdf(k_number: str) -> bool:
    """Download a single PDF. Returns True if successful."""
    path = os.path.join(PDF_DIR, f"{k_number}.pdf")
    if os.path.exists(path):
        return True  # already downloaded

    url = get_pdf_url(k_number)
    try:
        response = requests.get(url, timeout=30)
        if response.status_code == 200 and len(response.content) > 1000:
            with open(path, 'wb') as f:
                f.write(response.content)
            return True
        return False
    except Exception:
        return False


def main():
    os.makedirs(PDF_DIR, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get devices from 2010+ with a summary (not statement) available
    # Focus on SE decisions to maximize useful training data
    cursor.execute("""
        SELECT k_number FROM devices
        WHERE decision_code = 'SESE'
        AND statement_or_summary LIKE '%SUMMARY%'
        AND CAST(SUBSTR(decision_date, 1, 4) AS INTEGER) >= 2010
        ORDER BY decision_date DESC
        LIMIT ?
    """, (MAX_PDFS,))

    k_numbers = [row[0] for row in cursor.fetchall()]
    conn.close()

    print(f"Attempting to download {len(k_numbers)} PDFs with {WORKERS} workers...")

    success_count = 0
    with ThreadPoolExecutor(max_workers=WORKERS) as executor:
        futures = {executor.submit(download_pdf, k): k for k in k_numbers}
        with tqdm(total=len(k_numbers)) as pbar:
            for future in as_completed(futures):
                if future.result():
                    success_count += 1
                pbar.update(1)
                pbar.set_postfix({'success': success_count})
                time.sleep(0.05)  # be polite to FDA servers

    print(f"\nDownloaded {success_count} PDFs to {PDF_DIR}/")


if __name__ == "__main__":
    main()
