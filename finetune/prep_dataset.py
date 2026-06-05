"""
Build fine-tuning dataset from description_text stored in the SQLite DB.

Strategy:
  Positive examples (5,515): confirmed FDA SE pairs where BOTH devices have
    description text, model sees real comparative signal on both sides.
  Negative examples (~2,000): cross-product-code pairings (devices from
    incompatible categories), teaches the model to discriminate, not just
    parrot "strong/85" for every input.

Without negatives, training on all-positive data produces a model that
always outputs "strong recommendation" regardless of input, worse than
the base model.
"""
import sqlite3
import json
import os
import random
from tqdm import tqdm

DB_PATH = "data/db/510k.db"
OUTPUT_PATH = "data/finetune_dataset.jsonl"
NEGATIVE_RATIO = 0.27   # ~2,000 negatives out of ~7,500 total
RANDOM_SEED = 42

INSTRUCTION = """You are an FDA regulatory specialist. Analyze the substantial equivalence between the new device and the candidate predicate device. Respond with a structured JSON analysis covering: intended use comparison, technological characteristics comparison, safety questions raised, additional testing required, SE likelihood score (0-100), and recommendation (strong/viable/weak/not_recommended)."""


def build_dataset():
    random.seed(RANDOM_SEED)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # ── Positive examples: both devices have real description text ────────────
    cursor.execute("""
        SELECT
            pe.k_number,
            pe.predicate_k_number,
            d1.device_name      AS device_name,
            d2.device_name      AS predicate_name,
            d1.product_code     AS product_code,
            d1.applicant,
            d2.decision_date    AS predicate_date,
            d1.description_text AS device_text,
            d2.description_text AS predicate_text
        FROM predicate_edges pe
        JOIN devices d1 ON pe.k_number           = d1.k_number
        JOIN devices d2 ON pe.predicate_k_number = d2.k_number
        WHERE pe.confidence = 'high'
          AND d1.description_text IS NOT NULL AND d1.description_text != ''
          AND d2.description_text IS NOT NULL AND d2.description_text != ''
        ORDER BY RANDOM()
    """)
    positives = [dict(r) for r in cursor.fetchall()]

    # ── Negative examples: cross-product-code pairings ────────────────────────
    # Sample device pool: devices with text, grouped by product code
    cursor.execute("""
        SELECT k_number, device_name, product_code, description_text
        FROM devices
        WHERE description_text IS NOT NULL AND description_text != ''
          AND decision_code = 'SESE'
          AND product_code IS NOT NULL
        ORDER BY RANDOM()
        LIMIT 6000
    """)
    pool = [dict(r) for r in cursor.fetchall()]
    conn.close()

    # Build negatives by pairing devices from different product codes
    n_negatives = int(len(positives) * NEGATIVE_RATIO)
    negatives = []
    by_code: dict = {}
    for d in pool:
        by_code.setdefault(d['product_code'], []).append(d)
    codes = [c for c, devs in by_code.items() if len(devs) >= 2]

    attempts = 0
    while len(negatives) < n_negatives and attempts < n_negatives * 10:
        attempts += 1
        c1, c2 = random.sample(codes, 2)
        dev  = random.choice(by_code[c1])
        pred = random.choice(by_code[c2])
        negatives.append({
            'k_number': dev['k_number'],
            'predicate_k_number': pred['k_number'],
            'device_name': dev['device_name'],
            'predicate_name': pred['device_name'],
            'product_code': dev['product_code'],
            'predicate_date': None,
            'device_text': dev['description_text'],
            'predicate_text': pred['description_text'],
            'is_negative': True,
        })

    print(f"Positive pairs:  {len(positives)}")
    print(f"Negative pairs:  {len(negatives)}")
    print(f"Total examples:  {len(positives) + len(negatives)}")

    # ── Build examples ────────────────────────────────────────────────────────
    examples = []

    for pair in tqdm(positives, desc="Positives"):
        device_excerpt   = (pair['device_text']   or '')[:1000]
        predicate_excerpt = (pair['predicate_text'] or '')[:1000]

        input_text = (
            f"New Device K-Number: {pair['k_number']}\n"
            f"Device Name: {pair['device_name']}\n"
            f"Product Code: {pair['product_code']}\n"
            f"Description: {device_excerpt}\n\n"
            f"Candidate Predicate K-Number: {pair['predicate_k_number']}\n"
            f"Predicate Name: {pair['predicate_name']}\n"
            f"Predicate Decision Date: {pair.get('predicate_date', 'N/A')}\n"
            f"Predicate Description: {predicate_excerpt}"
        )
        output = json.dumps({
            "same_intended_use": True,
            "same_intended_use_explanation": (
                f"{pair['device_name']} shares the same intended use as "
                f"{pair['predicate_name']}, FDA confirmed substantial equivalence."
            ),
            "same_technological_characteristics": True,
            "technological_differences": [],
            "raises_safety_questions": False,
            "safety_concerns": [],
            "additional_testing_required": [],
            "se_likelihood_score": 85,
            "recommendation": "strong",
            "recommendation_reasoning": (
                f"FDA cleared {pair['k_number']} as substantially equivalent to "
                f"{pair['predicate_k_number']}."
            )
        })
        examples.append({"instruction": INSTRUCTION, "input": input_text, "output": output})

    for pair in tqdm(negatives, desc="Negatives"):
        device_excerpt    = (pair['device_text']   or '')[:1000]
        predicate_excerpt = (pair['predicate_text'] or '')[:1000]

        input_text = (
            f"New Device K-Number: {pair['k_number']}\n"
            f"Device Name: {pair['device_name']}\n"
            f"Product Code: {pair['product_code']}\n"
            f"Description: {device_excerpt}\n\n"
            f"Candidate Predicate K-Number: {pair['predicate_k_number']}\n"
            f"Predicate Name: {pair['predicate_name']}\n"
            f"Predicate Decision Date: N/A\n"
            f"Predicate Description: {predicate_excerpt}"
        )
        score = random.randint(5, 25)
        output = json.dumps({
            "same_intended_use": False,
            "same_intended_use_explanation": (
                f"{pair['device_name']} and {pair['predicate_name']} serve "
                "different clinical purposes and patient populations."
            ),
            "same_technological_characteristics": False,
            "technological_differences": [
                "Different device category and operating principle",
                "Different target anatomy or physiological parameter",
            ],
            "raises_safety_questions": True,
            "safety_concerns": [
                "Incompatible intended use creates unacceptable risk if used as predicate"
            ],
            "additional_testing_required": [
                "Full clinical study required, predicate pathway not appropriate"
            ],
            "se_likelihood_score": score,
            "recommendation": "not_recommended",
            "recommendation_reasoning": (
                f"{pair['predicate_name']} is from a different product category "
                "and cannot serve as a valid predicate for this device."
            )
        })
        examples.append({"instruction": INSTRUCTION, "input": input_text, "output": output})

    random.shuffle(examples)

    os.makedirs(os.path.dirname(OUTPUT_PATH) if os.path.dirname(OUTPUT_PATH) else '.', exist_ok=True)
    with open(OUTPUT_PATH, 'w') as f:
        for ex in examples:
            f.write(json.dumps(ex) + '\n')

    print(f"\nDataset written: {len(examples)} examples → {OUTPUT_PATH}")


if __name__ == "__main__":
    build_dataset()
