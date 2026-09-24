import type { requireAdmin } from "@/lib/admin-auth";

type AdminClient = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

const BUCKET = "site-assets";

// Blog görselleri raster olmalı: SVG yüklenen dosyada betik taşıyabilir.
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** Görseli site-assets/<folder>/ altına yükler, herkese açık adresini döner. */
export async function uploadBlogImage(supabase: AdminClient, file: File, folder: string, name: string, label: string) {
  const extension = IMAGE_TYPES[file.type];
  if (!extension) throw new Error(`${label} JPG, PNG, WebP veya AVIF olmalıdır.`);
  const path = `${folder}/${name}-${Date.now()}.${extension}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, new Uint8Array(await file.arrayBuffer()), { contentType: file.type });
  if (error) throw new Error(`${label} yüklenemedi: ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Yakalanan hatanın mesajı; Error dışı değerlerde yedek metin. */
export function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return fallback;
}
