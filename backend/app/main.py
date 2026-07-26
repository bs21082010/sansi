import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.core.monitoring import metrics_export, track_request, health_check
from app.api.v1.auth import router as auth_router
from app.api.v1.corpus import router as corpus_router
from app.api.v1.tutor import router as tutor_router
from app.api.v1.courses import router as courses_router
from app.api.v1.community import router as community_router
from app.api.v1.admin import router as admin_router
from app.api.v1.annotations import router as annotations_router
from app.api.v1.learning import router as learning_router
from app.api.v1.marketplace import router as marketplace_router
from app.api.v1.leaderboard import router as leaderboard_router
from app.api.v1.seed import router as seed_router

limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT])


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.sansi.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration = time.perf_counter() - start
    track_request(request.method, request.url.path, response.status_code)
    response.headers["X-Process-Time"] = str(round(duration, 4))
    return response


app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(corpus_router, prefix=settings.API_V1_PREFIX)
app.include_router(tutor_router, prefix=settings.API_V1_PREFIX)
app.include_router(courses_router, prefix=settings.API_V1_PREFIX)
app.include_router(community_router, prefix=settings.API_V1_PREFIX)
app.include_router(admin_router, prefix=settings.API_V1_PREFIX)
app.include_router(annotations_router, prefix=settings.API_V1_PREFIX)
app.include_router(learning_router, prefix=settings.API_V1_PREFIX)
app.include_router(marketplace_router, prefix=settings.API_V1_PREFIX)
app.include_router(leaderboard_router, prefix=settings.API_V1_PREFIX)
app.include_router(seed_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
@limiter.exempt
async def health(request: Request):
    return await health_check(db_ok=True, ai_ok=True)


@app.get("/metrics")
@limiter.exempt
async def metrics(request: Request):
    return await metrics_export()
