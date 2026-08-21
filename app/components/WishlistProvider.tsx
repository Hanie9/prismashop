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
import { api } from "../lib/api";
import { useAuth } from "./SessionProvider";

type WishlistContextValue = {
  ids: number[];
  totalItems: number;
  hydrated: boolean;
  isWishlisted: (id: number) => boolean;
  toggleItem: (id: number) => Promise<void> | void;
  addItem: (id: number) => Promise<void> | void;
  removeItem: (id: number) => Promise<void> | void;
  clearWishlist: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = "prismashop-wishlist";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { ready, isCustomer } = useAuth();
  const [ids, setIds] = useState<number[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      try {
        if (isCustomer) {
          let local: number[] = [];
          try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) local = (JSON.parse(raw) as number[]).filter((n) => typeof n === "number");
          } catch {}
          const synced = local.length ? await api.syncWishlist(local) : await api.wishlistIds();
          if (!cancelled) {
            setIds(synced);
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(synced));
          }
        } else {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as number[];
            if (Array.isArray(parsed) && !cancelled) {
              setIds(parsed.filter((id) => typeof id === "number"));
            }
          }
        }
      } catch {
        /* keep local */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, isCustomer]);

  useEffect(() => {
    if (!hydrated || isCustomer) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids, hydrated, isCustomer]);

  const toggleItem = useCallback(
    async (id: number) => {
      if (isCustomer) {
        const res = await api.toggleWishlist(id);
        setIds(res.productIds);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(res.productIds));
        return;
      }
      setIds((prev) =>
        prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
      );
    },
    [isCustomer],
  );

  const addItem = useCallback(
    async (id: number) => {
      if (ids.includes(id)) return;
      await toggleItem(id);
    },
    [ids, toggleItem],
  );

  const removeItem = useCallback(
    async (id: number) => {
      if (!ids.includes(id)) return;
      await toggleItem(id);
    },
    [ids, toggleItem],
  );

  const clearWishlist = useCallback(() => {
    setIds([]);
    window.localStorage.setItem(STORAGE_KEY, "[]");
  }, []);

  const isWishlisted = useCallback((id: number) => ids.includes(id), [ids]);

  const value = useMemo(
    () => ({
      ids,
      totalItems: ids.length,
      hydrated,
      isWishlisted,
      toggleItem,
      addItem,
      removeItem,
      clearWishlist,
    }),
    [ids, hydrated, isWishlisted, toggleItem, addItem, removeItem, clearWishlist],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
}
