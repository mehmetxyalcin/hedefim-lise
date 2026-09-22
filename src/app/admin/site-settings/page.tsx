import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminPage } from "@/components/admin/ui/AdminPage";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { FlashBanner } from "@/components/admin/ui/FlashBanner";
import { Card } from "@/components/admin/ui/Card";
import { adminButton } from "@/components/admin/ui/Button";
import { adminInput } from "@/components/admin/ui/styles";
import { LogoUploadField } from "@/components/admin/LogoUploadField";
import { AdminSubmitButton } from "@/components/admin/ui/AdminSubmitButton";
import { updateSiteSettings } from "./actions";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Genel ayarlar | Yönetim",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams?: Promise<{ success?: string; error?: string }>;
};

const inputClassName = adminInput;

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
    <Card title={title} description={description}>
      {children}
    </Card>
  );
}

export default async function SiteSettingsPage({ searchParams }: PageProps) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) {
    return (
      <AdminPage width="narrow">
        <PageHeader title="Yetkisiz erişim" />
      </AdminPage>
    );
  }

  const params = searchParams ? await searchParams : undefined;

  const { data: settings } = await supabase
    .from("site_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  return (
    <AdminPage width="narrow">
      <PageHeader title="Genel ayarlar" description="Site başlığı ve logo." />
      <FlashBanner success={params?.success} error={params?.error} />

        <form action={updateSiteSettings} className="space-y-6">
          <FormSection
            title="Site başlığı"
            description="Tarayıcı sekmesinde ve navbar'da görünen site adı."
          >
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-admin-body">
                Site başlığı
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
                <span className="mb-2 block text-sm font-semibold text-admin-body">
                  Logo alt metni
                </span>
                <input
                  name="logo_alt"
                  defaultValue={settings?.logo_alt ?? "Hedefim Lise"}
                  required
                  className={inputClassName}
                  placeholder="Hedefim Lise"
                />
                <span className="mt-2 block text-xs text-admin-muted">
                  Erişilebilirlik için logo görselinin açıklayıcı metni.
                </span>
              </label>
            </div>
          </FormSection>

          <div className="rounded-xl border border-admin-line bg-white p-4 shadow-admin-card">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold text-admin-ink">Değişiklikleri kaydet</p>
                <p className="mt-1 text-xs text-admin-muted">
                  Kaydedildiğinde navbar ve footer hemen güncellenir.
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/admin"
                  className={adminButton()}
                >
                  İptal
                </Link>
                <AdminSubmitButton label="Kaydet" />
              </div>
            </div>
          </div>
        </form>
    </AdminPage>
  );
}
