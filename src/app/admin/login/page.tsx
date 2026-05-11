import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormSubmitButton } from "@/components/admin/FormSubmitButton";
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

export default async function AdminLoginPage({ searchParams }: PageProps) {
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
      redirect("/admin");
    }
  }

  const params = searchParams ? await searchParams : undefined;
  const nextPath =
    params?.next?.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/admin";

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-slate-50 px-6 py-16">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          {/* Başlık */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Admin Girişi
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Yönetim paneline erişmek için e-posta ve şifrenizle giriş yapın.
            </p>
          </div>

          {/* Hata mesajı */}
          {params?.error && (
            <div
              role="alert"
              className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
            >
              {params.error}
            </div>
          )}

          {/* Form */}
          <form action={signInAdmin} className="space-y-5">
            <input type="hidden" name="next" value={nextPath} />

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                E-posta
              </span>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                placeholder="ornek@site.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Şifre
              </span>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                placeholder="En az 8 karakter"
              />
              <span className="mt-1.5 block text-xs text-slate-400">
                Şifre en az 8 karakter içermelidir.
              </span>
            </label>

            <FormSubmitButton label="Giriş Yap" pendingLabel="Giriş yapılıyor…" />
          </form>
        </div>
      </div>
    </div>
  );
}
