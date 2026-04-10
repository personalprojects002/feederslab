from fastapi import APIRouter, status
from src.middlewares.auth import CurrentUser

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    user_email: CurrentUser,
):
    # JWT-only mode does not persist refresh state on backend. Better Auth
    # session/JWT invalidation is handled by frontend auth provider.
    return {
        "message": "Successfully logged out",
        "email": user_email,
    }