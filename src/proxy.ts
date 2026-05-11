import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getSafeAdminNext(pathname: string, search = "") {
  if (!pathname.startsWith("/admin") || pathname === "/admin/login") {
    return "/admin";
  }

  return `${pathname}${search}`;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // x-pathname'i request headers'a ekle — admin-auth.ts bunu okur
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-search", search);

  // Supabase cookie refresh için response'u değiştirilebilir tut
  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Env eksikse session kontrolü yapma, sadece header'ı geçir
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Önce request cookie'lerini güncelle
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        // Response'u yeniden oluştur ve yeni cookie'leri set et
        response = NextResponse.next({
          request: { headers: requestHeaders },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // /admin/login sayfası açık — session kontrolü yapma
  if (pathname === "/admin/login") {
    return response;
  }

  // /admin/* altındaki korumalı sayfalar için session kontrolü
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", getSafeAdminNext(pathname, search));
    loginUrl.searchParams.set(
      "error",
      "Bu sayfaya erişmek için giriş yapmanız gerekiyor.",
    );
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // Yalnızca /admin/* routelarında çalıştır; statik dosyaları atla
  matcher: ["/admin/:path*"],
};
