"""
Agent 5: Report Generator
Compiles all agent outputs into a structured final recommendation.
Also generates a human-readable summary paragraph.
"""
import json
import httpx
from backend.config import settings
from backend.agents.se_analysis import call_openrouter


REPORT_SYSTEM_PROMPT = """You are an FDA regulatory affairs expert writing a structured predicate device recommendation.

Given the analysis results, produce:
1. A recommended primary predicate device
2. A brief narrative summary (3-4 sentences) explaining the recommendation
3. Key risks and required testing
4. Alternative predicates if primary is weak

Respond ONLY with valid JSON. No text outside JSON."""


async def run_report_generator(
    device_description: str,
    indications_for_use: str,
    classification: dict,
    candidates: list[dict],
    chains: dict,
    se_analyses: list[dict]
) -> dict:
    """Generate the final structured report."""

    # Build context summary for LLM
    context = {
        "classification": classification,
        "top_candidates_count": len(candidates),
        "se_analyses": [
            {
                "k_number": a.get('candidate_k_number'),
                "name": a.get('candidate_name'),
                "score": a.get('se_likelihood_score'),
                "recommendation": a.get('recommendation'),
                "reasoning": a.get('recommendation_reasoning', '')[:200]
            }
            for a in se_analyses[:3]
        ]
    }

    prompt = f"""Device: {device_description}
IFU: {indications_for_use}

Analysis Context:
{json.dumps(context, indent=2)}

Generate a final predicate recommendation report with:
- recommended_predicate_k_number
- recommended_predicate_name
- narrative_summary (3-4 sentences)
- confidence_level (high/medium/low)
- key_risks (list of strings)
- required_testing (list of strings)
- alternative_predicates (list of k_numbers)
- predicate_candidates (list of objects with k_number, name, se_score)"""

    messages = [
        {"role": "system", "content": REPORT_SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ]

    raw = await call_openrouter(messages)

    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        report = json.loads(raw)
    except json.JSONDecodeError:
        # Fallback to structured data from se_analyses
        best = se_analyses[0] if se_analyses else {}
        report = {
            "recommended_predicate_k_number": best.get('candidate_k_number', 'N/A'),
            "recommended_predicate_name": best.get('candidate_name', 'N/A'),
            "narrative_summary": "Analysis complete. See SE analysis for details.",
            "confidence_level": "medium",
            "key_risks": best.get('safety_concerns', []),
            "required_testing": best.get('additional_testing_required', []),
            "alternative_predicates": [a.get('candidate_k_number') for a in se_analyses[1:3]],
            "predicate_candidates": [
                {"k_number": a.get('candidate_k_number'), "name": a.get('candidate_name'), "se_score": a.get('se_likelihood_score')}
                for a in se_analyses
            ]
        }

    return report
