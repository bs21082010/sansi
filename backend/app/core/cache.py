import json
import hashlib
from typing import Any

try:
    import redis.asyncio as aioredis

    _redis: aioredis.Redis | None = aioredis.from_url(
        "redis://localhost:6379/0", decode_responses=True
    )
except ImportError:
    _redis = None


def _make_key(prefix: str, *args, **kwargs) -> str:
    raw = f"{prefix}:{json.dumps(args)}:{json.dumps(kwargs, sort_keys=True)}"
    return f"{prefix}:{hashlib.md5(raw.encode()).hexdigest()}"


async def cache_get(key: str) -> Any | None:
    if _redis is None:
        return None
    try:
        val = await _redis.get(key)
        return json.loads(val) if val else None
    except Exception:
        return None


async def cache_set(key: str, value: Any, ttl: int = 300) -> None:
    if _redis is None:
        return
    try:
        await _redis.setex(key, ttl, json.dumps(value, default=str))
    except Exception:
        pass


async def cache_invalidate(pattern: str) -> None:
    if _redis is None:
        return
    try:
        cursor = 0
        while True:
            cursor, keys = await _redis.scan(cursor=cursor, match=pattern, count=100)
            if keys:
                await _redis.delete(*keys)
            if cursor == 0:
                break
    except Exception:
        pass


def cache(prefix: str, ttl: int = 300):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            key = _make_key(prefix, func.__name__, *args, **kwargs)
            cached = await cache_get(key)
            if cached is not None:
                return cached
            result = await func(*args, **kwargs)
            await cache_set(key, result, ttl)
            return result

        return wrapper

    return decorator
