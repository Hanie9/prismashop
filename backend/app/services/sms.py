"""SMS.ir verify-template delivery for OTP codes."""

from __future__ import annotations

import logging

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

SMS_IR_VERIFY_URL = "https://api.sms.ir/v1/send/verify"


class SmsDeliveryError(Exception):
    """Raised when SMS.ir rejects or fails to deliver a message."""


def normalize_sms_mobile(mobile: str) -> str:
    """Convert Iranian mobile (09xxxxxxxxx) to SMS.ir format (9xxxxxxxxx)."""
    digits = "".join(ch for ch in mobile if ch.isdigit())
    if digits.startswith("98") and len(digits) == 12:
        return digits[2:]
    if digits.startswith("0") and len(digits) == 11:
        return digits[1:]
    return digits


def send_otp_sms(mobile: str, code: str) -> None:
    settings = get_settings()
    if not settings.sms_configured:
        return

    payload = {
        "mobile": normalize_sms_mobile(mobile),
        "templateId": settings.SMS_IR_TEMPLATE_ID,
        "parameters": [
            {
                "name": settings.SMS_IR_TEMPLATE_PARAM,
                "value": code,
            }
        ],
    }

    try:
        response = httpx.post(
            SMS_IR_VERIFY_URL,
            json=payload,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "x-api-key": settings.SMS_IR_API_KEY,
            },
            timeout=15.0,
        )
    except httpx.HTTPError as exc:
        logger.exception("SMS.ir request failed for %s", mobile)
        raise SmsDeliveryError("ارسال پیامک ناموفق بود") from exc

    if response.status_code >= 400:
        logger.error(
            "SMS.ir HTTP %s for %s: %s",
            response.status_code,
            mobile,
            response.text[:500],
        )
        raise SmsDeliveryError("ارسال پیامک ناموفق بود")

    try:
        data = response.json()
    except ValueError as exc:
        logger.error("SMS.ir invalid JSON for %s: %s", mobile, response.text[:500])
        raise SmsDeliveryError("پاسخ سرویس پیامک نامعتبر بود") from exc

    if data.get("status") != 1:
        message = data.get("message") or "ارسال پیامک ناموفق بود"
        logger.error("SMS.ir rejected OTP for %s: %s", mobile, message)
        raise SmsDeliveryError(message)
