import type { Coupon } from "./shop-types";

export function findCoupon(coupons: Coupon[], code: string): Coupon | undefined {
  const normalized = code.trim().toUpperCase();
  return coupons.find((c) => c.active && c.code.toUpperCase() === normalized);
}

export function calcCouponDiscount(subtotal: number, coupon: Coupon | null | undefined): number {
  if (!coupon || !coupon.active) return 0;
  if (subtotal < coupon.minOrder) return 0;
  if (coupon.type === "percent") {
    return Math.floor((subtotal * coupon.value) / 100);
  }
  return Math.min(coupon.value, subtotal);
}

export const COUPON_STORAGE_KEY = "prismashop-applied-coupon";
