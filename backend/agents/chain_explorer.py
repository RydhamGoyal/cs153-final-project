"""
Agent 3: Predicate Chain Explorer
For each candidate predicate device, traverse its ancestry chain recursively.
This is the visually impressive part, shows the genealogy of device clearances.
Returns structured data for the frontend D3 visualization.
"""
from backend.db import get_predicate_chain, get_device


async def explore_predicate_chain(k_number: str, max_depth: int = 10) -> list[dict]:
    """
    Returns the full predicate chain as a list of nodes with depth info.
    Depth 0 = the candidate predicate itself
    Depth 1 = candidate's predicate
    Depth 2 = candidate's predicate's predicate
    ... and so on
    """
    chain = await get_predicate_chain(k_number, max_depth=max_depth)
    return chain


async def run_chain_explorer_agent(
    candidates: list[dict],
    max_candidates: int = 5
) -> dict[str, list[dict]]:
    """
    Build predicate chains for top N candidates.
    Returns dict: k_number -> list of chain nodes
    """
    chains = {}
    for candidate in candidates[:max_candidates]:
        k = candidate['k_number']
        chain = await explore_predicate_chain(k)
        chains[k] = chain

    return chains
