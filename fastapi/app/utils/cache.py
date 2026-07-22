"""
Simple in-memory cache for frequently accessed data.
Bounded size + TTL to avoid unbounded RAM growth on small instances.
"""
import asyncio
import copy
import hashlib
from collections import OrderedDict
from datetime import datetime, timedelta
from functools import wraps
from typing import Any, Callable, Optional

# Keep cache small on ~4GB instances (each entry may hold API payloads).
MAX_CACHE_ENTRIES = 150


def _light_copy(value: Any) -> Any:
    """Shallow copy for common API payloads; deep copy only when needed."""
    if isinstance(value, (str, int, float, bool, type(None))):
        return value
    if isinstance(value, list):
        return list(value)
    if isinstance(value, dict):
        return dict(value)
    try:
        return copy.deepcopy(value)
    except Exception:
        return value


class SimpleCache:
    """Thread-safe in-memory cache with TTL and LRU eviction."""

    def __init__(self, max_entries: int = MAX_CACHE_ENTRIES):
        self._cache: OrderedDict[str, dict[str, Any]] = OrderedDict()
        self._max_entries = max(10, max_entries)
        self._lock = asyncio.Lock()

    def _evict_if_needed(self) -> None:
        while len(self._cache) > self._max_entries:
            self._cache.popitem(last=False)

    async def get(self, key: str) -> Optional[Any]:
        async with self._lock:
            entry = self._cache.get(key)
            if not entry:
                return None
            if datetime.now() >= entry["expires"]:
                del self._cache[key]
                return None
            self._cache.move_to_end(key)
            return _light_copy(entry["value"])

    async def set(self, key: str, value: Any, ttl_seconds: int = 30) -> None:
        async with self._lock:
            self._cache[key] = {
                "value": _light_copy(value),
                "expires": datetime.now() + timedelta(seconds=ttl_seconds),
            }
            self._cache.move_to_end(key)
            self._evict_if_needed()

    async def delete(self, key: str) -> None:
        async with self._lock:
            self._cache.pop(key, None)

    async def clear_pattern(self, pattern: str) -> None:
        async with self._lock:
            keys_to_delete = [k for k in self._cache.keys() if pattern in k]
            for key in keys_to_delete:
                self._cache.pop(key, None)

    async def clear_all(self) -> None:
        async with self._lock:
            self._cache.clear()

    def stats(self) -> dict:
        return {
            "entries": len(self._cache),
            "max_entries": self._max_entries,
            "keys": list(self._cache.keys())[:10],
        }


cache = SimpleCache()


def cached(ttl_seconds: int = 30, key_prefix: str = ""):
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            key_parts = [key_prefix or func.__name__]

            for arg in args:
                if hasattr(arg, "__dict__"):
                    continue
                try:
                    key_parts.append(str(arg))
                except Exception:
                    pass

            for k, v in sorted(kwargs.items()):
                if k in ("db", "current_user"):
                    continue
                try:
                    key_parts.append(f"{k}={v}")
                except Exception:
                    pass

            cache_key = hashlib.md5(":".join(key_parts).encode()).hexdigest()

            cached_value = await cache.get(cache_key)
            if cached_value is not None:
                return cached_value

            result = await func(*args, **kwargs)
            await cache.set(cache_key, result, ttl_seconds)
            return result

        return wrapper

    return decorator


async def invalidate_cache(patterns: list[str]) -> None:
    for pattern in patterns:
        await cache.clear_pattern(pattern)
