"""
Rate limiting utilities for the Commuto API.

This module provides a simplified rate limiting mechanism using
in-memory storage. For production, consider using Redis.
"""

import time
from functools import wraps
from fastapi import Request, HTTPException, status
from typing import Dict, Tuple, Optional
import threading

# In-memory rate limit storage
# Format: {key: (count, reset_time)}
_rate_limit_storage: Dict[str, Tuple[int, float]] = {}
_lock = threading.Lock()


def get_client_key(request: Request, suffix: str = "") -> str:
    """Generate a unique key for rate limiting based on client IP and optional suffix."""
    client_ip = request.client.host if request.client else "unknown"
    return f"{client_ip}:{suffix}" if suffix else client_ip


def is_rate_limited(key: str, max_requests: int, window_seconds: int) -> Tuple[bool, int, int]:
    """
    Check if the key is rate limited.
    
    Returns:
        Tuple of (is_limited, remaining, reset_after)
    """
    now = time.time()
    
    with _lock:
        if key in _rate_limit_storage:
            count, reset_time = _rate_limit_storage[key]
            
            # Check if window has expired
            if now > reset_time:
                # Reset the window
                _rate_limit_storage[key] = (1, now + window_seconds)
                return False, max_requests - 1, window_seconds
            
            # Check if limit exceeded
            if count >= max_requests:
                remaining_time = int(reset_time - now)
                return True, 0, remaining_time
            
            # Increment counter
            _rate_limit_storage[key] = (count + 1, reset_time)
            return False, max_requests - count - 1, int(reset_time - now)
        else:
            # First request in window
            _rate_limit_storage[key] = (1, now + window_seconds)
            return False, max_requests - 1, window_seconds


def rate_limit(max_requests: int, window_seconds: int, key_suffix: str = ""):
    """
    Decorator to apply rate limiting to a route.
    
    Args:
        max_requests: Maximum number of requests allowed in the window
        window_seconds: Time window in seconds
        key_suffix: Optional suffix to differentiate rate limits for the same IP
    """
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Find request in args or kwargs
            request = kwargs.get('request')
            if not request and args:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break
            
            if not request:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Rate limiting requires Request parameter"
                )
            
            key = get_client_key(request, key_suffix or func.__name__)
            is_limited, remaining, reset_after = is_rate_limited(key, max_requests, window_seconds)
            
            if is_limited:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Try again in {reset_after} seconds."
                )
            
            return await func(*args, **kwargs)
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Find request in args or kwargs
            request = kwargs.get('request')
            if not request and args:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break
            
            if not request:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Rate limiting requires Request parameter"
                )
            
            key = get_client_key(request, key_suffix or func.__name__)
            is_limited, remaining, reset_after = is_rate_limited(key, max_requests, window_seconds)
            
            if is_limited:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Try again in {reset_after} seconds."
                )
            
            return func(*args, **kwargs)
        
        # Return appropriate wrapper based on whether function is async or not
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator


# Cleanup old entries periodically
def cleanup_expired_entries():
    """Remove expired rate limit entries from storage."""
    now = time.time()
    with _lock:
        expired_keys = [
            key for key, (count, reset_time) in _rate_limit_storage.items()
            if now > reset_time
        ]
        for key in expired_keys:
            del _rate_limit_storage[key]
