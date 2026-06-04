"""
Import openFDA 510k JSON into SQLite.
Creates tables: devices, recalls
Handles the nested JSON structure of openFDA exports.
"""
import json
import sqlite3
import glob
import os
from tqdm import tqdm

DB_PATH = "data/db/510k.db"

CREATE_DEVICES_TABLE = """
CREATE TABLE IF NOT EXISTS devices (
    k_number TEXT PRIMARY KEY,
    device_name TEXT,
    applicant TEXT,
    product_code TEXT,
    advisory_committee TEXT,
    advisory_committee_description TEXT,
    decision_code TEXT,
    decision_description TEXT,
    date_received TEXT,
    decision_date TEXT,
    statement_or_summary TEXT,
    clearance_type TEXT,
    third_party_flag TEXT,
    expedited_review_flag TEXT,
    regulation_number TEXT,
    device_class TEXT,
    description_text TEXT  -- populated later from PDFs
);
"""

CREATE_PREDICATE_EDGES_TABLE = """
CREATE TABLE IF NOT EXISTS predicate_edges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    k_number TEXT NOT NULL,
    predicate_k_number TEXT NOT NULL,
    confidence TEXT DEFAULT 'high',
    UNIQUE(k_number, predicate_k_number)
);
"""

CREATE_RECALLS_TABLE = """
CREATE TABLE IF NOT EXISTS recalls (
    recall_id TEXT PRIMARY KEY,
    k_number TEXT,
    product_description TEXT,
    reason_for_recall TEXT,
    recall_initiation_date TEXT,
    classification TEXT,
    status TEXT
);
"""

CREATE_PRODUCT_CODES_TABLE = """
CREATE TABLE IF NOT EXISTS product_codes (
    product_code TEXT PRIMARY KEY,
    device_name TEXT,
    device_class TEXT,
    regulation_number TEXT,
    advisory_committee TEXT
);
"""

CREATE_INDEXES = """
CREATE INDEX IF NOT EXISTS idx_devices_product_code ON devices(product_code);
CREATE INDEX IF NOT EXISTS idx_devices_decision_code ON devices(decision_code);
CREATE INDEX IF NOT EXISTS idx_devices_decision_date ON devices(decision_date);
CREATE INDEX IF NOT EXISTS idx_predicate_edges_k_number ON predicate_edges(k_number);
CREATE INDEX IF NOT EXISTS idx_predicate_edges_predicate ON predicate_edges(predicate_k_number);
CREATE INDEX IF NOT EXISTS idx_recalls_k_number ON recalls(k_number);
"""


def import_devices(conn: sqlite3.Connection):
    """Import 510k device records from openFDA JSON."""
    json_files = glob.glob("data/raw/device-510k*.json")
    if not json_files:
        raise FileNotFoundError("No device-510k*.json files found in data/raw/. Run 01_download_data.sh first.")

    cursor = conn.cursor()
    total_imported = 0

    for json_file in json_files:
        print(f"Importing {json_file}...")
        with open(json_file, 'r') as f:
            data = json.load(f)

        results = data.get('results', [])
        batch = []

        for record in tqdm(results, desc="Processing records"):
            openfda = record.get('openfda', {})
            batch.append((
                record.get('k_number', ''),
                record.get('device_name', ''),
                record.get('applicant', ''),
                record.get('product_code', ''),
                record.get('advisory_committee', ''),
                record.get('advisory_committee_description', ''),
                record.get('decision_code', ''),
                record.get('decision_description', ''),
                record.get('date_received', ''),
                record.get('decision_date', ''),
                record.get('statement_or_summary', ''),
                record.get('clearance_type', ''),
                record.get('third_party_flag', ''),
                record.get('expedited_review_flag', ''),
                openfda.get('regulation_number', [None])[0] if openfda.get('regulation_number') else None,
                openfda.get('device_class', [None])[0] if openfda.get('device_class') else None,
                None  # description_text — populated later from PDFs
            ))

        cursor.executemany("""
            INSERT OR REPLACE INTO devices
            (k_number, device_name, applicant, product_code, advisory_committee,
             advisory_committee_description, decision_code, decision_description,
             date_received, decision_date, statement_or_summary, clearance_type,
             third_party_flag, expedited_review_flag, regulation_number, device_class,
             description_text)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, batch)

        conn.commit()
        total_imported += len(batch)
        print(f"  Imported {len(batch)} records")

    print(f"\nTotal devices imported: {total_imported}")


def import_recalls(conn: sqlite3.Connection):
    """Import recall records from openFDA JSON."""
    json_files = glob.glob("data/raw/device-recall*.json")
    if not json_files:
        print("Warning: No recall files found, skipping.")
        return

    cursor = conn.cursor()
    total_imported = 0

    for json_file in json_files:
        print(f"Importing recalls from {json_file}...")
        with open(json_file, 'r') as f:
            data = json.load(f)

        results = data.get('results', [])
        batch = []

        for record in tqdm(results, desc="Processing recalls"):
            openfda = record.get('openfda', {})
            k_numbers = openfda.get('k_number', [])
            k_number = k_numbers[0] if k_numbers else None

            batch.append((
                record.get('recall_number', str(hash(str(record)))),
                k_number,
                record.get('product_description', ''),
                record.get('reason_for_recall', ''),
                record.get('recall_initiation_date', ''),
                record.get('classification', ''),
                record.get('status', '')
            ))

        cursor.executemany("""
            INSERT OR REPLACE INTO recalls
            (recall_id, k_number, product_description, reason_for_recall,
             recall_initiation_date, classification, status)
            VALUES (?,?,?,?,?,?,?)
        """, batch)

        conn.commit()
        total_imported += len(batch)

    print(f"Total recalls imported: {total_imported}")


def main():
    print(f"Creating database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)

    print("Creating tables...")
    conn.executescript(CREATE_DEVICES_TABLE)
    conn.executescript(CREATE_PREDICATE_EDGES_TABLE)
    conn.executescript(CREATE_RECALLS_TABLE)
    conn.executescript(CREATE_PRODUCT_CODES_TABLE)
    conn.executescript(CREATE_INDEXES)
    conn.commit()

    import_devices(conn)
    import_recalls(conn)

    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM devices")
    print(f"\nDatabase ready. Device count: {cursor.fetchone()[0]}")
    cursor.execute("SELECT COUNT(*) FROM recalls")
    print(f"Recall count: {cursor.fetchone()[0]}")

    conn.close()


if __name__ == "__main__":
    main()
