import type { Product } from "./shop-types";

export const MAX_PRODUCT_IMAGES = 8;

export function getProductImages(product: Pick<Product, "image" | "images">): string[] {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images.filter(Boolean);
  }
  return product.image ? [product.image] : [];
}

export function getProductCover(product: Pick<Product, "image" | "images">): string {
  return getProductImages(product)[0] ?? "";
}

export function normalizeProduct<T extends Product>(product: T): T {
  const images = getProductImages(product).slice(0, MAX_PRODUCT_IMAGES);
  return {
    ...product,
    images,
    image: images[0] ?? product.image ?? "",
  };
}

export function syncProductImages(images: string[]): { image: string; images: string[] } {
  const cleaned = images.filter(Boolean).slice(0, MAX_PRODUCT_IMAGES);
  return {
    images: cleaned,
    image: cleaned[0] ?? "",
  };
}
