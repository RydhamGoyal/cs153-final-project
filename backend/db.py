"""
SQLite database helpers. All queries are synchronous (wrapped for async via run_in_executor).
"""
import sqlite3
import aiosqlite
from typing import Optional
from backend.config import settings


async def get_device(k_number: str) -> Optional[dict]:
    async with aiosqlite.connect(settings.db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM devices WHERE k_number = ? COLLATE NOCASE",
            (k_number.upper(),)
        ) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None


async def get_devices_by_product_code(product_code: str, limit: int = 50) -> list[dict]:
    async with aiosqlite.connect(settings.db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("""
            SELECT d.*, COUNT(r.recall_id) as recall_count
            FROM devices d
            LEFT JOIN recalls r ON d.k_number = r.k_number
            WHERE d.product_code = ? AND d.decision_code = 'SESE'
            GROUP BY d.k_number
            ORDER BY d.decision_date DESC
            LIMIT ?
        """, (product_code.upper(), limit)) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]


async def get_predicate_chain(k_number: str, max_depth: int = 12) -> list[dict]:
    """
    Recursively traverse predicate_edges to build ancestry chain.
    Uses WITH RECURSIVE SQL CTE for efficient graph traversal.
    Returns list of dicts with depth information.
    """
    async with aiosqlite.connect(settings.db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("""
            WITH RECURSIVE chain(k_number, depth) AS (
                SELECT ?, 0
                UNION ALL
                SELECT pe.predicate_k_number, chain.depth + 1
                FROM predicate_edges pe
                JOIN chain ON pe.k_number = chain.k_number
                WHERE chain.depth < ?
            )
            SELECT d.k_number, d.device_name, d.decision_date, d.applicant,
                   d.product_code, chain.depth,
                   CASE WHEN r.k_number IS NOT NULL THEN 1 ELSE 0 END as has_recall
            FROM chain
            JOIN devices d ON chain.k_number = d.k_number
            LEFT JOIN recalls r ON d.k_number = r.k_number
            GROUP BY d.k_number
            ORDER BY chain.depth
        """, (k_number.upper(), max_depth)) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]


async def get_recall_history(k_number: str) -> list[dict]:
    async with aiosqlite.connect(settings.db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM recalls WHERE k_number = ?",
            (k_number.upper(),)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]


async def get_product_code_info(product_code: str) -> Optional[dict]:
    async with aiosqlite.connect(settings.db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM product_codes WHERE product_code = ? COLLATE NOCASE",
            (product_code.upper(),)
        ) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None


async def get_device_count() -> int:
    async with aiosqlite.connect(settings.db_path) as db:
        async with db.execute("SELECT COUNT(*) FROM devices") as cursor:
            row = await cursor.fetchone()
            return row[0] if row else 0
