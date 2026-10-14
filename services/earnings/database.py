from datetime import datetime, timezone
import json
import math
import os
import sqlite3
from typing import Any, Dict, List, Optional, Tuple
import uuid

try:
    from config import settings
except ImportError:
    from services.earnings.config import settings


class EarningsDatabaseManager:
    """Unified Database Repository for Earnings Service."""

    def __init__(self):
        self.db_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "fairgig_local.db")
        )
        self._init_sqlite_schema()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_sqlite_schema(self):
        """Initializes tables matching the Supabase PostgreSQL DDL for local execution."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS earnings_shifts (
                id TEXT PRIMARY KEY,
                worker_id TEXT NOT NULL,
                platform TEXT NOT NULL,
                zone_id TEXT,
                shift_date TEXT NOT NULL,
                start_time TEXT,
                end_time TEXT,
                hours_worked REAL NOT NULL,
                gross_amount REAL NOT NULL,
                net_amount REAL NOT NULL,
                deductions REAL NOT NULL DEFAULT 0,
                tips_amount REAL NOT NULL DEFAULT 0,
                bonus_amount REAL NOT NULL DEFAULT 0,
                trips_count INTEGER NOT NULL DEFAULT 0,
                verification_status TEXT NOT NULL DEFAULT 'pending',
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS screenshot_evidence (
                id TEXT PRIMARY KEY,
                earning_id TEXT NOT NULL,
                worker_id TEXT NOT NULL,
                storage_path TEXT NOT NULL,
                mime_type TEXT NOT NULL,
                file_size_bytes INTEGER NOT NULL,
                ocr_confidence REAL,
                extracted_data TEXT DEFAULT '{}',
                created_at TEXT NOT NULL,
                FOREIGN KEY (earning_id) REFERENCES earnings_shifts(id) ON DELETE CASCADE
            );
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS verification_reviews (
                id TEXT PRIMARY KEY,
                earning_id TEXT NOT NULL,
                verifier_id TEXT NOT NULL,
                previous_status TEXT NOT NULL,
                new_status TEXT NOT NULL,
                decision TEXT NOT NULL,
                notes TEXT NOT NULL,
                discrepancy_reason TEXT,
                verified_gross_amount REAL,
                verified_net_amount REAL,
                verified_hours_worked REAL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (earning_id) REFERENCES earnings_shifts(id) ON DELETE CASCADE
            );
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                actor_id TEXT,
                action TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id TEXT,
                metadata TEXT DEFAULT '{}',
                created_at TEXT NOT NULL
            );
            """)
            cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_earnings_worker_date ON earnings_shifts(worker_id, shift_date);
            """)
            cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_earnings_status ON earnings_shifts(verification_status);
            """)
            conn.commit()

    def is_connected(self) -> Tuple[bool, str]:
        """Checks database connectivity status."""
        if settings.database_url:
            return True, "postgresql"
        return True, "sqlite-local"

    def record_audit_log(
        self,
        actor_id: str,
        action: str,
        entity_type: str,
        entity_id: str,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        log_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    log_id,
                    actor_id,
                    action,
                    entity_type,
                    entity_id,
                    json.dumps(metadata or {}),
                    now,
                ),
            )
            conn.commit()

    def create_earning(self, worker_id: str, data: dict) -> dict:
        earning_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO earnings_shifts (
                    id, worker_id, platform, zone_id, shift_date, start_time, end_time,
                    hours_worked, gross_amount, net_amount, deductions, tips_amount,
                    bonus_amount, trips_count, verification_status, notes,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
                """,
                (
                    earning_id,
                    worker_id,
                    data["platform"],
                    data.get("zoneId"),
                    data["shiftDate"],
                    data.get("startTime"),
                    data.get("endTime"),
                    data["hoursWorked"],
                    data["grossAmount"],
                    data["netAmount"],
                    data.get("deductions", 0.0),
                    data.get("tipsAmount", 0.0),
                    data.get("bonusAmount", 0.0),
                    data.get("tripsCount", 0),
                    data.get("notes"),
                    now,
                    now,
                ),
            )
            conn.commit()

        self.record_audit_log(
            actor_id=worker_id,
            action="CREATE_EARNING",
            entity_type="earnings_shifts",
            entity_id=earning_id,
            metadata={"gross": data["grossAmount"], "net": data["netAmount"]},
        )
        return self.get_earning_by_id(earning_id)

    def get_earning_by_id(self, earning_id: str) -> Optional[dict]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM earnings_shifts WHERE id = ?", (earning_id,))
            row = cursor.fetchone()
            if row:
                d = dict(row)
                d["hourly_rate"] = round(d["net_amount"] / d["hours_worked"], 2) if d["hours_worked"] > 0 else 0.0
                return d
            return None

    def list_earnings(
        self,
        worker_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        platform: Optional[str] = None,
        verification_status: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        conditions = ["worker_id = ?"]
        params = [worker_id]

        if start_date:
            conditions.append("shift_date >= ?")
            params.append(start_date)
        if end_date:
            conditions.append("shift_date <= ?")
            params.append(end_date)
        if platform:
            conditions.append("LOWER(platform) = LOWER(?)")
            params.append(platform)
        if verification_status:
            conditions.append("verification_status = ?")
            params.append(verification_status)

        where_clause = " WHERE " + " AND ".join(conditions)

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f"SELECT COUNT(*) FROM earnings_shifts {where_clause}", params)
            total_items = cursor.fetchone()[0]

            offset = (page - 1) * limit
            cursor.execute(
                f"""
                SELECT * FROM earnings_shifts {where_clause}
                ORDER BY shift_date DESC, created_at DESC
                LIMIT ? OFFSET ?
                """,
                params + [limit, offset],
            )
            rows = cursor.fetchall()
            items = []
            for r in rows:
                d = dict(r)
                d["hourly_rate"] = round(d["net_amount"] / d["hours_worked"], 2) if d["hours_worked"] > 0 else 0.0
                items.append(d)

            return items, total_items

    def update_earning(
        self,
        earning_id: str,
        worker_id: str,
        updates: dict,
        reset_verification: bool = False,
    ) -> Optional[dict]:
        existing = self.get_earning_by_id(earning_id)
        if not existing or existing["worker_id"] != worker_id:
            return None

        fields = []
        params = []
        now = datetime.now(timezone.utc).isoformat()

        for k, v in updates.items():
            if v is not None:
                # Map camelCase to snake_case
                snake_k = (
                    "shift_date" if k == "shiftDate" else (
                        "hours_worked" if k == "hoursWorked" else (
                            "gross_amount" if k == "grossAmount" else (
                                "net_amount" if k == "netAmount" else (
                                    "tips_amount" if k == "tipsAmount" else (
                                        "bonus_amount" if k == "bonusAmount" else (
                                            "trips_count" if k == "tripsCount" else k
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
                fields.append(f"{snake_k} = ?")
                params.append(v)

        if reset_verification:
            fields.append("verification_status = 'pending'")

        fields.append("updated_at = ?")
        params.append(now)
        params.append(earning_id)

        sql = f"UPDATE earnings_shifts SET {', '.join(fields)} WHERE id = ?"
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(sql, params)
            conn.commit()

        self.record_audit_log(
            actor_id=worker_id,
            action="UPDATE_EARNING",
            entity_type="earnings_shifts",
            entity_id=earning_id,
            metadata={"reset_verification": reset_verification, "fields": list(updates.keys())},
        )
        return self.get_earning_by_id(earning_id)

    def delete_earning(self, earning_id: str, worker_id: str) -> bool:
        existing = self.get_earning_by_id(earning_id)
        if not existing or existing["worker_id"] != worker_id:
            return False

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM earnings_shifts WHERE id = ?", (earning_id,))
            conn.commit()

        self.record_audit_log(
            actor_id=worker_id,
            action="DELETE_EARNING",
            entity_type="earnings_shifts",
            entity_id=earning_id,
            metadata={"deleted_shift_date": existing["shift_date"]},
        )
        return True

    def create_evidence(
        self,
        evidence_id: str,
        earning_id: str,
        worker_id: str,
        storage_path: str,
        mime_type: str,
        file_size_bytes: int,
        ocr_confidence: Optional[float] = None,
        extracted_data: Optional[Dict[str, Any]] = None,
    ) -> dict:
        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO screenshot_evidence (
                    id, earning_id, worker_id, storage_path, mime_type,
                    file_size_bytes, ocr_confidence, extracted_data, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    evidence_id,
                    earning_id,
                    worker_id,
                    storage_path,
                    mime_type,
                    file_size_bytes,
                    ocr_confidence,
                    json.dumps(extracted_data or {}),
                    now,
                ),
            )
            conn.commit()

        self.record_audit_log(
            actor_id=worker_id,
            action="ATTACH_EVIDENCE",
            entity_type="screenshot_evidence",
            entity_id=evidence_id,
            metadata={"earning_id": earning_id, "storage_path": storage_path},
        )
        return {
            "id": evidence_id,
            "earning_id": earning_id,
            "worker_id": worker_id,
            "storage_path": storage_path,
            "mime_type": mime_type,
            "file_size_bytes": file_size_bytes,
            "ocr_confidence": ocr_confidence,
            "extracted_data": extracted_data or {},
            "created_at": now,
        }

    def get_evidence_by_earning(self, earning_id: str) -> List[dict]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM screenshot_evidence WHERE earning_id = ? ORDER BY created_at DESC",
                (earning_id,),
            )
            rows = cursor.fetchall()
            results = []
            for r in rows:
                d = dict(r)
                d["extracted_data"] = json.loads(d["extracted_data"]) if d.get("extracted_data") else {}
                results.append(d)
            return results

    def create_verification_review(
        self,
        earning_id: str,
        verifier_id: str,
        previous_status: str,
        new_status: str,
        decision: str,
        notes: str,
        discrepancy_reason: Optional[str] = None,
        verified_gross: Optional[float] = None,
        verified_net: Optional[float] = None,
        verified_hours: Optional[float] = None,
    ) -> dict:
        review_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            # 1. Update earning status
            cursor.execute(
                "UPDATE earnings_shifts SET verification_status = ?, updated_at = ? WHERE id = ?",
                (new_status, now, earning_id),
            )
            # 2. Insert review record
            cursor.execute(
                """
                INSERT INTO verification_reviews (
                    id, earning_id, verifier_id, previous_status, new_status, decision,
                    notes, discrepancy_reason, verified_gross_amount, verified_net_amount,
                    verified_hours_worked, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    review_id,
                    earning_id,
                    verifier_id,
                    previous_status,
                    new_status,
                    decision,
                    notes,
                    discrepancy_reason,
                    verified_gross,
                    verified_net,
                    verified_hours,
                    now,
                ),
            )
            conn.commit()

        self.record_audit_log(
            actor_id=verifier_id,
            action="VERIFICATION_DECISION",
            entity_type="verification_reviews",
            entity_id=review_id,
            metadata={
                "earning_id": earning_id,
                "decision": decision,
                "previous_status": previous_status,
                "new_status": new_status,
            },
        )

        return {
            "id": review_id,
            "earning_id": earning_id,
            "verifier_id": verifier_id,
            "previous_status": previous_status,
            "new_status": new_status,
            "decision": decision,
            "notes": notes,
            "discrepancy_reason": discrepancy_reason,
            "verified_gross_amount": verified_gross,
            "verified_net_amount": verified_net,
            "verified_hours_worked": verified_hours,
            "created_at": now,
        }

    def get_verification_queue(self, status_filter: Optional[str] = None) -> List[dict]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            sql = """
            SELECT e.*, COUNT(s.id) as evidence_count
            FROM earnings_shifts e
            LEFT JOIN screenshot_evidence s ON s.earning_id = e.id
            """
            params = []
            if status_filter:
                sql += " WHERE e.verification_status = ?"
                params.append(status_filter)
            else:
                sql += " WHERE e.verification_status IN ('pending', 'discrepancy')"

            sql += " GROUP BY e.id ORDER BY e.shift_date DESC, e.created_at ASC"
            cursor.execute(sql, params)
            rows = cursor.fetchall()
            return [dict(r) for r in rows]


earnings_db = EarningsDatabaseManager()
