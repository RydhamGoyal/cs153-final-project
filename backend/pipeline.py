"""
LangGraph state machine, orchestrates all 5 agents in sequence.
State flows: classify → retrieve → explore chains → analyze SE → generate report
Each step appends to processing_steps for frontend progress display.
"""
from typing import TypedDict, Annotated, Optional
from langgraph.graph import StateGraph, END
import operator
import time

from backend.agents.classification import run_classification_agent
from backend.agents.retrieval import run_retrieval_agent
from backend.agents.chain_explorer import run_chain_explorer_agent
from backend.agents.se_analysis import run_se_analysis_agent
from backend.agents.report_generator import run_report_generator


class PipelineState(TypedDict):
    # Inputs
    device_description: str
    indications_for_use: str
    model_mode: str           # "openrouter" | "finetuned"
    # Intermediate
    classification: dict
    candidates: list
    predicate_chains: dict
    se_analysis: list
    # Output
    recommendation: dict
    model_info: dict          # which model actually served the SE analysis
    # Metadata
    processing_steps: Annotated[list, operator.add]
    error: Optional[str]


async def classify_node(state: PipelineState) -> dict:
    start = time.time()
    classification = await run_classification_agent(
        state['device_description'],
        state['indications_for_use']
    )
    return {
        "classification": classification,
        "processing_steps": [{
            "step": "classification",
            "label": f"Classified as {classification.get('product_code', '?')}, {classification.get('advisory_committee_description', '')}",
            "duration_ms": int((time.time() - start) * 1000),
            "data": classification
        }]
    }


async def retrieve_node(state: PipelineState) -> dict:
    start = time.time()
    product_code = state['classification'].get('product_code', '')
    candidates = await run_retrieval_agent(
        product_code=product_code,
        device_description=state['device_description'],
        indications_for_use=state['indications_for_use'],
        top_k=10
    )
    return {
        "candidates": candidates,
        "processing_steps": [{
            "step": "retrieval",
            "label": f"Found {len(candidates)} candidate predicate devices",
            "duration_ms": int((time.time() - start) * 1000),
            "data": {"count": len(candidates)}
        }]
    }


async def explore_chains_node(state: PipelineState) -> dict:
    start = time.time()
    chains = await run_chain_explorer_agent(state['candidates'], max_candidates=5)
    total_nodes = sum(len(chain) for chain in chains.values())
    return {
        "predicate_chains": chains,
        "processing_steps": [{
            "step": "chain_exploration",
            "label": f"Mapped predicate ancestry chains ({total_nodes} historical devices traced)",
            "duration_ms": int((time.time() - start) * 1000),
            "data": {"chains": len(chains), "total_nodes": total_nodes}
        }]
    }


async def analyze_se_node(state: PipelineState) -> dict:
    start = time.time()
    se_analysis, model_used = await run_se_analysis_agent(
        device_description=state['device_description'],
        indications_for_use=state['indications_for_use'],
        product_code=state['classification'].get('product_code', ''),
        candidates=state['candidates'],
        top_n=3,
        model_mode=state.get('model_mode', 'openrouter'),
    )
    best_score = max((a.get('se_likelihood_score', 0) for a in se_analysis), default=0)
    model_label = {
        "finetuned": "fine-tuned Qwen2.5-7B",
        "openrouter_fallback": "Llama 3.3 70B (fine-tuned endpoint unavailable)",
        "openrouter": "Llama 3.3 70B",
    }.get(model_used, "Llama 3.3 70B")
    return {
        "se_analysis": se_analysis,
        "model_info": {"requested": state.get('model_mode', 'openrouter'), "used": model_used},
        "processing_steps": [{
            "step": "se_analysis",
            "label": f"Analyzed substantial equivalence via {model_label}, best match score: {best_score}/100",
            "duration_ms": int((time.time() - start) * 1000),
            "data": {"analyses_count": len(se_analysis), "best_score": best_score, "model_used": model_used}
        }]
    }


async def generate_report_node(state: PipelineState) -> dict:
    start = time.time()
    recommendation = await run_report_generator(
        device_description=state['device_description'],
        indications_for_use=state['indications_for_use'],
        classification=state['classification'],
        candidates=state['candidates'],
        chains=state['predicate_chains'],
        se_analyses=state['se_analysis']
    )
    return {
        "recommendation": recommendation,
        "processing_steps": [{
            "step": "report",
            "label": f"Recommended predicate: {recommendation.get('recommended_predicate_k_number', 'N/A')}",
            "duration_ms": int((time.time() - start) * 1000),
            "data": recommendation
        }]
    }


def build_pipeline():
    graph = StateGraph(PipelineState)
    graph.add_node("classify", classify_node)
    graph.add_node("retrieve", retrieve_node)
    graph.add_node("explore_chains", explore_chains_node)
    graph.add_node("analyze_se", analyze_se_node)
    graph.add_node("generate_report", generate_report_node)

    graph.set_entry_point("classify")
    graph.add_edge("classify", "retrieve")
    graph.add_edge("retrieve", "explore_chains")
    graph.add_edge("explore_chains", "analyze_se")
    graph.add_edge("analyze_se", "generate_report")
    graph.add_edge("generate_report", END)

    return graph.compile()


_pipeline = None

def get_pipeline():
    global _pipeline
    if _pipeline is None:
        _pipeline = build_pipeline()
    return _pipeline


async def run_pipeline(
    device_description: str,
    indications_for_use: str,
    model_mode: str = "openrouter",
) -> dict:
    """Main entry point. Returns the full analysis result."""
    pipeline = get_pipeline()

    initial_state: PipelineState = {
        "device_description": device_description,
        "indications_for_use": indications_for_use,
        "model_mode": model_mode,
        "classification": {},
        "candidates": [],
        "predicate_chains": {},
        "se_analysis": [],
        "recommendation": {},
        "model_info": {},
        "processing_steps": [],
        "error": None
    }

    result = await pipeline.ainvoke(initial_state)
    return result
