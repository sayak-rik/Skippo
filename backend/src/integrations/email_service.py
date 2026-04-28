"""Internal helper to call the Skippo email microservice."""

import logging
import os
import textwrap

import httpx

logger = logging.getLogger(__name__)

EMAIL_SERVICE_URL = os.getenv("EMAIL_SERVICE_URL", "http://localhost:8092")
EMAIL_SERVICE_API_KEY = os.getenv("EMAIL_SERVICE_API_KEY", "dev-key-change-in-production")

CONTACT_EMAIL = "contact@skippo.co.in"
SUPPORT_EMAIL = "support@skippo.co.in"

SUPPORT_ENQUIRY_TYPES = {"Support / bug report"}

_BASE_STYLE = """
  body { margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         background:#f8fafc; color:#0a0a0a; }
  .wrap { max-width:560px; margin:32px auto; background:#fff; border-radius:16px;
          border:1px solid #e4e4e7; overflow:hidden; }
  .header { background:#4f46e5; padding:28px 32px; }
  .header h1 { margin:0; color:#fff; font-size:20px; font-weight:900; letter-spacing:-0.3px; }
  .header p  { margin:4px 0 0; color:rgba(255,255,255,0.75); font-size:13px; }
  .body  { padding:28px 32px; }
  .field { margin-bottom:18px; }
  .field label { display:block; font-size:11px; font-weight:700; color:#71717a;
                 text-transform:uppercase; letter-spacing:.06em; margin-bottom:4px; }
  .field value { display:block; font-size:14px; color:#0a0a0a; }
  .msg-box { background:#f4f4f5; border-radius:10px; padding:14px 16px;
             font-size:14px; color:#3f3f46; line-height:1.65; white-space:pre-wrap; }
  .tag { display:inline-block; background:#eef2ff; color:#4f46e5; font-size:11px;
         font-weight:700; padding:3px 10px; border-radius:999px; margin-bottom:18px; }
  .footer { padding:16px 32px; border-top:1px solid #f4f4f5;
            font-size:11px; color:#a1a1aa; }
"""


def _build_html(title: str, subtitle: str, tag: str, tag_color: str, fields: list[tuple[str, str]], message: str) -> str:
    field_html = "".join(
        f'<div class="field"><label>{k}</label><value>{v}</value></div>'
        for k, v in fields if v
    )
    return textwrap.dedent(f"""
    <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
    <style>{_BASE_STYLE}
    .tag {{ background:{tag_color}1a; color:{tag_color}; }}
    .header {{ background:{tag_color}; }}
    </style></head>
    <body><div class="wrap">
      <div class="header">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div class="body">
        <span class="tag">{tag}</span>
        {field_html}
        <div class="field"><label>Message</label>
          <div class="msg-box">{message or '(no message)'}</div>
        </div>
      </div>
      <div class="footer">This notification was sent automatically by Skippo · skippo.co.in</div>
    </div></body></html>
    """).strip()


def notify_new_enquiry(*, name: str, email: str, phone: str, school: str, message: str, enquiry_type: str) -> None:
    """Fire-and-forget: send an email notification for a new contact/enquiry submission.

    Routes to support@skippo.co.in for support queries, contact@skippo.co.in for everything else.
    Sets Reply-To to the submitter's email so the team can reply directly.
    Failures are logged but never propagate — we never block the API response on this.
    """
    is_support = enquiry_type in SUPPORT_ENQUIRY_TYPES
    to_address = SUPPORT_EMAIL if is_support else CONTACT_EMAIL

    tag = enquiry_type or "General"
    tag_color = "#dc2626" if is_support else "#4f46e5"
    title = "Support request received" if is_support else "New school enquiry"
    subtitle = f"From {name} · {email}"

    html = _build_html(
        title=title,
        subtitle=subtitle,
        tag=tag,
        tag_color=tag_color,
        fields=[
            ("Name",        name),
            ("Email",       email),
            ("Phone",       phone),
            ("School name", school),
            ("Enquiry type", enquiry_type),
        ],
        message=message,
    )

    subject = f"[Skippo] {tag} — {name}" + (f" · {school}" if school else "")

    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.post(
                f"{EMAIL_SERVICE_URL}/send",
                json={
                    "to":       to_address,
                    "subject":  subject,
                    "html":     html,
                    "reply_to": email,
                },
                headers={"X-Api-Key": EMAIL_SERVICE_API_KEY},
            )
            resp.raise_for_status()
            logger.info("Email notification sent → %s (enquiry from %s)", to_address, email)
    except Exception as exc:
        logger.warning("Email notification failed (non-fatal): %s", exc)
