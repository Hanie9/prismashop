from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_current_user, get_optional_user
from app.core.database import get_db
from app.models.admin_user import AdminUser
from app.models.contact_message import ContactMessage
from app.models.user import User
from app.schemas import (
    ContactMessageCreate,
    ContactMessageOut,
    ContactMessageUpdate,
    MessageResponse,
)

router = APIRouter(tags=["contact"])


def _serialize(row: ContactMessage) -> ContactMessageOut:
    return ContactMessageOut(
        id=row.id,
        user_id=row.user_id,
        first_name=row.first_name,
        last_name=row.last_name,
        mobile=row.mobile,
        email=row.email,
        subject=row.subject,
        message=row.message,
        reply=row.reply,
        replied_at=row.replied_at,
        is_read=row.is_read,
        created_at=row.created_at,
    )


def _resolve_user_id(
    db: Session,
    *,
    user: User | None,
    email: str,
    mobile: str,
) -> int | None:
    if user:
        return user.id
    matched = db.scalar(
        select(User).where(
            or_(User.email == email, User.mobile == mobile),
            User.is_active.is_(True),
        )
    )
    return matched.id if matched else None


@router.post("/contact", response_model=MessageResponse, status_code=201)
def create_contact_message(
    payload: ContactMessageCreate,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    email = payload.email
    mobile = payload.mobile
    row = ContactMessage(
        user_id=_resolve_user_id(db, user=user, email=email, mobile=mobile),
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        mobile=mobile,
        email=email,
        subject=payload.subject.strip(),
        message=payload.message.strip(),
        is_read=False,
    )
    db.add(row)
    db.commit()
    return MessageResponse(message="پیام شما با موفقیت ثبت شد")


@router.get("/contact/mine", response_model=list[ContactMessageOut])
def list_my_contact_messages(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = db.scalars(
        select(ContactMessage)
        .where(
            or_(
                ContactMessage.user_id == user.id,
                ContactMessage.email == user.email,
                ContactMessage.mobile == user.mobile,
            )
        )
        .order_by(ContactMessage.created_at.desc())
    ).all()
    return [_serialize(row) for row in rows]


@router.get("/admin/contact", response_model=list[ContactMessageOut])
def admin_list_contact_messages(
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    rows = db.scalars(
        select(ContactMessage).order_by(
            ContactMessage.is_read.asc(),
            ContactMessage.created_at.desc(),
        )
    ).all()
    return [_serialize(row) for row in rows]


@router.patch("/admin/contact/{message_id}", response_model=ContactMessageOut)
def admin_update_contact_message(
    message_id: int,
    payload: ContactMessageUpdate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    row = db.get(ContactMessage, message_id)
    if not row:
        raise HTTPException(status_code=404, detail="پیام یافت نشد")

    data = payload.updates()
    if "is_read" in data and data["is_read"] is not None:
        row.is_read = bool(data["is_read"])

    if "reply" in data:
        reply_text = (data["reply"] or "").strip()
        if reply_text:
            row.reply = reply_text
            row.replied_at = datetime.now(timezone.utc)
            row.is_read = True
        else:
            row.reply = None
            row.replied_at = None

    db.add(row)
    db.commit()
    db.refresh(row)
    return _serialize(row)


@router.delete("/admin/contact/{message_id}", response_model=MessageResponse)
def admin_delete_contact_message(
    message_id: int,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    row = db.get(ContactMessage, message_id)
    if not row:
        raise HTTPException(status_code=404, detail="پیام یافت نشد")
    db.delete(row)
    db.commit()
    return MessageResponse(message="پیام حذف شد")
