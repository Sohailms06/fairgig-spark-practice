from datetime import datetime, timedelta, timezone
import hashlib
import os
import secrets
from typing import Optional
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt

try:
    from config import settings
except ImportError:
    from services.auth.config import settings

security_bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hashes a plaintext password using native bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a password against its bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def generate_refresh_token() -> str:
    """Generates a high-entropy random refresh token."""
    return f"fg_rf_{secrets.token_hex(32)}"


def hash_token(token: str) -> str:
    """Computes SHA-256 hash of a token for safe storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a short-lived signed JWT access token."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({
        "exp": expire,
        "iat": now,
        "iss": "fairgig-auth"
    })
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """Decodes and validates a JWT access token."""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            issuer="fairgig-auth"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_claims(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)
) -> dict:
    """Dependency that extracts and validates the JWT payload."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header with Bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return decode_access_token(credentials.credentials)


def require_role(allowed_roles: list[str]):
    """Role-based authorization dependency guard."""
    async def role_checker(claims: dict = Depends(get_current_user_claims)) -> dict:
        user_role = claims.get("role")
        if not user_role or user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Insufficient privileges. Required role in {allowed_roles}, got '{user_role}'",
            )
        return claims
    return role_checker
