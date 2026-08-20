export const ADMIN_CREDENTIALS = {
  email: "admin@prismashop.ir",
  password: "admin123",
} as const;

export const ADMIN_SESSION_KEY = "prismashop-admin-session";

export function normalizeAdminEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeAdminPassword(value: string) {
  return value.trim();
}

export function isAdminCredentials(email: string, password: string) {
  return (
    normalizeAdminEmail(email) === ADMIN_CREDENTIALS.email &&
    normalizeAdminPassword(password) === ADMIN_CREDENTIALS.password
  );
}

export function setAdminSession() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_SESSION_KEY, "1");
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ADMIN_SESSION_KEY);
}

export function getAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ADMIN_SESSION_KEY) === "1";
}
