import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSubmitButton } from "@/components/admin/ui/AdminSubmitButton";
import { adminHint, adminInput, adminLabel } from "@/components/admin/ui/styles";
import { signInAdmin } from "./actions";

export const metadata: Metadata = {
  title: "Admin Girişi",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
  }>;
};

function getSafeNext(value?: string) {
  if (
    !value ||
    !value.startsWith("/admin") ||
    value.startsWith("//") ||
    value.startsWith("/admin/login")
  ) {
    return "/admin";
  }

  return value;
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined;
  const nextPath = getSafeNext(params?.next);

  // Zaten giriş yapmış admin'i direkt panele yönlendir
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "admin") {
      redirect(nextPath);
    }
  }

  return (
    <div className="flex w-full items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-admin-accent text-sm font-bold text-white">
            HL
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold text-admin-ink">Hedefim Lise</span>
            <span className="block text-xs text-admin-muted">Yönetim</span>
          </span>
        </div>
        <div className="rounded-xl border border-admin-line bg-white p-6 shadow-admin-card">
          <h1 className="text-xl font-bold tracking-tight text-admin-ink">Giriş yap</h1>
          <p className="mt-1 text-sm text-admin-muted">
            Yönetim paneline e-posta ve şifrenizle girin.
          </p>

          {params?.error && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
            >
              {params.error}
            </div>
          )}

          <form action={signInAdmin} className="mt-5 space-y-4">
            <input type="hidden" name="next" value={nextPath} />
            <label className="block">
              <span className={adminLabel}>E-posta</span>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className={adminInput}
                placeholder="ornek@site.com"
              />
            </label>
            <label className="block">
              <span className={adminLabel}>Şifre</span>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                autoComplete="current-password"
                className={adminInput}
              />
              <span className={adminHint}>En az 8 karakter.</span>
            </label>
            <AdminSubmitButton label="Giriş yap" pendingLabel="Giriş yapılıyor…" className="w-full" />
          </form>
        </div>
      </div>
    </div>
  );
}
