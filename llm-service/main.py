import logging

from fastapi import FastAPI

from routes import extraction, faq, reports

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)

app = FastAPI(
    title="Skippo LLM Service",
    version="1.0.0",
    description="Centralized AI/LLM layer for the Skippo school management platform.",
)

app.include_router(extraction.router, prefix="/extract", tags=["Extraction"])
app.include_router(faq.router,        prefix="/faq",     tags=["FAQ & Escalation"])
app.include_router(reports.router,    prefix="/reports", tags=["Reports"])


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "llm-service"}
