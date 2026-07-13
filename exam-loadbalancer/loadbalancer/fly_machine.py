"""
Fly.io Machines API client for the exam loadbalancer.

Adapted from the interviewer_loadbalancer FlyMachineFactory, stripped down
to only what the exam loadbalancer needs:
  - create_machine(test_id)  → {id, host_status}
  - delete_machine(machine_id)
  - get_machine_state(machine_id) → str | None
  - list_machines() → list[dict]

All public methods are synchronous (wraps asyncio.run internally).
"""

import asyncio
import logging
import os
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
from django.conf import settings

from .exceptions import FlyMachineError

log = logging.getLogger(__name__)

RETRYABLE_STATUSES = {408, 409, 425, 429, 500, 502, 503, 504, 520}


def _run(coro):
    return asyncio.run(coro)


class FlyMachineClient:
    """Thin async wrapper around the Fly Machines API."""

    def __init__(self):
        self.api_token  = settings.FLY_API_TOKEN
        self.app_name   = settings.FLY_APP_NAME
        self.image      = settings.FLY_MACHINE_IMAGE
        self.base_url   = settings.FLY_MACHINE_BASE_URL
        self.engine_env = dict(settings.EXAM_ENGINE_ENV)

        # Machine sizing — override via env
        self.cpu_kind  = os.environ.get("FLY_CPU_KIND",  "shared")
        self.cpus      = int(os.environ.get("FLY_CPUS",   "2"))
        self.memory_mb = int(os.environ.get("FLY_MEMORY", "2048"))
        self.port      = int(os.environ.get("FLY_PORT",   "8080"))
        self.regions   = os.environ.get("FLY_REGIONS", "bom").split(",")
        self.timeout   = int(os.environ.get("FLY_TIMEOUT_SECONDS", "30"))
        self.retries   = int(os.environ.get("FLY_RETRY_ATTEMPTS",  "3"))

        if not self.api_token:
            raise FlyMachineError("FLY_API_TOKEN is required.")
        if not self.app_name:
            raise FlyMachineError("FLY_APP_NAME is required.")

    @property
    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type":  "application/json",
        }

    def _machines_url(self) -> str:
        return f"https://api.machines.dev/v1/apps/{self.app_name}/machines"

    def _machine_url(self, machine_id: str) -> str:
        return f"{self._machines_url()}/{machine_id}"

    def build_pod_url(self, machine_id: str) -> str:
        if not self.base_url:
            raise FlyMachineError("FLY_MACHINE_BASE_URL is required to build pod URL.")
        sep = "&" if "?" in self.base_url else "?"
        return f"{self.base_url}{sep}fly_machine_id={machine_id}"

    # ── Retry helper ──────────────────────────────────────────────────────────

    async def _request(
        self,
        client: httpx.AsyncClient,
        method: str,
        url: str,
        **kwargs,
    ) -> httpx.Response:
        for attempt in range(1, self.retries + 1):
            try:
                resp = await client.request(method, url, headers=self._headers, **kwargs)
                resp.raise_for_status()
                return resp
            except httpx.HTTPStatusError as exc:
                is_last = attempt >= self.retries
                retryable = exc.response is not None and exc.response.status_code in RETRYABLE_STATUSES
                if is_last or not retryable:
                    log.warning(
                        "fly: %s %s failed permanently attempt=%s status=%s body=%s",
                        method, url, attempt,
                        exc.response.status_code if exc.response else None,
                        exc.response.text[:200] if exc.response else "",
                    )
                    raise FlyMachineError(str(exc)) from exc
                log.warning("fly: %s %s retryable status=%s attempt=%s", method, url, exc.response.status_code, attempt)
            except httpx.RequestError as exc:
                if attempt >= self.retries:
                    raise FlyMachineError(str(exc)) from exc
                log.warning("fly: %s %s request error attempt=%s error=%s", method, url, attempt, exc)
            await asyncio.sleep(1.0 * attempt)
        raise FlyMachineError(f"Fly API {method} {url} failed after {self.retries} retries")

    # ── Create ────────────────────────────────────────────────────────────────

    def _build_create_payload(self, test_id: str, region: str) -> Dict[str, Any]:
        env = {**self.engine_env, "TEST_ID": test_id}
        return {
            "name": f"exam-engine|{uuid.uuid4()}|{test_id[:8]}",
            "region": region,
            "config": {
                "image": self.image,
                "guest": {
                    "cpu_kind":  self.cpu_kind,
                    "cpus":      self.cpus,
                    "memory_mb": self.memory_mb,
                },
                "env": env,
                "services": [
                    {
                        "protocol":      "tcp",
                        "internal_port": self.port,
                        "autostart":     True,
                        "ports": [
                            {"port": 80,  "handlers": ["http"],         "force_https": True},
                            {"port": 443, "handlers": ["tls", "http"]},
                        ],
                    }
                ],
            },
        }

    async def _acreate_machine(self, test_id: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for region in self.regions:
                log.info("fly: create machine test_id=%s region=%s", test_id, region)
                payload = self._build_create_payload(test_id, region)
                try:
                    resp = await self._request(client, "post", self._machines_url(), json=payload)
                    data = resp.json()
                    machine_id = data.get("id")
                    if not machine_id:
                        raise FlyMachineError(f"Fly create: missing id in response for test_id={test_id}")
                    log.info(
                        "fly: created machine_id=%s test_id=%s region=%s host_status=%s",
                        machine_id, test_id, region, data.get("host_status"),
                    )
                    return {"id": machine_id, "host_status": data.get("host_status"), "region": region}
                except FlyMachineError:
                    if region == self.regions[-1]:
                        raise
                    log.warning("fly: create failed in region=%s, trying next", region)
        raise FlyMachineError(f"Failed to create machine for test_id={test_id} in all regions")

    def create_machine(self, test_id: str) -> Dict[str, Any]:
        return _run(self._acreate_machine(test_id))

    # ── Delete ────────────────────────────────────────────────────────────────

    async def _adelete_machine(self, machine_id: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            # Stop first (best-effort), then force delete
            try:
                await self._request(
                    client, "post",
                    f"{self._machine_url(machine_id)}/stop",
                )
                # Wait for stopped state
                for _ in range(10):
                    state = await self._aget_state(client, machine_id)
                    if state == "stopped":
                        break
                    await asyncio.sleep(1)
            except Exception as exc:
                log.warning("fly: stop before delete failed machine_id=%s error=%s", machine_id, exc)

            try:
                resp = await self._request(
                    client, "delete",
                    self._machine_url(machine_id),
                    params={"force": "true"},
                )
                is_deleted = True
                try:
                    body = resp.json()
                    is_deleted = body.get("ok", True)
                except Exception:
                    pass
                log.info("fly: deleted machine_id=%s is_deleted=%s", machine_id, is_deleted)
                return {"machine_id": machine_id, "is_deleted": is_deleted}
            except FlyMachineError as exc:
                log.warning("fly: force-delete failed machine_id=%s error=%s", machine_id, exc)
                return {"machine_id": machine_id, "is_deleted": False, "error": str(exc)}

    def delete_machine(self, machine_id: str) -> Dict[str, Any]:
        return _run(self._adelete_machine(machine_id))

    # ── State ──────────────────────────────────────────────────────────────────

    async def _aget_state(self, client: httpx.AsyncClient, machine_id: str) -> Optional[str]:
        try:
            resp = await self._request(client, "get", self._machine_url(machine_id))
            return resp.json().get("state")
        except Exception as exc:
            log.warning("fly: get_state failed machine_id=%s error=%s", machine_id, exc)
            return None

    async def _aget_machine_state(self, machine_id: str) -> Optional[str]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            return await self._aget_state(client, machine_id)

    def get_machine_state(self, machine_id: str) -> Optional[str]:
        return _run(self._aget_machine_state(machine_id))

    # ── List ───────────────────────────────────────────────────────────────────

    async def _alist_machines(self) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await self._request(client, "get", self._machines_url())
            data = resp.json()
            return [m for m in data if isinstance(m, dict) and m.get("id")]

    def list_machines(self) -> List[Dict[str, Any]]:
        return _run(self._alist_machines())
