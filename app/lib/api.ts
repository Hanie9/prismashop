const API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:8000";

export const SESSION_STORAGE_KEY = "prismashop_session_id";
export const SESSION_PERSIST_KEY = "prismashop_session_persist";
export const REMEMBERED_LOGIN_KEY = "prismashop_remembered_login";
export const SESSION_HEADER = "X-Session-Id";

export type ApiError = {
  detail?: string | { msg?: string; type?: string; loc?: (string | number)[] }[];
};

const FIELD_LABELS: Record<string, string> = {
  email: "ایمیل",
  emailOrMobile: "ایمیل یا موبایل",
  email_or_mobile: "ایمیل یا موبایل",
  password: "رمز عبور",
  firstName: "نام",
  first_name: "نام",
  lastName: "نام خانوادگی",
  last_name: "نام خانوادگی",
  mobile: "موبایل",
  phone: "موبایل",
  postalCode: "کد پستی",
  postal_code: "کد پستی",
  address: "آدرس",
  province: "استان",
  city: "شهر",
  code: "کد",
  otpCode: "کد تأیید",
  otp_code: "کد تأیید",
  name: "نام",
  categoryId: "دسته‌بندی",
  category_id: "دسته‌بندی",
  images: "تصاویر",
  value: "مقدار",
  items: "اقلام سبد",
  customer: "اطلاعات مشتری",
};

function translateValidationMsg(msg: string, field?: string): string {
  const label = (field && FIELD_LABELS[field]) || "مقدار واردشده";
  const lower = msg.toLowerCase();

  if (lower.includes("valid email") || lower.includes("email address")) {
    return "لطفاً یک ایمیل معتبر وارد کنید.";
  }
  if (lower.includes("field required") || lower.includes("missing")) {
    return `${label} الزامی است.`;
  }
  if (lower.includes("at least") && lower.includes("character")) {
    return `${label} کوتاه‌تر از حد مجاز است.`;
  }
  if (lower.includes("string_too_short") || lower.includes("too_short")) {
    return `${label} کوتاه‌تر از حد مجاز است.`;
  }
  if (lower.includes("string_too_long") || lower.includes("too_long")) {
    return `${label} بلندتر از حد مجاز است.`;
  }
  if (lower.includes("greater than") || lower.includes("gt") || lower.includes("ge")) {
    return `${label} باید عدد معتبر و در محدوده مجاز باشد.`;
  }
  if (lower.includes("integer") || lower.includes("number") || lower.includes("float")) {
    return `${label} باید عدد باشد.`;
  }
  if (lower.includes("json") || lower.includes("type")) {
    return `فرمت ${label} نامعتبر است.`;
  }
  // Already Persian or custom backend message
  if (/[\u0600-\u06FF]/.test(msg)) return msg;
  return "اطلاعات واردشده نامعتبر است. لطفاً دوباره بررسی کنید.";
}

function statusMessage(status: number): string {
  if (status === 401) return "برای ادامه باید وارد حساب کاربری شوید.";
  if (status === 403) return "دسترسی مجاز نیست.";
  if (status === 404) return "مورد درخواستی یافت نشد.";
  if (status === 409) return "این مورد قبلاً ثبت شده است.";
  if (status === 422) return "اطلاعات واردشده نامعتبر است.";
  if (status >= 500) return "خطای سرور. لطفاً کمی بعد دوباره تلاش کنید.";
  return "خطایی رخ داد. لطفاً دوباره تلاش کنید.";
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as ApiError;
    if (typeof data.detail === "string") {
      return /[\u0600-\u06FF]/.test(data.detail)
        ? data.detail
        : translateValidationMsg(data.detail);
    }
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      const first = data.detail[0];
      const loc = first.loc || [];
      const field = [...loc].reverse().find((p) => typeof p === "string" && p !== "body") as
        | string
        | undefined;
      return translateValidationMsg(first.msg || "", field);
    }
  } catch {
    /* ignore */
  }
  return statusMessage(res.status);
}

function getStoredSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem(SESSION_STORAGE_KEY) ||
    window.sessionStorage.getItem(SESSION_STORAGE_KEY)
  );
}

export function setSessionPersist(remember: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_PERSIST_KEY, remember ? "1" : "0");
}

function shouldPersistSession(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(SESSION_PERSIST_KEY) !== "0";
}

export function setStoredSessionId(id: string | null) {
  if (typeof window === "undefined") return;
  if (!id) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  if (shouldPersistSession()) {
    window.localStorage.setItem(SESSION_STORAGE_KEY, id);
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } else {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

export function setRememberedLogin(identifier: string | null) {
  if (typeof window === "undefined") return;
  if (identifier) window.localStorage.setItem(REMEMBERED_LOGIN_KEY, identifier);
  else window.localStorage.removeItem(REMEMBERED_LOGIN_KEY);
}

export function getRememberedLogin(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(REMEMBERED_LOGIN_KEY) ?? "";
}

export function getApiBase() {
  return API_BASE.replace(/\/$/, "");
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  formData?: FormData;
  signal?: AbortSignal;
};

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  const sessionId = getStoredSessionId();
  if (sessionId) headers[SESSION_HEADER] = sessionId;

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const res = await fetch(`${getApiBase()}${path}`, {
    method: options.method || "GET",
    headers,
    body,
    credentials: "include",
    signal: options.signal,
  });

  const newSession =
    res.headers.get(SESSION_HEADER) ||
    res.headers.get(SESSION_HEADER.toLowerCase());
  if (newSession) setStoredSessionId(newSession);

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return (await res.json()) as T;
}

export type SessionInfo = {
  sessionId: string;
  role: "guest" | "customer" | "admin";
  expiresAt: string;
  displayName?: string | null;
  email?: string | null;
};

export type CustomerProfile = {
  id: number;
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string | null;
  province?: string | null;
  city?: string | null;
  address?: string | null;
  postalCode?: string | null;
  createdAt: string;
};

export type AdminProfile = {
  id: number;
  email: string;
  mobile?: string | null;
  firstName: string;
  lastName: string;
};

export const api = {
  ensureSession: () => apiFetch<SessionInfo>("/api/auth/session", { method: "POST" }),
  getSession: () => apiFetch<SessionInfo>("/api/auth/session"),
  register: (body: {
    firstName: string;
    lastName: string;
    mobile: string;
    signupToken: string;
  }) => apiFetch<SessionInfo>("/api/auth/register", { method: "POST", body }),
  requestOtp: (mobile: string, purpose: "login" | "signup" | "admin") =>
    apiFetch<{ message: string; expiresIn: number; devCode?: string | null }>(
      "/api/auth/otp/request",
      { method: "POST", body: { mobile, purpose } },
    ),
  verifyOtpLogin: (mobile: string, code: string, rememberMe = false) =>
    apiFetch<SessionInfo>("/api/auth/otp/verify", {
      method: "POST",
      body: { mobile, code, purpose: "login", rememberMe },
    }),
  verifyOtpAdmin: (mobile: string, code: string, rememberMe = false) =>
    apiFetch<SessionInfo>("/api/auth/otp/verify", {
      method: "POST",
      body: { mobile, code, purpose: "admin", rememberMe },
    }),
  verifyOtpSignup: (mobile: string, code: string) =>
    apiFetch<{ message: string; signupToken: string; mobile: string }>(
      "/api/auth/otp/verify",
      { method: "POST", body: { mobile, code, purpose: "signup" } },
    ),
  logout: () => apiFetch<{ message: string }>("/api/auth/logout", { method: "POST" }),
  me: () => apiFetch<CustomerProfile>("/api/auth/me"),
  updateProfile: (body: Record<string, unknown>) =>
    apiFetch<CustomerProfile>("/api/auth/me", { method: "PATCH", body }),
  adminMe: () => apiFetch<AdminProfile>("/api/auth/admin/me"),

  listProducts: (params?: Record<string, string | number | boolean | undefined>) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") q.set(k, String(v));
      });
    }
    const qs = q.toString();
    return apiFetch<{ items: import("./shop-types").Product[]; total: number }>(
      `/api/products${qs ? `?${qs}` : ""}`,
    );
  },
  getProduct: (id: number) =>
    apiFetch<import("./shop-types").Product>(`/api/products/${id}`),
  createProduct: (body: Record<string, unknown>) =>
    apiFetch<import("./shop-types").Product>("/api/products", {
      method: "POST",
      body,
    }),
  updateProduct: (id: number, body: Record<string, unknown>) =>
    apiFetch<import("./shop-types").Product>(`/api/products/${id}`, {
      method: "PATCH",
      body,
    }),
  updateStock: (id: number, body: { stock?: number; lowStockThreshold?: number }) =>
    apiFetch<import("./shop-types").Product>(`/api/products/${id}/stock`, {
      method: "PATCH",
      body,
    }),
  deleteProduct: (id: number) =>
    apiFetch<void>(`/api/products/${id}`, { method: "DELETE" }),

  listCategories: () =>
    apiFetch<import("./shop-types").Category[]>("/api/categories"),
  createCategory: (body: Record<string, unknown>) =>
    apiFetch<import("./shop-types").Category>("/api/categories", {
      method: "POST",
      body,
    }),
  updateCategory: (id: string, body: Record<string, unknown>) =>
    apiFetch<import("./shop-types").Category>(`/api/categories/${id}`, {
      method: "PATCH",
      body,
    }),
  deleteCategory: (id: string) =>
    apiFetch<void>(`/api/categories/${id}`, { method: "DELETE" }),

  listCoupons: () => apiFetch<import("./shop-types").Coupon[]>("/api/coupons"),
  listAvailableCoupons: () =>
    apiFetch<import("./shop-types").Coupon[]>("/api/coupons/available"),
  validateCoupon: (code: string, subtotal: number) =>
    apiFetch<{
      valid: boolean;
      discount: number;
      message: string | null;
      coupon: import("./shop-types").Coupon | null;
    }>("/api/coupons/validate", { method: "POST", body: { code, subtotal } }),
  createCoupon: (body: Record<string, unknown>) =>
    apiFetch<import("./shop-types").Coupon>("/api/coupons", {
      method: "POST",
      body,
    }),
  updateCoupon: (id: string, body: Record<string, unknown>) =>
    apiFetch<import("./shop-types").Coupon>(`/api/coupons/${id}`, {
      method: "PATCH",
      body,
    }),
  deleteCoupon: (id: string) =>
    apiFetch<void>(`/api/coupons/${id}`, { method: "DELETE" }),

  listOrders: (status?: string) =>
    apiFetch<import("./shop-types").Order[]>(
      `/api/orders${status && status !== "all" ? `?status=${status}` : ""}`,
    ),
  myOrders: () => apiFetch<import("./shop-types").Order[]>("/api/orders/me"),
  placeOrder: (body: Record<string, unknown>) =>
    apiFetch<import("./shop-types").Order>("/api/orders", {
      method: "POST",
      body,
    }),
  updateOrderStatus: (id: string, status: string) =>
    apiFetch<import("./shop-types").Order>(`/api/orders/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),

  wishlistIds: () => apiFetch<number[]>("/api/wishlist/ids"),
  wishlistProducts: () =>
    apiFetch<import("./shop-types").Product[]>("/api/wishlist"),
  toggleWishlist: (productId: number) =>
    apiFetch<{ wishlisted: boolean; productIds: number[] }>(
      `/api/wishlist/${productId}/toggle`,
      { method: "POST" },
    ),
  syncWishlist: async (localIds: number[]) => {
    const remote = await apiFetch<number[]>("/api/wishlist/ids");
    const missing = localIds.filter((id) => !remote.includes(id));
    let ids = remote;
    for (const id of missing) {
      const res = await apiFetch<{ wishlisted: boolean; productIds: number[] }>(
        `/api/wishlist/${id}/toggle`,
        { method: "POST" },
      );
      ids = res.productIds;
    }
    return ids;
  },

  dashboard: () => apiFetch<Record<string, unknown>>("/api/admin/dashboard"),
  customers: () =>
    apiFetch<
      {
        phone: string;
        firstName: string;
        lastName: string;
        email?: string | null;
        city: string;
        province: string;
        address?: string | null;
        postalCode?: string | null;
        ordersCount: number;
        totalSpent: number;
        lastOrderAt?: string | null;
        registeredAt?: string | null;
        isRegistered: boolean;
      }[]
    >("/api/admin/customers"),
  inventory: (filter?: string) =>
    apiFetch<import("./shop-types").Product[]>(
      `/api/admin/inventory${filter ? `?filter=${filter}` : ""}`,
    ),

  uploadImage: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiFetch<{ url: string }>("/api/uploads/image", {
      formData: fd,
      method: "POST",
    });
  },

  validateCart: (items: { productId: number; qty: number }[]) =>
    apiFetch<{
      ok: boolean;
      lines: {
        productId: number;
        availableStock: number;
        ok: boolean;
        reason: string | null;
      }[];
    }>("/api/cart/validate", { method: "POST", body: { items } }),

  getCart: () =>
    apiFetch<{ items: { productId: number; qty: number }[] }>("/api/cart"),
  replaceCart: (items: { productId: number; qty: number }[]) =>
    apiFetch<{ items: { productId: number; qty: number }[] }>("/api/cart", {
      method: "PUT",
      body: { items },
    }),
  syncCart: (items: { productId: number; qty: number }[]) =>
    apiFetch<{ items: { productId: number; qty: number }[] }>("/api/cart/sync", {
      method: "POST",
      body: { items },
    }),

  listProductReviews: (productId: number) =>
    apiFetch<ProductReview[]>(`/api/products/${productId}/reviews`),
  createProductReview: (productId: number, body: { rating: number; text: string }) =>
    apiFetch<ProductReview>(`/api/products/${productId}/reviews`, {
      method: "POST",
      body,
    }),
  listFeaturedReviews: () => apiFetch<FeaturedReview[]>("/api/reviews/featured"),
  adminListReviews: () => apiFetch<ProductReview[]>("/api/admin/reviews"),
  adminUpdateReview: (
    id: number,
    body: { featuredOnHome?: boolean; featuredOrder?: number; roleLabel?: string | null },
  ) =>
    apiFetch<ProductReview>(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      body,
    }),
  adminDeleteReview: (id: number) =>
    apiFetch<{ message: string }>(`/api/admin/reviews/${id}`, { method: "DELETE" }),

  listBlogPosts: () => apiFetch<BlogPost[]>("/api/blog"),
  getBlogPost: (slug: string) => apiFetch<BlogPost>(`/api/blog/${slug}`),
  adminListBlogPosts: () => apiFetch<BlogPost[]>("/api/admin/blog"),
  adminCreateBlogPost: (body: BlogPostInput) =>
    apiFetch<BlogPost>("/api/admin/blog", { method: "POST", body }),
  adminUpdateBlogPost: (id: number, body: Partial<BlogPostInput>) =>
    apiFetch<BlogPost>(`/api/admin/blog/${id}`, { method: "PATCH", body }),
  adminDeleteBlogPost: (id: number) =>
    apiFetch<{ message: string }>(`/api/admin/blog/${id}`, { method: "DELETE" }),

  createContactMessage: (body: ContactMessageInput) =>
    apiFetch<{ message: string }>("/api/contact", { method: "POST", body }),
  listMyContactMessages: () =>
    apiFetch<ContactMessage[]>("/api/contact/mine"),
  adminListContactMessages: () =>
    apiFetch<ContactMessage[]>("/api/admin/contact"),
  adminUpdateContactMessage: (
    id: number,
    body: { isRead?: boolean; reply?: string | null },
  ) =>
    apiFetch<ContactMessage>(`/api/admin/contact/${id}`, {
      method: "PATCH",
      body,
    }),
  adminDeleteContactMessage: (id: number) =>
    apiFetch<{ message: string }>(`/api/admin/contact/${id}`, {
      method: "DELETE",
    }),

  getSiteSettings: () => apiFetch<SiteSettings>("/api/settings"),
  adminUpdateSiteSettings: (body: Partial<SiteSettings>) =>
    apiFetch<SiteSettings>("/api/admin/settings", { method: "PATCH", body }),

  listSitePages: () => apiFetch<SitePage[]>("/api/pages"),
  getSitePage: (slug: string) => apiFetch<SitePage>(`/api/pages/${slug}`),
  adminListSitePages: () => apiFetch<SitePage[]>("/api/admin/pages"),
  adminCreateSitePage: (body: Partial<SitePage> & { slug: string; title: string }) =>
    apiFetch<SitePage>("/api/admin/pages", { method: "POST", body }),
  adminUpdateSitePage: (id: number, body: Partial<SitePage>) =>
    apiFetch<SitePage>(`/api/admin/pages/${id}`, { method: "PATCH", body }),
  adminDeleteSitePage: (id: number) =>
    apiFetch<{ message: string }>(`/api/admin/pages/${id}`, { method: "DELETE" }),
};

export type SocialLink = { label: string; href: string; icon: string };
export type SiteStat = { value: string; label: string };
export type SiteFeature = { title: string; description: string; icon: string };

export type PromoBanner = {
  enabled: boolean;
  badge: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  images: string[];
};

export type SiteSettings = {
  brandName: string;
  brandSubtitle: string;
  brandTagline: string;
  copyrightText: string;
  contactPhone: string;
  contactPhoneLink: string;
  contactEmail: string;
  contactAddress: string;
  workingHours: string;
  socialLinks: SocialLink[];
  heroImages: string[];
  stats: SiteStat[];
  features: SiteFeature[];
  footerBadges: string[];
  promoBanner: PromoBanner;
  shippingTimeText: string;
  warrantyText: string;
  originCountry: string;
  productHighlights: string[];
  freeShippingThreshold: number;
  shippingCost: number;
};

export type PageSection = { heading: string; paragraphs: string[] };
export type FaqItem = { question: string; answer: string };

export type SitePage = {
  id: number;
  slug: string;
  title: string;
  description: string;
  sections: PageSection[];
  faqs: FaqItem[];
  ctaLabel: string;
  ctaHref: string;
  published: boolean;
};

export type ProductReview = {
  id: number;
  productId: number;
  productName?: string | null;
  userId: number;
  userName: string;
  rating: number;
  text: string;
  featuredOnHome: boolean;
  featuredOrder: number;
  roleLabel?: string | null;
  createdAt: string;
  isMine?: boolean;
};

export type FeaturedReview = {
  id: number;
  name: string;
  role: string;
  text: string;
  rating: number;
  avatar: string;
  productName?: string | null;
};

export type BlogPost = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  category: string;
  readTimeMinutes: number;
  content: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BlogPostInput = {
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  category?: string;
  readTimeMinutes: number;
  content: string[];
  published?: boolean;
};

export type ContactMessage = {
  id: number;
  userId?: number | null;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  subject: string;
  message: string;
  reply?: string | null;
  repliedAt?: string | null;
  isRead: boolean;
  createdAt: string;
};

export type ContactMessageInput = {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  subject: string;
  message: string;
};
