"""
Agent 4: Substantial Equivalence Analysis Agent
The intellectually complex agent — uses LLM to analyze SE between a new device and candidates.
If a fine-tuned model is available (served locally via ollama), uses that.
Otherwise uses OpenRouter.
"""
import json
import httpx
from backend.config import settings
from backend.db import get_device


SE_ANALYSIS_SYSTEM_PROMPT = """You are a senior FDA regulatory affairs specialist with 20+ years of experience in 510(k) submissions.

Your task is to analyze whether a new medical device is "substantially equivalent" to a predicate device under 21 CFR 807.87(f).

The FDA's substantial equivalence standard requires:
1. Same intended use as the predicate, OR
2. Different intended use but does not raise new types of safety/effectiveness questions AND does not alter intended use

AND

3. Same technological characteristics as the predicate, OR
4. Different technological characteristics that do not raise different questions of safety/effectiveness AND device is at least as safe/effective as predicate

Respond ONLY with a valid JSON object in this exact format:
{
  "same_intended_use": true/false,
  "same_intended_use_explanation": "...",
  "same_technological_characteristics": true/false,
  "technological_differences": ["difference 1", "difference 2"],
  "raises_safety_questions": true/false,
  "safety_concerns": ["concern 1"],
  "additional_testing_required": ["test 1", "test 2"],
  "se_likelihood_score": 0-100,
  "recommendation": "strong|viable|weak|not_recommended",
  "recommendation_reasoning": "..."
}

Do not include any text outside the JSON object. Be precise and cite specific regulatory standards where relevant.
The se_likelihood_score must reflect actual similarity — do not default to the same score for every candidate. A device with identical technology should score 90+. Minor differences score 70-85. Significant differences score 40-69. Incompatible devices score below 40."""


SE_ANALYSIS_PROMPT_TEMPLATE = """Analyze substantial equivalence for this new device versus the candidate predicate:

=== NEW DEVICE ===
Description: {device_description}
Indications for Use: {indications_for_use}
Product Code: {product_code}

=== CANDIDATE PREDICATE ===
K-Number: {predicate_k}
Device Name: {predicate_name}
Applicant: {predicate_applicant}
Decision Date: {predicate_date}
Product Code: {predicate_product_code}
{predicate_description_section}

Provide a rigorous substantial equivalence analysis."""


async def call_openrouter(messages: list[dict], model: str = None) -> str:
    """Call OpenRouter API. Returns response text."""
    if model is None:
        model = settings.default_model

    async with httpx.AsyncClient(timeout=90) as client:
        response = await client.post(
            f"{settings.openrouter_base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://github.com/510k-navigator",
                "X-Title": "510k-navigator"
            },
            json={
                "model": model,
                "messages": messages,
                "temperature": 0.1,
                "max_tokens": 1000
            }
        )
        response.raise_for_status()
        data = response.json()
        return data['choices'][0]['message']['content'].strip()


async def call_finetuned(messages: list[dict]) -> str:
    """
    Call the fine-tuned Qwen2.5-7B + LoRA adapter served on Modal (OpenAI-compatible).
    Raises on any failure so the caller can fall back to OpenRouter.
    """
    if not settings.modal_endpoint_url:
        raise RuntimeError("Fine-tuned endpoint not configured")

    base = settings.modal_endpoint_url.rstrip("/")
    # Generous timeout: the first request after idle pays a cold start while the
    # container loads the 7B model. The caller falls back if this is exceeded.
    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.post(
            f"{base}/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.modal_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.finetuned_model_name,
                "messages": messages,
                "temperature": 0.1,
                "max_tokens": 1000,
            }
        )
        response.raise_for_status()
        data = response.json()
        return data['choices'][0]['message']['content'].strip()


async def call_model(messages: list[dict], model_mode: str) -> tuple[str, str]:
    """
    Dispatch to the requested model. Returns (response_text, model_actually_used).
    When 'finetuned' is requested but unavailable (not configured, cold-start timeout,
    credits exhausted), transparently falls back to OpenRouter so the app never breaks.
    """
    if model_mode == "finetuned":
        try:
            return await call_finetuned(messages), "finetuned"
        except Exception:
            return await call_openrouter(messages), "openrouter_fallback"
    return await call_openrouter(messages), "openrouter"


async def analyze_se(
    device_description: str,
    indications_for_use: str,
    product_code: str,
    predicate: dict,
    model_mode: str = "openrouter",
) -> dict:
    """Analyze SE between new device and one predicate candidate."""

    predicate_description_section = ""
    if predicate.get('description_text'):
        predicate_description_section = f"Description excerpt:\n{predicate['description_text'][:1500]}"

    prompt = SE_ANALYSIS_PROMPT_TEMPLATE.format(
        device_description=device_description,
        indications_for_use=indications_for_use,
        product_code=product_code,
        predicate_k=predicate.get('k_number', 'Unknown'),
        predicate_name=predicate.get('device_name', 'Unknown'),
        predicate_applicant=predicate.get('applicant', 'Unknown'),
        predicate_date=predicate.get('decision_date', 'Unknown'),
        predicate_product_code=predicate.get('product_code', 'Unknown'),
        predicate_description_section=predicate_description_section
    )

    messages = [
        {"role": "system", "content": SE_ANALYSIS_SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ]

    raw, model_used = await call_model(messages, model_mode)

    # Clean JSON
    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        analysis = json.loads(raw)
    except json.JSONDecodeError:
        analysis = {
            "same_intended_use": False,
            "same_intended_use_explanation": "Analysis failed to parse.",
            "same_technological_characteristics": False,
            "technological_differences": [],
            "raises_safety_questions": True,
            "safety_concerns": [],
            "additional_testing_required": [],
            "se_likelihood_score": 0,
            "recommendation": "weak",
            "recommendation_reasoning": "Parse error"
        }

    analysis['candidate_k_number'] = predicate.get('k_number', '')
    analysis['candidate_name'] = predicate.get('device_name', '')
    analysis['_model_used'] = model_used
    return analysis


def _resolve_model_used(results: list[dict]) -> str:
    """Collapse the per-candidate model tags into one status for the UI."""
    tags = {r.get('_model_used') for r in results}
    if "finetuned" in tags:
        return "finetuned"
    if "openrouter_fallback" in tags:
        return "openrouter_fallback"
    return "openrouter"


async def run_se_analysis_agent(
    device_description: str,
    indications_for_use: str,
    product_code: str,
    candidates: list[dict],
    top_n: int = 3,
    model_mode: str = "openrouter",
) -> tuple[list[dict], str]:
    """Run SE analysis for top N candidates. Returns (results, model_used)."""
    import asyncio
    top_candidates = candidates[:top_n]

    # Enrich with full device info
    enriched = []
    for c in top_candidates:
        device = await get_device(c['k_number'])
        if device:
            enriched.append({**c, **device})
        else:
            enriched.append(c)

    # Run SE analysis concurrently
    tasks = [
        analyze_se(device_description, indications_for_use, product_code, candidate, model_mode)
        for candidate in enriched
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Filter out exceptions
    valid_results = [r for r in results if isinstance(r, dict)]
    model_used = _resolve_model_used(valid_results)

    # Strip the internal tag before returning to the client
    for r in valid_results:
        r.pop('_model_used', None)

    # Sort by se_likelihood_score descending
    valid_results.sort(key=lambda x: x.get('se_likelihood_score', 0), reverse=True)

    return valid_results, model_used
