"""
Skippo Payment Service
======================
FastAPI microservice that owns all Razorpay API calls so the Django
backend never touches the Razorpay SDK directly.

Endpoints
---------
POST /orders/create       — Create a Razorpay order (Django calls this before showing checkout)
POST /orders/verify       — HMAC-SHA256 signature verification
POST /accounts/create     — Onboard a school as a Razorpay Route linked account
POST /transfers/create    — Transfer school share to their linked account (post-capture)
POST /webhooks/razorpay   — Receive async payment events from Razorpay
GET  /health
"""
import hashlib
import hmac
import logging
from contextlib import asynccontextmanager

import razorpay
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from config import settings

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("payment-service")

_client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))


@asynccontextmanager
async def lifespan(_: FastAPI):
    log.info("Payment service started. Razorpay key: %s", settings.razorpay_key_id[:8] + "…" if settings.razorpay_key_id else "(not set)")
    yield


app = FastAPI(title="Skippo Payment Service", lifespan=lifespan)


# ── Order creation ────────────────────────────────────────────────────────────

class CreateOrderRequest(BaseModel):
    amount_paise:        int          # total amount in paise
    receipt:             str          # e.g. "inv_42"
    linked_account_id:   str | None = None
    school_amount_paise: int | None = None  # used for Route transfer post-capture


@app.post("/orders/create")
def create_order(req: CreateOrderRequest):
    """Create a Razorpay order.  The order_id is returned to the parent app to open checkout."""
    try:
        order = _client.order.create({
            "amount":   req.amount_paise,
            "currency": "INR",
            "receipt":  req.receipt,
        })
    except Exception as exc:
        log.error("Order creation failed: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc))

    log.info("Order created: %s for ₹%.2f", order["id"], req.amount_paise / 100)
    return {
        "order_id": order["id"],
        "amount":   order["amount"],
        "currency": order["currency"],
    }


# ── Signature verification ────────────────────────────────────────────────────

class VerifyRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id:   str
    razorpay_signature:  str


@app.post("/orders/verify")
def verify_payment(req: VerifyRequest):
    """HMAC-SHA256 verify the payment.  Returns {valid: bool}."""
    body     = f"{req.razorpay_order_id}|{req.razorpay_payment_id}"
    expected = hmac.new(
        settings.razorpay_key_secret.encode(),
        body.encode(),
        hashlib.sha256,
    ).hexdigest()
    valid = hmac.compare_digest(expected, req.razorpay_signature)
    log.info("Verify payment %s → %s", req.razorpay_payment_id, "OK" if valid else "FAIL")
    return {"valid": valid, "transfer_id": ""}


# ── Linked account creation (Razorpay Route) ──────────────────────────────────

class CreateAccountRequest(BaseModel):
    school_id:   int
    school_name: str
    email:       str
    profile:     dict = {}


@app.post("/accounts/create")
def create_linked_account(req: CreateAccountRequest):
    """
    Register a school as a Razorpay Route linked account (sub-merchant).
    Light KYC — school must complete full KYC in the Razorpay dashboard before
    payouts are enabled.
    """
    address = req.profile.get("address", {
        "street1":     "School Address",
        "city":        "Mumbai",
        "state":       "Maharashtra",
        "postal_code": "400001",
        "country":     "IN",
    })
    try:
        account = _client.account.create({
            "email":               req.email,
            "legal_business_name": req.school_name,
            "business_type":       "educational_institutes",
            "profile": {
                "category":    "education",
                "subcategory": "educational_institutes",
                "addresses": {"registered": address},
            },
            "legal_info": req.profile.get("legal_info", {}),
        })
    except Exception as exc:
        log.error("Linked account creation failed for school %s: %s", req.school_id, exc)
        raise HTTPException(status_code=502, detail=str(exc))

    log.info("Linked account created: %s for school_id=%s", account["id"], req.school_id)
    return {
        "account_id": account["id"],
        "name":       account.get("legal_business_name", req.school_name),
        "email":      account.get("email", req.email),
        "status":     account.get("status", "created"),
    }


# ── Route transfer (school payout) ────────────────────────────────────────────

class TransferRequest(BaseModel):
    payment_id:          str
    linked_account_id:   str
    school_amount_paise: int


@app.post("/transfers/create")
def create_transfer(req: TransferRequest):
    """
    Transfer the school's share to their linked account via Razorpay Route.
    Called by the backend after verifying a captured payment.
    """
    try:
        result = _client.payment.transfer(req.payment_id, {
            "transfers": [{
                "account":  req.linked_account_id,
                "amount":   req.school_amount_paise,
                "currency": "INR",
            }]
        })
    except Exception as exc:
        log.error("Transfer failed for payment %s: %s", req.payment_id, exc)
        raise HTTPException(status_code=502, detail=str(exc))

    items      = result.get("items", [])
    transfer_id = items[0].get("id", "") if items else ""
    log.info("Transfer %s → account %s ₹%.2f", transfer_id, req.linked_account_id, req.school_amount_paise / 100)
    return {"transfer_id": transfer_id}


# ── Razorpay webhook ──────────────────────────────────────────────────────────

@app.post("/webhooks/razorpay")
async def razorpay_webhook(request: Request):
    """
    Verify the Razorpay webhook signature and log the event.
    Add downstream handling (e.g. mark invoices paid on payment.captured) as needed.
    """
    body      = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    expected  = hmac.new(
        settings.razorpay_webhook_secret.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, signature):
        log.warning("Invalid webhook signature")
        raise HTTPException(status_code=400, detail="Invalid signature")

    import json
    event = json.loads(body).get("event", "unknown")
    log.info("Webhook event: %s", event)
    return JSONResponse({"status": "ok"})


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "payment-service"}
