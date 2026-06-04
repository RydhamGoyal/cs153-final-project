"""
Download FDA Device Classification database.
Maps product codes to device class, regulation number, and advisory committee.
Source: https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPCD/classification.cfm
We use the downloadable file from FDA's website.
"""
import requests
import sqlite3
import io
import zipfile
from tqdm import tqdm

DB_PATH = "data/db/510k.db"

# FDA publishes a downloadable product code classification file
PRODUCT_CODE_URL = "https://www.accessdata.fda.gov/premarket/ftparea/foiclass.zip"


def download_and_import_product_codes():
    print("Downloading FDA product code classification database...")
    response = requests.get(PRODUCT_CODE_URL, timeout=120)
    response.raise_for_status()

    # The ZIP contains foiclass.txt (pipe-delimited)
    with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
        with zf.open('foiclass.txt') as f:
            content = f.read().decode('latin-1')

    lines = content.strip().split('\n')
    print(f"Found {len(lines)} product code records")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    batch = []
    for line in tqdm(lines[1:], desc="Importing product codes"):  # skip header
        fields = line.split('|')
        if len(fields) < 5:
            continue
        # Fields: PRODUCTCODE, DEVICENAME, DEVICECLASS, REGULATIONNUMBER, REVIEWPANEL
        batch.append((
            fields[0].strip(),   # product_code
            fields[1].strip(),   # device_name
            fields[2].strip(),   # device_class (I, II, III)
            fields[3].strip(),   # regulation_number
            fields[4].strip(),   # advisory_committee
        ))

    cursor.executemany("""
        INSERT OR REPLACE INTO product_codes
        (product_code, device_name, device_class, regulation_number, advisory_committee)
        VALUES (?,?,?,?,?)
    """, batch)

    conn.commit()
    cursor.execute("SELECT COUNT(*) FROM product_codes")
    print(f"Product codes imported: {cursor.fetchone()[0]}")
    conn.close()


if __name__ == "__main__":
    download_and_import_product_codes()
