from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.core.database import get_db
from app.core.dependencies import require_role
from app.models.user import User
from app.models.badge import Badge
from app.models.content import Course, CorpusText
from app.schemas.user import UserOut

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return [UserOut.model_validate(u) for u in result.scalars().all()]


@router.patch("/users/{user_id}/role")
async def set_role(
    user_id: str,
    role: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    valid_roles = ["learner", "contributor", "moderator", "admin"]
    if role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Choose from: {valid_roles}")
    await db.execute(update(User).where(User.id == user_id).values(role=role))
    await db.commit()
    return {"message": f"User {user_id} role updated to {role}"}


@router.post("/badges/assign")
async def assign_badge(
    user_id: str, name: str, description: str, icon: str = "award",
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    badge = Badge(user_id=user_id, name=name, description=description, icon=icon)
    db.add(badge)
    await db.flush()
    await db.refresh(badge)
    return {"id": str(badge.id), "name": name}
