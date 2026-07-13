import asyncio
from typing import Dict

_locks: Dict[str, asyncio.Lock] = {}


def get_classroom_lock(classroom_id: str) -> asyncio.Lock:
    if classroom_id not in _locks:
        _locks[classroom_id] = asyncio.Lock()
    return _locks[classroom_id]


def release_classroom_lock(classroom_id: str) -> None:
    _locks.pop(classroom_id, None)
