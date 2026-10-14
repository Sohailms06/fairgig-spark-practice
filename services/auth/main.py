"""FairGig Auth Service (FastAPI)
Authentication, JWT token issuance, session refresh rotation, and role-based access control.
"""

from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

try:
    from config import settings
    from database import db
    from models import HealthResponse, ReadyResponse
    from routes.auth import router as auth_router
except ImportError:
    from services.auth.config import settings
    from services.auth.database import db
    from services.auth.models import HealthResponse, ReadyResponse
    from services.auth.routes.auth import router as auth_router

app = FastAPI(
    title="FairGig Auth Service",
    description="Authentication, JWT token issuance, session refresh rotation, and role authorization.",
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
    code = "UNAUTHORIZED" if exc.status_code == 401 else (
        "FORBIDDEN" if exc.status_code == 403 else (
            "NOT_FOUND" if exc.status_code == 404 else (
                "CONFLICT" if exc.status_code == 409 else "HTTP_ERROR"
            )
        )
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": code,
                "message": exc.detail,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        },
        headers=exc.headers,
    )


# System Health and Readiness Endpoints
@app.get("/health", response_model=HealthResponse, tags=["System"])
@app.get("/api/v1/health", response_model=HealthResponse, tags=["System"])
def health_check() -> HealthResponse:
    """Standard health check endpoint."""
    return HealthResponse()


@app.get("/ready", response_model=ReadyResponse, tags=["System"])
@app.get("/api/v1/ready", response_model=ReadyResponse, tags=["System"])
def readiness_check(response: Response) -> ReadyResponse:
    """Readiness probe testing database connectivity."""
    is_connected, engine = db.is_connected()
    if not is_connected:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return ReadyResponse(
            status="not_ready",
            database="disconnected",
            databaseEngine=engine,
        )
    return ReadyResponse(
        status="ready",
        database="connected",
        databaseEngine=engine,
    )


@app.get("/", tags=["System"])
def root() -> dict[str, str]:
    return {
        "service": "FairGig Auth Service",
        "health": "/health",
        "ready": "/ready",
        "docs": "/docs",
    }


# Mount Authentication Endpoints
app.include_router(auth_router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=settings.port, reload=True)
