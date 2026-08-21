"use client";

import { useEffect, useState } from "react";
import { api, type ProductReview } from "../../lib/api";
import PageLoader from "../../components/PageLoader";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [roleDrafts, setRoleDrafts] = useState<Record<number, string>>({});

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await api.adminListReviews();
      setReviews(list);
      const drafts: Record<number, string> = {};
      list.forEach((r) => {
        drafts[r.id] = r.roleLabel || "";
      });
      setRoleDrafts(drafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "بارگذاری نظرات ناموفق بود.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggleFeatured = async (review: ProductReview) => {
    setBusyId(review.id);
    setError("");
    try {
      const updated = await api.adminUpdateReview(review.id, {
        featuredOnHome: !review.featuredOnHome,
      });
      setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "به‌روزرسانی ناموفق بود.");
    } finally {
      setBusyId(null);
    }
  };

  const saveRole = async (review: ProductReview) => {
    setBusyId(review.id);
    setError("");
    try {
      const updated = await api.adminUpdateReview(review.id, {
        roleLabel: roleDrafts[review.id]?.trim() || null,
      });
      setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "ذخیره برچسب ناموفق بود.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (review: ProductReview) => {
    if (!confirm(`نظر «${review.userName}» حذف شود؟`)) return;
    setBusyId(review.id);
    setError("");
    try {
      await api.adminDeleteReview(review.id);
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "حذف نظر ناموفق بود.");
    } finally {
      setBusyId(null);
    }
  };

  const featuredCount = reviews.filter((r) => r.featuredOnHome).length;

  if (loading) return <PageLoader label="در حال بارگذاری نظرات..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-[#2e1a08] sm:text-2xl">نظرات مشتریان</h1>
        <p className="mt-1 text-sm text-[#a96c20]">
          نظرات ثبت‌شده روی محصولات را مدیریت کنید و موارد منتخب را در بخش «نظرات مشتریان»
          صفحه اصلی نمایش دهید.
        </p>
        <p className="mt-2 text-xs text-[#6d4014]">
          {reviews.length.toLocaleString("fa-IR")} نظر ·{" "}
          {featuredCount.toLocaleString("fa-IR")} مورد در صفحه اصلی
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-[#ead7bb] bg-white px-5 py-10 text-center text-sm text-[#a96c20]">
          هنوز نظری ثبت نشده است.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl border border-[#ead7bb] bg-white p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-bold text-[#2e1a08]">{review.userName}</h2>
                    <span className="text-xs text-[#a96c20]">
                      {formatDate(review.createdAt)}
                    </span>
                    {review.featuredOnHome && (
                      <span className="rounded-full bg-[#fff6ea] px-2 py-0.5 text-[10px] font-bold text-[#8a5419]">
                        صفحه اصلی
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[#6d4014]">
                    محصول: {review.productName || `#${review.productId}`}
                  </p>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg
                      key={s}
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill={s <= review.rating ? "#d4a96a" : "none"}
                      stroke="#d4a96a"
                      strokeWidth={2}
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
              </div>

              <p className="mt-3 text-sm leading-7 text-[#4e2e0e]">{review.text}</p>

              <div className="mt-4 flex flex-col gap-3 border-t border-[#f5e9d5] pt-4 sm:flex-row sm:items-end">
                <label className="flex-1 text-xs text-[#6d4014]">
                  برچسب نمایش در صفحه اصلی (اختیاری)
                  <input
                    value={roleDrafts[review.id] ?? ""}
                    onChange={(e) =>
                      setRoleDrafts((prev) => ({ ...prev, [review.id]: e.target.value }))
                    }
                    placeholder="مثلاً طراح دکور داخلی"
                    className="mt-1 w-full rounded-xl border border-[#ead7bb] bg-[#fffaf5] px-3 py-2 text-sm text-[#2e1a08] focus:border-[#d4a96a] focus:outline-none"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === review.id}
                    onClick={() => void saveRole(review)}
                    className="rounded-xl border border-[#ead7bb] px-3 py-2 text-xs font-bold text-[#6d4014] hover:bg-[#fff6ea] disabled:opacity-60"
                  >
                    ذخیره برچسب
                  </button>
                  <button
                    type="button"
                    disabled={busyId === review.id}
                    onClick={() => void toggleFeatured(review)}
                    className={`rounded-xl px-3 py-2 text-xs font-bold disabled:opacity-60 ${
                      review.featuredOnHome
                        ? "bg-[#6d4014] text-white hover:bg-[#4e2e0e]"
                        : "border border-[#d4a96a] bg-[#fff6ea] text-[#8a5419] hover:bg-[#f5e9d5]"
                    }`}
                  >
                    {review.featuredOnHome ? "حذف از صفحه اصلی" : "نمایش در صفحه اصلی"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === review.id}
                    onClick={() => void remove(review)}
                    className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
