from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.marketplace import (
    TutorProfile, Session, Review, Streak, MentorRequest, Report,
)
from app.schemas.content import (
    TutorProfileCreate, TutorProfileOut,
    SessionCreate, SessionOut,
    ReviewCreate, ReviewOut,
    StreakOut,
    MentorRequestCreate, MentorRequestOut,
    ReportCreate, ReportOut,
)

router = APIRouter(prefix="/marketplace", tags=["marketplace"])


# ── Tutor Profiles ──

@router.get("/tutors", response_model=list[TutorProfileOut])
async def list_tutors(
    language: str | None = Query(None),
    specialization: str | None = Query(None),
    min_rating: float = Query(0.0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    query = select(TutorProfile).where(TutorProfile.is_available == True)
    if language:
        query = query.where(TutorProfile.languages.contains([language]))
    if specialization:
        query = query.where(TutorProfile.specializations.contains([specialization]))
    if min_rating > 0:
        query = query.where(TutorProfile.rating >= min_rating)

    result = await db.execute(query.order_by(TutorProfile.rating.desc()))
    return [TutorProfileOut.model_validate(t) for t in result.scalars().all()]


@router.post("/tutors/profile", response_model=TutorProfileOut)
async def create_tutor_profile(
    body: TutorProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("contributor")),
):
    existing = await db.execute(
        select(TutorProfile).where(TutorProfile.user_id == current_user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Profile already exists")

    current_user.is_tutor = True
    profile = TutorProfile(user_id=current_user.id, **body.model_dump())
    db.add(profile)
    await db.flush()
    await db.refresh(profile)
    return TutorProfileOut.model_validate(profile)


@router.get("/tutors/me", response_model=TutorProfileOut)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(TutorProfile).where(TutorProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Tutor profile not found")
    return TutorProfileOut.model_validate(profile)


# ── Sessions ──

@router.post("/sessions", response_model=SessionOut, status_code=201)
async def book_session(
    body: SessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tutor = await db.execute(select(TutorProfile).where(TutorProfile.user_id == body.tutor_id))
    tutor_row = tutor.scalar_one_or_none()
    if not tutor_row:
        raise HTTPException(status_code=404, detail="Tutor not found")

    session = Session(
        tutor_id=body.tutor_id,
        learner_id=current_user.id,
        session_type=body.session_type,
        scheduled_at=body.scheduled_at,
        duration_minutes=body.duration_minutes,
        amount=tutor_row.hourly_rate * (body.duration_minutes / 60),
    )
    db.add(session)
    tutor_row.total_sessions += 1
    await db.flush()
    await db.refresh(session)
    return SessionOut.model_validate(session)


@router.get("/sessions", response_model=list[SessionOut])
async def list_sessions(
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Session).where(
        (Session.learner_id == current_user.id) | (Session.tutor_id == current_user.id)
    )
    if status:
        query = query.where(Session.status == status)
    result = await db.execute(query.order_by(Session.scheduled_at.desc()))
    return [SessionOut.model_validate(s) for s in result.scalars().all()]


# ── Reviews ──

@router.post("/reviews", response_model=ReviewOut, status_code=201)
async def create_review(
    body: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = await db.execute(
        select(Session).where(
            Session.id == body.session_id,
            Session.learner_id == current_user.id,
        )
    )
    if not session.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Session not found or not yours")

    review = Review(
        session_id=body.session_id,
        reviewer_id=current_user.id,
        tutor_id=body.tutor_id,
        rating=body.rating,
        content=body.content,
    )
    db.add(review)

    stats = await db.execute(
        select(func.avg(Review.rating), func.count(Review.id)).where(
            Review.tutor_id == body.tutor_id
        )
    )
    avg_rating, count = stats.one()
    await db.execute(
        select(TutorProfile).where(TutorProfile.user_id == body.tutor_id)
    )
    tutor_result = await db.execute(
        select(TutorProfile).where(TutorProfile.user_id == body.tutor_id)
    )
    tutor_row = tutor_result.scalar_one_or_none()
    if tutor_row:
        tutor_row.rating = round(float(avg_rating or body.rating), 2)
        tutor_row.review_count = count or 1

    user_result = await db.execute(select(User).where(User.id == body.tutor_id))
    user_row = user_result.scalar_one_or_none()
    if user_row:
        user_row.tutor_rating = round(float(avg_rating or body.rating), 2)

    await db.flush()
    await db.refresh(review)
    return ReviewOut.model_validate(review)


# ── Streaks ──

@router.get("/streaks", response_model=StreakOut)
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
    return StreakOut.model_validate(streak)


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
            return StreakOut.model_validate(streak)
        elif diff_hours < 48:
            streak.current_streak += 1
        else:
            if streak.streak_freeze:
                streak.streak_freeze = False
                streak.current_streak += 1
            else:
                streak.current_streak = 1
    else:
        streak.current_streak = 1

    streak.last_activity = now
    streak.longest_streak = max(streak.longest_streak, streak.current_streak)
    await db.flush()
    return StreakOut.model_validate(streak)


# ── Mentor Requests ──

@router.post("/mentor-requests", response_model=MentorRequestOut, status_code=201)
async def create_mentor_request(
    body: MentorRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tutor = await db.execute(select(User).where(User.id == body.tutor_id, User.is_mentor == True))
    if not tutor.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Mentor not found")

    req = MentorRequest(learner_id=current_user.id, **body.model_dump())
    db.add(req)
    await db.flush()
    await db.refresh(req)
    return MentorRequestOut.model_validate(req)


@router.get("/mentor-requests", response_model=list[MentorRequestOut])
async def list_mentor_requests(
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(MentorRequest).where(
        (MentorRequest.learner_id == current_user.id) |
        (MentorRequest.tutor_id == current_user.id)
    )
    if status:
        query = query.where(MentorRequest.status == status)
    result = await db.execute(query.order_by(MentorRequest.created_at.desc()))
    return [MentorRequestOut.model_validate(r) for r in result.scalars().all()]


# ── Reports (Moderation) ──

@router.post("/reports", response_model=ReportOut, status_code=201)
async def create_report(
    body: ReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = Report(reporter_id=current_user.id, **body.model_dump())
    db.add(report)
    await db.flush()
    await db.refresh(report)
    return ReportOut.model_validate(report)


@router.get("/reports", response_model=list[ReportOut])
async def list_reports(
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    moderator: User = Depends(require_role("moderator")),
):
    query = select(Report)
    if status:
        query = query.where(Report.status == status)
    result = await db.execute(query.order_by(Report.created_at.desc()))
    return [ReportOut.model_validate(r) for r in result.scalars().all()]


@router.patch("/reports/{report_id}/review")
async def review_report(
    report_id: UUID,
    action: str = "dismissed",
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
