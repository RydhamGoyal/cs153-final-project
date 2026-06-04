"""
Evaluation: test the system's ability to identify correct predicate devices.

Methodology:
1. Use predicate_edges table (high-confidence, PDF-extracted) as ground truth
2. For each device K_i with known predicate K_p:
   - Feed K_i's device_name + product_code into our pipeline
   - Check if K_p appears in top-1, top-3, top-5 recommended predicates
3. Report: Top-1, Top-3, Top-5 accuracy + mean reciprocal rank (MRR)

This is the evaluation section you show in your video and README.
It demonstrates rigorous validation against real FDA data.
"""
import sqlite3
import asyncio
import json
from tqdm import tqdm

DB_PATH = "data/db/510k.db"
EVAL_RESULTS_PATH = "data/eval/evaluation_results.json"

import sys
sys.path.insert(0, '.')
from backend.pipeline import run_pipeline


async def run_evaluation(n_samples: int = 100):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get high-confidence predicate pairs where we have device info for both
    cursor.execute("""
        SELECT pe.k_number, pe.predicate_k_number,
               d.device_name, d.product_code
        FROM predicate_edges pe
        JOIN devices d ON pe.k_number = d.k_number
        JOIN devices d2 ON pe.predicate_k_number = d2.k_number
        WHERE pe.confidence = 'high'
        AND d.decision_code = 'SESE'
        ORDER BY RANDOM()
        LIMIT ?
    """, (n_samples,))

    eval_pairs = [dict(row) for row in cursor.fetchall()]
    conn.close()

    print(f"Running evaluation on {len(eval_pairs)} device pairs...")

    results = []
    for pair in tqdm(eval_pairs, desc="Evaluating"):
        device_description = f"Device: {pair['device_name']}"
        indications = f"Similar to existing cleared {pair['product_code']} devices"

        try:
            result = await run_pipeline(
                device_description=device_description,
                indications_for_use=indications,
                _skip_finetuned=True  # use base model for evaluation
            )

            recommended = result.get('recommendation', {}).get('predicate_candidates', [])
            recommended_k_numbers = [r.get('k_number', '').upper() for r in recommended[:5]]

            true_predicate = pair['predicate_k_number'].upper()

            hit_at_1 = true_predicate in recommended_k_numbers[:1]
            hit_at_3 = true_predicate in recommended_k_numbers[:3]
            hit_at_5 = true_predicate in recommended_k_numbers[:5]

            rank = None
            for i, k in enumerate(recommended_k_numbers):
                if k == true_predicate:
                    rank = i + 1
                    break

            results.append({
                'k_number': pair['k_number'],
                'true_predicate': true_predicate,
                'recommended': recommended_k_numbers,
                'hit@1': hit_at_1,
                'hit@3': hit_at_3,
                'hit@5': hit_at_5,
                'rank': rank,
            })
        except Exception as e:
            print(f"  Error for {pair['k_number']}: {e}")
            continue

    if not results:
        print("No evaluation results.")
        return

    hit_at_1 = sum(r['hit@1'] for r in results) / len(results)
    hit_at_3 = sum(r['hit@3'] for r in results) / len(results)
    hit_at_5 = sum(r['hit@5'] for r in results) / len(results)
    ranks = [r['rank'] for r in results if r['rank'] is not None]
    mrr = sum(1/r for r in ranks) / len(results) if ranks else 0

    metrics = {
        'n_evaluated': len(results),
        'hit@1': round(hit_at_1 * 100, 1),
        'hit@3': round(hit_at_3 * 100, 1),
        'hit@5': round(hit_at_5 * 100, 1),
        'mrr': round(mrr, 3),
        'results': results
    }

    import os
    os.makedirs("data/eval", exist_ok=True)
    with open(EVAL_RESULTS_PATH, 'w') as f:
        json.dump(metrics, f, indent=2)

    print(f"\n{'='*50}")
    print(f"EVALUATION RESULTS (n={len(results)})")
    print(f"{'='*50}")
    print(f"Top-1 Accuracy:  {metrics['hit@1']}%")
    print(f"Top-3 Accuracy:  {metrics['hit@3']}%")
    print(f"Top-5 Accuracy:  {metrics['hit@5']}%")
    print(f"MRR:             {metrics['mrr']}")
    print(f"\nFull results saved to {EVAL_RESULTS_PATH}")


if __name__ == "__main__":
    asyncio.run(run_evaluation(n_samples=100))
