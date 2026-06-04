"""
FAISS semantic search wrapper.
Loads the pre-built index at startup. Provides fast nearest-neighbor lookup.
"""
import faiss
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer
from typing import Optional
import os
from backend.config import settings

_index: Optional[faiss.IndexFlatIP] = None
_metadata: Optional[dict] = None
_model: Optional[SentenceTransformer] = None


def load_index():
    global _index, _metadata, _model
    if not os.path.exists(settings.faiss_index_path):
        print("WARNING: FAISS index not found. Run setup/06_build_embeddings.py first.")
        return False

    print("Loading FAISS index...")
    _index = faiss.read_index(settings.faiss_index_path)
    with open(settings.faiss_metadata_path, 'rb') as f:
        _metadata = pickle.load(f)
    _model = SentenceTransformer("all-MiniLM-L6-v2")
    print(f"FAISS index loaded: {_index.ntotal} devices indexed")
    return True


def semantic_search(query: str, top_k: int = 20) -> list[dict]:
    """
    Given a query string, return the top_k most similar devices.
    Returns list of dicts with k_number, similarity_score, and metadata.
    """
    if _index is None or _metadata is None or _model is None:
        return []

    query_embedding = _model.encode([query], convert_to_numpy=True, normalize_embeddings=True)
    query_embedding = query_embedding.astype('float32')

    scores, indices = _index.search(query_embedding, top_k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < 0:
            continue
        k_number = _metadata['k_numbers'][idx]
        results.append({
            'k_number': k_number,
            'similarity_score': float(score),
            'device_name': _metadata['rows'][idx].get('device_name', ''),
            'product_code': _metadata['rows'][idx].get('product_code', ''),
        })

    return results


def is_loaded() -> bool:
    return _index is not None
