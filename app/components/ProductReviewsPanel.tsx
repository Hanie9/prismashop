"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type ProductReview } from "../lib/api";
import PageLoader from "./PageLoader";
import { useAuth } from "./SessionProvider";
import { useShop } from "./ShopProvider";

function formatReviewDate(value: string) {
  return new Date(value).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ProductReviewsPanel({
  productId,
  onReviewCountChange,
}: {
  productId: number;
  onReviewCountChange?: (count: number) => void;
}) {
  const { isCustomer, isLoggedIn, ready } = useAuth();
  const { refreshShop } = useShop();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await api.listProductReviews(productId);
      setReviews(list);
      onReviewCountChange?.(list.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "بارگذاری نظرات ناموفق بود.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const alreadyReviewed = reviews.some((r) => r.isMine);

  const submit = async () => {
    setFormError("");
    if (!isLoggedIn || !isCustomer) {
      setFormError("برای ثبت نظر باید با حساب مشتری وارد شوید.");
      return;
    }
    if (text.trim().length < 10) {
      setFormError("متن نظر باید حداقل ۱۰ کاراکتر باشد.");
      return;
    }
    setSubmitting(true);
    try {
      await api.createProductReview(productId, { rating, text: text.trim() });
      setText("");
      setRating(5);
      await Promise.all([load(), refreshShop()]);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "ثبت نظر ناموفق بود.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {ready && isLoggedIn && isCustomer && !alreadyReviewed && (
        <div className="rounded-2xl border border-[#ead7bb] bg-[#fffaf5] p-4">
          <h3 className="mb-3 text-sm font-bold text-[#2e1a08]">ثبت نظر شما</h3>
          <div className="space-y-3">
            <div>
              <p className="mb-2 text-xs text-[#6d4014]">امتیاز</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-0.5"
                    aria-label={`${s} ستاره`}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill={s <= rating ? "#d4a96a" : "none"}
                      stroke="#d4a96a"
                      strokeWidth={2}
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="تجربه خود از خرید این محصول را بنویسید..."
              className="w-full rounded-xl border border-[#ead7bb] bg-white px-3 py-2 text-sm text-[#2e1a08] focus:border-[#d4a96a] focus:outline-none"
            />
            {formError && <p className="text-xs text-red-600">{formError}</p>}
            <button
              type="button"
              disabled={submitting}
              onClick={() => void submit()}
              className="rounded-xl bg-[#6d4014] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#4e2e0e] disabled:opacity-60"
            >
              {submitting ? "در حال ثبت..." : "ثبت نظر"}
            </button>
          </div>
        </div>
      )}

      {ready && !isLoggedIn && (
        <div className="rounded-2xl border border-[#ead7bb] bg-[#fffaf5] p-4">
          <p className="text-sm leading-7 text-[#6d4014]">
            برای ثبت نظر{" "}
            <Link
              href={`/auth/login?next=${encodeURIComponent(`/products/${productId}`)}`}
              className="font-bold text-[#8a5419] hover:underline"
            >
              وارد حساب کاربری
            </Link>{" "}
            شوید.
          </p>
        </div>
      )}

      {loading && (
        <PageLoader label="در حال بارگذاری نظرات..." fullScreen={false} className="py-8" />
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && reviews.length === 0 && (
        <p className="text-sm text-[#a96c20]">هنوز نظری برای این محصول ثبت نشده است.</p>
      )}

      {reviews.map((review) => (
        <div key={review.id} className="border-b border-[#f5e9d5] pb-6 last:border-0">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6d4014] text-sm font-bold text-white">
                {review.userName[0]}
              </div>
              <span className="truncate text-sm font-medium text-[#2e1a08]">{review.userName}</span>
              {review.isMine && (
                <span className="rounded-full bg-[#fff6ea] px-2 py-0.5 text-[10px] font-bold text-[#a96c20]">
                  نظر شما
                </span>
              )}
            </div>
            <span className="shrink-0 text-xs text-[#a96c20]">
              {formatReviewDate(review.createdAt)}
            </span>
          </div>
          <div className="mb-2 mr-0 flex gap-0.5 sm:mr-11">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg
                key={s}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill={s <= review.rating ? "#d4a96a" : "none"}
                stroke="#d4a96a"
                strokeWidth={2}
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <p className="mr-0 text-sm leading-7 text-[#4e2e0e] sm:mr-11">{review.text}</p>
        </div>
      ))}
    </div>
  );
}
