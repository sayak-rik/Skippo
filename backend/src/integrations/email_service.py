"""Internal helper to call the Skippo email microservice."""

import logging
import os
import textwrap

import httpx

logger = logging.getLogger(__name__)

EMAIL_SERVICE_URL = os.getenv("EMAIL_SERVICE_URL", "http://localhost:8092")
EMAIL_SERVICE_API_KEY = os.getenv("EMAIL_SERVICE_API_KEY", "dev-key-change-in-production")

# CONTACT_EMAIL = "contact@skippo.co.in"
# SUPPORT_EMAIL = "support@skippo.co.in"
SUPPORT_EMAIL = "skippo.india@gmail.com"
CONTACT_EMAIL = "skippo.india@gmail.com"

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


def notify_school_onboarded(
    *,
    school_name: str,
    school_slug: str,
    admin_email: str,
    admin_name: str,
    temp_password: str,
    dashboard_url: str,
    lead_id: int | None,
) -> None:
    """Fire-and-forget: notify Skippo root ops email when a new school is provisioned."""
    html = _build_html(
        title="New school onboarded",
        subtitle=f"{school_name} is now live on Skippo",
        tag="Onboarding",
        tag_color="#059669",
        fields=[
            ("School name",    school_name),
            ("School slug",    school_slug),
            ("Dashboard URL",  dashboard_url),
            ("Admin email",    admin_email),
            ("Admin name",     admin_name or "—"),
            ("Temp password",  temp_password),
            ("Lead ID",        str(lead_id) if lead_id else "—"),
        ],
        message="A new school has been provisioned. Send the credentials to the admin and archive this record.",
    )
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.post(
                f"{EMAIL_SERVICE_URL}/send",
                json={
                    "to":      CONTACT_EMAIL,
                    "subject": f"[Skippo] New school onboarded — {school_name}",
                    "html":    html,
                },
                headers={"X-Api-Key": EMAIL_SERVICE_API_KEY},
            )
            resp.raise_for_status()
            logger.info("Onboarding notification sent → %s (school: %s)", CONTACT_EMAIL, school_name)
    except Exception as exc:
        logger.warning("Onboarding notification failed (non-fatal): %s", exc)


def send_school_welcome(
    *,
    school_name: str,
    school_slug: str,
    admin_email: str,
    admin_name: str,
    temp_password: str,
    dashboard_url: str,
) -> None:
    """Fire-and-forget: send welcome credentials email to the new school admin."""
    display_name = admin_name.split()[0] if admin_name else "there"
    welcome_message = (
        f"Welcome to Skippo, {display_name}!\n\n"
        f"Your school dashboard is ready. Use the credentials below to sign in for the first time. "
        f"You will be prompted to change your password after logging in.\n\n"
        f"Once signed in, complete the quick setup checklist to upload your school logo, "
        f"confirm your timezone, and invite your first teachers."
    )
    html = _build_html(
        title="Welcome to Skippo",
        subtitle=f"Your dashboard for {school_name} is ready",
        tag="Welcome",
        tag_color="#4f46e5",
        fields=[
            ("School ID",      school_slug),
            ("Login email",    admin_email),
            ("Temp password",  temp_password),
            ("Dashboard URL",  f'<a href="{dashboard_url}" style="color:#4f46e5">{dashboard_url}</a>'),
        ],
        message=welcome_message,
    )
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.post(
                f"{EMAIL_SERVICE_URL}/send",
                json={
                    "to":       admin_email,
                    "subject":  f"Welcome to Skippo — your {school_name} dashboard is ready",
                    "html":     html,
                    "reply_to": CONTACT_EMAIL,
                },
                headers={"X-Api-Key": EMAIL_SERVICE_API_KEY},
            )
            resp.raise_for_status()
            logger.info("Welcome email sent → %s (school: %s)", admin_email, school_name)
    except Exception as exc:
        logger.warning("Welcome email failed (non-fatal): %s", exc)


def send_otp_email(*, to: str, code: str, ttl_minutes: int = 10, school_name: str = "") -> bool:
    """Send a one-time password email. Returns True on success, False on failure."""
    context = f" for {school_name}" if school_name else ""
    html = f"""<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<style>
{_BASE_STYLE}
.otp-box {{
  background: #eef2ff; border-radius: 12px; padding: 24px 32px; text-align: center;
  margin: 24px 0;
}}
.otp-code {{
  font-size: 40px; font-weight: 900; letter-spacing: 10px; color: #4f46e5;
  font-family: 'Courier New', monospace;
}}
.otp-note {{
  font-size: 13px; color: #71717a; margin-top: 8px;
}}
</style></head>
<body><div class="wrap">
  <div class="header" style="background:#4f46e5;">
    <h1>Skippo Sign-in Code</h1>
    <p>Your one-time password{context}</p>
  </div>
  <div class="body">
    <p style="font-size:15px;color:#3f3f46;margin-bottom:0;">
      Use the code below to sign in to your Skippo dashboard. It expires in
      <strong>{ttl_minutes} minutes</strong> and can only be used once.
    </p>
    <div class="otp-box">
      <div class="otp-code">{code}</div>
      <div class="otp-note">Do not share this code with anyone.</div>
    </div>
    <p style="font-size:13px;color:#a1a1aa;">
      If you didn't request this, you can safely ignore this email.
    </p>
  </div>
  <div class="footer">Sent by Skippo · skippo.co.in</div>
</div></body></html>"""
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.post(
                f"{EMAIL_SERVICE_URL}/send",
                json={
                    "to":      to,
                    "subject": "Your Skippo sign-in code",
                    "html":    html,
                },
                headers={"X-Api-Key": EMAIL_SERVICE_API_KEY},
            )
            resp.raise_for_status()
            logger.info("OTP email sent → %s", to)
            return True
    except Exception as exc:
        logger.warning("OTP email failed to %s: %s", to, exc)
        return False


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
