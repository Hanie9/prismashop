import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

IRAN_MOBILE_RE = re.compile(r"^09\d{9}$")
EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
PASSWORD_RE = re.compile(r"^.{8,128}$", re.DOTALL)


def to_camel(string: str) -> str:
    parts = string.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def normalize_iran_mobile(value: str) -> str:
    v = value.strip()
    if not IRAN_MOBILE_RE.fullmatch(v):
        raise ValueError("شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود")
    return v


def normalize_email(value: str) -> str:
    v = value.strip().lower()
    if not EMAIL_RE.fullmatch(v):
        raise ValueError("ایمیل معتبر نیست")
    return v


def normalize_password(value: str) -> str:
    if not PASSWORD_RE.fullmatch(value):
        raise ValueError("رمز عبور باید حداقل ۸ کاراکتر باشد")
    return value


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        serialize_by_alias=True,
    )


# ---------- Auth ----------


class CustomerRegister(CamelModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    mobile: str
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        return normalize_iran_mobile(v)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: EmailStr) -> str:
        return normalize_email(str(v))

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return normalize_password(v)


class CustomerLogin(CamelModel):
    email_or_mobile: str
    password: str
    remember_me: bool = False

    @field_validator("email_or_mobile")
    @classmethod
    def validate_email_or_mobile(cls, v: str) -> str:
        raw = v.strip()
        if IRAN_MOBILE_RE.fullmatch(raw):
            return raw
        if EMAIL_RE.fullmatch(raw.lower()):
            return raw.lower()
        raise ValueError("ایمیل یا شماره موبایل معتبر وارد کنید")


