"""
Retrieval benchmark: does the retrieval agent surface the correct predicate?

Ground truth = the predicate_edges table (real, document-extracted predicate citations).
For each device with a known predicate, we run the actual hybrid retrieval agent (SQL
product-code filter + FAISS semantic search, exactly what the pipeline uses), exclude the
device itself, and check at what rank the true predicate appears among the candidates.

Reports Hit@1, Hit@3, Hit@5, Hit@10 and Mean Reciprocal Rank (MRR).
Note: the device's true product code is supplied directly here (i.e. assuming correct
classification), so this isolates retrieval quality. A single cited predicate is treated
as the only correct answer even though multiple valid predicates often exist, so these are
a conservative lower bound.

Run from the repo root:  python setup/08_eval_retrieval.py [n]
Writes data/eval/evaluation_results.json
"""
import sqlite3, json, os, sys, asyncio
sys.path.insert(0, '.')
from backend.embeddings import load_index
from backend.agents.retrieval import run_retrieval_agent

DB = "data/db/510k.db"
OUT = "data/eval/evaluation_results.json"
N = int(sys.argv[1]) if len(sys.argv) > 1 else 300
TOPK = 10


async def main():
    print("Loading FAISS index...")
    load_index()
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row

    def fetch(where):
        return conn.execute(f"""
            SELECT pe.k_number, pe.predicate_k_number, d.device_name, d.product_code
            FROM predicate_edges pe
            JOIN devices d  ON pe.k_number = d.k_number
            JOIN devices d2 ON pe.predicate_k_number = d2.k_number
            WHERE d.device_name IS NOT NULL AND d.device_name != ''
              AND d.product_code IS NOT NULL AND d.product_code != '' {where}
            ORDER BY RANDOM() LIMIT ?
        """, (N,)).fetchall()

    rows = fetch("AND pe.confidence = 'high'")
    if len(rows) < 50:
        rows = fetch("")
    print(f"Evaluating {len(rows)} device/predicate pairs through the retrieval agent...")

    h1 = h3 = h5 = h10 = 0
    rr = 0.0
    n = 0
    for r in rows:
        cands = await run_retrieval_agent(
            product_code=r["product_code"],
            device_description=r["device_name"],
            indications_for_use=r["device_name"],
            top_k=TOPK,
        )
        self_k = r["k_number"].upper()
        ks = [c["k_number"].upper() for c in cands if c["k_number"].upper() != self_k][:TOPK]
        target = r["predicate_k_number"].upper()
        n += 1
        if target in ks:
            rank = ks.index(target) + 1
            rr += 1.0 / rank
            h1 += rank <= 1
            h3 += rank <= 3
            h5 += rank <= 5
            h10 += rank <= 10

    metrics = {
        "n_evaluated": n,
        "hit@1": round(100 * h1 / n, 1),
        "hit@3": round(100 * h3 / n, 1),
        "hit@5": round(100 * h5 / n, 1),
        "hit@10": round(100 * h10 / n, 1),
        "mrr": round(rr / n, 3),
        "method": "Hybrid retrieval agent (SQL product-code filter + FAISS) vs predicate_edges ground truth",
    }
    os.makedirs("data/eval", exist_ok=True)
    json.dump(metrics, open(OUT, "w"), indent=2)

    print("\n" + "=" * 46)
    print(f"RETRIEVAL EVALUATION  (n={n})")
    print("=" * 46)
    print(f"Hit@1:  {metrics['hit@1']}%")
    print(f"Hit@3:  {metrics['hit@3']}%")
    print(f"Hit@5:  {metrics['hit@5']}%")
    print(f"Hit@10: {metrics['hit@10']}%")
    print(f"MRR:    {metrics['mrr']}")
    print(f"\nSaved to {OUT}")


if __name__ == "__main__":
    asyncio.run(main())
