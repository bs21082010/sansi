from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

ROLE_HIERARCHY = {"learner": 0, "contributor": 1, "moderator": 2, "admin": 3}


async def get_current_user(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.split(" ", 1)[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


def require_role(minimum_role: str):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if ROLE_HIERARCHY.get(current_user.role, -1) < ROLE_HIERARCHY.get(minimum_role, 0):
            raise HTTPException(
                status_code=403,
                detail=f"Requires role '{minimum_role}' or higher",
            )
        return current_user

    return role_checker
