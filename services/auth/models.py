from datetime import datetime, timezone
import re
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRole(str):
    WORKER = "worker"
    VERIFIER = "verifier"
    ADVOCATE = "advocate"
    ADMIN = "admin"


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    fullName: str = Field(min_length=2, max_length=100)
    phoneNumber: Optional[str] = None
    cityId: Optional[str] = None
    primaryPlatform: Optional[str] = None
    # If client attempts to send role, it will be strictly ignored/rejected!
    role: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class RefreshTokenRequest(BaseModel):
    refreshToken: str = Field(min_length=1)


class UserProfileResponse(BaseModel):
    id: str
    email: str
    fullName: str
    role: str
    phoneNumber: Optional[str] = None
    cityId: Optional[str] = None
    primaryPlatform: Optional[str] = None
    isEmailVerified: bool = False
    createdAt: str
    updatedAt: str


class AuthTokenResponse(BaseModel):
    accessToken: str
    refreshToken: str
    tokenType: str = "Bearer"
    expiresInSeconds: int
    user: UserProfileResponse


class LogoutResponse(BaseModel):
    success: bool
    message: str


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "auth"
    version: str = "0.1.0"
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ReadyResponse(BaseModel):
    status: str  # "ready" or "not_ready"
    service: str = "auth"
    database: str  # "connected" or "disconnected"
    databaseEngine: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ApiErrorDetail(BaseModel):
    field: Optional[str] = None
    message: str
    code: Optional[str] = None


class ApiErrorEnvelope(BaseModel):
    success: bool = False
    error: dict
