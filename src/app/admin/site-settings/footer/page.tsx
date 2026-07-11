import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { FormSubmitButton } from "@/components/admin/FormSubmitButton";
import {
  getAdminFooterLinks,
  getAdminSocialLinks,
} from "@/lib/site-settings";
import {
  updateFooterSettings,
  createFooterLink,
  deleteFooterLink,
  createSocialLink,
  deleteSocialLink,
} from "../actions";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Footer Yönetimi",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams?: Promise<{ success?: string; error?: string }>;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const textareaClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-y";

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

const SOCIAL_PLATFORMS = [
  "instagram",
  "twitter",
  "youtube",
  "facebook",
  "linkedin",
  "tiktok",
  "whatsapp",
  "telegram",
];

const FOOTER_SECTIONS = [
  { value: "paydaşlar", label: "Proje Paydaşları" },
  { value: "hukuki", label: "Hukuki" },
  { value: "kaynaklar", label: "Kaynaklar" },
];

function sectionLabel(section: string, partnersTitle: string) {
  if (section === "paydaşlar") return partnersTitle;
  return FOOTER_SECTIONS.find((s) => s.value === section)?.label ?? section;
}

export default async function FooterSettingsPage({ searchParams }: PageProps) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) return <h1>Yetkisiz erişim.</h1>;

  const params = searchParams ? await searchParams : undefined;

  const { data: settings } = await supabase
    .from("footer_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  const [footerLinks, socialLinks] = await Promise.all([
    getAdminFooterLinks(supabase),
    getAdminSocialLinks(supabase),
  ]);
  const partnersTitle = settings?.partners_title ?? "Proje Paydaşları";

  // footer_links'i section'a göre grupla
  const linksBySection: Record<string, typeof footerLinks> = {};
  for (const link of footerLinks) {
    if (!linksBySection[link.section]) linksBySection[link.section] = [];
    linksBySection[link.section].push(link);
  }

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
            Footer&apos;ın metinlerini, linklerini ve sosyal medya hesaplarını yönetin.
          </p>
        </div>

        <SettingsTabs active="footer" />

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

        <div className="space-y-6">
          {/* ── Genel bilgiler formu ── */}
          <form action={updateFooterSettings} className="space-y-6">
            <FormSection
              title="Hakkında ve Telif Hakkı"
              description="Footer sol sütununda görünen açıklama metni ve alt bardaki telif metni."
            >
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Hakkında Metni
                  </span>
                  <textarea
                    name="about_text"
                    defaultValue={settings?.about_text ?? ""}
                    rows={4}
                    className={textareaClassName}
                    placeholder="Projenizin kısa açıklaması..."
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Telif Hakkı Metni
                  </span>
                  <input
                    name="copyright_text"
                    defaultValue={
                      settings?.copyright_text ?? "© 2026 Hedefim Lise, Yolum Bilinçli Tercih Projesi."
                    }
                    required
                    className={inputClassName}
                    placeholder="© 2026 Hedefim Lise"
                  />
                </label>
              </div>
            </FormSection>

            <FormSection
              title="Footer Bölüm Başlıkları"
              description="Footer'daki bağlantı bölümlerinin görünen başlıklarını yönetin."
            >
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Paydaşlar Bölümü Başlığı
                </span>
                <input
                  name="partners_title"
                  defaultValue={partnersTitle}
                  required
                  maxLength={80}
                  className={inputClassName}
                  placeholder="Proje Paydaşları"
                />
                <span className="mt-2 block text-xs text-slate-500">
                  Footer&apos;da paydaş bağlantılarının üzerinde gösterilir.
                </span>
              </label>
            </FormSection>

            <FormSection
              title="İletişim Bilgileri"
              description="Footer'ın iletişim sütununda görünen bilgiler."
            >
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    E-posta
                  </span>
                  <input
                    name="contact_email"
                    type="email"
                    defaultValue={settings?.contact_email ?? ""}
                    className={inputClassName}
                    placeholder="ornek@mersin.edu.tr"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Telefon
                  </span>
                  <input
                    name="contact_phone"
                    defaultValue={settings?.contact_phone ?? ""}
                    className={inputClassName}
                    placeholder="0 (324) 000 00 00"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Adres
                  </span>
                  <input
                    name="address"
                    defaultValue={settings?.address ?? ""}
                    className={inputClassName}
                    placeholder="İlçe, Mersin"
                  />
                </label>
              </div>
            </FormSection>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm font-bold text-slate-900">
                  Footer genel ayarlarını kaydet
                </p>
                <FormSubmitButton label="Kaydet" />
              </div>
            </div>
          </form>

          {/* ── Footer Linkleri ── */}
          <FormSection
            title="Footer Bağlantıları"
            description="Section adına göre gruplanmış bağlantılar. Mevcut section'lar: Proje Paydaşları, Hukuki, Kaynaklar."
          >
            <div className="space-y-6">
              {/* Mevcut linkler — section'a göre gruplu */}
              {Object.keys(linksBySection).length === 0 ? (
                <p className="text-sm text-slate-500">Henüz link yok.</p>
              ) : (
                Object.entries(linksBySection).map(([section, links]) => (
                  <div key={section}>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                      {sectionLabel(section, partnersTitle)}
                    </p>
                    <div className="space-y-2">
                      {links.map((link) => (
                        <div
                          key={link.id}
                          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-slate-800">{link.label}</span>
                            <span className="ml-2 font-mono text-xs text-slate-400">
                              {link.href}
                            </span>
                          </div>
                          <form action={deleteFooterLink}>
                            <input type="hidden" name="id" value={link.id} />
                            <button
                              type="submit"
                              aria-label={`${link.label} linkini sil`}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-sm text-rose-700 transition-colors hover:bg-rose-100"
                            >
                              ✕
                            </button>
                          </form>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}

              {/* Yeni link ekle */}
              <div className="rounded-xl border border-dashed border-slate-300 p-4">
                <p className="mb-3 text-sm font-semibold text-slate-700">
                  Yeni Bağlantı Ekle
                </p>
                <form action={createFooterLink} className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-slate-600">
                        Bölüm
                      </span>
                      <select
                        name="section"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      >
                        {FOOTER_SECTIONS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.value === "paydaşlar" ? partnersTitle : s.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-slate-600">
                        Etiket
                      </span>
                      <input
                        name="label"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        placeholder="Gizlilik Politikası"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-slate-600">
                        Bağlantı
                      </span>
                      <input
                        name="href"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        placeholder="/gizlilik"
                      />
                    </label>
                  </div>
                  <FormSubmitButton label="Link Ekle" pendingLabel="Ekleniyor..." />
                </form>
              </div>
            </div>
          </FormSection>

          {/* ── Sosyal Medya ── */}
          <FormSection
            title="Sosyal Medya Bağlantıları"
            description="Footer alt barında gösterilecek sosyal medya hesapları."
          >
            <div className="space-y-4">
              {/* Mevcut sosyal linkler */}
              {socialLinks.length === 0 ? (
                <p className="text-sm text-slate-500">Henüz sosyal medya linki yok.</p>
              ) : (
                <div className="space-y-2">
                  {socialLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5"
                    >
                      <span className="w-24 shrink-0 font-medium capitalize text-slate-800">
                        {link.platform}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-400">
                        {link.url}
                      </span>
                      <form action={deleteSocialLink}>
                        <input type="hidden" name="id" value={link.id} />
                        <button
                          type="submit"
                          aria-label={`${link.platform} linkini sil`}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-sm text-rose-700 transition-colors hover:bg-rose-100"
                        >
                          ✕
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              )}

              {/* Yeni sosyal link ekle */}
              <div className="rounded-xl border border-dashed border-slate-300 p-4">
                <p className="mb-3 text-sm font-semibold text-slate-700">
                  Yeni Sosyal Medya Linki Ekle
                </p>
                <form action={createSocialLink} className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-slate-600">
                        Platform
                      </span>
                      <select
                        name="platform"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      >
                        {SOCIAL_PLATFORMS.map((p) => (
                          <option key={p} value={p}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-slate-600">
                        URL
                      </span>
                      <input
                        name="url"
                        type="url"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        placeholder="https://instagram.com/..."
                      />
                    </label>
                  </div>
                  <FormSubmitButton label="Ekle" pendingLabel="Ekleniyor..." />
                </form>
              </div>
            </div>
          </FormSection>
        </div>
      </div>
    </div>
  );
}
