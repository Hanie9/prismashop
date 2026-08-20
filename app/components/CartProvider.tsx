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
import { useShop } from "./ShopProvider";

type CartItem = {
  id: number;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  getItemQty: (id: number) => number;
  addItem: (id: number, qty?: number) => { ok: boolean; reason?: "out_of_stock" | "max_stock" };
  updateQty: (id: number, qty: number) => { ok: boolean; reason?: "out_of_stock" | "max_stock" };
  removeItem: (id: number) => void;
  clearCart: () => void;
  getAvailableStock: (id: number) => number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "prismashop-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const { getStock, hydrated: shopHydrated } = useShop();
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  // Clamp cart quantities when stock data loads or changes
  useEffect(() => {
    if (!hydrated || !shopHydrated) return;
    setItems((prev) => {
      let changed = false;
      const next = prev
        .map((item) => {
          const stock = getStock(item.id);
          if (stock <= 0) {
            changed = true;
            return null;
          }
          if (item.qty > stock) {
            changed = true;
            return { ...item, qty: stock };
          }
          return item;
        })
        .filter((item): item is CartItem => item != null);
      return changed ? next : prev;
    });
  }, [hydrated, shopHydrated, getStock]);

  const getAvailableStock = useCallback((id: number) => getStock(id), [getStock]);

  const addItem = useCallback(
    (id: number, qty = 1): { ok: boolean; reason?: "out_of_stock" | "max_stock" } => {
      const stock = getStock(id);
      if (stock <= 0) return { ok: false, reason: "out_of_stock" };

      let result: { ok: boolean; reason?: "out_of_stock" | "max_stock" } = { ok: true };

      setItems((prev) => {
        const existing = prev.find((item) => item.id === id);
        const current = existing?.qty ?? 0;
        if (current >= stock) {
          result = { ok: false, reason: "max_stock" };
          return prev;
        }
        const nextQty = Math.min(stock, current + qty);
        if (nextQty === current) {
          result = { ok: false, reason: "max_stock" };
          return prev;
        }
        if (existing) {
          return prev.map((item) => (item.id === id ? { ...item, qty: nextQty } : item));
        }
        return [...prev, { id, qty: nextQty }];
      });

      return result;
    },
    [getStock],
  );

  const updateQty = useCallback(
    (id: number, qty: number): { ok: boolean; reason?: "out_of_stock" | "max_stock" } => {
      const stock = getStock(id);
      if (stock <= 0) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        return { ok: false, reason: "out_of_stock" };
      }
      const nextQty = Math.max(1, qty);
      if (nextQty > stock) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, qty: stock } : item)),
        );
        return { ok: false, reason: "max_stock" };
      }
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, qty: nextQty } : item)),
      );
      return { ok: true };
    },
    [getStock],
  );

  const removeItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.qty, 0),
    [items],
  );

  const getItemQty = useCallback(
    (id: number) => items.find((item) => item.id === id)?.qty ?? 0,
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      totalItems,
      getItemQty,
      addItem,
      updateQty,
      removeItem,
      clearCart,
      getAvailableStock,
    }),
    [items, totalItems, getItemQty, addItem, updateQty, removeItem, clearCart, getAvailableStock],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
