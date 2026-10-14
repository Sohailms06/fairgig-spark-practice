import os
from typing import List
from pydantic import BaseModel

try:
    from dotenv import load_dotenv
    _root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    load_dotenv(os.path.join(_root_dir, ".env.local"))
    load_dotenv(os.path.join(_root_dir, ".env"))
except Exception:
    pass


class Settings(BaseModel):
    service_name: str = "auth"
    version: str = "0.1.0"
    port: int = int(os.getenv("PORT_AUTH", os.getenv("PORT", "8001")))
    
    # Supabase & PostgreSQL
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY", "")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    database_url: str = os.getenv("DATABASE_URL", "")
    
    # JWT & Auth
    jwt_secret: str = os.getenv("JWT_SECRET", "fairgig-default-hackathon-jwt-secret-key-32-chars-min!")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
    refresh_token_expire_days: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))
    
    # CORS
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8001",
        "http://localhost:8002",
        "http://localhost:8003",
        "http://localhost:8004",
        "http://localhost:4001",
        "http://localhost:4002",
        "*"
    ]


settings = Settings()
