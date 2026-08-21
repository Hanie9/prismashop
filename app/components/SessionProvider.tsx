"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  setStoredSessionId,
  type AdminProfile,
  type CustomerProfile,
  type SessionInfo,
} from "../lib/api";
import { clearAdminSession, setAdminSession } from "../lib/admin-auth";

type AuthContextValue = {
  ready: boolean;
  session: SessionInfo | null;
  customer: CustomerProfile | null;
  admin: AdminProfile | null;
  isAdmin: boolean;
  isCustomer: boolean;
  isLoggedIn: boolean;
  displayName: string;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);

  const refresh = useCallback(async () => {
    const s = await api.ensureSession();
    setStoredSessionId(s.sessionId);
    setSession(s);

    if (s.role === "customer") {
      clearAdminSession();
      setAdmin(null);
      try {
        setCustomer(await api.me());
      } catch {
        setCustomer(null);
      }
    } else if (s.role === "admin") {
      setAdminSession();
      setCustomer(null);
      try {
        setAdmin(await api.adminMe());
      } catch {
        setAdmin(null);
      }
    } else {
      clearAdminSession();
      setCustomer(null);
      setAdmin(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refresh();
      } catch {
        if (!cancelled) {
          setSession(null);
          setCustomer(null);
          setAdmin(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    clearAdminSession();
    await refresh();
    window.dispatchEvent(new Event("prismashop-auth-change"));
  }, [refresh]);

  const isAdmin = session?.role === "admin";
  const isCustomer = session?.role === "customer";
  const isLoggedIn = isAdmin || isCustomer;

  const displayName = useMemo(() => {
    if (admin) {
      const name = `${admin.firstName ?? ""} ${admin.lastName ?? ""}`.trim();
      return name || admin.email || session?.displayName || "";
    }
    if (customer) {
      const name = `${customer.firstName} ${customer.lastName}`.trim();
      return name || customer.email || session?.displayName || "";
    }
    return session?.displayName || "";
  }, [admin, customer, session?.displayName]);

  const value = useMemo(
    () => ({
      ready,
      session,
      customer,
      admin,
      isAdmin,
      isCustomer,
      isLoggedIn,
      displayName,
      refresh,
      logout,
    }),
    [
      ready,
      session,
      customer,
      admin,
      isAdmin,
      isCustomer,
      isLoggedIn,
      displayName,
      refresh,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within SessionProvider");
  return ctx;
}
