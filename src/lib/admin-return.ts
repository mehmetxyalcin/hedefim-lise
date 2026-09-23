// Okul defterinden yapılan işlemlerin (aktif/pasif, silme) dönüş adresi.
// Formdan gelen `return_to` yalnız /admin kökünün göreli adresi olabilir;
// başka her şey /admin'e düşer (açık yönlendirme yok). Eski success/error
// bildirimleri atılır, yenisi withFlash ile eklenir.

const ADMIN_ROOT = "/admin";
const FLASH_KEYS = ["success", "error"];

export function safeAdminReturn(
  raw: FormDataEntryValue | null | undefined,
  drop: string[] = [],
): string {
  if (typeof raw !== "string") return ADMIN_ROOT;
  const value = raw.trim();
  // Yalnız "/admin" ya da "/admin?..." biçimi; şema, "//", ters bölü ve alt yol yok.
  if (!/^\/admin(?:\?[^\\]*)?(?:#.*)?$/.test(value)) return ADMIN_ROOT;

  const url = new URL(value, "https://admin.invalid");
  if (url.origin !== "https://admin.invalid" || url.pathname !== ADMIN_ROOT) return ADMIN_ROOT;

  for (const key of [...FLASH_KEYS, ...drop]) url.searchParams.delete(key);
  const search = url.searchParams.toString();
  return search ? `${ADMIN_ROOT}?${search}` : ADMIN_ROOT;
}

export function withFlash(path: string, kind: "success" | "error", message: string): string {
  return `${path}${path.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(message)}`;
}
