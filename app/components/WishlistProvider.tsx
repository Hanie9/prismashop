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
  toggleItem: (id: number) => Promise<void>;
  addItem: (id: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  clearWishlist: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);
const LEGACY_STORAGE_KEY = "prismashop-wishlist";

async function migrateLegacyLocalWishlist(): Promise<number[]> {
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is number => typeof id === "number");
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { ready, session } = useAuth();
  const [ids, setIds] = useState<number[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    (async () => {
      try {
        let serverIds = await api.wishlistIds();
        const legacy = await migrateLegacyLocalWishlist();
        const missing = legacy.filter((id) => !serverIds.includes(id));
        for (const id of missing) {
          const res = await api.toggleWishlist(id);
          serverIds = res.productIds;
        }
        if (legacy.length) {
          window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
        if (!cancelled) setIds(serverIds);
      } catch {
        if (!cancelled) setIds([]);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, session?.sessionId]);

  const toggleItem = useCallback(async (id: number) => {
    const res = await api.toggleWishlist(id);
    setIds(res.productIds);
  }, []);

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

  const clearWishlist = useCallback(async () => {
    await api.clearWishlist();
    setIds([]);
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
