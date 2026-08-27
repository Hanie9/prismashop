import type { ProductSpec } from "./shop-types";

/** Blank spec rows shown in the admin product form; values come from the admin. */
export const DEFAULT_PRODUCT_SPECS: ProductSpec[] = [
  { label: "جنس", value: "" },
  { label: "ابعاد", value: "" },
  { label: "وزن", value: "" },
  { label: "رنگ", value: "" },
  { label: "سطح", value: "" },
  { label: "کشور تولیدکننده", value: "" },
  { label: "ضمانت", value: "" },
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
