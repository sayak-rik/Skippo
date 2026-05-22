import logging
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel

from providers import get_provider

log = logging.getLogger(__name__)
router = APIRouter()

_SYSTEM = (Path(__file__).parent.parent / "prompts" / "reports.txt").read_text()


class ReportRequest(BaseModel):
    school_name: str = ""
    metrics: list[str]
    date_range: dict
    data: dict


@router.post("/generate")
async def generate_report(req: ReportRequest):
    prompt = (
        f"{_SYSTEM}\n\n"
        f"School: {req.school_name}\n"
        f"Period: {req.date_range.get('from', 'N/A')} → {req.date_range.get('to', 'N/A')}\n"
        f"Metrics requested: {', '.join(req.metrics)}\n\n"
        f"Data:\n{req.data}"
    )
    provider = get_provider()
    return await provider.generate_json(prompt)
