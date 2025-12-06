"""
Simple in-memory cache for frequently accessed data.
Dramatically improves performance by reducing MongoDB Atlas network latency impact.
"""
import asyncio
from datetime import datetime, timedelta
from typing import Any, Callable, Optional
from functools import wraps
import hashlib
import json
import copy


class SimpleCache:
    """Thread-safe in-memory cache with TTL support."""
    
    def __init__(self):
        self._cache: dict[str, dict[str, Any]] = {}
        self._lock = asyncio.Lock()
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired. Returns a copy to avoid mutation."""
        async with self._lock:
            if key in self._cache:
                entry = self._cache[key]
                if datetime.now() < entry["expires"]:
                    # Return deep copy to prevent mutation of cached data
                    try:
                        return copy.deepcopy(entry["value"])
                    except:
                        return entry["value"]
                else:
                    del self._cache[key]
            return None
    
    async def set(self, key: str, value: Any, ttl_seconds: int = 30) -> None:
        """Set value in cache with TTL. Stores a deep copy."""
        async with self._lock:
            try:
                cached_value = copy.deepcopy(value)
            except:
                cached_value = value
            self._cache[key] = {
                "value": cached_value,
                "expires": datetime.now() + timedelta(seconds=ttl_seconds)
            }
    
    async def delete(self, key: str) -> None:
        """Delete a specific key from cache."""
        async with self._lock:
            if key in self._cache:
                del self._cache[key]
    
    async def clear_pattern(self, pattern: str) -> None:
        """Clear all keys matching a pattern."""
        async with self._lock:
            keys_to_delete = [k for k in self._cache.keys() if pattern in k]
            for key in keys_to_delete:
                del self._cache[key]
    
    async def clear_all(self) -> None:
        """Clear entire cache."""
        async with self._lock:
            self._cache.clear()
    
    def stats(self) -> dict:
        """Get cache statistics."""
        return {
            "entries": len(self._cache),
            "keys": list(self._cache.keys())[:10]  # First 10 keys
        }


# Global cache instance
cache = SimpleCache()


def cached(ttl_seconds: int = 30, key_prefix: str = ""):
    """
    Decorator for caching async function results.
    
    Usage:
        @cached(ttl_seconds=60, key_prefix="patients")
        async def get_patients(clinic_id: str):
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            key_parts = [key_prefix or func.__name__]
            
            # Add positional args (skip 'self' or 'db' objects)
            for arg in args:
                if hasattr(arg, '__dict__'):
                    continue  # Skip complex objects like db connections
                try:
                    key_parts.append(str(arg))
                except:
                    pass
            
            # Add keyword args
            for k, v in sorted(kwargs.items()):
                if k in ('db', 'current_user'):
                    continue  # Skip db and user objects
                try:
                    key_parts.append(f"{k}={v}")
                except:
                    pass
            
            cache_key = hashlib.md5(":".join(key_parts).encode()).hexdigest()
            
            # Try to get from cache
            cached_value = await cache.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            await cache.set(cache_key, result, ttl_seconds)
            return result
        
        return wrapper
    return decorator


async def invalidate_cache(patterns: list[str]) -> None:
    """Invalidate cache entries matching any of the given patterns."""
    for pattern in patterns:
        await cache.clear_pattern(pattern)

