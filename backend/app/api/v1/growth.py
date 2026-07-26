from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.core.cache import cache
from app.models.user import User
from app.models.badge import Badge, UserScore
from app.models.growth import Challenge, ChallengeProgress, BadgeRule, Event
from app.schemas.content import (
    ChallengeCreate, ChallengeOut, EventOut, BadgeRuleOut,
)

router = APIRouter(prefix="/community", tags=["growth"])


# ── Badge Rules (Auto-badging engine) ──

@router.get("/badge-rules", response_model=list[BadgeRuleOut])
async def list_badge_rules(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BadgeRule).where(BadgeRule.is_auto == True))
    return [BadgeRuleOut.model_validate(r) for r in result.scalars().all()]


@router.post("/badge-rules", response_model=BadgeRuleOut, status_code=201)
async def create_badge_rule(
    name: str, description: str, icon: str = "award",
    category: str = "contribution", condition_type: str = "points_total",
    condition_threshold: int = 100,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    rule = BadgeRule(
        name=name, description=description, icon=icon,
        category=category, condition_type=condition_type,
        condition_threshold=condition_threshold,
    )
    db.add(rule)
    await db.flush()
    await db.refresh(rule)
    return BadgeRuleOut.model_validate(rule)


@router.post("/badges/check-auto")
async def check_auto_badges(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rules = await db.execute(
        select(BadgeRule).where(BadgeRule.is_auto == True)
    )
    score = await db.execute(
        select(UserScore).where(UserScore.user_id == current_user.id)
    )
    score_row = score.scalar_one_or_none()
    awarded = []
    for rule in rules.scalars().all():
        existing = await db.execute(
            select(Badge).where(
                Badge.user_id == current_user.id,
                Badge.name == rule.name,
            )
        )
        if existing.scalar_one_or_none():
            continue

        met = False
        if score_row:
            if rule.condition_type == "points_total":
                met = score_row.total_points >= rule.condition_threshold
            elif rule.condition_type == "texts_uploaded":
                met = score_row.texts_uploaded >= rule.condition_threshold
            elif rule.condition_type == "annotations":
                met = score_row.annotations_made >= rule.condition_threshold

        if met:
            badge = Badge(
                user_id=current_user.id,
                name=rule.name,
                description=rule.description,
                icon=rule.icon,
                category=rule.category,
            )
            db.add(badge)
            awarded.append(rule.name)

    await db.flush()
    return {"awarded": awarded}


# ── Challenges ──

@router.get("/challenges", response_model=list[ChallengeOut])
async def list_challenges(
    active_only: bool = Query(True),
    seasonal: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Challenge)
    if active_only:
        query = query.where(Challenge.is_active == True)
    if seasonal:
        query = query.where(Challenge.season == seasonal)
    result = await db.execute(query.order_by(Challenge.starts_at.desc()))
    return [ChallengeOut.model_validate(c) for c in result.scalars().all()]


@router.post("/challenges", response_model=ChallengeOut, status_code=201)
async def create_challenge(
    body: ChallengeCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    challenge = Challenge(**body.model_dump())
    db.add(challenge)
    await db.flush()
    await db.refresh(challenge)
    return ChallengeOut.model_validate(challenge)


@router.post("/challenges/{challenge_id}/join")
async def join_challenge(
    challenge_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    challenge = await db.execute(select(Challenge).where(Challenge.id == challenge_id))
    if not challenge.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Challenge not found")

    existing = await db.execute(
        select(ChallengeProgress).where(
            ChallengeProgress.challenge_id == challenge_id,
            ChallengeProgress.user_id == current_user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already joined")

    progress = ChallengeProgress(challenge_id=challenge_id, user_id=current_user.id)
    db.add(progress)
    await db.flush()
    return {"joined": True}


@router.post("/challenges/{challenge_id}/progress")
async def update_challenge_progress(
    challenge_id: UUID,
    delta: int = Query(1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ChallengeProgress).where(
            ChallengeProgress.challenge_id == challenge_id,
            ChallengeProgress.user_id == current_user.id,
        )
    )
    cp = result.scalar_one_or_none()
    if not cp:
        raise HTTPException(status_code=404, detail="Not joined this challenge")

    challenge = await db.execute(select(Challenge).where(Challenge.id == challenge_id))
    c = challenge.scalar_one_or_none()

    cp.progress += delta
    if not cp.completed and cp.progress >= c.goal:
        cp.completed = True
        cp.completed_at = datetime.now(timezone.utc)
        score = await db.execute(
            select(UserScore).where(UserScore.user_id == current_user.id)
        )
        s = score.scalar_one_or_none()
        if s:
            s.total_points += c.points_reward
        if c.badge_reward:
            badge = Badge(
                user_id=current_user.id,
                name=c.badge_reward,
                description=c.description[:500],
                icon="award",
                category="challenge",
            )
            db.add(badge)

    await db.flush()
    return {
        "progress": cp.progress,
        "goal": c.goal,
        "completed": cp.completed,
    }


# ── Events ──

@router.get("/events", response_model=list[EventOut])
async def list_events(active_only: bool = Query(True), db: AsyncSession = Depends(get_db)):
    query = select(Event)
    if active_only:
        query = query.where(Event.is_active == True)
    result = await db.execute(query.order_by(Event.starts_at.desc()))
    return [EventOut.model_validate(e) for e in result.scalars().all()]
