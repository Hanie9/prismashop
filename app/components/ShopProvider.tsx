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
import { normalizeProduct } from "../lib/product-images";
import type { Category, Coupon, Order, Product } from "../lib/shop-types";
import { useAuth } from "./SessionProvider";

export {
  clearAdminSession,
  getAdminSession,
  setAdminSession,
} from "../lib/admin-auth";

type ShopContextValue = {
  products: Product[];
  categories: Category[];
  coupons: Coupon[];
  orders: Order[];
  hydrated: boolean;
  loadError: string | null;
  refreshShop: () => Promise<void>;
  getProduct: (id: number) => Product | undefined;
  getActiveProducts: () => Product[];
  addProduct: (product: Omit<Product, "id"> & { id?: number }) => Promise<Product>;
  updateProduct: (id: number, patch: Partial<Product>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (id: string, patch: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addCoupon: (coupon: Coupon) => Promise<void>;
  updateCoupon: (id: string, patch: Partial<Coupon>) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  addOrder: (order: Order) => void;
  placeOrder: (payload: Record<string, unknown>) => Promise<Order>;
  updateOrderStatus: (id: string, status: Order["status"]) => Promise<void>;
  decreaseStock: (items: { id: number; qty: number }[]) => void;
  getStock: (id: number) => number;
  isLowStock: (product: Product) => boolean;
  nextProductId: () => number;
};

const ShopContext = createContext<ShopContextValue | null>(null);

function mapProduct(p: Product): Product {
  return normalizeProduct({
    ...p,
    images: p.images?.length ? p.images : p.image ? [p.image] : [],
  });
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const { ready, isAdmin, session } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshShop = useCallback(async () => {
    const [cats, prodRes] = await Promise.all([
      api.listCategories(),
      api.listProducts({
        active_only: isAdmin ? false : true,
        limit: 200,
      }),
    ]);
    setCategories(
      cats.map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        image: c.image,
      })),
    );
    setProducts(prodRes.items.map(mapProduct));

    if (isAdmin) {
      const [couponList, orderList] = await Promise.all([
        api.listCoupons(),
        api.listOrders(),
      ]);
      setCoupons(
        couponList.map((c) => ({
          id: c.id,
          code: c.code,
          type: c.type,
          value: c.value,
          active: c.active,
          minOrder: (c as Coupon).minOrder ?? 0,
        })),
      );
      setOrders(orderList);
    } else {
      setCoupons([]);
      setOrders([]);
    }
    setLoadError(null);
  }, [isAdmin]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      try {
        await refreshShop();
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error
              ? err.message
              : "ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.",
          );
          setProducts([]);
          setCategories([]);
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, refreshShop, session?.sessionId, session?.role]);

  const getProduct = useCallback(
    (id: number) => products.find((p) => p.id === id),
    [products],
  );

  const getActiveProducts = useCallback(
    () => products.filter((p) => p.active),
    [products],
  );

  const nextProductId = useCallback(() => {
    if (products.length === 0) return 1;
    return Math.max(...products.map((p) => p.id)) + 1;
  }, [products]);

  const addProduct = useCallback(
    async (product: Omit<Product, "id"> & { id?: number }) => {
      const created = await api.createProduct({
        name: product.name,
        categoryId: product.categoryId,
        originalPrice: product.originalPrice ?? product.price,
        discountPercent: product.discount ?? 0,
        images: product.images?.length ? product.images : [product.image],
        isNew: product.isNew ?? false,
        isBestseller: product.isBestseller ?? false,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        description: product.description,
        detailParagraphs: product.detailParagraphs ?? [],
        highlights: product.highlights ?? [],
        specs: product.specs ?? [],
        active: product.active,
      });
      const mapped = mapProduct(created);
      setProducts((prev) => [...prev, mapped]);
      return mapped;
    },
    [],
  );

  const updateProduct = useCallback(async (id: number, patch: Partial<Product>) => {
    const body: Record<string, unknown> = {};
    if (patch.name !== undefined) body.name = patch.name;
    if (patch.categoryId !== undefined) body.categoryId = patch.categoryId;
    if (patch.originalPrice !== undefined) body.originalPrice = patch.originalPrice;
    if (patch.discount !== undefined) body.discountPercent = patch.discount;
    if (patch.images !== undefined) body.images = patch.images;
    if (patch.isNew !== undefined) body.isNew = patch.isNew;
    if (patch.isBestseller !== undefined) body.isBestseller = patch.isBestseller;
    if (patch.stock !== undefined) body.stock = patch.stock;
    if (patch.lowStockThreshold !== undefined)
      body.lowStockThreshold = patch.lowStockThreshold;
    if (patch.description !== undefined) body.description = patch.description;
    if (patch.detailParagraphs !== undefined) body.detailParagraphs = patch.detailParagraphs;
    if (patch.highlights !== undefined) body.highlights = patch.highlights;
    if (patch.specs !== undefined) body.specs = patch.specs;
    if (patch.active !== undefined) body.active = patch.active;

    // Prefer dedicated stock endpoint when only stock fields change
    if (
      (patch.stock !== undefined || patch.lowStockThreshold !== undefined) &&
      Object.keys(body).every((k) => k === "stock" || k === "lowStockThreshold")
    ) {
      const updated = await api.updateStock(id, {
        stock: patch.stock,
        lowStockThreshold: patch.lowStockThreshold,
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? mapProduct(updated) : p)),
      );
      return;
    }

    const updated = await api.updateProduct(id, body);
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? mapProduct(updated) : p)),
    );
  }, []);

  const deleteProduct = useCallback(async (id: number) => {
    await api.deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addCategory = useCallback(async (category: Category) => {
    const created = await api.createCategory({
      id: category.id,
      name: category.name,
      icon: category.icon,
      image: category.image,
    });
    setCategories((prev) => [
      ...prev,
      {
        id: created.id,
        name: created.name,
        icon: created.icon,
        image: created.image,
      },
    ]);
  }, []);

  const updateCategory = useCallback(async (id: string, patch: Partial<Category>) => {
    const updated = await api.updateCategory(id, patch);
    setCategories((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              id: updated.id,
              name: updated.name,
              icon: updated.icon,
              image: updated.image,
            }
          : c,
      ),
    );
    if (patch.name) {
      setProducts((prev) =>
        prev.map((p) =>
          p.categoryId === id ? { ...p, category: patch.name as string } : p,
        ),
      );
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    await api.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addCoupon = useCallback(async (coupon: Coupon) => {
    const created = await api.createCoupon({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      active: coupon.active,
      minOrder: coupon.minOrder,
    });
    setCoupons((prev) => [
      ...prev,
      {
        id: created.id,
        code: created.code,
        type: created.type,
        value: created.value,
        active: created.active,
        minOrder: (created as Coupon).minOrder ?? coupon.minOrder,
      },
    ]);
  }, []);

  const updateCoupon = useCallback(async (id: string, patch: Partial<Coupon>) => {
    const updated = await api.updateCoupon(id, patch);
    setCoupons((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              id: updated.id,
              code: updated.code,
              type: updated.type,
              value: updated.value,
              active: updated.active,
              minOrder: (updated as Coupon).minOrder ?? c.minOrder,
            }
          : c,
      ),
    );
  }, []);

  const deleteCoupon = useCallback(async (id: string) => {
    await api.deleteCoupon(id);
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addOrder = useCallback((order: Order) => {
    setOrders((prev) => [order, ...prev]);
  }, []);

  const placeOrder = useCallback(async (payload: Record<string, unknown>) => {
    const order = await api.placeOrder(payload);
    setOrders((prev) => [order, ...prev]);
    await refreshShop();
    return order;
  }, [refreshShop]);

  const updateOrderStatus = useCallback(
    async (id: string, status: Order["status"]) => {
      const updated = await api.updateOrderStatus(id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    },
    [],
  );

  const decreaseStock = useCallback((_items: { id: number; qty: number }[]) => {
    // Stock is decremented server-side on checkout
  }, []);

  const getStock = useCallback(
    (id: number) => products.find((p) => p.id === id)?.stock ?? 0,
    [products],
  );

  const isLowStock = useCallback(
    (product: Product) =>
      product.stock > 0 && product.stock <= product.lowStockThreshold,
    [],
  );

  const value = useMemo(
    () => ({
      products,
      categories,
      coupons,
      orders,
      hydrated,
      loadError,
      refreshShop,
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
      placeOrder,
      updateOrderStatus,
      decreaseStock,
      getStock,
      isLowStock,
      nextProductId,
    }),
    [
      products,
      categories,
      coupons,
      orders,
      hydrated,
      loadError,
      refreshShop,
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
      placeOrder,
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
