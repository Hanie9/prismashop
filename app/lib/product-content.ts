import type { ProductSpec } from "./shop-types";

/** Default specs template matching the storefront product page UI */
export const DEFAULT_PRODUCT_SPECS: ProductSpec[] = [
  { label: "جنس", value: "" },
  { label: "ابعاد", value: "" },
  { label: "وزن", value: "" },
  { label: "رنگ", value: "" },
  { label: "سطح", value: "" },
  { label: "کشور تولیدکننده", value: "ایران" },
  { label: "ضمانت", value: "۷ روز ضمانت بازگشت" },
];

export const DEFAULT_PRODUCT_HIGHLIGHTS = [
  "هنر دکوپاژ و دکوپاژ روی چوب",
  "نجاری خانگی و پروژه‌های DIY",
  "دکوراسیون داخلی منزل و محل کار",
  "کلاس‌های هنری و کارگاه‌های آموزشی",
];

export function normalizeSpecs(specs?: ProductSpec[] | null): ProductSpec[] {
  if (!specs?.length) return DEFAULT_PRODUCT_SPECS.map((s) => ({ ...s }));
  return specs.map((s) => ({
    label: (s.label ?? "").trim(),
    value: (s.value ?? "").trim(),
  }));
}

export function filledSpecs(specs?: ProductSpec[] | null): ProductSpec[] {
  return normalizeSpecs(specs).filter((s) => s.label && s.value);
}
