import { api, setStoredSessionId } from "./api";

export const ADMIN_SESSION_KEY = "prismashop-admin-session";
export const ADMIN_MOBILE_DEFAULT = "09355191020";

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

export async function loginAdminWithOtp(mobile: string, code: string, rememberMe = true) {
  const session = await api.verifyOtpAdmin(mobile, code, rememberMe);
  setStoredSessionId(session.sessionId);
  setAdminSession();
  return session;
}

export async function logoutAdmin() {
  try {
    await api.logout();
  } catch {
    /* ignore */
  }
  clearAdminSession();
}
