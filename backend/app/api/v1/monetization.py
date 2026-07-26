from uuid import UUID
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.core.cache import cache
from app.models.user import User
from app.models.marketplace import Session, TutorProfile
from app.models.monetization import (
    SubscriptionPlan, UserSubscription, PremiumBundle, TutorPayout, RevenueShare,
)
from app.schemas.content import (
    SubscriptionPlanOut, UserSubscriptionOut,
    PremiumBundleCreate, PremiumBundleOut,
    TutorPayoutOut,
)

router = APIRouter(prefix="/monetization", tags=["monetization"])


# ── Subscription Plans ──

@router.get("/plans", response_model=list[SubscriptionPlanOut])
@cache(prefix="plans", ttl=600)
async def list_plans(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SubscriptionPlan).where(SubscriptionPlan.is_active == True)
    )
    return [SubscriptionPlanOut.model_validate(p) for p in result.scalars().all()]


@router.post("/plans", response_model=SubscriptionPlanOut, status_code=201)
async def create_plan(
    name: str, description: str, price_monthly: float, price_yearly: float,
    tier: str = "basic", features: str = "{}",
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    import json
    plan = SubscriptionPlan(
        name=name, description=description,
        price_monthly=price_monthly, price_yearly=price_yearly,
        tier=tier, features=json.loads(features),
    )
    db.add(plan)
    await db.flush()
    await db.refresh(plan)
    return SubscriptionPlanOut.model_validate(plan)


@router.post("/subscribe", response_model=UserSubscriptionOut)
async def subscribe(
    plan_id: UUID,
    billing: str = "monthly",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id))
    plan_row = plan.scalar_one_or_none()
    if not plan_row:
        raise HTTPException(status_code=404, detail="Plan not found")

    existing = await db.execute(
        select(UserSubscription).where(UserSubscription.user_id == current_user.id)
    )
    ex = existing.scalar_one_or_none()
    if ex:
        ex.plan_id = plan_id
        ex.status = "active"
        ex.current_period_start = datetime.now(timezone.utc)
        days = 30 if billing == "monthly" else 365
        ex.current_period_end = datetime.now(timezone.utc) + timedelta(days=days)
        await db.flush()
        await db.refresh(ex)
        return UserSubscriptionOut.model_validate(ex)

    days = 30 if billing == "monthly" else 365
    sub = UserSubscription(
        user_id=current_user.id, plan_id=plan_id,
        current_period_start=datetime.now(timezone.utc),
        current_period_end=datetime.now(timezone.utc) + timedelta(days=days),
    )
    db.add(sub)
    await db.flush()
    await db.refresh(sub)
    return UserSubscriptionOut.model_validate(sub)


@router.get("/subscription", response_model=UserSubscriptionOut)
async def get_subscription(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(UserSubscription).where(UserSubscription.user_id == current_user.id)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="No active subscription")
    return UserSubscriptionOut.model_validate(sub)


# ── Premium Bundles ──

@router.get("/bundles", response_model=list[PremiumBundleOut])
@cache(prefix="bundles", ttl=600)
async def list_bundles(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PremiumBundle).where(PremiumBundle.is_active == True)
    )
    return [PremiumBundleOut.model_validate(b) for b in result.scalars().all()]


@router.post("/bundles", response_model=PremiumBundleOut, status_code=201)
async def create_bundle(
    body: PremiumBundleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    bundle = PremiumBundle(**body.model_dump(), created_by=current_user.id)
    db.add(bundle)
    await db.flush()
    await db.refresh(bundle)
    return PremiumBundleOut.model_validate(bundle)


# ── Tutor Revenue & Payouts ──

@router.get("/tutor/revenue")
async def get_tutor_revenue(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_tutor:
        raise HTTPException(status_code=403, detail="Not a tutor")

    shares = await db.execute(
        select(func.sum(RevenueShare.tutor_amount)).where(
            RevenueShare.tutor_id == current_user.id
        )
    )
    total_revenue = shares.scalar() or 0.0

    payouts = await db.execute(
        select(TutorPayout).where(TutorPayout.tutor_id == current_user.id)
        .order_by(TutorPayout.created_at.desc())
    )

    return {
        "total_revenue": round(total_revenue, 2),
        "pending_payouts": round(
            sum(p.tutor_share for p in payouts.scalars().all() if p.status == "pending"), 2
        ),
    }


@router.get("/tutor/payouts", response_model=list[TutorPayoutOut])
async def list_payouts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(TutorPayout).where(TutorPayout.tutor_id == current_user.id)
        .order_by(TutorPayout.created_at.desc())
    )
    return [TutorPayoutOut.model_validate(p) for p in result.scalars().all()]


@router.post("/sessions/{session_id}/settle")
async def settle_session_revenue(
    session_id: UUID,
    platform_percent: float = 15.0,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    existing = await db.execute(
        select(RevenueShare).where(RevenueShare.session_id == session_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already settled")

    tutor_percent = 100.0 - platform_percent
    share = RevenueShare(
        tutor_id=session.tutor_id,
        session_id=session_id,
        session_amount=session.amount,
        platform_percent=platform_percent,
        tutor_percent=tutor_percent,
        platform_amount=round(session.amount * platform_percent / 100, 2),
        tutor_amount=round(session.amount * tutor_percent / 100, 2),
    )
    db.add(share)

    profile = await db.execute(
        select(TutorProfile).where(TutorProfile.user_id == session.tutor_id)
    )
    tp = profile.scalar_one_or_none()
    if tp:
        tp.total_sessions += 1

    await db.flush()
    return {
        "platform": share.platform_amount,
        "tutor": share.tutor_amount,
    }
