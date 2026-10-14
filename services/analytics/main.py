"""FairGig Analytics Service (FastAPI)
Provides worker personal analytics and advocate aggregated intelligence with k-anonymity privacy safeguards.
"""

from datetime import datetime, timezone
import os
from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

try:
    from config import settings
    from database import analytics_db
    from models import HealthResponse, ReadyResponse
    from routes.advocate import router as advocate_router
    from routes.worker import router as worker_router
except ImportError:
    from services.analytics.config import settings
    from services.analytics.database import analytics_db
    from services.analytics.models import HealthResponse, ReadyResponse
    from services.analytics.routes.advocate import router as advocate_router
    from services.analytics.routes.worker import router as worker_router

app = FastAPI(
    title="FairGig Analytics Service",
    description="Worker income analytics and privacy-preserving collective advocate intelligence.",
    version=settings.version,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Standardized RFC 7807 Error Envelope Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    details = []
    for err in exc.errors():
        loc = ".".join(str(x) for x in err.get("loc", []))
        details.append({
            "field": loc,
            "message": err.get("msg", "Invalid value"),
            "code": err.get("type", "VALIDATION_ERROR"),
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_FAILED",
                "message": "Input payload failed validation rules.",
                "details": details,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    code_str = "FORBIDDEN" if exc.status_code == 403 else (
        "UNAUTHORIZED" if exc.status_code == 401 else (
            "NOT_FOUND" if exc.status_code == 404 else "ERROR"
        )
    )
    return JSONResponse(
        status_code=exc.status_code,
        headers=getattr(exc, "headers", None),
        content={
            "success": False,
            "error": {
                "code": code_str,
                "message": str(exc.detail),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        },
    )


# Include Routers
app.include_router(worker_router)
app.include_router(advocate_router)


# System Probes
@app.get("/health", response_model=HealthResponse, tags=["System"])
@app.get("/api/v1/health", response_model=HealthResponse, tags=["System"])
def health_check() -> HealthResponse:
    """Standard health probe."""
    return HealthResponse(
        status="ok",
        service="analytics",
        version=settings.version,
    )


@app.get("/ready", response_model=ReadyResponse, tags=["System"])
@app.get("/api/v1/ready", response_model=ReadyResponse, tags=["System"])
def ready_check(response: Response) -> ReadyResponse:
    """Readiness probe checking database connectivity."""
    is_ok, db_type = analytics_db.is_connected()
    if not is_ok:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return ReadyResponse(
            status="unhealthy",
            service="analytics",
            database="disconnected",
        )
    return ReadyResponse(
        status="ready",
        service="analytics",
        database=db_type,
    )


@app.get("/", tags=["System"])
def root() -> dict[str, str]:
    return {
        "service": "FairGig Analytics Service",
        "health": "/health",
        "ready": "/ready",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT_ANALYTICS", os.getenv("PORT", "8004")))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
