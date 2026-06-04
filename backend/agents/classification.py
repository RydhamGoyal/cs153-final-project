"""
Agent 1: Classification Agent
Given a device description and IFU, determine:
- FDA product code
- Device class (I, II, III)
- Regulation number
- Advisory committee

Uses LLM when product code is ambiguous, SQL lookup when straightforward.
"""
import json
import httpx
from backend.config import settings
from backend.db import get_product_code_info


CLASSIFICATION_SYSTEM_PROMPT = """You are an FDA regulatory classification expert with deep knowledge of the 21 CFR medical device classification system.

Given a medical device description and its indications for use, determine the FDA product code, device class, regulation number, and advisory committee.

CRITICAL RULES:
- The product code MUST match the device's PRIMARY function. Do not use a code for a different device type.
- Before finalizing, ask yourself: "Does this product code describe a device with the same intended use as what I was given?"
- Common codes to know: DQA=pulse oximeter, IYO=ultrasound, FRN=glucose monitor, LZG=ECG, KZH=blood pressure monitor, FPA=infusion pump, GEI=surgical stapler, KWQ=ventilator, MRY=MRI, LMF=CT scanner
- If uncertain, set confidence to "medium" or "low" — do not guess a plausible-sounding but wrong code.

Respond ONLY with a JSON object:
{
  "product_code": "XXX",
  "device_class": "II",
  "regulation_number": "21 CFR XXX.XXXX",
  "advisory_committee": "cardiovascular",
  "advisory_committee_description": "Cardiovascular Devices",
  "confidence": "high",
  "reasoning": "Brief explanation confirming the product code matches the device function"
}

Do not include any text outside the JSON object."""


CLASSIFICATION_PROMPT_TEMPLATE = """Classify this medical device:

Device Description: {device_description}

Indications for Use: {indications_for_use}

Determine the FDA product code, device class, regulation number, and advisory committee."""


async def run_classification_agent(
    device_description: str,
    indications_for_use: str
) -> dict:
    """
    Classify a device using LLM + database lookup.
    Returns classification dict.
    """
    prompt = CLASSIFICATION_PROMPT_TEMPLATE.format(
        device_description=device_description,
        indications_for_use=indications_for_use
    )

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            f"{settings.openrouter_base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://github.com/510k-navigator",
                "X-Title": "510k-navigator"
            },
            json={
                "model": settings.default_model,
                "messages": [
                    {"role": "system", "content": CLASSIFICATION_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1,
                "max_tokens": 500
            }
        )
        response.raise_for_status()
        data = response.json()

    raw_content = data['choices'][0]['message']['content'].strip()

    # Clean JSON if wrapped in markdown code blocks
    if raw_content.startswith("```"):
        raw_content = raw_content.split("```")[1]
        if raw_content.startswith("json"):
            raw_content = raw_content[4:]
        raw_content = raw_content.strip()

    classification = json.loads(raw_content)

    # Enrich with database lookup
    if classification.get('product_code'):
        db_info = await get_product_code_info(classification['product_code'])
        if db_info:
            classification['device_class'] = db_info.get('device_class', classification.get('device_class'))
            classification['regulation_number'] = db_info.get('regulation_number', classification.get('regulation_number'))
            classification['db_device_name'] = db_info.get('device_name')
            classification['db_advisory_committee'] = db_info.get('advisory_committee')

    return classification
