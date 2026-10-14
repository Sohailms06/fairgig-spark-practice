import os
from typing import List
from pydantic import BaseModel


class Settings(BaseModel):
    service_name: str = "earnings"
    version: str = "0.1.0"
    port: int = int(os.getenv("PORT_EARNINGS", "8002"))
    
    # Supabase & PostgreSQL
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY", "")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    database_url: str = os.getenv("DATABASE_URL", "")
    storage_bucket_evidence: str = os.getenv("SUPABASE_STORAGE_BUCKET_EVIDENCE", "evidence-private")
    
    # JWT & Auth
    jwt_secret: str = os.getenv("JWT_SECRET", "fairgig-default-hackathon-jwt-secret-key-32-chars-min!")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    
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
