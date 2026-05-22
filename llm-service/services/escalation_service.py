import logging

from providers.base import BaseLLMProvider

log = logging.getLogger(__name__)

_PROMPT_TEMPLATE = """\
You are a customer support escalation assistant for Skippo, a school management platform.

A user requires human support intervention.

User ID   : {user_id}
App       : {app_context}
Issue     : {issue}
Context   : {context}

Generate a structured escalation package as JSON:

{{
  "summary"    : "2-3 sentence summary of the issue for the support agent",
  "priority"   : "high|medium|low",
  "email_draft": "Full draft email body to the Skippo support team",
  "next_steps" : ["step 1", "step 2", "step 3"]
}}

Return ONLY valid JSON."""


async def generate_escalation(
    user_id: str,
    issue: str,
    context: str,
    app_context: str,
    provider: BaseLLMProvider,
) -> dict:
    prompt = _PROMPT_TEMPLATE.format(
        user_id=user_id,
        app_context=app_context,
        issue=issue,
        context=context,
    )
    return await provider.generate_json(prompt)
