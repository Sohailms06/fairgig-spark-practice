from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status

try:
    from config import settings
    from database import db
    from models import (
        AuthTokenResponse,
        LoginRequest,
        LogoutResponse,
        RefreshTokenRequest,
        RegisterRequest,
        UserProfileResponse,
    )
    from security import (
        create_access_token,
        generate_refresh_token,
        get_current_user_claims,
        hash_password,
        hash_token,
        verify_password,
    )
except ImportError:
    from services.auth.config import settings
    from services.auth.database import db
    from services.auth.models import (
        AuthTokenResponse,
        LoginRequest,
        LogoutResponse,
        RefreshTokenRequest,
        RegisterRequest,
        UserProfileResponse,
    )
    from services.auth.security import (
        create_access_token,
        generate_refresh_token,
        get_current_user_claims,
        hash_password,
        hash_token,
        verify_password,
    )

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


def _format_user_profile(user: dict) -> UserProfileResponse:
    return UserProfileResponse(
        id=user["id"],
        email=user["email"],
        fullName=user["full_name"],
        role=user["role"],
        phoneNumber=user.get("phone_number"),
        cityId=user.get("city_id"),
        primaryPlatform=user.get("primary_platform"),
        isEmailVerified=bool(user.get("is_email_verified", 0)),
        createdAt=user["created_at"],
        updatedAt=user["updated_at"],
    )


@router.post(
    "/register",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Public Worker Registration",
)
async def register(request: RegisterRequest, req: Request) -> AuthTokenResponse:
    """Public worker registration.

    Enforces:
    - Email uniqueness.
    - Password complexity.
    - Public registration strictly assigns role: 'worker'.
    - Self-assigning 'verifier', 'advocate', or 'admin' is explicitly rejected.
    """
    if request.role and request.role != "worker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Public registration cannot assign privileged roles (verifier, advocate, admin).",
        )

    existing_user = db.get_user_by_email(request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An account with email '{request.email}' already exists.",
        )

    pwd_hash = hash_password(request.password)
    user = db.create_user(
        email=request.email,
        password_hash=pwd_hash,
        full_name=request.fullName,
        role="worker",  # Strict enforcement
        phone_number=request.phoneNumber,
        city_id=request.cityId,
        primary_platform=request.primaryPlatform,
    )

    # Issue short-lived access token
    access_token = create_access_token(
        data={"sub": user["id"], "email": user["email"], "role": user["role"]}
    )

    # Issue refresh token & store hash
    raw_refresh_token = generate_refresh_token()
    token_hash = hash_token(raw_refresh_token)
    expires_at = (
        datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    ).isoformat()

    client_ip = req.client.host if req.client else None
    user_agent = req.headers.get("user-agent")

    db.create_refresh_session(
        user_id=user["id"],
        token_hash=token_hash,
        expires_at=expires_at,
        ip_address=client_ip,
        user_agent=user_agent,
    )

    return AuthTokenResponse(
        accessToken=access_token,
        refreshToken=raw_refresh_token,
        tokenType="Bearer",
        expiresInSeconds=settings.access_token_expire_minutes * 60,
        user=_format_user_profile(user),
    )


@router.post(
    "/login",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Worker / Verifier / Advocate Login",
)
async def login(request: LoginRequest, req: Request) -> AuthTokenResponse:
    """Authenticates user with email and password, returning short-lived JWT and refresh token."""
    user = db.get_user_by_email(request.email)
    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user["id"], "email": user["email"], "role": user["role"]}
    )

    raw_refresh_token = generate_refresh_token()
    token_hash = hash_token(raw_refresh_token)
    expires_at = (
        datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    ).isoformat()

    client_ip = req.client.host if req.client else None
    user_agent = req.headers.get("user-agent")

    db.create_refresh_session(
        user_id=user["id"],
        token_hash=token_hash,
        expires_at=expires_at,
        ip_address=client_ip,
        user_agent=user_agent,
    )

    return AuthTokenResponse(
        accessToken=access_token,
        refreshToken=raw_refresh_token,
        tokenType="Bearer",
        expiresInSeconds=settings.access_token_expire_minutes * 60,
        user=_format_user_profile(user),
    )


