"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "../lib/api";
import { useAuth } from "./SessionProvider";
import { useShop } from "./ShopProvider";

type CartItem = {
  id: number;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  hydrated: boolean;
  getItemQty: (id: number) => number;
  addItem: (id: number, qty?: number) => { ok: boolean; reason?: "out_of_stock" | "max_stock" };
  updateQty: (id: number, qty: number) => { ok: boolean; reason?: "out_of_stock" | "max_stock" };
  removeItem: (id: number) => void;
  clearCart: () => void;
  getAvailableStock: (id: number) => number;
};

const CartContext = createContext<CartContextValue | null>(null);
const LEGACY_KEY = "prismashop-cart";
const GUEST_KEY = "prismashop-cart:guest";

function storageKeyFor(owner: string) {
  return owner === "guest" ? GUEST_KEY : `prismashop-cart:${owner}`;
}

function readLocalCart(key: string): CartItem[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === "number" &&
        typeof item.qty === "number" &&
        item.qty > 0,
    );
  } catch {
    return [];
  }
}

function writeLocalCart(key: string, items: CartItem[]) {
  window.localStorage.setItem(key, JSON.stringify(items));
}

function migrateLegacyGuestCart() {
  try {
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (!legacy) return;
    const guest = window.localStorage.getItem(GUEST_KEY);
    if (!guest) {
      window.localStorage.setItem(GUEST_KEY, legacy);
    }
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}

function mergeItems(base: CartItem[], extra: CartItem[]): CartItem[] {
  const map = new Map<number, number>();
  for (const item of base) map.set(item.id, item.qty);
  for (const item of extra) {
    map.set(item.id, (map.get(item.id) ?? 0) + item.qty);
  }
  return Array.from(map.entries()).map(([id, qty]) => ({ id, qty }));
}

function toApiItems(items: CartItem[]) {
  return items.map((item) => ({ productId: item.id, qty: item.qty }));
}

function fromApiItems(items: { productId: number; qty: number }[]): CartItem[] {
  return items.map((item) => ({ id: item.productId, qty: item.qty }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { ready, isCustomer, customer, isAdmin } = useAuth();
  const { getStock, hydrated: shopHydrated } = useShop();
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [owner, setOwner] = useState<string | null>(null);
  const persistRemoteRef = useRef(false);
  const skipNextPersist = useRef(false);

  const resolveOwner = useCallback(() => {
    if (isCustomer && customer?.id) return `user:${customer.id}`;
    if (isAdmin) return "admin";
    return "guest";
  }, [isCustomer, customer?.id, isAdmin]);

  const ownerReady = ready && (!isCustomer || customer !== null);

  // Load the cart that belongs to the current identity
  useEffect(() => {
    if (!ownerReady) return;
    let cancelled = false;

    (async () => {
      setHydrated(false);
      migrateLegacyGuestCart();
      const nextOwner = resolveOwner();
      const localKey = storageKeyFor(nextOwner);
      const guestItems = readLocalCart(GUEST_KEY);

      try {
        if (nextOwner.startsWith("user:")) {
          const guestPayload = toApiItems(guestItems);
          const remote =
            guestPayload.length > 0
              ? await api.syncCart(guestPayload)
              : await api.getCart();
          if (cancelled) return;
          const loaded = fromApiItems(remote.items);
          writeLocalCart(localKey, loaded);
          if (guestItems.length) writeLocalCart(GUEST_KEY, []);
          skipNextPersist.current = true;
          persistRemoteRef.current = true;
          setItems(loaded);
          setOwner(nextOwner);
        } else {
          const stored = readLocalCart(localKey);
          const loaded =
            nextOwner !== "guest" && guestItems.length
              ? mergeItems(stored, guestItems)
              : stored;
          if (cancelled) return;
          writeLocalCart(localKey, loaded);
          if (nextOwner !== "guest" && guestItems.length) writeLocalCart(GUEST_KEY, []);
          skipNextPersist.current = true;
          persistRemoteRef.current = false;
          setItems(loaded);
          setOwner(nextOwner);
        }
      } catch {
        if (cancelled) return;
        const fallback =
          nextOwner !== "guest" && guestItems.length
            ? mergeItems(readLocalCart(localKey), guestItems)
            : readLocalCart(localKey);
        skipNextPersist.current = true;
        persistRemoteRef.current = nextOwner.startsWith("user:");
        setItems(fallback);
        setOwner(nextOwner);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ownerReady, resolveOwner]);

  // Persist local + remote cart for the active owner
  useEffect(() => {
    if (!hydrated || !owner) return;
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }

    const key = storageKeyFor(owner);
    writeLocalCart(key, items);

    if (!persistRemoteRef.current || !owner.startsWith("user:")) return;

    const handle = window.setTimeout(() => {
      void api.replaceCart(toApiItems(items)).catch(() => {
        /* keep local copy */
      });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [items, hydrated, owner]);

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
      hydrated,
      getItemQty,
      addItem,
      updateQty,
      removeItem,
      clearCart,
      getAvailableStock,
    }),
    [
      items,
      totalItems,
      hydrated,
      getItemQty,
      addItem,
      updateQty,
      removeItem,
      clearCart,
      getAvailableStock,
    ],
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
