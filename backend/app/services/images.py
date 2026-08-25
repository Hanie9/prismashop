"""Server-side image normalization and compression for admin uploads."""

from __future__ import annotations

from io import BytesIO

from PIL import Image, ImageOps

# Accept large phone photos; we always re-encode smaller on disk.
MAX_UPLOAD_BYTES = 15 * 1024 * 1024
# Longest side after resize (enough for product detail, light for CDN/storage).
MAX_DIMENSION = 1280
# Soft target for encoded file size.
TARGET_MAX_BYTES = 280_000
START_QUALITY = 82
MIN_QUALITY = 45
QUALITY_STEP = 7


def _to_rgb(img: Image.Image) -> Image.Image:
    """Flatten transparency onto white for consistent WebP/JPEG output."""
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        rgba = img.convert("RGBA")
        background = Image.new("RGB", rgba.size, (255, 255, 255))
        background.paste(rgba, mask=rgba.split()[-1])
        return background
    if img.mode != "RGB":
        return img.convert("RGB")
    return img


def _resize(img: Image.Image, max_dimension: int = MAX_DIMENSION) -> Image.Image:
    w, h = img.size
    longest = max(w, h)
    if longest <= max_dimension:
        return img
    scale = max_dimension / longest
    return img.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.Resampling.LANCZOS)


def _encode_webp(img: Image.Image, quality: int) -> bytes:
    buf = BytesIO()
    img.save(
        buf,
        format="WEBP",
        quality=quality,
        method=6,
    )
    return buf.getvalue()


def _encode_jpeg(img: Image.Image, quality: int) -> bytes:
    buf = BytesIO()
    img.save(
        buf,
        format="JPEG",
        quality=quality,
        optimize=True,
        progressive=True,
    )
    return buf.getvalue()


def compress_image(raw: bytes) -> tuple[bytes, str]:
    """
    Resize + compress upload bytes.

    Returns (encoded_bytes, extension_without_dot) e.g. (b"...", "webp").
    """
    img = Image.open(BytesIO(raw))
    img = ImageOps.exif_transpose(img)
    img = _to_rgb(img)
    img = _resize(img)

    # Prefer WebP (much smaller than JPEG at similar visual quality).
    quality = START_QUALITY
    best: bytes | None = None
    while quality >= MIN_QUALITY:
        data = _encode_webp(img, quality)
        best = data
        if len(data) <= TARGET_MAX_BYTES:
            return data, "webp"
        quality -= QUALITY_STEP

    if best is not None and len(best) <= TARGET_MAX_BYTES * 1.35:
        return best, "webp"

    # Extra pass: shrink dimensions a bit more if still heavy.
    smaller = _resize(img, max_dimension=960)
    quality = START_QUALITY
    best = None
    while quality >= MIN_QUALITY:
        data = _encode_webp(smaller, quality)
        best = data
        if len(data) <= TARGET_MAX_BYTES:
            return data, "webp"
        quality -= QUALITY_STEP

    if best is not None:
        return best, "webp"

    # Extremely unlikely fallback
    return _encode_jpeg(smaller if smaller is not img else img, MIN_QUALITY), "jpg"
