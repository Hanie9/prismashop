/** Iranian mobile: 09 + 9 digits */
export const IRAN_MOBILE_REGEX = /^09\d{9}$/;

/** Practical email pattern aligned with backend validation */
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/** Password: at least 8 characters (max 128, aligned with backend) */
export const PASSWORD_REGEX = /^.{8,128}$/;

/** Convert Persian/Arabic digits to English digits */
export function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - "۰".charCodeAt(0)))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - "٠".charCodeAt(0)));
}

/** Keep only English digits (after Persian/Arabic conversion) */
export function onlyDigits(value: string): string {
  return toEnglishDigits(value).replace(/\D/g, "");
}

export function normalizeIranMobileInput(value: string): string {
  return onlyDigits(value).slice(0, 11);
}

export function isValidIranMobile(value: string): boolean {
  return IRAN_MOBILE_REGEX.test(normalizeIranMobileInput(value));
}

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export function isValidPassword(value: string): boolean {
  return PASSWORD_REGEX.test(value);
}

/** Login identifier: email or Iranian mobile */
export function isValidEmailOrMobile(value: string): boolean {
  const v = value.trim();
  return isValidEmail(v) || isValidIranMobile(v);
}
