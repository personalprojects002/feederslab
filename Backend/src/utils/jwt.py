"""JWT verification helpers used by authentication boundaries."""

import json
import os
import urllib.request
from typing import Any, cast

import jwt
from jwt.algorithms import OKPAlgorithm, RSAAlgorithm

from src.config.settings import settings
from src.exceptions import UnauthorizedError


_JWKS_CACHE: dict[str, Any] = {"keys": None, "fetched_at": 0}
_JWKS_CACHE_TTL_SECONDS = 300


def _now_seconds() -> int:
    # Simple monotonic-ish timer for cache TTL.
    return int(os.times().elapsed)


def _get_jwks() -> dict[str, Any]:
    """Fetch and cache JWKS from the Better Auth server."""
    if _JWKS_CACHE["keys"] is not None:
        age = _now_seconds() - _JWKS_CACHE["fetched_at"]
        if age < _JWKS_CACHE_TTL_SECONDS:
            return cast(dict[str, Any], _JWKS_CACHE["keys"])

    app_url = settings.app_url.strip()
    jwks_url = f"{app_url}/api/better-auth/jwks"

    req = urllib.request.Request(
        jwks_url,
        headers={"Accept": "application/json"},
    )

    with urllib.request.urlopen(req, timeout=5) as resp:
        payload = json.loads(resp.read().decode("utf-8"))

    _JWKS_CACHE["keys"] = payload
    _JWKS_CACHE["fetched_at"] = _now_seconds()
    return cast(dict[str, Any], payload)


def _verify_with_jwks(token: str) -> dict[str, Any]:
    """Verify token signature using the Better Auth JWKS endpoint."""
    try:
        header = jwt.get_unverified_header(token)
    except Exception as e:
        raise UnauthorizedError(
            f"Token verification failed: malformed header ({str(e)})"
        )

    alg = cast(str | None, header.get("alg"))
    kid = cast(str | None, header.get("kid"))

    jwks = _get_jwks()
    keys = cast(list[dict[str, Any]], jwks.get("keys") or [])

    if not keys:
        raise UnauthorizedError(
            "Invalid token (JWKS verification failed): No keys available from JWKS endpoint"
        )

    if kid:
        matching_keys = [k for k in keys if k.get("kid") == kid]
        if matching_keys:
            keys = matching_keys
        # If no matching kid found, try all keys as fallback

    last_error: str = "Invalid token"
    for jwk in keys:
        try:
            kty = jwk.get("kty")

            # Handle OKP keys (EdDSA, Ed25519, Ed448)
            if kty == "OKP":
                public_key = OKPAlgorithm.from_jwk(jwk)
            # Handle RSA keys
            elif kty == "RSA":
                public_key = RSAAlgorithm.from_jwk(jwk)
            else:
                # Skip unknown key types
                last_error = f"Unsupported key type: {kty}"
                continue

            algorithms = [alg] if isinstance(alg, str) and alg else None
            decoded = jwt.decode(
                token,
                key=cast(Any, public_key),
                algorithms=algorithms,
                leeway=settings.refresh_token_leeway_seconds,
                options={"verify_aud": False},
            )
            return decoded
        except Exception as e:
            last_error = str(e)
            continue

    raise UnauthorizedError(f"Invalid token (JWKS verification failed): {last_error}")


def verify_jwt_token(token: str) -> dict[str, Any]:
    """Verify a JWT and return payload data."""
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")

        if alg == "HS256":
            try:
                return jwt.decode(
                    token,
                    str(settings.better_auth_secret),
                    algorithms=["HS256"],
                    leeway=settings.refresh_token_leeway_seconds,
                    options={"verify_aud": False},
                )
            except jwt.exceptions.ExpiredSignatureError:
                raise UnauthorizedError("Token has expired")
            except jwt.exceptions.InvalidTokenError:
                pass

        return _verify_with_jwks(token)

    except UnauthorizedError:
        raise
    except jwt.exceptions.ExpiredSignatureError:
        raise UnauthorizedError("Token has expired")
    except Exception as e:
        raise UnauthorizedError(f"Token verification failed: {str(e)}")


def extract_user_email(payload: dict[str, Any]) -> str:
    """Extract normalized email from supported JWT payload shapes."""
    email = (
        cast(str | None, payload.get("email"))
        or cast(dict[str, Any], payload.get("user") or {}).get("email")
        or cast(str | None, payload.get("userEmail"))
    )

    if not email:
        raise UnauthorizedError("Email not found in token payload")

    return str(email).strip().lower()


def extract_user_id(payload: dict[str, Any]) -> str:
    """Extract user id from supported payload keys."""
    user_id = cast(str | None, payload.get("userId")) or cast(
        str | None, payload.get("sub")
    )

    if not user_id:
        raise UnauthorizedError("User ID not found in token")

    return user_id