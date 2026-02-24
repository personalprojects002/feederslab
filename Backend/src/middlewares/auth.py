from typing import Annotated
from datetime import datetime, timezone

from fastapi import Depends, Header, HTTPException, status
from sqlmodel import Session, select

from src.config.db import get_session


def get_current_user_email(
    authorization: Annotated[str | None, Header()] = None,
    db_session: Session = Depends(get_session),
) -> str:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not Authorized"
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected: Bearer <token>",
        )

    token = authorization.replace("Bearer ", "").strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is missing"
        )

    print(f"🔍 Validating session token: {token[:20]}...")
    try:
        from sqlalchemy import text
        query = text("""
            SELECT s.*, u.email, u.name
            FROM session s
            JOIN "user" u ON s."userId" = u.id
            WHERE s.token = :token
            AND s."expiresAt" > NOW()
            LIMIT 1
        """)
        
        result = db_session.execute(query, {"token": token}).fetchone()
        
        if not result:
            print(f"❌ Session not found or expired")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session"
            )
        
        # Extract email from result (it's the second-to-last column after all session columns)
        email = result[-2]  # -2 because we selected email, then name
        print(f"✅ Session validated for user: {email}")
        return email
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Database error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Session validation failed: {str(e)}"
        )


# Type alias for dependency injection
# Makes code cleaner and matches TypeScript pattern
#
# Equivalent to TypeScript:
#     type CurrentUser = string;  // The authenticated user's email
#
# Usage:
#     def my_route(user_email: CurrentUser):
#         # user_email is automatically injected and verified
CurrentUser = Annotated[str, Depends(get_current_user_email)]