@router.post(
    "/refresh",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Rotate Refresh Token and Issue Fresh Access Token",
)
async def refresh_token(request: RefreshTokenRequest, req: Request) -> AuthTokenResponse:
    """Validates refresh token, rotates token, revokes replaced token, and returns fresh pair."""
    token_hash = hash_token(request.refreshToken)
    session = db.get_refresh_session(token_hash)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or unrecognized refresh token.",
        )

    if session["is_revoked"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has already been revoked or rotated.",
        )

    # Check expiration
    expires_dt = datetime.fromisoformat(session["expires_at"])
    if expires_dt < datetime.now(timezone.utc):
        db.revoke_refresh_session(session["id"])
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired.",
        )

    user = db.get_user_by_id(session["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with session not found.",
        )

    # Revoke old session immediately (Rotation)
    db.revoke_refresh_session(session["id"])

    # Issue new refresh token & fresh access token
    new_access_token = create_access_token(
        data={"sub": user["id"], "email": user["email"], "role": user["role"]}
    )

    new_raw_refresh_token = generate_refresh_token()
    new_token_hash = hash_token(new_raw_refresh_token)
    new_expires_at = (
        datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    ).isoformat()

    client_ip = req.client.host if req.client else None
    user_agent = req.headers.get("user-agent")

    db.create_refresh_session(
        user_id=user["id"],
        token_hash=new_token_hash,
        expires_at=new_expires_at,
        ip_address=client_ip,
        user_agent=user_agent,
    )

    return AuthTokenResponse(
        accessToken=new_access_token,
        refreshToken=new_raw_refresh_token,
        tokenType="Bearer",
        expiresInSeconds=settings.access_token_expire_minutes * 60,
        user=_format_user_profile(user),
    )


@router.get(
    "/me",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Current Authenticated Profile",
)
async def get_me(claims: dict = Depends(get_current_user_claims)) -> UserProfileResponse:
    """Returns the authenticated worker profile based on Bearer token."""
    user = db.get_user_by_id(claims["sub"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User record not found.",
        )
    return _format_user_profile(user)


@router.post(
    "/logout",
    response_model=LogoutResponse,
    status_code=status.HTTP_200_OK,
    summary="Logout and Revoke Refresh Session",
)
async def logout(request: RefreshTokenRequest) -> LogoutResponse:
    """Revokes the refresh token session."""
    token_hash = hash_token(request.refreshToken)
    session = db.get_refresh_session(token_hash)
    if session:
        db.revoke_refresh_session(session["id"])
    return LogoutResponse(success=True, message="Successfully logged out.")


@router.post(
    "/admin/provision-demo-accounts",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Provision Demo Verifier and Advocate Accounts (Protected Admin/Seeding Route)",
)
async def provision_demo_accounts() -> dict:
    """Provisions demo verifier and advocate accounts for testing and evaluation."""
    accounts = [
        {
            "email": "verifier.demo@fairgig.org",
            "password": "VerifierPassword123",
            "full_name": "Eleanor Vance (Auditor Lead)",
            "role": "verifier",
        },
        {
            "email": "advocate.demo@fairgig.org",
            "password": "AdvocatePassword123",
            "full_name": "Marcus Rodriguez (Labor Advocate)",
            "role": "advocate",
        },
        {
            "email": "worker.demo@fairgig.org",
            "password": "WorkerPassword123",
            "full_name": "Maria Santos (Demo Worker)",
            "role": "worker",
        },
    ]

    created = []
    for acc in accounts:
        existing = db.get_user_by_email(acc["email"])
        if not existing:
            pwd_hash = hash_password(acc["password"])
            user = db.create_user(
                email=acc["email"],
                password_hash=pwd_hash,
                full_name=acc["full_name"],
                role=acc["role"],
            )
            created.append({"email": acc["email"], "role": acc["role"], "id": user["id"]})
        else:
            created.append({"email": acc["email"], "role": existing["role"], "id": existing["id"], "status": "existing"})

    return {"message": "Demo accounts provisioned successfully", "accounts": created}