class AdminLogin(CamelModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def validate_admin_email(cls, v: EmailStr) -> str:
        return normalize_email(str(v))


class SessionResponse(CamelModel):
    session_id: str
    role: Literal["guest", "customer", "admin"]
    expires_at: datetime
    display_name: str | None = None
    email: str | None = None


class CustomerOut(CamelModel):
    id: int
    first_name: str
    last_name: str
    mobile: str
    email: EmailStr
    province: str | None = None
    city: str | None = None
    address: str | None = None
    postal_code: str | None = None
    created_at: datetime


class CustomerProfileUpdate(CamelModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    province: str | None = None
    city: str | None = None
    address: str | None = None
    postal_code: str | None = None


class AdminOut(CamelModel):
    id: int
    email: EmailStr
    first_name: str
    last_name: str


# ---------- Category ----------


class CategoryBase(CamelModel):
    name: str = Field(min_length=1, max_length=200)
    icon: str = "📦"
    image: str = Field(min_length=1)


class CategoryCreate(CategoryBase):
    id: str = Field(min_length=1, max_length=64)

    @field_validator("id")
    @classmethod
    def slugify_id(cls, v: str) -> str:
        v = v.strip().lower().replace(" ", "-")
        if not v:
            raise ValueError("شناسه دسته‌بندی الزامی است")
        return v


class CategoryUpdate(CamelModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    icon: str | None = None
    image: str | None = Field(default=None, min_length=1)


class CategoryOut(CamelModel):
    id: str
    name: str
    icon: str
    image: str
    product_count: int | None = None


# ---------- Product ----------


class ProductSpecItem(CamelModel):
    label: str = Field(min_length=1, max_length=100)
    value: str = Field(min_length=1, max_length=500)


class ProductCreate(CamelModel):
    name: str = Field(min_length=1, max_length=255)
    category_id: str
    original_price: int = Field(gt=0)
    discount_percent: int = Field(default=0, ge=0, le=100)
    images: list[str] = Field(min_length=1)
    is_new: bool = False
    stock: int = Field(default=10, ge=0)
    low_stock_threshold: int = Field(default=5, ge=1)
    description: str | None = None
    detail_paragraphs: list[str] = Field(default_factory=list)
    highlights: list[str] = Field(default_factory=list)
    specs: list[ProductSpecItem] = Field(default_factory=list)
    active: bool = True


class ProductUpdate(CamelModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    category_id: str | None = None
    original_price: int | None = Field(default=None, gt=0)
    discount_percent: int | None = Field(default=None, ge=0, le=100)
    images: list[str] | None = None
    is_new: bool | None = None
    stock: int | None = Field(default=None, ge=0)
    low_stock_threshold: int | None = Field(default=None, ge=1)
    description: str | None = None
    detail_paragraphs: list[str] | None = None
    highlights: list[str] | None = None
    specs: list[ProductSpecItem] | None = None
    active: bool | None = None


class ProductStockUpdate(CamelModel):
    stock: int | None = Field(default=None, ge=0)
    low_stock_threshold: int | None = Field(default=None, ge=1)


class ProductOut(CamelModel):
    id: int
    name: str
    price: int
    original_price: int | None = None
    image: str
    images: list[str]
    category: str
    category_id: str
    rating: float
    review_count: int
    is_new: bool = False
    discount: int | None = None
    stock: int
    low_stock_threshold: int
    description: str | None = None
    detail_paragraphs: list[str] = Field(default_factory=list)
    highlights: list[str] = Field(default_factory=list)
    specs: list[ProductSpecItem] = Field(default_factory=list)
    active: bool
    is_low_stock: bool = False


class ProductListResponse(CamelModel):
    items: list[ProductOut]
    total: int


# ---------- Coupon ----------


class CouponCreate(CamelModel):
    code: str = Field(min_length=1, max_length=64)
    type: Literal["percent", "fixed"]
    value: int = Field(gt=0)
    active: bool = True
    min_order: int = Field(default=0, ge=0)

    @field_validator("code")
    @classmethod
    def upper_code(cls, v: str) -> str:
        return v.strip().upper()


class CouponUpdate(CamelModel):
    code: str | None = None
    type: Literal["percent", "fixed"] | None = None
    value: int | None = Field(default=None, gt=0)
    active: bool | None = None
    min_order: int | None = Field(default=None, ge=0)

    @field_validator("code")
    @classmethod
    def upper_code(cls, v: str | None) -> str | None:
        return v.strip().upper() if v else v


class CouponOut(CamelModel):
    id: str
    code: str
    type: Literal["percent", "fixed"]
    value: int
    active: bool
    min_order: int


class CouponValidateRequest(CamelModel):
    code: str
    subtotal: int = Field(ge=0)


class CouponValidateResponse(CamelModel):
    valid: bool
    discount: int = 0
    message: str | None = None
    coupon: CouponOut | None = None


# ---------- Orders ----------


class CheckoutItem(CamelModel):
    product_id: int
    qty: int = Field(gt=0)


class CheckoutCustomer(CamelModel):
    first_name: str = Field(min_length=1)
    last_name: str = Field(min_length=1)
    phone: str
    email: EmailStr | None = None
    province: str = Field(min_length=1)
    city: str = Field(min_length=1)
    address: str = Field(min_length=10)
    postal_code: str
    notes: str | None = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return normalize_iran_mobile(v)

    @field_validator("email")
    @classmethod
    def validate_checkout_email(cls, v: EmailStr | None) -> str | None:
        if v is None:
            return None
        return normalize_email(str(v))

    @field_validator("postal_code")
    @classmethod
    def validate_postal(cls, v: str) -> str:
        v = v.strip()
        if not re.fullmatch(r"\d{10}", v):
            raise ValueError("کد پستی باید دقیقاً ۱۰ رقم باشد")
        return v


class CheckoutRequest(CamelModel):
    customer: CheckoutCustomer
    items: list[CheckoutItem] = Field(min_length=1)
    coupon_code: str | None = None


class OrderItemOut(CamelModel):
    product_id: int
    name: str
    price: int
    qty: int
    image: str


class OrderCustomerOut(CamelModel):
    first_name: str
    last_name: str
    phone: str
    email: str | None = None
    province: str
    city: str
    address: str
    postal_code: str
    notes: str | None = None


class OrderOut(CamelModel):
    id: str
    tracking_code: str
    created_at: datetime
    status: Literal["pending", "processing", "shipped", "delivered", "cancelled"]
    customer: OrderCustomerOut
    items: list[OrderItemOut]
    subtotal: int
    shipping: int
    discount: int
    total: int
    coupon_code: str | None = None


class OrderStatusUpdate(CamelModel):
    status: Literal["pending", "processing", "shipped", "delivered", "cancelled"]


# ---------- Dashboard / Customers ----------


class DashboardStats(CamelModel):
    active_products: int
    open_orders: int
    low_stock_products: int
    categories_count: int
    confirmed_revenue: int
    out_of_stock: int
    active_coupons: int
    recent_orders: list[OrderOut]


class AggregatedCustomer(CamelModel):
    phone: str
    first_name: str
    last_name: str
    email: str | None = None
    city: str = ""
    province: str = ""
    address: str | None = None
    postal_code: str | None = None
    orders_count: int = 0
    total_spent: int = 0
    last_order_at: datetime | None = None
    registered_at: datetime | None = None
    is_registered: bool = False


class UploadResponse(CamelModel):
    url: str


class MessageResponse(CamelModel):
    message: str


class WishlistToggleResponse(CamelModel):
    wishlisted: bool
    product_ids: list[int]


# ---------- Reviews ----------


class ReviewCreate(CamelModel):
    rating: int = Field(ge=1, le=5)
    text: str = Field(min_length=10, max_length=1000)


class ReviewAdminUpdate(CamelModel):
    featured_on_home: bool | None = None
    featured_order: int | None = Field(default=None, ge=0, le=100)
    role_label: str | None = Field(default=None, max_length=120)


class ReviewOut(CamelModel):
    id: int
    product_id: int
    product_name: str | None = None
    user_id: int
    user_name: str
    rating: int
    text: str
    featured_on_home: bool = False
    featured_order: int = 0
    role_label: str | None = None
    created_at: datetime
    is_mine: bool = False


class FeaturedReviewOut(CamelModel):
    id: int
    name: str
    role: str
    text: str
    rating: int
    avatar: str
    product_name: str | None = None


class CartLine(CamelModel):
    product_id: int
    qty: int = Field(gt=0)


class CartOut(CamelModel):
    items: list[CartLine]


class CartReplaceRequest(CamelModel):
    items: list[CartLine] = Field(default_factory=list)
