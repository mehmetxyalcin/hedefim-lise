import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrlWithPath } from "@/lib/site";

function getSafeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/admin";
  }

  return next;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent("Giris oturumu olusturulamadi. Baglantiyi yeniden deneyin.")}`,
          getSiteUrlWithPath("/"),
        ),
      );
    }
  }

  return NextResponse.redirect(new URL(next, getSiteUrlWithPath("/")));
}
