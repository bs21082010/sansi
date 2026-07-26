from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.cache import cache
from app.models.user import User
from app.models.badge import UserScore
from app.models.marketplace import MentorProfile

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("/contributors")
async def contributor_leaderboard(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserScore).order_by(UserScore.total_points.desc()).limit(limit)
    )
    rows = result.scalars().all()
    board = []
    for row in rows:
        user = await db.execute(select(User).where(User.id == row.user_id))
        u = user.scalar_one_or_none()
        if u:
            board.append({
                "rank": len(board) + 1,
                "user_id": str(u.id),
                "username": u.username,
                "display_name": u.display_name,
                "avatar_url": u.avatar_url,
                "score": {
                    "total_points": row.total_points,
                    "texts_uploaded": row.texts_uploaded,
                    "annotations_made": row.annotations_made,
                    "lessons_completed": row.lessons_completed,
                },
            })
    return board


@router.get("/mentors")
async def mentor_leaderboard(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MentorProfile).order_by(MentorProfile.thanks_count.desc()).limit(limit)
    )
    return [
        {
            "rank": i + 1,
            "user_id": str(m.user_id),
            "headline": m.headline,
            "rating": m.rating,
            "thanks_count": m.thanks_count,
            "total_sessions": m.total_sessions,
            "badge": m.badge,
        }
        for i, m in enumerate(result.scalars().all())
    ]
