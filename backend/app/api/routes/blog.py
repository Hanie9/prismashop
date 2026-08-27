import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.admin_user import AdminUser
from app.models.blog_post import BlogPost
from app.schemas import BlogPostCreate, BlogPostOut, BlogPostUpdate, MessageResponse

router = APIRouter(tags=["blog"])

SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def _normalize_slug(value: str) -> str:
    slug = value.strip().lower().replace("_", "-")
    slug = re.sub(r"\s+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    if not slug or not SLUG_RE.fullmatch(slug):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="شناسه مقاله باید فقط حروف انگلیسی کوچک، عدد و خط تیره باشد",
        )
    return slug


def _serialize(post: BlogPost) -> BlogPostOut:
    return BlogPostOut(
        id=post.id,
        slug=post.slug,
        title=post.title,
        excerpt=post.excerpt,
        cover=post.cover,
        category=post.category,
        read_time_minutes=post.read_time_minutes,
        content=list(post.content or []),
        published=post.published,
        created_at=post.created_at,
        updated_at=post.updated_at,
    )


@router.get("/blog", response_model=list[BlogPostOut])
def list_blog_posts(db: Session = Depends(get_db)):
    rows = db.scalars(
        select(BlogPost)
        .where(BlogPost.published.is_(True))
        .order_by(BlogPost.created_at.desc())
    ).all()
    return [_serialize(row) for row in rows]


@router.get("/blog/{slug}", response_model=BlogPostOut)
def get_blog_post(slug: str, db: Session = Depends(get_db)):
    post = db.scalar(
        select(BlogPost).where(
            BlogPost.slug == slug,
            BlogPost.published.is_(True),
        )
    )
    if not post:
        raise HTTPException(status_code=404, detail="مقاله یافت نشد")
    return _serialize(post)


@router.get("/admin/blog", response_model=list[BlogPostOut])
def admin_list_blog_posts(
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    rows = db.scalars(
        select(BlogPost).order_by(BlogPost.created_at.desc())
    ).all()
    return [_serialize(row) for row in rows]


@router.post("/admin/blog", response_model=BlogPostOut, status_code=201)
def admin_create_blog_post(
    payload: BlogPostCreate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    slug = _normalize_slug(payload.slug)
    if db.scalar(select(BlogPost.id).where(BlogPost.slug == slug)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="شناسه مقاله تکراری است",
        )

    content = [p.strip() for p in payload.content if p and p.strip()]
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="متن مقاله باید حداقل یک پاراگراف داشته باشد",
        )

    post = BlogPost(
        slug=slug,
        title=payload.title.strip(),
        excerpt=payload.excerpt.strip(),
        cover=payload.cover.strip(),
        category=(payload.category or "حروف کالیگرافی").strip(),
        read_time_minutes=payload.read_time_minutes,
        content=content,
        published=payload.published,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return _serialize(post)


@router.patch("/admin/blog/{post_id}", response_model=BlogPostOut)
def admin_update_blog_post(
    post_id: int,
    payload: BlogPostUpdate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    post = db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="مقاله یافت نشد")

    data = payload.updates()

    if "slug" in data and data["slug"] is not None:
        slug = _normalize_slug(data["slug"])
        existing = db.scalar(
            select(BlogPost.id).where(
                BlogPost.slug == slug,
                BlogPost.id != post_id,
            )
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="شناسه مقاله تکراری است",
            )
        post.slug = slug

    if "title" in data and data["title"] is not None:
        post.title = data["title"].strip()
    if "excerpt" in data and data["excerpt"] is not None:
        post.excerpt = data["excerpt"].strip()
    if "cover" in data and data["cover"] is not None:
        post.cover = data["cover"].strip()
    if "category" in data and data["category"] is not None:
        post.category = data["category"].strip() or "حروف کالیگرافی"
    if "read_time_minutes" in data and data["read_time_minutes"] is not None:
        post.read_time_minutes = int(data["read_time_minutes"])
    if "content" in data and data["content"] is not None:
        content = [p.strip() for p in data["content"] if p and p.strip()]
        if not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="متن مقاله باید حداقل یک پاراگراف داشته باشد",
            )
        post.content = content
    if "published" in data and data["published"] is not None:
        post.published = bool(data["published"])

    db.add(post)
    db.commit()
    db.refresh(post)
    return _serialize(post)


@router.delete("/admin/blog/{post_id}", response_model=MessageResponse)
def admin_delete_blog_post(
    post_id: int,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    post = db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="مقاله یافت نشد")
    db.delete(post)
    db.commit()
    return MessageResponse(message="مقاله حذف شد")
