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

# All plans are free — tiers are transparent rate limits for fair usage
RATE_TIERS = {
    "hobby": {"requests_per_hour": 1000, "description": "For personal projects and experiments"},
    "builder": {"requests_per_hour": 10000, "description": "For active apps and integrations"},
    "scale": {"requests_per_hour": 100000, "description": "For production applications"},
}


@router.post("/apps", response_model=DeveloperAppOut, status_code=201)
async def create_app(
    body: DeveloperAppCreate,
    tier: str = "hobby",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if tier not in RATE_TIERS:
        tier = "hobby"
    api_key = f"sansi_{secrets.token_hex(32)}"
    prefix = api_key[:12]

    app = DeveloperApp(
        user_id=current_user.id,
        name=body.name,
        description=body.description,
        api_key=api_key,
        api_key_prefix=prefix,
        rate_plan=tier,
        requests_per_hour=RATE_TIERS[tier]["requests_per_hour"],
    )
    db.add(app)
    await db.flush()
    await db.refresh(app)
    return DeveloperAppOut.model_validate(app)


@router.get("/tiers")
async def list_tiers():
    return [
        {
            "name": key,
            "requests_per_hour": val["requests_per_hour"],
            "description": val["description"],
            "price": "free",
        }
        for key, val in RATE_TIERS.items()
    ]


@router.post("/apps/{app_id}/upgrade")
async def upgrade_app_tier(
    app_id: UUID,
    tier: str = "builder",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if tier not in RATE_TIERS:
        raise HTTPException(status_code=400, detail=f"Invalid tier. Options: {list(RATE_TIERS.keys())}")

    result = await db.execute(
        select(DeveloperApp).where(
            DeveloperApp.id == app_id,
            DeveloperApp.user_id == current_user.id,
        )
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")

    app.rate_plan = tier
    app.requests_per_hour = RATE_TIERS[tier]["requests_per_hour"]
    await db.flush()
    return {"tier": tier, "requests_per_hour": app.requests_per_hour, "price": "free"}


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
            "tier": a.rate_plan,
            "requests_per_hour": a.requests_per_hour,
            "total_requests": count.scalar() or 0,
        })

    return {"total_requests": sum(u["total_requests"] for u in usage), "apps": usage}


@router.get("/endpoints", response_model=list[APIEndpointOut])
async def list_endpoints(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(APIEndpoint).where(APIEndpoint.is_active == True)
        .order_by(APIEndpoint.category, APIEndpoint.path)
    )
    return [APIEndpointOut.model_validate(e) for e in result.scalars().all()]


@router.post("/endpoints", response_model=APIEndpointOut, status_code=201)
async def register_endpoint(
    path: str, method: str, description: str, category: str = "corpus",
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    ep = APIEndpoint(path=path, method=method.upper(), description=description, category=category)
    db.add(ep)
    await db.flush()
    await db.refresh(ep)
    return APIEndpointOut.model_validate(ep)
