"""
Fly.io Machines API client for the AI teacher loadbalancer.

Spins up one machine per class session and tears it down when the class ends.
"""

import asyncio
import logging
import os
import uuid
from typing import Any, Dict, List, Optional

import httpx
from django.conf import settings

from .exceptions import FlyMachineError

log = logging.getLogger(__name__)

RETRYABLE_STATUSES = {408, 409, 425, 429, 500, 502, 503, 504, 520}


def _run(coro):
    return asyncio.run(coro)


class FlyMachineClient:
    def __init__(self):
        self.api_token  = settings.FLY_API_TOKEN
        self.app_name   = settings.FLY_APP_NAME
        self.image      = settings.FLY_MACHINE_IMAGE
        self.base_url   = settings.FLY_MACHINE_BASE_URL
        self.engine_env = dict(settings.AI_ENGINE_ENV)

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

    async def _request(self, client, method, url, **kwargs):
        for attempt in range(1, self.retries + 1):
            try:
                resp = await client.request(method, url, headers=self._headers, **kwargs)
                resp.raise_for_status()
                return resp
            except httpx.HTTPStatusError as exc:
                is_last = attempt >= self.retries
                retryable = exc.response is not None and exc.response.status_code in RETRYABLE_STATUSES
                if is_last or not retryable:
                    raise FlyMachineError(str(exc)) from exc
                log.warning("fly: retryable status=%s attempt=%s", exc.response.status_code, attempt)
            except httpx.RequestError as exc:
                if attempt >= self.retries:
                    raise FlyMachineError(str(exc)) from exc
            await asyncio.sleep(1.0 * attempt)
        raise FlyMachineError(f"Fly API {method} {url} failed after {self.retries} retries")

    def _build_create_payload(self, class_id: str, subject: str, instructions: str, region: str) -> Dict[str, Any]:
        env = {
            **self.engine_env,
            "SKIPPO_CLASS_ID": class_id,
            "CLASS_SUBJECT": subject,
            "CLASS_INSTRUCTIONS": instructions,
        }
        return {
            "name": f"ai-teacher|{uuid.uuid4()}|{class_id[:8]}",
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

    async def _acreate_machine(self, class_id: str, subject: str, instructions: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for region in self.regions:
                log.info("fly: create machine class_id=%s region=%s", class_id, region)
                payload = self._build_create_payload(class_id, subject, instructions, region)
                try:
                    resp = await self._request(client, "post", self._machines_url(), json=payload)
                    data = resp.json()
                    machine_id = data.get("id")
                    if not machine_id:
                        raise FlyMachineError(f"Missing id in response for class_id={class_id}")
                    log.info("fly: created machine_id=%s class_id=%s region=%s", machine_id, class_id, region)
                    return {"id": machine_id, "host_status": data.get("host_status"), "region": region}
                except FlyMachineError:
                    if region == self.regions[-1]:
                        raise
                    log.warning("fly: create failed region=%s, trying next", region)
        raise FlyMachineError(f"Failed to create machine for class_id={class_id}")

    def create_machine(self, class_id: str, subject: str, instructions: str) -> Dict[str, Any]:
        return _run(self._acreate_machine(class_id, subject, instructions))

    async def _adelete_machine(self, machine_id: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                await self._request(client, "post", f"{self._machine_url(machine_id)}/stop")
                for _ in range(10):
                    try:
                        resp = await self._request(client, "get", self._machine_url(machine_id))
                        if resp.json().get("state") == "stopped":
                            break
                    except Exception:
                        pass
                    await asyncio.sleep(1)
            except Exception as exc:
                log.warning("fly: stop before delete failed machine_id=%s error=%s", machine_id, exc)

            try:
                resp = await self._request(
                    client, "delete",
                    self._machine_url(machine_id),
                    params={"force": "true"},
                )
                log.info("fly: deleted machine_id=%s", machine_id)
                return {"machine_id": machine_id, "is_deleted": True}
            except FlyMachineError as exc:
                log.warning("fly: force-delete failed machine_id=%s error=%s", machine_id, exc)
                return {"machine_id": machine_id, "is_deleted": False, "error": str(exc)}

    def delete_machine(self, machine_id: str) -> Dict[str, Any]:
        return _run(self._adelete_machine(machine_id))

    def get_machine_state(self, machine_id: str) -> Optional[str]:
        async def _get():
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                try:
                    resp = await self._request(client, "get", self._machine_url(machine_id))
                    return resp.json().get("state")
                except Exception as exc:
                    log.warning("fly: get_state failed machine_id=%s error=%s", machine_id, exc)
                    return None
        return _run(_get())
