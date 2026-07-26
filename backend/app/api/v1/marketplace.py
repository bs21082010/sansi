from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.marketplace import (
    MentorProfile, MentorshipSession, ThankYou, Streak, MentorRequest, Report,
)

router = APIRouter(prefix="/community", tags=["mentors"])


# ── Mentor Profiles ──

@router.get("/mentors")
async def list_mentors(
    language: str | None = Query(None),
    specialization: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(MentorProfile).where(MentorProfile.is_available == True)
    if language:
        query = query.where(MentorProfile.languages.contains([language]))
    if specialization:
        query = query.where(MentorProfile.specializations.contains([specialization]))
    result = await db.execute(query.order_by(MentorProfile.thanks_count.desc()))
    mentors = []
    for m in result.scalars().all():
        user = await db.execute(select(User).where(User.id == m.user_id))
        u = user.scalar_one()
        mentors.append({
            "id": str(m.id),
            "user_id": str(m.user_id),
            "username": u.username,
            "display_name": u.display_name,
            "headline": m.headline,
            "bio": m.bio,
            "languages": m.languages,
            "specializations": m.specializations,
            "total_sessions": m.total_sessions,
            "rating": m.rating,
            "thanks_count": m.thanks_count,
            "badge": m.badge,
        })
    return mentors


@router.post("/mentors/register")
async def register_as_mentor(
    headline: str = "", bio: str = "",
    languages: str = '["sa","hi","en"]',
    specializations: str = '["grammar"]',
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("contributor")),
):
    import json
    existing = await db.execute(
        select(MentorProfile).where(MentorProfile.user_id == current_user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already registered as mentor")

    current_user.is_mentor = True
    profile = MentorProfile(
        user_id=current_user.id,
        headline=headline,
        bio=bio,
        languages=json.loads(languages),
        specializations=json.loads(specializations),
    )
    db.add(profile)
    await db.flush()
    await db.refresh(profile)
    return {"registered": True, "mentor_id": str(profile.id)}


# ── Mentorship Sessions ──

@router.post("/sessions", status_code=201)
async def request_session(
    mentor_id: UUID,
    session_type: str = "video",
    scheduled_at: str = "",
    duration_minutes: int = 60,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mentor = await db.execute(
        select(MentorProfile).where(MentorProfile.user_id == mentor_id)
    )
    if not mentor.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Mentor not found")

    session = MentorshipSession(
        mentor_id=mentor_id,
        learner_id=current_user.id,
        session_type=session_type,
        duration_minutes=duration_minutes,
    )
    db.add(session)
    await db.flush()
    return {"session_id": str(session.id), "status": "pending"}


@router.get("/sessions")
async def list_sessions(
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(MentorshipSession).where(
        (MentorshipSession.learner_id == current_user.id) |
        (MentorshipSession.mentor_id == current_user.id)
    )
    if status:
        query = query.where(MentorshipSession.status == status)
    result = await db.execute(query.order_by(MentorshipSession.scheduled_at.desc()))
    sessions = []
    for s in result.scalars().all():
        sessions.append({
            "id": str(s.id),
            "mentor_id": str(s.mentor_id),
            "learner_id": str(s.learner_id),
            "status": s.status,
            "session_type": s.session_type,
            "duration_minutes": s.duration_minutes,
        })
    return sessions


# ── Thank You (instead of paid reviews) ──

@router.post("/thanks", status_code=201)
async def send_thanks(
    session_id: UUID, mentor_id: UUID,
    rating: int = 5, message: str = "",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = await db.execute(
        select(MentorshipSession).where(
            MentorshipSession.id == session_id,
            MentorshipSession.learner_id == current_user.id,
        )
    )
    if not session.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Session not found")

    thanks = ThankYou(
        session_id=session_id, giver_id=current_user.id,
        mentor_id=mentor_id, rating=rating, message=message,
    )
    db.add(thanks)

    mentor = await db.execute(
        select(MentorProfile).where(MentorProfile.user_id == mentor_id)
    )
    m = mentor.scalar_one_or_none()
    if m:
        m.thanks_count += 1
        avg = await db.execute(
            select(func.avg(ThankYou.rating)).where(ThankYou.mentor_id == mentor_id)
        )
        m.rating = round(float(avg.scalar() or rating), 2)

    await db.flush()
    return {"thanks": True, "rating": rating}


# ── Streaks ──

@router.get("/streaks")
async def get_streak(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Streak).where(Streak.user_id == current_user.id)
    )
    streak = result.scalar_one_or_none()
    if not streak:
        streak = Streak(user_id=current_user.id)
        db.add(streak)
        await db.flush()
    return {
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "streak_freeze": streak.streak_freeze,
        "last_activity": streak.last_activity,
    }


@router.post("/streaks/tick")
async def tick_streak(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Streak).where(Streak.user_id == current_user.id)
    )
    streak = result.scalar_one_or_none()
    if not streak:
        streak = Streak(user_id=current_user.id)
        db.add(streak)

    now = datetime.now(timezone.utc)
    if streak.last_activity:
        diff_hours = (now - streak.last_activity).total_seconds() / 3600
        if diff_hours < 24:
            return {"current_streak": streak.current_streak}
        elif diff_hours < 48:
            streak.current_streak += 1
        else:
            streak.current_streak = 1
    else:
        streak.current_streak = 1

    streak.last_activity = now
    streak.longest_streak = max(streak.longest_streak, streak.current_streak)
    await db.flush()
    return {"current_streak": streak.current_streak}


# ── Mentor Requests ──

@router.post("/mentor-requests", status_code=201)
async def create_mentor_request(
    mentor_id: UUID, question: str, context: str = "",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mentor = await db.execute(
        select(User).where(User.id == mentor_id, User.is_mentor == True)
    )
    if not mentor.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Mentor not found")

    req = MentorRequest(
        learner_id=current_user.id, mentor_id=mentor_id,
        question=question, context=context,
    )
    db.add(req)
    await db.flush()
    return {"request_id": str(req.id), "status": "open"}


@router.get("/mentor-requests")
async def list_mentor_requests(
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(MentorRequest).where(
        (MentorRequest.learner_id == current_user.id) |
        (MentorRequest.mentor_id == current_user.id)
    )
    if status:
        query = query.where(MentorRequest.status == status)
    result = await db.execute(query.order_by(MentorRequest.created_at.desc()))
    requests = []
    for r in result.scalars().all():
        requests.append({
            "id": str(r.id), "learner_id": str(r.learner_id),
            "mentor_id": str(r.mentor_id), "status": r.status,
            "question": r.question, "context": r.context,
        })
    return requests


# ── Reports (Moderation) ──

@router.post("/reports", status_code=201)
async def create_report(
    target_type: str, target_id: UUID, reason: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = Report(
        reporter_id=current_user.id,
        target_type=target_type, target_id=target_id, reason=reason,
    )
    db.add(report)
    await db.flush()
    return {"report_id": str(report.id), "status": "pending"}


@router.get("/reports")
async def list_reports(
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    moderator: User = Depends(require_role("moderator")),
):
    query = select(Report)
    if status:
        query = query.where(Report.status == status)
    result = await db.execute(query.order_by(Report.created_at.desc()))
    reports = []
    for r in result.scalars().all():
        reports.append({
            "id": str(r.id), "reporter_id": str(r.reporter_id),
            "target_type": r.target_type, "target_id": str(r.target_id),
            "reason": r.reason, "status": r.status,
        })
    return reports


@router.patch("/reports/{report_id}/review")
async def review_report(
    report_id: UUID, action: str = "dismissed",
    db: AsyncSession = Depends(get_db),
    moderator: User = Depends(require_role("moderator")),
):
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    report.status = "reviewed" if action == "reviewed" else "dismissed"
    report.reviewed_by = moderator.id
    await db.flush()
    return {"status": report.status}
