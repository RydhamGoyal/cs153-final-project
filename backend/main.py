"""
FastAPI application.
Endpoints:
  POST /api/analyze          — main pipeline
  GET  /api/device/{k}       — device lookup
  GET  /api/chain/{k}        — predicate chain for a device
  GET  /api/eval/results     — load evaluation metrics
  GET  /api/health           — health check
"""
import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.config import settings
from backend.models import AnalyzeRequest, AnalyzeResponse, HealthResponse
from backend.pipeline import run_pipeline
from backend.embeddings import load_index, is_loaded
from backend.db import get_device, get_predicate_chain, get_device_count


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load resources on startup."""
    print("Loading FAISS index...")
    load_index()
    print("Startup complete.")
    yield


app = FastAPI(
    title="510(k) Predicate Device Navigator",
    description="Agentic FDA regulatory clearance pathway analysis",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/analyze")
async def analyze_device(request: AnalyzeRequest):
    """
    Main pipeline endpoint. Runs all 5 agents and returns full analysis.
    Typical latency: 15-40 seconds (5 LLM calls in sequence).
    """
    if not request.device_description.strip():
        raise HTTPException(status_code=400, detail="device_description is required")
    if not request.indications_for_use.strip():
        raise HTTPException(status_code=400, detail="indications_for_use is required")

    try:
        result = await run_pipeline(
            device_description=request.device_description,
            indications_for_use=request.indications_for_use,
            model_mode=request.model_mode,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/device/{k_number}")
async def get_device_info(k_number: str):
    """Get metadata + predicate chain for a specific K-number."""
    device = await get_device(k_number)
    if not device:
        raise HTTPException(status_code=404, detail=f"Device {k_number} not found")

    chain = await get_predicate_chain(k_number)
    return {
        "device": device,
        "predicate_chain": chain
    }


@app.get("/api/chain/{k_number}")
async def get_chain(k_number: str, max_depth: int = 12):
    """Get full predicate ancestry chain for visualization."""
    chain = await get_predicate_chain(k_number, max_depth=max_depth)
    if not chain:
        raise HTTPException(status_code=404, detail=f"No chain found for {k_number}")
    return {"k_number": k_number, "chain": chain}


@app.get("/api/eval/results")
async def get_eval_results():
    """Return evaluation metrics if they exist."""
    eval_path = "data/eval/evaluation_results.json"
    if not os.path.exists(eval_path):
        return {"message": "No evaluation results yet. Run setup/07_run_evaluation.py"}
    with open(eval_path) as f:
        return json.load(f)


@app.get("/api/devices")
async def list_devices(
    search: str = "",
    product_code: str = "",
    device_class: str = "",
    page: int = 1,
    limit: int = 25,
):
    """Paginated, searchable device list for the Database tab."""
    import aiosqlite
    offset = (page - 1) * limit
    conditions = []
    params: list = []

    if search:
        conditions.append("(d.device_name LIKE ? OR d.k_number LIKE ? OR d.applicant LIKE ?)")
        q = f"%{search}%"
        params += [q, q, q]
    if product_code:
        conditions.append("d.product_code = ?")
        params.append(product_code.upper())
    if device_class:
        conditions.append("d.device_class = ?")
        params.append(device_class)

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    async with aiosqlite.connect(settings.db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            f"SELECT COUNT(*) FROM devices d {where}", params
        ) as cur:
            total = (await cur.fetchone())[0]

        async with db.execute(f"""
            SELECT d.k_number, d.device_name, d.applicant, d.product_code,
                   d.device_class, d.decision_date, d.regulation_number,
                   d.advisory_committee_description,
                   COUNT(r.recall_id) as recall_count
            FROM devices d
            LEFT JOIN recalls r ON d.k_number = r.k_number
            {where}
            GROUP BY d.k_number
            ORDER BY d.decision_date DESC
            LIMIT ? OFFSET ?
        """, params + [limit, offset]) as cur:
            rows = [dict(r) for r in await cur.fetchall()]

    return {"total": total, "page": page, "limit": limit, "devices": rows}


@app.get("/api/devices/autocomplete")
async def autocomplete_devices(q: str = "", limit: int = 8):
    """K-number prefix search with connection count, for the graph search dropdown."""
    import aiosqlite
    if len(q.strip()) < 2:
        return []
    async with aiosqlite.connect(settings.db_path) as db:
        db.row_factory = aiosqlite.Row
        pattern = q.strip().upper() + "%"
        async with db.execute("""
            WITH conn_counts AS (
                SELECT k_number, COUNT(*) AS conns FROM (
                    SELECT k_number FROM predicate_edges
                    UNION ALL
                    SELECT predicate_k_number AS k_number FROM predicate_edges
                ) GROUP BY k_number
            )
            SELECT d.k_number, d.device_name, COALESCE(c.conns, 0) AS connections
            FROM devices d
            LEFT JOIN conn_counts c ON d.k_number = c.k_number
            WHERE d.k_number LIKE ?
            ORDER BY connections DESC, d.k_number
            LIMIT ?
        """, (pattern, limit)) as cur:
            return [dict(r) for r in await cur.fetchall()]


@app.get("/api/network/sample")
async def get_sample_network():
    """
    Returns all devices that have 2+ predicate connections (no artificial cap).
    Pure SQL — avoids Python-side IN-clause blowup with large node sets.
    Must be registered BEFORE /api/network/{k_number}.
    """
    import aiosqlite
    async with aiosqlite.connect(settings.db_path) as db:
        db.row_factory = aiosqlite.Row

        # Top 50 hubs for visual highlighting
        async with db.execute("""
            SELECT predicate_k_number AS k_number
            FROM predicate_edges
            GROUP BY predicate_k_number
            ORDER BY COUNT(*) DESC
            LIMIT 50
        """) as cur:
            hubs = [r["k_number"] for r in await cur.fetchall()]

        if not hubs:
            return {"nodes": [], "edges": [], "hubs": []}

        # Nodes with degree >= 2 (appear in 2+ edges as either endpoint)
        async with db.execute("""
            WITH all_endpoints AS (
                SELECT k_number FROM predicate_edges
                UNION ALL
                SELECT predicate_k_number AS k_number FROM predicate_edges
            ),
            core_nodes AS (
                SELECT k_number FROM all_endpoints
                GROUP BY k_number HAVING COUNT(*) >= 2
            )
            SELECT d.k_number, d.device_name, d.product_code, d.device_class,
                   d.decision_date, d.applicant,
                   COUNT(r.recall_id) AS recall_count
            FROM devices d
            JOIN core_nodes c ON d.k_number = c.k_number
            LEFT JOIN recalls r ON d.k_number = r.k_number
            GROUP BY d.k_number, d.device_name, d.product_code, d.device_class,
                     d.decision_date, d.applicant
        """) as cur:
            node_rows = [dict(r) for r in await cur.fetchall()]

        # All edges where both endpoints are in the core
        async with db.execute("""
            WITH all_endpoints AS (
                SELECT k_number FROM predicate_edges
                UNION ALL
                SELECT predicate_k_number AS k_number FROM predicate_edges
            ),
            core_nodes AS (
                SELECT k_number FROM all_endpoints
                GROUP BY k_number HAVING COUNT(*) >= 2
            )
            SELECT e.k_number, e.predicate_k_number
            FROM predicate_edges e
            JOIN core_nodes s ON e.k_number = s.k_number
            JOIN core_nodes t ON e.predicate_k_number = t.k_number
        """) as cur:
            edge_rows = [dict(r) for r in await cur.fetchall()]

    return {"hubs": hubs, "nodes": node_rows, "edges": edge_rows}


@app.get("/api/network/insights")
async def get_network_insights():
    """
    Pre-computed graph intelligence statistics for the Network Intelligence panel.
    Returns hubs (most cited), dynasties (oldest still active), bridges (cross-category),
    and activity (hottest product codes recently). Registered before /{k_number}.
    """
    import aiosqlite
    async with aiosqlite.connect(settings.db_path) as db:
        db.row_factory = aiosqlite.Row

        # Top 15 most-cited predicates (in-degree)
        async with db.execute("""
            SELECT pe.predicate_k_number AS k_number,
                   d.device_name, d.product_code, d.decision_date,
                   COUNT(*) AS citations
            FROM predicate_edges pe
            JOIN devices d ON d.k_number = pe.predicate_k_number
            GROUP BY pe.predicate_k_number
            ORDER BY citations DESC
            LIMIT 15
        """) as cur:
            hubs = [dict(r) for r in await cur.fetchall()]

        # Regulatory dynasties: pre-1995 devices still cited after 2015
        async with db.execute("""
            SELECT d_pred.k_number, d_pred.device_name, d_pred.product_code,
                   d_pred.decision_date AS cleared_date,
                   COUNT(*) AS total_citations,
                   MAX(d_citing.decision_date) AS latest_citation
            FROM predicate_edges pe
            JOIN devices d_pred ON d_pred.k_number = pe.predicate_k_number
            JOIN devices d_citing ON d_citing.k_number = pe.k_number
            WHERE d_pred.decision_date < '1995-01-01'
              AND d_citing.decision_date >= '2015-01-01'
            GROUP BY d_pred.k_number
            HAVING COUNT(*) >= 2
            ORDER BY d_pred.decision_date ASC
            LIMIT 12
        """) as cur:
            dynasties = [dict(r) for r in await cur.fetchall()]

        # Cross-category bridges: cited across the most distinct product codes
        async with db.execute("""
            SELECT pe.predicate_k_number AS k_number,
                   d_pred.device_name,
                   d_pred.decision_date,
                   COUNT(DISTINCT d_citing.product_code) AS product_categories,
                   COUNT(*) AS total_citations
            FROM predicate_edges pe
            JOIN devices d_pred ON d_pred.k_number = pe.predicate_k_number
            JOIN devices d_citing ON d_citing.k_number = pe.k_number
            WHERE d_citing.product_code != ''
            GROUP BY pe.predicate_k_number
            HAVING COUNT(DISTINCT d_citing.product_code) >= 3
            ORDER BY COUNT(DISTINCT d_citing.product_code) DESC, COUNT(*) DESC
            LIMIT 12
        """) as cur:
            bridges = [dict(r) for r in await cur.fetchall()]

        # Activity: product codes with the most clearances since 2021
        async with db.execute("""
            SELECT d.product_code,
                   COUNT(*) AS recent_clearances,
                   MAX(d.decision_date) AS latest_date
            FROM devices d
            WHERE d.decision_date >= '2021-01-01' AND d.product_code != ''
            GROUP BY d.product_code
            ORDER BY recent_clearances DESC
            LIMIT 12
        """) as cur:
            activity = [dict(r) for r in await cur.fetchall()]

    return {"hubs": hubs, "dynasties": dynasties, "bridges": bridges, "activity": activity}


@app.get("/api/network/{k_number}")
async def get_device_network(k_number: str, hops: int = 2):
    """Ego-network of a device within N predicate hops. Capped at 80 nodes."""
    import aiosqlite
    k = k_number.upper()
    async with aiosqlite.connect(settings.db_path) as db:
        db.row_factory = aiosqlite.Row

        async with db.execute("SELECT device_name FROM devices WHERE k_number=?", (k,)) as cur:
            row = await cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"{k_number} not found")

        visited: set[str] = {k}
        frontier = {k}
        for _ in range(hops):
            if not frontier:
                break
            placeholders = ",".join("?" * len(frontier))
            async with db.execute(f"""
                SELECT k_number, predicate_k_number FROM predicate_edges
                WHERE k_number IN ({placeholders}) OR predicate_k_number IN ({placeholders})
            """, list(frontier) * 2) as cur:
                edges_raw = await cur.fetchall()
            new_nodes = set()
            for e in edges_raw:
                new_nodes.add(e["k_number"])
                new_nodes.add(e["predicate_k_number"])
            frontier = new_nodes - visited
            visited |= new_nodes
            if len(visited) > 80:
                break

        visited = set(list(visited)[:80])
        placeholders = ",".join("?" * len(visited))
        async with db.execute(f"""
            SELECT k_number, device_name, applicant, product_code, decision_date, device_class
            FROM devices WHERE k_number IN ({placeholders})
        """, list(visited)) as cur:
            node_rows = {r["k_number"]: dict(r) for r in await cur.fetchall()}

        async with db.execute(f"""
            SELECT k_number, predicate_k_number FROM predicate_edges
            WHERE k_number IN ({placeholders}) AND predicate_k_number IN ({placeholders})
        """, list(visited) * 2) as cur:
            edge_rows = [dict(r) for r in await cur.fetchall()]

    return {"center": k, "nodes": list(node_rows.values()), "edges": edge_rows}


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    device_count = await get_device_count()
    return HealthResponse(
        status="ok",
        db_connected=device_count > 0,
        faiss_loaded=is_loaded(),
        device_count=device_count
    )
