import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { LogoUploadField } from "@/components/admin/LogoUploadField";
import { FormSubmitButton } from "@/components/admin/FormSubmitButton";
import { updateSiteSettings } from "./actions";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Site Ayarları",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams?: Promise<{ success?: string; error?: string }>;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

function FormSection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function SettingsTabs({ active }: { active: "general" | "navigation" | "footer" }) {
  const tabs = [
    { id: "general" as const, href: "/admin/site-settings", label: "Genel" },
    { id: "navigation" as const, href: "/admin/site-settings/navigation", label: "Menü" },
    { id: "footer" as const, href: "/admin/site-settings/footer", label: "Footer" },
  ];

  return (
    <div className="mb-6 flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`flex-1 rounded-lg px-4 py-2 text-center text-sm font-semibold transition-colors ${
            active === tab.id
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

export default async function SiteSettingsPage({ searchParams }: PageProps) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) return <h1>Yetkisiz erişim.</h1>;

  const params = searchParams ? await searchParams : undefined;

  const { data: settings } = await supabase
    .from("site_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  return (
    <div className="min-h-[70vh] bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <Link
              href="/admin"
              className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              ← Admin Paneli
            </Link>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Site Ayarları
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Sitenin genel görünümünü ve içeriğini buradan yönetin.
          </p>
        </div>

        <SettingsTabs active="general" />

        {params?.success && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {params.success}
          </div>
        )}

        {params?.error && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {params.error}
          </div>
        )}

        <form action={updateSiteSettings} className="space-y-6">
          <FormSection
            title="Site Başlığı"
            description="Tarayıcı sekmesinde ve navbar'da görünen site adı."
          >
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Site Başlığı
              </span>
              <input
                name="site_title"
                defaultValue={settings?.site_title ?? "Hedefim Lise"}
                required
                className={inputClassName}
                placeholder="Hedefim Lise"
              />
            </label>
          </FormSection>

          <FormSection
            title="Logo"
            description="Navbar ve footer'da görünen logo görseli."
          >
            <div className="space-y-4">
              <LogoUploadField
                currentLogoUrl={settings?.logo_url}
                logoAlt={settings?.logo_alt ?? "Hedefim Lise"}
              />
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Logo Alt Metni
                </span>
                <input
                  name="logo_alt"
                  defaultValue={settings?.logo_alt ?? "Hedefim Lise"}
                  required
                  className={inputClassName}
                  placeholder="Hedefim Lise"
                />
                <span className="mt-2 block text-xs text-slate-500">
                  Erişilebilirlik için logo görselinin açıklayıcı metni.
                </span>
              </label>
            </div>
          </FormSection>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Değişiklikleri kaydet</p>
                <p className="mt-1 text-xs text-slate-500">
                  Kaydedildiğinde navbar ve footer hemen güncellenir.
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/admin"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  İptal
                </Link>
                <FormSubmitButton label="Kaydet" />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
