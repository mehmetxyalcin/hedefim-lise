import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

async function getLoginRedirect() {
  const fallbackPath = "/admin";
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-pathname") ?? fallbackPath;
  const search = requestHeaders.get("x-search") ?? "";
  const next = pathname.startsWith("/admin") && pathname !== "/admin/login"
    ? `${pathname}${search}`
    : fallbackPath;

  return `/admin/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(
    "Oturumunuzun süresi dolmuş olabilir. Lütfen yeniden giriş yapın.",
  )}`;
}

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(await getLoginRedirect());
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "admin") {
    // Her çağıran (Server Action ve API route dahil) burada durur.
    // Yalnız oturum sahibi olmak yönetim işlemleri için yeterli değildir.
    const message = profileError
      ? "Yönetici yetkiniz doğrulanamadı. Lütfen tekrar giriş yapın."
      : "Bu hesabın yönetici yetkisi bulunmuyor.";
    redirect(`/admin/login?error=${encodeURIComponent(message)}`);
  }

  return { supabase, user, profile };
}
