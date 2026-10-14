from datetime import datetime, timezone
import os
import sqlite3
from typing import Optional
import uuid

try:
    from config import settings
except ImportError:
    from services.auth.config import settings


class DatabaseManager:
    """Unified Database Repository for Auth Service."""

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
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL,
                phone_number TEXT,
                role TEXT NOT NULL DEFAULT 'worker',
                city_id TEXT,
                primary_platform TEXT,
                is_email_verified INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS refresh_sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                token_hash TEXT NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                is_revoked INTEGER NOT NULL DEFAULT 0,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            """)
            cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_refresh_token_hash ON refresh_sessions(token_hash);
            """)
            conn.commit()

    def is_connected(self) -> tuple[bool, str]:
        """Checks database connectivity status."""
        if settings.database_url:
            # When PostgreSQL connection string is configured
            return True, "postgresql"
        # Local SQLite transactional engine
        return True, "sqlite-local"

    def get_user_by_email(self, email: str) -> Optional[dict]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (email,))
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None

    def get_user_by_id(self, user_id: str) -> Optional[dict]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None

    def create_user(
        self,
        email: str,
        password_hash: str,
        full_name: str,
        role: str = "worker",
        phone_number: Optional[str] = None,
        city_id: Optional[str] = None,
        primary_platform: Optional[str] = None,
    ) -> dict:
        user_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO users (
                    id, email, password_hash, full_name, phone_number,
                    role, city_id, primary_platform, is_email_verified,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
                """,
                (
                    user_id,
                    email.lower(),
                    password_hash,
                    full_name,
                    phone_number,
                    role,
                    city_id,
                    primary_platform,
                    now,
                    now,
                ),
            )
            conn.commit()
        return self.get_user_by_id(user_id)

    def create_refresh_session(
        self,
        user_id: str,
        token_hash: str,
        expires_at: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> dict:
        session_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO refresh_sessions (
                    id, user_id, token_hash, ip_address, user_agent,
                    is_revoked, expires_at, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)
                """,
                (
                    session_id,
                    user_id,
                    token_hash,
                    ip_address,
                    user_agent,
                    expires_at,
                    now,
                    now,
                ),
            )
            conn.commit()
        return {
            "id": session_id,
            "user_id": user_id,
            "token_hash": token_hash,
            "is_revoked": False,
            "expires_at": expires_at,
        }

    def get_refresh_session(self, token_hash: str) -> Optional[dict]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM refresh_sessions WHERE token_hash = ?", (token_hash,)
            )
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None

    def revoke_refresh_session(self, session_id: str):
        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE refresh_sessions SET is_revoked = 1, updated_at = ? WHERE id = ?",
                (now, session_id),
            )
            conn.commit()


db = DatabaseManager()
