import csv
import io
import logging
import re
from pathlib import Path

import config
from providers.base import BaseLLMProvider

log = logging.getLogger(__name__)

_PROMPT = (Path(__file__).parent.parent / "prompts" / "extraction.txt").read_text()


# ── File parsers ──────────────────────────────────────────────────────────────

def _parse_csv(content: bytes) -> tuple[list[str], list[list[str]]]:
    text = content.decode("utf-8-sig", errors="replace")
    reader = csv.reader(io.StringIO(text))
    rows = [r for r in reader if any(c.strip() for c in r)]
    if not rows:
        return [], []
    return rows[0], rows[1:]


def _parse_xlsx(content: bytes) -> tuple[list[str], list[list[str]]]:
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True, data_only=True)
    ws = wb.active
    all_rows = []
    for row in ws.iter_rows(values_only=True):
        cells = [str(c) if c is not None else "" for c in row]
        if any(c.strip() for c in cells):
            all_rows.append(cells)
    wb.close()
    if not all_rows:
        return [], []
    return all_rows[0], all_rows[1:]


def _parse_pdf(content: bytes) -> tuple[list[str], list[list[str]]]:
    import pdfplumber
    all_rows: list[list[str]] = []
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page in pdf.pages:
            table = page.extract_table()
            if table:
                all_rows.extend([[str(c) if c else "" for c in row] for row in table])
    if not all_rows:
        return [], []
    return all_rows[0], all_rows[1:]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _table_to_text(headers: list[str], rows: list[list[str]]) -> str:
    header_line = " | ".join(str(h) for h in headers)
    separator   = "-" * max(len(header_line), 40)
    data_lines  = [" | ".join(str(c) for c in row) for row in rows]
    return "\n".join([header_line, separator] + data_lines)


def _normalize_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 10:
        return f"+91{digits}"
    if len(digits) == 11 and digits.startswith("0"):
        return f"+91{digits[1:]}"
    if len(digits) == 12 and digits.startswith("91"):
        return f"+{digits}"
    if digits:
        return f"+{digits}" if not phone.startswith("+") else phone
    return phone


# ── Main entry point ──────────────────────────────────────────────────────────

async def extract_students(filename: str, content: bytes, provider: BaseLLMProvider) -> dict:
    ext = Path(filename).suffix.lower()

    try:
        if ext == ".csv":
            headers, rows = _parse_csv(content)
        elif ext in (".xlsx", ".xls"):
            headers, rows = _parse_xlsx(content)
        elif ext == ".pdf":
            headers, rows = _parse_pdf(content)
        else:
            return {"success": False, "error": f"Unsupported file type: {ext}"}
    except Exception as exc:
        log.exception("File parsing error")
        return {"success": False, "error": f"Could not parse file: {exc}"}

    if not rows:
        return {"success": False, "error": "No data rows found in file."}

    # Send to LLM in chunks to respect context limits
    chunk = rows[: config.EXTRACTION_CHUNK]
    table_text = _table_to_text(headers, chunk)
    prompt = _PROMPT.replace("{{TABLE}}", table_text)

    try:
        result = await provider.generate_json(prompt)
    except Exception as exc:
        log.exception("LLM extraction failed")
        return {"success": False, "error": f"LLM extraction failed: {exc}"}

    students = result.get("students", [])

    # Normalize phone numbers
    for s in students:
        if s.get("parent_phone"):
            s["parent_phone"] = _normalize_phone(s["parent_phone"])

    return {
        "success": True,
        "students_found": len(students),
        "students": students,
        "truncated": len(rows) > config.EXTRACTION_CHUNK,
    }
