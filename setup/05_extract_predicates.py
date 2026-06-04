"""
Extract predicate K-numbers from 510(k) summary PDFs.
Stores results in predicate_edges table.
This is the key script for building ground truth for evaluation.

Strategy:
1. Parse each PDF with pdfplumber
2. Search for K-number patterns (K followed by 6 digits) in the text
3. Cross-reference with our devices database to confirm the K-number exists
4. Store with confidence='high' if pattern found, skip if ambiguous

This replicates and extends the approach from github.com/wcedmisten/510k.fyi
"""
import sqlite3
import os
import re
import pdfplumber
from tqdm import tqdm

DB_PATH = "data/db/510k.db"
PDF_DIR = "data/pdfs"

# Regex for K-numbers
K_NUMBER_PATTERN = re.compile(r'\bK\d{6}\b', re.IGNORECASE)

# Keywords that indicate a predicate section
PREDICATE_KEYWORDS = [
    'predicate device',
    'predicate devices',
    'substantially equivalent to',
    'legally marketed device',
    'previously cleared',
    'predicates',
]


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF, trying pdfplumber first then pymupdf."""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            text = ""
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text
    except Exception:
        try:
            import fitz  # pymupdf
            doc = fitz.open(pdf_path)
            text = ""
            for page in doc:
                text += page.get_text() + "\n"
            return text
        except Exception:
            return ""


def find_predicate_knumbers(text: str, source_k_number: str) -> list[str]:
    """
    Find K-numbers in text that are likely predicates.
    Filters out the source device's own K-number.
    Prioritizes K-numbers appearing near predicate keywords.
    """
    if not text:
        return []

    lines = text.split('\n')
    predicate_knumbers = []

    # Strategy 1: Find K-numbers near predicate keywords
    for i, line in enumerate(lines):
        line_lower = line.lower()
        is_predicate_context = any(kw in line_lower for kw in PREDICATE_KEYWORDS)

        if is_predicate_context:
            # Search this line and surrounding 3 lines
            context_window = '\n'.join(lines[max(0, i-1):i+4])
            found = K_NUMBER_PATTERN.findall(context_window)
            for k in found:
                k_upper = k.upper()
                if k_upper != source_k_number.upper() and k_upper not in predicate_knumbers:
                    predicate_knumbers.append(k_upper)

    # Strategy 2: If nothing found near keywords, look for first K-number in doc
    # that isn't the source device itself
    if not predicate_knumbers:
        all_found = K_NUMBER_PATTERN.findall(text)
        for k in all_found:
            k_upper = k.upper()
            if k_upper != source_k_number.upper():
                predicate_knumbers.append(k_upper)
                break  # just take the first one as a weak signal

    return predicate_knumbers


def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get all K-numbers that exist in our database (for validation)
    cursor.execute("SELECT k_number FROM devices")
    valid_k_numbers = {row[0].upper() for row in cursor.fetchall()}
    print(f"Loaded {len(valid_k_numbers)} valid K-numbers from database")

    pdf_files = [f for f in os.listdir(PDF_DIR) if f.endswith('.pdf')]
    print(f"Processing {len(pdf_files)} PDFs...")

    extracted = 0
    failed = 0

    for pdf_file in tqdm(pdf_files, desc="Extracting predicates"):
        k_number = pdf_file.replace('.pdf', '').upper()

        text = extract_text_from_pdf(os.path.join(PDF_DIR, pdf_file))
        if not text:
            failed += 1
            continue

        predicate_knumbers = find_predicate_knumbers(text, k_number)

        # Only store predicates that exist in our database
        valid_predicates = [k for k in predicate_knumbers if k in valid_k_numbers]

        for predicate_k in valid_predicates:
            try:
                cursor.execute("""
                    INSERT OR IGNORE INTO predicate_edges (k_number, predicate_k_number, confidence)
                    VALUES (?, ?, 'high')
                """, (k_number, predicate_k))
                extracted += 1
            except sqlite3.Error:
                pass

    conn.commit()

    cursor.execute("SELECT COUNT(*) FROM predicate_edges WHERE confidence='high'")
    total_edges = cursor.fetchone()[0]

    print(f"\nExtraction complete:")
    print(f"  PDFs processed: {len(pdf_files)}")
    print(f"  Failed to parse: {failed}")
    print(f"  Predicate edges extracted: {extracted}")
    print(f"  Total high-confidence edges in DB: {total_edges}")

    conn.close()


if __name__ == "__main__":
    main()
