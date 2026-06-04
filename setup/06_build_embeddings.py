"""
Build FAISS semantic search index over device descriptions.
Uses sentence-transformers for local embedding (no API cost).
Stores index + metadata pickle for fast retrieval at runtime.
"""
import sqlite3
import pickle
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from tqdm import tqdm
import os

DB_PATH = "data/db/510k.db"
FAISS_INDEX_PATH = "data/embeddings/devices.index"
FAISS_METADATA_PATH = "data/embeddings/devices_metadata.pkl"
BATCH_SIZE = 512
MODEL_NAME = "all-MiniLM-L6-v2"  # Fast, good quality, 384 dimensions


def build_search_string(row: dict) -> str:
    """
    Create a searchable text representation of a device.
    Combine device_name + product_code + advisory_committee + description_text.
    """
    parts = []
    if row.get('device_name'):
        parts.append(row['device_name'])
    if row.get('advisory_committee_description'):
        parts.append(row['advisory_committee_description'])
    if row.get('description_text'):
        parts.append(row['description_text'][:500])  # truncate long descriptions
    return ' | '.join(parts)


def main():
    os.makedirs("data/embeddings", exist_ok=True)

    print(f"Loading embedding model: {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Only index SE-cleared devices (decision_code = 'SESE')
    cursor.execute("""
        SELECT k_number, device_name, product_code,
               advisory_committee, advisory_committee_description,
               description_text, decision_date, applicant
        FROM devices
        WHERE decision_code = 'SESE'
        ORDER BY decision_date DESC
    """)
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()

    print(f"Building embeddings for {len(rows)} cleared devices...")

    # Build text representations
    texts = [build_search_string(row) for row in rows]
    k_numbers = [row['k_number'] for row in rows]

    # Embed in batches
    all_embeddings = []
    for i in tqdm(range(0, len(texts), BATCH_SIZE), desc="Embedding"):
        batch = texts[i:i+BATCH_SIZE]
        embeddings = model.encode(batch, convert_to_numpy=True, normalize_embeddings=True)
        all_embeddings.append(embeddings)

    embeddings_matrix = np.vstack(all_embeddings).astype('float32')
    print(f"Embeddings shape: {embeddings_matrix.shape}")

    # Build FAISS index (Inner Product for cosine similarity with normalized vectors)
    dimension = embeddings_matrix.shape[1]
    index = faiss.IndexFlatIP(dimension)
    index.add(embeddings_matrix)

    # Save
    faiss.write_index(index, FAISS_INDEX_PATH)
    with open(FAISS_METADATA_PATH, 'wb') as f:
        pickle.dump({'k_numbers': k_numbers, 'texts': texts, 'rows': rows}, f)

    print(f"\nFAISS index saved: {FAISS_INDEX_PATH}")
    print(f"Metadata saved: {FAISS_METADATA_PATH}")
    print(f"Total indexed devices: {index.ntotal}")


if __name__ == "__main__":
    main()
