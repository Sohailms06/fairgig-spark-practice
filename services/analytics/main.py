"""FairGig Analytics Service (FastAPI)
Provides worker personal analytics and advocate aggregated intelligence with k-anonymity privacy safeguards.
"""

from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="FairGig Analytics Service",
    description="Worker income analytics and privacy-preserving collective advocate intelligence.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str = Field(default="ok")
    service: str = Field(default="analytics")
    version: str = Field(default="0.1.0")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@app.get("/health", response_model=HealthResponse, tags=["System"])
@app.get("/api/v1/health", response_model=HealthResponse, tags=["System"])
def health_check() -> HealthResponse:
    """Standard health check endpoint."""
    return HealthResponse()


@app.get("/", tags=["System"])
def root() -> dict[str, str]:
    return {
        "service": "FairGig Analytics Service",
        "health": "/health",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8004, reload=True)
