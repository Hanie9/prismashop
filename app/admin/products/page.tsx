"use client";

import { FormEvent, useMemo, useState } from "react";
import AdminBottomSheet from "../../components/AdminBottomSheet";
import ConfirmDeleteDialog from "../../components/ConfirmDeleteDialog";
import MultiImageUploadField from "../../components/MultiImageUploadField";
import SelectDropdown from "../../components/SelectDropdown";
import { useShop } from "../../components/ShopProvider";
import {
  DEFAULT_PRODUCT_SPECS,
  normalizeSpecs,
} from "../../lib/product-content";
import { getProductCover, getProductImages, syncProductImages } from "../../lib/product-images";
import type { Product, ProductSpec } from "../../lib/shop-types";

const emptyForm = {
  name: "",
  originalPrice: "",
  discountPercent: "",
  images: [] as string[],
  categoryId: "",
  isBestseller: false,
  stock: "10",
  lowStockThreshold: "5",
  description: "",
  detailParagraphs: [""] as string[],
  highlights: [""] as string[],
  specs: DEFAULT_PRODUCT_SPECS.map((s) => ({ ...s })) as ProductSpec[],
  active: true,
};

function calcSalePrice(original: number, discountPercent: number) {
  if (!original || original <= 0) return 0;
  if (!discountPercent || discountPercent <= 0) return Math.round(original);
  const clamped = Math.min(100, Math.max(0, discountPercent));
  return Math.max(0, Math.round(original * (1 - clamped / 100)));
}

