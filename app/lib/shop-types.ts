export type ProductSpec = {
  label: string;
  value: string;
};

export type Product = {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  /** تصویر اصلی / کاور */
  image: string;
  /** گالری تصاویر محصول (حداقل یکی؛ اولی همان کاور است) */
  images: string[];
  category: string;
  categoryId: string;
  rating: number;
  reviewCount: number;
  isNew?: boolean;
  discount?: number;
  stock: number;
  lowStockThreshold: number;
  /** خلاصه کوتاه زیر عنوان محصول */
  description?: string;
  /** پاراگراف‌های تب توضیحات */
  detailParagraphs?: string[];
  /** موارد بولت‌دار تب توضیحات */
  highlights?: string[];
  /** ردیف‌های جدول مشخصات */
  specs?: ProductSpec[];
  active: boolean;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  image: string;
};

export type Coupon = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  active: boolean;
  minOrder: number;
};

export type OrderItem = {
  productId: number;
  name: string;
  price: number;
  qty: number;
  image: string;
};

export type Order = {
  id: string;
  trackingCode: string;
  createdAt: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    province: string;
    city: string;
    address: string;
    postalCode: string;
    notes?: string;
  };
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  couponCode?: string;
};

export type ShopData = {
  products: Product[];
  categories: Category[];
  coupons: Coupon[];
  orders: Order[];
};
