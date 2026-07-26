from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.cache import cache
from app.models.user import User
from app.models.badge import UserScore
from app.models.marketplace import TutorProfile

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("/contributors")
@cache(prefix="leaderboard_contributors", ttl=120)
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


@router.get("/tutors")
@cache(prefix="leaderboard_tutors", ttl=300)
async def tutor_leaderboard(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TutorProfile).order_by(TutorProfile.rating.desc()).limit(limit)
    )
    return [
        {
            "rank": i + 1,
            "user_id": str(t.user_id),
            "headline": t.headline,
            "rating": t.rating,
            "review_count": t.review_count,
            "total_sessions": t.total_sessions,
            "hourly_rate": t.hourly_rate,
            "badge": t.badge,
        }
        for i, t in enumerate(result.scalars().all())
    ]
