from fastapi import APIRouter
from pydantic import BaseModel

from providers import get_provider
from services.escalation_service import generate_escalation
from services.faq_service import answer_faq
from services.memory_service import clear_history

router = APIRouter()


class AskRequest(BaseModel):
    user_id: str
    question: str
    app_context: str = "dashboard"


class ClearRequest(BaseModel):
    user_id: str


class EscalateRequest(BaseModel):
    user_id: str
    issue: str
    context: str = ""
    app_context: str = "dashboard"


@router.post("/ask")
async def ask(req: AskRequest):
    provider = get_provider()
    answer = await answer_faq(req.user_id, req.question, req.app_context, provider)
    return {"answer": answer, "user_id": req.user_id}


@router.post("/clear")
async def clear(req: ClearRequest):
    await clear_history(req.user_id)
    return {"cleared": True, "user_id": req.user_id}


@router.post("/escalate")
async def escalate(req: EscalateRequest):
    provider = get_provider()
    result = await generate_escalation(
        req.user_id, req.issue, req.context, req.app_context, provider
    )
    return result
