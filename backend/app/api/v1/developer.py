import secrets
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.core.cache import cache
from app.models.user import User
from app.models.developer import DeveloperApp, APIUsageLog, APIEndpoint
from app.schemas.content import DeveloperAppCreate, DeveloperAppOut, APIEndpointOut

router = APIRouter(prefix="/developer", tags=["developer"])

RATE_PLANS = {
    "free": {"requests_per_hour": 100, "endpoints": "basic"},
    "basic": {"requests_per_hour": 1000, "endpoints": "standard"},
    "pro": {"requests_per_hour": 10000, "endpoints": "all"},
    "enterprise": {"requests_per_hour": 100000, "endpoints": "all"},
}


# ── Developer Apps ──

@router.post("/apps", response_model=DeveloperAppOut, status_code=201)
async def create_app(
    body: DeveloperAppCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    api_key = f"sansi_{secrets.token_hex(32)}"
    prefix = api_key[:12]

    app = DeveloperApp(
        user_id=current_user.id,
        name=body.name,
        description=body.description,
        api_key=api_key,
        api_key_prefix=prefix,
        rate_plan="free",
        requests_per_hour=RATE_PLANS["free"]["requests_per_hour"],
    )
    db.add(app)
    await db.flush()
    await db.refresh(app)
    return DeveloperAppOut.model_validate(app)


@router.get("/apps", response_model=list[DeveloperAppOut])
async def list_apps(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(DeveloperApp).where(DeveloperApp.user_id == current_user.id)
    )
    return [DeveloperAppOut.model_validate(a) for a in result.scalars().all()]


@router.delete("/apps/{app_id}", status_code=204)
async def delete_app(
    app_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(DeveloperApp).where(
            DeveloperApp.id == app_id,
            DeveloperApp.user_id == current_user.id,
        )
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    app.is_active = False
    await db.flush()


@router.post("/apps/{app_id}/upgrade")
async def upgrade_app_plan(
    app_id: UUID,
    plan: str = "basic",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if plan not in RATE_PLANS:
        raise HTTPException(status_code=400, detail=f"Invalid plan. Options: {list(RATE_PLANS.keys())}")

    result = await db.execute(
        select(DeveloperApp).where(
            DeveloperApp.id == app_id,
            DeveloperApp.user_id == current_user.id,
        )
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")

    app.rate_plan = plan
    app.requests_per_hour = RATE_PLANS[plan]["requests_per_hour"]
    await db.flush()
    return {"plan": plan, "requests_per_hour": app.requests_per_hour}


# ── API Key Authentication ──

async def get_app_from_api_key(x_api_key: str = Header(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(DeveloperApp).where(
            DeveloperApp.api_key == x_api_key,
            DeveloperApp.is_active == True,
        )
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return app


@router.get("/usage")
async def get_usage(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    apps = await db.execute(
        select(DeveloperApp).where(DeveloperApp.user_id == current_user.id)
    )
    app_ids = [a.id for a in apps.scalars().all()]
    if not app_ids:
        return {"total_requests": 0, "apps": []}

    usage = []
    for app_id in app_ids:
        count = await db.execute(
            select(func.count()).select_from(APIUsageLog).where(
                APIUsageLog.app_id == app_id
            )
        )
        app = await db.execute(select(DeveloperApp).where(DeveloperApp.id == app_id))
        a = app.scalar_one()
        usage.append({
            "app_name": a.name,
            "api_key_prefix": a.api_key_prefix,
            "plan": a.rate_plan,
            "total_requests": count.scalar() or 0,
        })

    total = sum(u["total_requests"] for u in usage)
    return {"total_requests": total, "apps": usage}


# ── API Endpoints Registry (Open API docs) ──

@router.get("/endpoints", response_model=list[APIEndpointOut])
@cache(prefix="api_endpoints", ttl=600)
async def list_endpoints(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(APIEndpoint).where(APIEndpoint.is_active == True)
        .order_by(APIEndpoint.category, APIEndpoint.path)
    )
    return [APIEndpointOut.model_validate(e) for e in result.scalars().all()]


@router.post("/endpoints", response_model=APIEndpointOut, status_code=201)
async def register_endpoint(
    path: str, method: str, description: str, category: str = "corpus",
    min_plan: str = "free",
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    ep = APIEndpoint(
        path=path, method=method.upper(), description=description,
        category=category, min_plan=min_plan,
    )
    db.add(ep)
    await db.flush()
    await db.refresh(ep)
    return APIEndpointOut.model_validate(ep)
