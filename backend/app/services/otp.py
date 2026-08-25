import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.otp_challenge import OtpChallenge

OTP_LENGTH = 6
OTP_TTL_SECONDS = 300
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN_SECONDS = 60
SIGNUP_TOKEN_TTL_SECONDS = 600


def _hash_code(code: str) -> str:
    secret = get_settings().SECRET_KEY.encode("utf-8")
    return hmac.new(secret, code.encode("utf-8"), hashlib.sha256).hexdigest()


def _generate_code() -> str:
    return f"{secrets.randbelow(10**OTP_LENGTH):0{OTP_LENGTH}d}"


def create_otp_challenge(db: Session, *, mobile: str, purpose: str) -> tuple[OtpChallenge, str]:
    now = datetime.now(timezone.utc)
    recent = db.scalar(
        select(OtpChallenge)
        .where(
            OtpChallenge.mobile == mobile,
            OtpChallenge.purpose == purpose,
        )
        .order_by(OtpChallenge.created_at.desc())
        .limit(1)
    )
    if recent and recent.created_at:
        created = recent.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        elapsed = (now - created).total_seconds()
        if elapsed < OTP_RESEND_COOLDOWN_SECONDS:
            wait = int(OTP_RESEND_COOLDOWN_SECONDS - elapsed)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"لطفاً {wait} ثانیه صبر کنید و دوباره درخواست دهید",
            )

    code = _generate_code()
    challenge = OtpChallenge(
        mobile=mobile,
        purpose=purpose,
        code_hash=_hash_code(code),
        attempts=0,
        expires_at=now + timedelta(seconds=OTP_TTL_SECONDS),
        verified_at=None,
        signup_token=None,
    )
    db.add(challenge)
    db.commit()
    db.refresh(challenge)

    # Dev fallback: log OTP so local testing works without SMS gateway
    print(f"[OTP] mobile={mobile} purpose={purpose} code={code}")
    return challenge, code


def verify_otp_challenge(
    db: Session,
    *,
    mobile: str,
    purpose: str,
    code: str,
) -> OtpChallenge:
    now = datetime.now(timezone.utc)
    challenge = db.scalar(
        select(OtpChallenge)
        .where(
            OtpChallenge.mobile == mobile,
            OtpChallenge.purpose == purpose,
            OtpChallenge.verified_at.is_(None),
        )
        .order_by(OtpChallenge.created_at.desc())
        .limit(1)
    )
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="کد تأیید یافت نشد. دوباره درخواست کد دهید",
        )

    expires = challenge.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="کد منقضی شده است. دوباره درخواست دهید",
        )

    if challenge.attempts >= OTP_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="تعداد تلاش‌ها بیش از حد مجاز است. دوباره درخواست کد دهید",
        )

    challenge.attempts += 1
    if not hmac.compare_digest(challenge.code_hash, _hash_code(code.strip())):
        db.add(challenge)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="کد تأیید نادرست است",
        )

    challenge.verified_at = now
    if purpose == "signup":
        challenge.signup_token = secrets.token_urlsafe(32)
    db.add(challenge)
    db.commit()
    db.refresh(challenge)
    return challenge


def consume_signup_token(db: Session, *, mobile: str, signup_token: str) -> OtpChallenge:
    now = datetime.now(timezone.utc)
    challenge = db.scalar(
        select(OtpChallenge).where(
            OtpChallenge.mobile == mobile,
            OtpChallenge.purpose == "signup",
            OtpChallenge.signup_token == signup_token,
        )
    )
    if not challenge or not challenge.verified_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="تأیید شماره موبایل نامعتبر است. دوباره کد را دریافت کنید",
        )

    verified = challenge.verified_at
    if verified.tzinfo is None:
        verified = verified.replace(tzinfo=timezone.utc)
    if (now - verified).total_seconds() > SIGNUP_TOKEN_TTL_SECONDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="مهلت تکمیل ثبت‌نام تمام شده است. دوباره شروع کنید",
        )

    # one-time use
    challenge.signup_token = None
    db.add(challenge)
    db.commit()
    return challenge
