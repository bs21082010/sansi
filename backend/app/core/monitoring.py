import time
from datetime import datetime, timezone

try:
    from prometheus_client import Counter, Histogram, generate_latest, REGISTRY

    HTTP_REQUESTS = Counter(
        "sansi_http_requests_total",
        "Total HTTP requests",
        ["method", "endpoint", "status"],
    )
    HTTP_DURATION = Histogram(
        "sansi_http_request_duration_seconds",
        "HTTP request duration in seconds",
        ["method", "endpoint"],
    )
    DB_QUERY_DURATION = Histogram(
        "sansi_db_query_duration_seconds",
        "Database query duration",
        ["query_type"],
    )
    ACTIVE_USERS = Counter(
        "sansi_active_users_total",
        "Total registered users",
    )
_can_export = True
except ImportError:
    _can_export = False

    class _Noop:
        def labels(self, **kw):
            return self

        def inc(self, _n=0):
            pass

        def observe(self, _n):
            pass

    HTTP_REQUESTS = _Noop()
    HTTP_DURATION = _Noop()
    DB_QUERY_DURATION = _Noop()
    ACTIVE_USERS = _Noop()


async def metrics_export():
    if not _can_export:
        return b"# prometheus client not installed"
    return generate_latest(REGISTRY)


class TimingContext:
    def __init__(self, metric: Histogram, labels: dict | None = None):
        self.metric = metric
        self.labels = labels or {}

    async def __aenter__(self):
        self.start = time.perf_counter()
        return self

    async def __aexit__(self, *args):
        duration = time.perf_counter() - self.start
        self.metric.labels(**self.labels).observe(duration)


def track_request(method: str, endpoint: str, status: int):
    HTTP_REQUESTS.labels(method=method, endpoint=endpoint, status=status).inc()


async def health_check(db_ok: bool, ai_ok: bool) -> dict:
    return {
        "status": "healthy" if (db_ok and ai_ok) else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checks": {
            "database": "up" if db_ok else "down",
            "ai_service": "up" if ai_ok else "down",
        },
        "uptime_seconds": round(time.monotonic(), 2),
    }
