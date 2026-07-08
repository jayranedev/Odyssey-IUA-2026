"""
Supabase JWT verification. The backend never talks to Supabase's DB —
it only validates the access token (HS256, SUPABASE_JWT_SECRET) and
extracts sub/email. Users are upserted into our own Postgres on first
authenticated request.
"""

import logging

from fastapi import HTTPException, Request
from jose import JWTError, jwt

from app.config import settings

logger = logging.getLogger(__name__)

# Cache of user ids already upserted this process — avoids a DB roundtrip per request.
_known_users: set[str] = set()


class AuthUser:
    __slots__ = ("id", "email")

    def __init__(self, id: str, email: str):
        self.id = id
        self.email = email


def _decode_token(token: str) -> AuthUser | tuple[None, str]:
    if not settings.supabase_jwt_secret:
        return None, "No secret configured"
    try:
        secret = settings.supabase_jwt_secret.strip()
        if "-" not in secret and "_" not in secret and (secret.endswith("=") or len(secret) % 4 == 0):
            try:
                import base64
                decoded = base64.b64decode(secret)
                if base64.b64encode(decoded).decode('utf-8') == secret:
                    secret = decoded
            except Exception:
                pass

        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except JWTError as e:
        logger.error("JWT rejected: %s (Secret length: %d)", e, len(secret) if secret else 0)
        return None, f"JWT Error: {str(e)}"
    except Exception as e:
        logger.error("Unexpected error in JWT decoding: %s", e)
        return None, f"Unexpected error: {str(e)}"
        
    sub = payload.get("sub")
    if not sub:
        logger.error("JWT missing 'sub' claim")
        return None, "JWT missing 'sub' claim"
    return AuthUser(id=sub, email=payload.get("email", "") or "")


async def _upsert_user(user: AuthUser) -> None:
    if user.id in _known_users:
        return
    from sqlalchemy.dialects.postgresql import insert

    from app.db import AsyncSessionLocal
    from app.models.user import User

    try:
        async with AsyncSessionLocal() as db:
            stmt = insert(User).values(id=user.id, email=user.email)
            stmt = stmt.on_conflict_do_update(index_elements=[User.id], set_={"email": user.email})
            await db.execute(stmt)
            await db.commit()
        _known_users.add(user.id)
    except Exception as e:  # noqa: BLE001 — auth must not fail because of a DB hiccup
        logger.warning("User upsert failed for %s: %s", user.id, e)


async def get_current_user_optional(request: Request) -> AuthUser | None:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        request.state.auth_error = "No Bearer token found"
        return None
    
    result = _decode_token(auth[7:].strip())
    if isinstance(result, tuple):
        request.state.auth_error = result[1]
        return None
        
    user = result
    if user:
        await _upsert_user(user)
    return user


async def get_current_user_required(request: Request) -> AuthUser:
    user = await get_current_user_optional(request)
    if user is None:
        reason = getattr(request.state, "auth_error", "Authentication required")
        raise HTTPException(status_code=401, detail=reason)
    return user


def get_device_id(request: Request) -> str:
    return request.headers.get("X-Device-Id", "").strip()[:64]


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
