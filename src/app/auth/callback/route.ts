import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getSafeNextPath(next: string | null) {
  if (
    !next ||
    !next.startsWith("/admin") ||
    next.startsWith("//") ||
    next.startsWith("/admin/login")
  ) {
    return "/admin";
  }

  return next;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const authError = requestUrl.searchParams.get("error");
  const authErrorDescription = requestUrl.searchParams.get("error_description");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));
  const origin = requestUrl.origin;

  if (authError) {
    const message =
      authErrorDescription ??
      "Giriş bağlantısı geçersiz veya süresi dolmuş. Lütfen yeniden giriş bağlantısı isteyin.";

    return NextResponse.redirect(
      new URL(`/admin/login?error=${encodeURIComponent(message)}`, origin),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(
        `/admin/login?error=${encodeURIComponent("Giriş bağlantısı eksik veya geçersiz. Lütfen yeniden deneyin.")}`,
        origin,
      ),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/admin/login?error=${encodeURIComponent("Giriş oturumu oluşturulamadı. Bağlantının süresi dolmuş olabilir; lütfen yeniden deneyin.")}`,
        origin,
      ),
    );
  }

  return NextResponse.redirect(new URL(next, origin));
}
