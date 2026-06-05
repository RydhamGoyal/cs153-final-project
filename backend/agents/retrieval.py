"""
Agent 2: Candidate Retrieval Agent
Given a product code + device description, retrieve top candidate predicates.

Strategy:
1. SQL filter: get cleared devices matching the classified product code
2. FAISS semantic search: get top-50 most similar devices by description
3. Validate SQL results: if the SQL matches are semantically irrelevant to the
   description (avg similarity < threshold), the LLM classified the wrong product
   code, fall back to pure semantic search in that case.
4. When SQL is valid: use semantic scores to re-rank within the product-code set.
   Never mix in semantic-only devices from different product categories.
"""
from backend.db import get_devices_by_product_code, get_recall_history
from backend.embeddings import semantic_search

# If the average semantic similarity of SQL matches is below this, the product
# code is almost certainly wrong, use semantic search instead.
RELEVANCE_THRESHOLD = 0.25


async def run_retrieval_agent(
    product_code: str,
    device_description: str,
    indications_for_use: str,
    top_k: int = 10
) -> list[dict]:
    """
    Returns top candidate predicate devices.
    """
    # 1. Get cleared devices with this product code from SQL
    sql_candidates = await get_devices_by_product_code(product_code, limit=100)

    # 2. Semantic search over the full FAISS index
    query = f"{device_description} {indications_for_use}"
    semantic_candidates = semantic_search(query, top_k=50)

    # 3. Validate SQL candidates are actually relevant to the device description.
    # Check how many SQL matches appear in the semantic top-50 and their scores.
    sql_k_set = {c['k_number'].upper() for c in sql_candidates}
    sql_semantic_scores = [
        c['similarity_score'] for c in semantic_candidates
        if c['k_number'].upper() in sql_k_set
    ]
    avg_sql_semantic = (
        sum(sql_semantic_scores) / len(sql_semantic_scores)
        if sql_semantic_scores else 0.0
    )

    # SQL is trustworthy if it has results AND they overlap meaningfully with
    # the semantic results for this description.
    sql_is_relevant = bool(sql_candidates) and avg_sql_semantic >= RELEVANCE_THRESHOLD

    scored = {}

    if sql_is_relevant:
        # Product code is correct, SQL matches are the primary candidate set.
        # Semantic scores re-rank within that set only.
        for c in sql_candidates:
            k = c['k_number'].upper()
            scored[k] = {**c, 'sql_match': True, 'semantic_score': 0.0, 'composite_score': 0.6}

        for c in semantic_candidates:
            k = c['k_number'].upper()
            if k in scored:
                scored[k]['semantic_score'] = c['similarity_score']
                scored[k]['composite_score'] = 0.5 + (c['similarity_score'] * 0.5)
            # Intentionally ignore semantic-only results, they are from different
            # product categories and would pollute the candidate set.
    else:
        # Product code was wrong or returned irrelevant results, trust semantic entirely.
        for c in semantic_candidates:
            k = c['k_number'].upper()
            scored[k] = {**c, 'sql_match': False, 'composite_score': c['similarity_score']}

    # Fetch recall info for top candidates
    all_candidates = sorted(scored.values(), key=lambda x: x['composite_score'], reverse=True)
    top_candidates = all_candidates[:top_k]

    for c in top_candidates:
        recalls = await get_recall_history(c['k_number'])
        c['has_recall'] = len(recalls) > 0
        c['recall_count'] = len(recalls)

    return top_candidates
