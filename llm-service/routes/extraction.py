import logging

from fastapi import APIRouter, File, HTTPException, UploadFile

import config
from providers import get_provider
from services.extraction_service import extract_students

log = logging.getLogger(__name__)
router = APIRouter()

_ALLOWED_EXTS = {".csv", ".xlsx", ".xls", ".pdf"}


@router.post("/students")
async def extract_students_endpoint(file: UploadFile = File(...)):
    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in _ALLOWED_EXTS:
        raise HTTPException(400, f"Unsupported file type '{ext}'. Allowed: CSV, XLSX, PDF.")

    content = await file.read()

    if len(content) > config.MAX_FILE_SIZE:
        mb = config.MAX_FILE_SIZE // (1024 * 1024)
        raise HTTPException(413, f"File too large. Maximum allowed size is {mb} MB.")

    if not content:
        raise HTTPException(400, "Uploaded file is empty.")

    provider = get_provider()
    result = await extract_students(file.filename, content, provider)

    if not result.get("success"):
        raise HTTPException(422, result.get("error", "Extraction failed."))

    return result
