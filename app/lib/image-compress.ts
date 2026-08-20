const MAX_DIM = 1200;
const MAX_BYTES = 900_000;

export async function fileToCompressedDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("فقط فایل تصویری مجاز است.");
  }

  const raw = await readAsDataURL(file);
  if (file.size <= MAX_BYTES && file.size <= 400_000) {
    return raw;
  }

  return compressImage(raw, file.type);
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("خواندن فایل ناموفق بود."));
    reader.readAsDataURL(file);
  });
}

function compressImage(dataUrl: string, mime: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("فشرده‌سازی تصویر ناموفق بود."));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const type = mime === "image/png" ? "image/png" : "image/jpeg";
      let quality = 0.86;
      let result = canvas.toDataURL(type, quality);
      while (result.length > MAX_BYTES * 1.37 && quality > 0.45) {
        quality -= 0.1;
        result = canvas.toDataURL("image/jpeg", quality);
      }
      resolve(result);
    };
    img.onerror = () => reject(new Error("بارگذاری تصویر ناموفق بود."));
    img.src = dataUrl;
  });
}
