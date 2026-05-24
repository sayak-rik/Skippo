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


# Premium Skippo Outreach Email — Modernized Version


def send_school_outreach_email(*, to: str, school_name: str) -> bool:
    """Send a premium outreach email to schools.

    Returns True on success, False on failure.
    """

    html = f"""<!DOCTYPE html>
<html lang=\"en\">
<head>
<meta charset=\"UTF-8\" />
<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
<title>Skippo</title>
<style>
  * {{
    box-sizing: border-box;
  }}

  body {{
    margin: 0;
    padding: 0;
    background: #f3f7fb;
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #0f172a;
    -webkit-font-smoothing: antialiased;
  }}

  .container {{
    width: 100%;
    padding: 40px 18px;
  }}

  .card {{
    max-width: 680px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 32px;
    overflow: hidden;
    box-shadow:
      0 10px 40px rgba(15, 23, 42, 0.08),
      0 2px 8px rgba(15, 23, 42, 0.04);
    position: relative;
  }}

  .hero {{
    position: relative;
    overflow: hidden;
    padding: 58px 48px 46px;
    background:
      radial-gradient(circle at top left, rgba(99,102,241,0.35), transparent 30%),
      radial-gradient(circle at top right, rgba(168,85,247,0.28), transparent 35%),
      linear-gradient(135deg, #0f172a 0%, #111827 40%, #1e1b4b 100%);
  }}

  .hero::before {{
    content: '';
    position: absolute;
    width: 320px;
    height: 320px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
    top: -120px;
    right: -120px;
    filter: blur(20px);
  }}

  .badge {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 999px;
    background: rgba(255,255,255,0.08);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.92);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .14em;
    text-transform: uppercase;
    margin-bottom: 26px;
  }}

  .hero h1 {{
    margin: 0;
    color: #ffffff;
    font-size: 42px;
    line-height: 1.08;
    letter-spacing: -1.8px;
    font-weight: 900;
    max-width: 540px;
  }}

  .hero p {{
    margin: 20px 0 0;
    color: rgba(255,255,255,0.72);
    font-size: 16px;
    line-height: 1.7;
    max-width: 520px;
  }}

  .stats-row {{
    display: flex;
    gap: 14px;
    margin-top: 34px;
    flex-wrap: wrap;
  }}

  .stat-chip {{
    padding: 14px 18px;
    border-radius: 18px;
    background: rgba(255,255,255,0.08);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.08);
    min-width: 140px;
  }}

  .stat-value {{
    color: #ffffff;
    font-size: 24px;
    font-weight: 900;
    letter-spacing: -0.8px;
    margin-bottom: 2px;
  }}

  .stat-label {{
    color: rgba(255,255,255,0.65);
    font-size: 12px;
    font-weight: 600;
  }}

  .content {{
    padding: 52px 48px;
  }}

  .eyebrow {{
    font-size: 12px;
    font-weight: 800;
    color: #6366f1;
    letter-spacing: .12em;
    text-transform: uppercase;
    margin-bottom: 14px;
  }}

  .section-title {{
    font-size: 32px;
    line-height: 1.18;
    font-weight: 900;
    color: #0f172a;
    letter-spacing: -1.3px;
    margin: 0 0 16px;
  }}

  .lead {{
    font-size: 16px;
    line-height: 1.9;
    color: #475569;
    margin: 0;
  }}

  .highlight {{
    color: #111827;
    font-weight: 700;
  }}

  .glass-panel {{
    margin-top: 42px;
    padding: 28px;
    border-radius: 28px;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9));
    border: 1px solid rgba(226,232,240,0.9);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.8),
      0 12px 30px rgba(15,23,42,0.05);
  }}

  .outcomes {{
    margin-top: 6px;
  }}

  .outcome {{
    padding: 22px 0;
    border-bottom: 1px solid #e2e8f0;
  }}

  .outcome:last-child {{
    border-bottom: none;
    padding-bottom: 0;
  }}

  .outcome-top {{
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 10px;
  }}

  .icon {{
    width: 54px;
    height: 54px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
  }}

  .icon-purple {{
    background: linear-gradient(135deg,#ede9fe,#ddd6fe);
  }}

  .icon-blue {{
    background: linear-gradient(135deg,#dbeafe,#bfdbfe);
  }}

  .icon-orange {{
    background: linear-gradient(135deg,#ffedd5,#fdba74);
  }}

  .outcome-title {{
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.4px;
  }}

  .outcome p {{
    margin: 0;
    color: #64748b;
    font-size: 15px;
    line-height: 1.8;
    padding-left: 68px;
  }}

  .mockup {{
    margin-top: 40px;
    border-radius: 28px;
    overflow: hidden;
    background: linear-gradient(180deg,#0f172a,#111827);
    padding: 26px;
  }}

  .mock-header {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }}

  .mock-logo {{
    color: #ffffff;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: -0.4px;
  }}

  .mock-pill {{
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.8);
    font-size: 11px;
    font-weight: 700;
  }}

  .dashboard {{
    display: grid;
    grid-template-columns: 1.2fr .8fr;
    gap: 18px;
  }}

  .panel {{
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 22px;
    padding: 18px;
  }}

  .map {{
    height: 170px;
    border-radius: 18px;
    background:
      radial-gradient(circle at 30% 40%, rgba(99,102,241,0.45), transparent 30%),
      radial-gradient(circle at 70% 60%, rgba(34,197,94,0.35), transparent 30%),
      rgba(255,255,255,0.04);
    position: relative;
    overflow: hidden;
  }}

  .map::after {{
    content: 'Live Bus Tracking';
    position: absolute;
    left: 16px;
    bottom: 16px;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
  }}

  .mini-card {{
    height: 74px;
    border-radius: 16px;
    background: rgba(255,255,255,0.05);
    margin-bottom: 12px;
    padding: 14px;
  }}

  .mini-card:last-child {{
    margin-bottom: 0;
  }}

  .mini-title {{
    color: rgba(255,255,255,0.9);
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 8px;
  }}

  .mini-sub {{
    color: rgba(255,255,255,0.5);
    font-size: 12px;
  }}

  .cta-wrap {{
    margin-top: 48px;
    text-align: center;
    padding: 42px 32px;
    border-radius: 28px;
    background:
      radial-gradient(circle at top, rgba(99,102,241,0.12), transparent 50%),
      #f8fafc;
    border: 1px solid #e2e8f0;
  }}

  .cta-wrap h2 {{
    margin: 0 0 12px;
    font-size: 34px;
    line-height: 1.1;
    letter-spacing: -1.4px;
    color: #0f172a;
  }}

  .cta-wrap p {{
    margin: 0 auto 28px;
    max-width: 520px;
    color: #64748b;
    line-height: 1.8;
    font-size: 15px;
  }}

  .button {{
    display: inline-block;
    padding: 18px 34px;
    border-radius: 18px;
    background: linear-gradient(135deg,#4f46e5,#7c3aed);
    color: #ffffff !important;
    text-decoration: none;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: -0.2px;
    box-shadow:
      0 10px 30px rgba(79,70,229,0.35),
      inset 0 1px 0 rgba(255,255,255,0.2);
  }}

  .secondary {{
    margin-top: 16px;
    font-size: 13px;
    color: #64748b;
  }}

  .secondary a {{
    color: #4f46e5;
    text-decoration: none;
    font-weight: 700;
  }}

  .footer {{
    padding: 28px 48px 42px;
    text-align: center;
  }}

  .footer p {{
    margin: 0;
    color: #94a3b8;
    font-size: 12px;
    line-height: 1.8;
  }}

  .footer a {{
    color: #6366f1;
    text-decoration: none;
    font-weight: 700;
  }}

  @media only screen and (max-width: 640px) {{
    .hero,
    .content,
    .footer {{
      padding-left: 24px;
      padding-right: 24px;
    }}

    .hero h1 {{
      font-size: 34px;
    }}

    .section-title,
    .cta-wrap h2 {{
      font-size: 28px;
    }}

    .dashboard {{
      grid-template-columns: 1fr;
    }}

    .outcome p {{
      padding-left: 0;
    }}
  }}
</style>
</head>
<body>
  <div class=\"container\">
    <div class=\"card\">

      <div class=\"hero\">
        <div class=\"badge\">🚀 Premium School Operations Platform</div>

        <h1>
          Parents are already searching for {school_name} on Skippo.
        </h1>

        <p>
          Bring transport visibility, parent communication, teacher updates,
          and school operations into one modern platform your parents will actually love using.
        </p>

        <div class=\"stats-row\">
          <div class=\"stat-chip\">
            <div class=\"stat-value\">98%</div>
            <div class=\"stat-label\">Parent Engagement</div>
          </div>

          <div class=\"stat-chip\">
            <div class=\"stat-value\">3 Min</div>
            <div class=\"stat-label\">School Setup</div>
          </div>

          <div class=\"stat-chip\">
            <div class=\"stat-value\">Real-Time</div>
            <div class=\"stat-label\">Bus Visibility</div>
          </div>
        </div>
      </div>

      <div class=\"content\">
        <div class=\"eyebrow\">A Parent Triggered This Email</div>

        <h2 class=\"section-title\">
          One of your parents tried to join Skippo — but your school isn't live yet.
        </h2>

        <p class=\"lead\">
          Schools across India are replacing scattered WhatsApp groups, paper updates,
          and outdated ERP systems with <span class=\"highlight\">one unified experience</span>
          for parents, teachers, transport teams, and administrators.
        </p>

        <div class=\"glass-panel\">
          <div class=\"outcomes\">

            <div class=\"outcome\">
              <div class=\"outcome-top\">
                <div class=\"icon icon-purple\">📍</div>
                <div class=\"outcome-title\">Parents stop calling reception.</div>
              </div>
              <p>
                Real-time transport visibility gives parents live updates on bus location,
                arrival timing, delays, and drop confirmations.
              </p>
            </div>

            <div class=\"outcome\">
              <div class=\"outcome-top\">
                <div class=\"icon icon-blue\">📲</div>
                <div class=\"outcome-title\">School communication becomes effortless.</div>
              </div>
              <p>
                Attendance alerts, announcements, fee reminders, and classroom updates
                reach parents instantly through one modern app.
              </p>
            </div>

            <div class=\"outcome\">
              <div class=\"outcome-top\">
                <div class=\"icon icon-orange\">🎓</div>
                <div class=\"outcome-title\">Teachers update parents in seconds.</div>
              </div>
              <p>
                Progress notes, classroom observations, and student milestones can be
                shared instantly without extra admin overhead.
              </p>
            </div>

          </div>
        </div>

        <div class=\"mockup\">
          <div class=\"mock-header\">
            <div class=\"mock-logo\">Skippo Dashboard</div>
            <div class=\"mock-pill\">Live Operations</div>
          </div>

          <div class=\"dashboard\">
            <div class=\"panel\">
              <div class=\"map\"></div>
            </div>

            <div>
              <div class=\"mini-card\">
                <div class=\"mini-title\">Today's Attendance</div>
                <div class=\"mini-sub\">1,284 students synced live</div>
              </div>

              <div class=\"mini-card\">
                <div class=\"mini-title\">Parent Alerts</div>
                <div class=\"mini-sub\">All notices delivered instantly</div>
              </div>

              <div class=\"mini-card\">
                <div class=\"mini-title\">Transport Status</div>
                <div class=\"mini-sub\">All active routes operational</div>
              </div>
            </div>
          </div>
        </div>

        <div class=\"cta-wrap\">
          <h2>
            Bring {school_name} to Skippo.
          </h2>

          <p>
            Setup takes only a few minutes. No complicated deployment,
            no hardware installation, and no lengthy onboarding process.
          </p>

          <a
            href=\"https://skippo.co.in/schools/register?ref=parent-outreach&school={school_name.replace(' ', '+')}\"
            class=\"button\"
          >
            Activate Your School →
          </a>

          <div class=\"secondary\">
            Prefer a walkthrough?
            <a href=\"mailto:skippo.india@gmail.com\">Reply to this email</a>
            or WhatsApp us directly.
          </div>
        </div>
      </div>

      <div class=\"footer\">
        <p>
          This email was sent because a parent searched for
          <strong>{school_name}</strong> inside the Skippo Parent App.<br /><br />

          <a href=\"https://skippo.co.in\">skippo.co.in</a>
          · Built for modern schools in India.
        </p>
      </div>

    </div>
  </div>
</body>
</html>
"""

    try:
        with httpx.Client(timeout=8.0) as client:
            resp = client.post(
                f"{EMAIL_SERVICE_URL}/send",
                json={
                    "to": to,
                    "subject": f"Parents from {school_name} are looking for Skippo",
                    "html": html,
                    "reply_to": CONTACT_EMAIL,
                },
                headers={"X-Api-Key": EMAIL_SERVICE_API_KEY},
            )

            resp.raise_for_status()
            logger.info(
                "Premium school outreach email sent → %s (school: %s)",
                to,
                school_name,
            )
            return True

    except Exception as exc:
        logger.warning(
            "Premium school outreach email failed to %s: %s",
            to,
            exc,
        )
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
