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
import { SEED_CATEGORIES, SEED_COUPONS, SEED_PRODUCTS } from "../lib/shop-seed";
import { normalizeProduct } from "../lib/product-images";
import type {
  Category,
  Coupon,
  Order,
  Product,
  ShopData,
} from "../lib/shop-types";

export {
  ADMIN_CREDENTIALS,
  ADMIN_SESSION_KEY,
  clearAdminSession,
  getAdminSession,
  setAdminSession,
} from "../lib/admin-auth";

const STORAGE_KEY = "prismashop-shop-data";

type ShopContextValue = {
  products: Product[];
  categories: Category[];
  coupons: Coupon[];
  orders: Order[];
  hydrated: boolean;
  getProduct: (id: number) => Product | undefined;
  getActiveProducts: () => Product[];
  addProduct: (product: Omit<Product, "id"> & { id?: number }) => Product;
  updateProduct: (id: number, patch: Partial<Product>) => void;
  deleteProduct: (id: number) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addCoupon: (coupon: Coupon) => void;
  updateCoupon: (id: string, patch: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: Order["status"]) => void;
  decreaseStock: (items: { id: number; qty: number }[]) => void;
  getStock: (id: number) => number;
  isLowStock: (product: Product) => boolean;
  nextProductId: () => number;
};

const ShopContext = createContext<ShopContextValue | null>(null);

function createSeedData(): ShopData {
  return {
    products: SEED_PRODUCTS.map((p) => normalizeProduct({ ...p })),
    categories: SEED_CATEGORIES.map((c) => ({ ...c })),
    coupons: SEED_COUPONS.map((c) => ({ ...c })),
    orders: [],
  };
}

function isShopData(value: unknown): value is ShopData {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return (
    Array.isArray(data.products) &&
    Array.isArray(data.categories) &&
    Array.isArray(data.coupons) &&
    Array.isArray(data.orders)
  );
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ShopData>(createSeedData);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (isShopData(parsed)) {
          setData({
            products: parsed.products.map((p) => normalizeProduct(p as Product)),
            categories: parsed.categories,
            coupons: parsed.coupons,
            orders: parsed.orders,
          });
        } else {
          setData(createSeedData());
        }
      } else {
        setData(createSeedData());
      }
    } catch {
      setData(createSeedData());
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, hydrated]);

  const getProduct = useCallback(
    (id: number) => data.products.find((p) => p.id === id),
    [data.products],
  );

  const getActiveProducts = useCallback(
    () => data.products.filter((p) => p.active),
    [data.products],
  );

  const nextProductId = useCallback(() => {
    if (data.products.length === 0) return 1;
    return Math.max(...data.products.map((p) => p.id)) + 1;
  }, [data.products]);

  const addProduct = useCallback(
    (product: Omit<Product, "id"> & { id?: number }): Product => {
      let created!: Product;
      setData((prev) => {
        const id =
          product.id ??
          (prev.products.length === 0
            ? 1
            : Math.max(...prev.products.map((p) => p.id)) + 1);
        created = normalizeProduct({ ...product, id });
        return {
          ...prev,
          products: [...prev.products, created],
        };
      });
      return created;
    },
    [],
  );

  const updateProduct = useCallback((id: number, patch: Partial<Product>) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === id ? normalizeProduct({ ...p, ...patch, id }) : p,
      ),
    }));
  }, []);

  const deleteProduct = useCallback((id: number) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
  }, []);

  const addCategory = useCallback((category: Category) => {
    setData((prev) => ({
      ...prev,
      categories: [...prev.categories, category],
    }));
  }, []);

  const updateCategory = useCallback((id: string, patch: Partial<Category>) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === id ? { ...c, ...patch, id } : c)),
    }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
    }));
  }, []);

  const addCoupon = useCallback((coupon: Coupon) => {
    setData((prev) => ({
      ...prev,
      coupons: [...prev.coupons, coupon],
    }));
  }, []);

  const updateCoupon = useCallback((id: string, patch: Partial<Coupon>) => {
    setData((prev) => ({
      ...prev,
      coupons: prev.coupons.map((c) => (c.id === id ? { ...c, ...patch, id } : c)),
    }));
  }, []);

  const deleteCoupon = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      coupons: prev.coupons.filter((c) => c.id !== id),
    }));
  }, []);

  const addOrder = useCallback((order: Order) => {
    setData((prev) => ({
      ...prev,
      orders: [order, ...prev.orders],
    }));
  }, []);

  const updateOrderStatus = useCallback((id: string, status: Order["status"]) => {
    setData((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    }));
  }, []);

  const decreaseStock = useCallback((items: { id: number; qty: number }[]) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        const match = items.find((item) => item.id === p.id);
        if (!match) return p;
        return { ...p, stock: Math.max(0, p.stock - match.qty) };
      }),
    }));
  }, []);

  const getStock = useCallback(
    (id: number) => data.products.find((p) => p.id === id)?.stock ?? 0,
    [data.products],
  );

  const isLowStock = useCallback(
    (product: Product) => product.stock > 0 && product.stock <= product.lowStockThreshold,
    [],
  );

  const value = useMemo(
    () => ({
      products: data.products,
      categories: data.categories,
      coupons: data.coupons,
      orders: data.orders,
      hydrated,
      getProduct,
      getActiveProducts,
      addProduct,
      updateProduct,
      deleteProduct,
      addCategory,
      updateCategory,
      deleteCategory,
      addCoupon,
      updateCoupon,
      deleteCoupon,
      addOrder,
      updateOrderStatus,
      decreaseStock,
      getStock,
      isLowStock,
      nextProductId,
    }),
    [
      data.products,
      data.categories,
      data.coupons,
      data.orders,
      hydrated,
      getProduct,
      getActiveProducts,
      addProduct,
      updateProduct,
      deleteProduct,
      addCategory,
      updateCategory,
      deleteCategory,
      addCoupon,
      updateCoupon,
      deleteCoupon,
      addOrder,
      updateOrderStatus,
      decreaseStock,
      getStock,
      isLowStock,
      nextProductId,
    ],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within ShopProvider");
  }
  return context;
}