export default function AdminProductsPage() {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    isLowStock,
  } = useShop();
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        String(p.id).includes(q),
    );
  }, [products, query]);

  const originalNum = Number(form.originalPrice) || 0;
  const discountNum = Number(form.discountPercent) || 0;
  const salePrice = calcSalePrice(originalNum, discountNum);
  const hasDiscount = discountNum > 0 && originalNum > 0;

  const startCreate = () => {
    setEditingId(null);
    setFormError("");
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id ?? "",
    });
    setOpen(true);
  };

  const startEdit = (product: Product) => {
    const original = product.originalPrice ?? product.price;
    const discount =
      product.discount ??
      (product.originalPrice && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0);

    setEditingId(product.id);
    setFormError("");
    setForm({
      name: product.name,
      originalPrice: String(original),
      discountPercent: discount > 0 ? String(discount) : "",
      images: getProductImages(product),
      categoryId: product.categoryId,
      isBestseller: Boolean(product.isBestseller),
      stock: String(product.stock),
      lowStockThreshold: String(product.lowStockThreshold),
      description: product.description ?? "",
      detailParagraphs:
        product.detailParagraphs?.length ? [...product.detailParagraphs] : [""],
      highlights: product.highlights?.length ? [...product.highlights] : [""],
      specs: product.specs?.length
        ? normalizeSpecs(product.specs)
        : DEFAULT_PRODUCT_SPECS.map((s) => ({ ...s })),
      active: product.active,
    });
    setOpen(true);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    const category = categories.find((c) => c.id === form.categoryId);
    if (!form.name.trim() || !category) {
      setFormError("نام محصول و دسته‌بندی الزامی است.");
      return;
    }
    if (form.images.length === 0) {
      setFormError("حداقل یک تصویر برای محصول اضافه کنید.");
      return;
    }
    if (originalNum <= 0) {
      setFormError("قیمت قبل تخفیف را وارد کنید.");
      return;
    }
    if (discountNum < 0 || discountNum > 100) {
      setFormError("درصد تخفیف باید بین ۰ تا ۱۰۰ باشد.");
      return;
    }

    const price = salePrice;
    const originalPrice = hasDiscount ? originalNum : undefined;
    const discount = hasDiscount ? Math.round(discountNum) : undefined;
    const imageFields = syncProductImages(form.images);

    const payload = {
      name: form.name.trim(),
      price,
      originalPrice,
      ...imageFields,
      category: category.name,
      categoryId: category.id,
      isBestseller: form.isBestseller,
      discount,
      stock: Math.max(0, Number(form.stock) || 0),
      lowStockThreshold: Math.max(1, Number(form.lowStockThreshold) || 5),
      description: form.description.trim(),
      detailParagraphs: form.detailParagraphs.map((p) => p.trim()).filter(Boolean),
      highlights: form.highlights.map((h) => h.trim()).filter(Boolean),
      specs: form.specs
        .map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
        .filter((s) => s.label && s.value),
      active: form.active,
      rating: 0,
      reviewCount: 0,
    };

    if (editingId != null) {
      updateProduct(editingId, payload);
    } else {
      addProduct(payload);
    }
    setOpen(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "حذف محصول ناموفق بود.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-[#2e1a08] sm:text-2xl">محصولات</h1>
          <p className="mt-1 text-sm text-[#6d4014]">افزودن، ویرایش، تصویر و تخفیف محصولات</p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="w-full rounded-2xl bg-[#6d4014] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#4e2e0e] sm:w-auto"
        >
          + محصول جدید
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="جستجوی محصول..."
        className="w-full rounded-2xl border border-[#ead7bb] bg-white px-4 py-3 text-sm outline-none focus:border-[#d4a96a] sm:max-w-md"
      />

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((product) => (
          <ProductMobileCard
            key={product.id}
            product={product}
            isLow={isLowStock(product)}
            onEdit={() => startEdit(product)}
            onToggle={() => updateProduct(product.id, { active: !product.active })}
            onDelete={() => setDeleteTarget(product)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="rounded-3xl border border-[#ead7bb] bg-white py-12 text-center text-sm text-[#a96c20]">
            محصولی پیدا نشد.
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-3xl border border-[#ead7bb] bg-white md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-[#fffaf5] text-[#6d4014]">
            <tr>
              <th className="px-4 py-3 text-right font-medium">محصول</th>
              <th className="px-4 py-3 text-right font-medium">قیمت</th>
              <th className="px-4 py-3 text-right font-medium">تخفیف</th>
              <th className="px-4 py-3 text-right font-medium">موجودی</th>
              <th className="px-4 py-3 text-right font-medium">وضعیت</th>
              <th className="px-4 py-3 text-right font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id} className="border-t border-[#f1e3cf]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={getProductCover(product)}
                      alt=""
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                    <div>
                      <p className="font-bold text-[#2e1a08]">{product.name}</p>
                      <p className="text-xs text-[#a96c20]">
                        {product.category}
                        {getProductImages(product).length > 1
                          ? ` · ${getProductImages(product).length.toLocaleString("fa-IR")} تصویر`
                          : ""}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#4e2e0e]">
                  <div>{product.price.toLocaleString("fa-IR")}</div>
                  {product.originalPrice && (
                    <div className="text-xs text-gray-400 line-through">
                      {product.originalPrice.toLocaleString("fa-IR")}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {product.discount ? (
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
                      {product.discount.toLocaleString("fa-IR")}٪
                    </span>
                  ) : (
                    <span className="text-xs text-[#a96c20]">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      product.stock <= 0
                        ? "bg-red-50 text-red-600"
                        : isLowStock(product)
                          ? "bg-amber-50 text-amber-700"
                          : "bg-green-50 text-green-700"
                    }`}
                  >
                    {product.stock.toLocaleString("fa-IR")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => updateProduct(product.id, { active: !product.active })}
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      product.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {product.active ? "فعال" : "غیرفعال"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(product)}
                      className="rounded-xl border border-[#ead7bb] px-3 py-1.5 text-xs font-medium text-[#6d4014]"
                    >
                      ویرایش
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(product)}
                      className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600"
                    >
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminBottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={editingId != null ? "ویرایش محصول" : "محصول جدید"}
        onSubmit={onSubmit}
      >
        <div className="grid gap-3 sm:grid-cols-2">
              <Field label="نام محصول">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="دسته‌بندی">
                <SelectDropdown
                  id="product-category"
                  label="دسته‌بندی"
                  value={form.categoryId}
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  open={openDropdown === "product-category"}
                  onOpenChange={setOpenDropdown}
                  onChange={(categoryId) => setForm({ ...form, categoryId })}
                />
              </Field>

              <Field label="قیمت قبل تخفیف (تومان)">
                <input
                  required
                  type="number"
                  min={0}
                  value={form.originalPrice}
                  onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                  className={inputClass}
                  dir="ltr"
                  placeholder="مثلاً 150000"
                />
              </Field>
              <Field label="درصد تخفیف">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.discountPercent}
                  onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                  className={inputClass}
                  dir="ltr"
                  placeholder="مثلاً 20"
                />
              </Field>

              <div className="sm:col-span-2 rounded-2xl border border-[#ead7bb] bg-[#fffaf5] p-4">
                <p className="text-xs font-medium text-[#a96c20]">محاسبه خودکار قیمت</p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] text-[#a96c20]">قبل تخفیف</p>
                    <p className="mt-1 text-sm font-bold text-[#4e2e0e]">
                      {originalNum > 0 ? `${originalNum.toLocaleString("fa-IR")} تومان` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#a96c20]">درصد تخفیف</p>
                    <p className="mt-1 text-sm font-bold text-red-600">
                      {hasDiscount ? `${Math.round(discountNum).toLocaleString("fa-IR")}٪` : "بدون تخفیف"}
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-[11px] text-[#a96c20]">قیمت نهایی فروش</p>
                    <p className="mt-1 text-base font-black text-[#2e1a08]">
                      {salePrice > 0 ? `${salePrice.toLocaleString("fa-IR")} تومان` : "—"}
                    </p>
                  </div>
                </div>
              </div>

              <Field label="موجودی">
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className={inputClass}
                  dir="ltr"
                />
              </Field>
              <Field label="آستانه موجودی کم">
                <input
                  type="number"
                  value={form.lowStockThreshold}
                  onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                  className={inputClass}
                  dir="ltr"
                />
              </Field>

              <div className="sm:col-span-2">
                <MultiImageUploadField
                  value={form.images}
                  onChange={(images) => setForm({ ...form, images })}
                  label="تصاویر محصول"
                />
              </div>

              <div className="sm:col-span-2 space-y-4 rounded-2xl border border-[#ead7bb] bg-[#fffaf5] p-4">
                <div>
                  <h3 className="text-sm font-bold text-[#2e1a08]">محتوای صفحه محصول</h3>
                  <p className="mt-1 text-xs leading-6 text-[#a96c20]">
                    این بخش دقیقاً مطابق تب‌های «توضیحات» و «مشخصات» در صفحه محصول فروشگاه پر می‌شود.
                  </p>
                </div>

                <Field label="خلاصه کوتاه (زیر عنوان محصول)">
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className={inputClass}
                    placeholder="یک یا دو جمله کوتاه برای معرفی محصول"
                  />
                </Field>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-[#4e2e0e]">پاراگراف‌های توضیحات</span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm({ ...form, detailParagraphs: [...form.detailParagraphs, ""] })
                      }
                      className="text-xs font-medium text-[#8a5419] hover:underline"
                    >
                      + پاراگراف
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.detailParagraphs.map((paragraph, index) => (
                      <div key={`p-${index}`} className="flex gap-2">
                        <textarea
                          rows={2}
                          value={paragraph}
                          onChange={(e) => {
                            const next = [...form.detailParagraphs];
                            next[index] = e.target.value;
                            setForm({ ...form, detailParagraphs: next });
                          }}
                          className={inputClass}
                          placeholder={`پاراگراف ${index + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              detailParagraphs: form.detailParagraphs.filter((_, i) => i !== index),
                            })
                          }
                          className="shrink-0 rounded-xl border border-red-200 px-2 text-xs text-red-600 hover:bg-red-50"
                          disabled={form.detailParagraphs.length <= 1}
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-[#4e2e0e]">نکات برجسته (بولت)</span>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, highlights: [...form.highlights, ""] })}
                      className="text-xs font-medium text-[#8a5419] hover:underline"
                    >
                      + مورد
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.highlights.map((item, index) => (
                      <div key={`h-${index}`} className="flex gap-2">
                        <input
                          value={item}
                          onChange={(e) => {
                            const next = [...form.highlights];
                            next[index] = e.target.value;
                            setForm({ ...form, highlights: next });
                          }}
                          className={inputClass}
                          placeholder="مثلاً مناسب دکوراسیون داخلی"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              highlights: form.highlights.filter((_, i) => i !== index),
                            })
                          }
                          className="shrink-0 rounded-xl border border-red-200 px-2 text-xs text-red-600 hover:bg-red-50"
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-[#4e2e0e]">جدول مشخصات</span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          specs: [...form.specs, { label: "", value: "" }],
                        })
                      }
                      className="text-xs font-medium text-[#8a5419] hover:underline"
                    >
                      + ردیف
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.specs.map((spec, index) => (
                      <div key={`s-${index}`} className="grid grid-cols-[1fr_1.4fr_auto] gap-2">
                        <input
                          value={spec.label}
                          onChange={(e) => {
                            const next = [...form.specs];
                            next[index] = { ...next[index], label: e.target.value };
                            setForm({ ...form, specs: next });
                          }}
                          className={inputClass}
                          placeholder="عنوان (مثلاً جنس)"
                        />
                        <input
                          value={spec.value}
                          onChange={(e) => {
                            const next = [...form.specs];
                            next[index] = { ...next[index], value: e.target.value };
                            setForm({ ...form, specs: next });
                          }}
                          className={inputClass}
                          placeholder="مقدار"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              specs: form.specs.filter((_, i) => i !== index),
                            })
                          }
                          className="rounded-xl border border-red-200 px-2 text-xs text-red-600 hover:bg-red-50"
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        specs: DEFAULT_PRODUCT_SPECS.map((s) => ({ ...s })),
                      })
                    }
                    className="mt-2 text-xs text-[#6d4014] hover:underline"
                  >
                    بازگردانی قالب پیش‌فرض مشخصات
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-[#4e2e0e]">
                <input
                  type="checkbox"
                  checked={form.isBestseller}
                  onChange={(e) => setForm({ ...form, isBestseller: e.target.checked })}
                />
                پرفروش‌ترین‌ها
              </label>
              <label className="flex items-center gap-2 text-sm text-[#4e2e0e]">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                نمایش در فروشگاه
              </label>
            </div>

            {formError && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{formError}</p>
            )}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-2xl border border-[#ead7bb] px-5 py-2.5 text-sm text-[#6d4014]"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="rounded-2xl bg-[#6d4014] px-5 py-2.5 text-sm font-bold text-white"
              >
                ذخیره محصول
              </button>
            </div>
      </AdminBottomSheet>

      <ConfirmDeleteDialog
        open={deleteTarget != null}
        title="حذف محصول"
        description={
          deleteTarget ? (
            <>
              آیا مطمئن هستید که می‌خواهید محصول «{deleteTarget.name}» را حذف کنید؟ این عمل
              قابل بازگشت نیست.
            </>
          ) : null
        }
        busy={deleteTarget != null && deletingId === deleteTarget.id}
        onCancel={() => {
          if (deletingId == null) setDeleteTarget(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}

function ProductMobileCard({
  product,
  isLow,
  onEdit,
  onToggle,
  onDelete,
}: {
  product: Product;
  isLow: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-3xl border border-[#ead7bb] bg-white p-3">
      <div className="flex gap-3">
        <img
          src={getProductCover(product)}
          alt=""
          className="h-20 w-20 shrink-0 rounded-2xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-bold text-[#2e1a08]">{product.name}</p>
          <p className="mt-0.5 text-xs text-[#a96c20]">
            {product.category}
            {getProductImages(product).length > 1
              ? ` · ${getProductImages(product).length.toLocaleString("fa-IR")} تصویر`
              : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-black text-[#4e2e0e]">
              {product.price.toLocaleString("fa-IR")}
            </span>
            {product.originalPrice && (
              <span className="text-[11px] text-gray-400 line-through">
                {product.originalPrice.toLocaleString("fa-IR")}
              </span>
            )}
            {product.discount ? (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                {product.discount.toLocaleString("fa-IR")}٪
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                product.stock <= 0
                  ? "bg-red-50 text-red-600"
                  : isLow
                    ? "bg-amber-50 text-amber-700"
                    : "bg-green-50 text-green-700"
              }`}
            >
              موجودی {product.stock.toLocaleString("fa-IR")}
            </span>
            <button
              type="button"
              onClick={onToggle}
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                product.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {product.active ? "فعال" : "غیرفعال"}
            </button>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-xl border border-[#ead7bb] py-2 text-xs font-medium text-[#6d4014]"
        >
          ویرایش
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-xl border border-red-200 py-2 text-xs font-medium text-red-600"
        >
          حذف
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-[#4e2e0e]">
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-2xl border border-[#ead7bb] bg-[#fffaf5] px-3 py-2.5 text-sm outline-none focus:border-[#d4a96a]";
