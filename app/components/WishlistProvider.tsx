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

type WishlistContextValue = {
  ids: number[];
  totalItems: number;
  isWishlisted: (id: number) => boolean;
  toggleItem: (id: number) => void;
  addItem: (id: number) => void;
  removeItem: (id: number) => void;
  clearWishlist: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = "prismashop-wishlist";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<number[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as number[];
        if (Array.isArray(parsed)) {
          setIds(parsed.filter((id) => typeof id === "number"));
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids, hydrated]);

  const addItem = useCallback((id: number) => {
    setIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const removeItem = useCallback((id: number) => {
    setIds((prev) => prev.filter((itemId) => itemId !== id));
  }, []);

  const toggleItem = useCallback((id: number) => {
    setIds((prev) => (prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]));
  }, []);

  const clearWishlist = useCallback(() => setIds([]), []);

  const isWishlisted = useCallback((id: number) => ids.includes(id), [ids]);

  const value = useMemo(
    () => ({
      ids,
      totalItems: ids.length,
      isWishlisted,
      toggleItem,
      addItem,
      removeItem,
      clearWishlist,
    }),
    [ids, isWishlisted, toggleItem, addItem, removeItem, clearWishlist],
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
