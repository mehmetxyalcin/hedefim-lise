import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminPage } from "@/components/admin/ui/AdminPage";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { FlashBanner } from "@/components/admin/ui/FlashBanner";
import { Card } from "@/components/admin/ui/Card";
import { adminInput } from "@/components/admin/ui/styles";
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton";
import { adminButton } from "@/components/admin/ui/Button";
import { X } from "lucide-react";
import { AdminSubmitButton } from "@/components/admin/ui/AdminSubmitButton";
import {
  getAdminFooterLinks,
  getAdminSocialLinks,
} from "@/lib/site-settings";
import {
  updateFooterSettings,
  updateFooterSectionTitle,
  createFooterLink,
  deleteFooterLink,
  createSocialLink,
  deleteSocialLink,
} from "../actions";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Alt bilgi | Yönetim",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams?: Promise<{ success?: string; error?: string }>;
};

const inputClassName = adminInput;

const textareaClassName =
  "w-full rounded-xl border border-admin-line bg-white px-4 py-3 text-admin-ink outline-none placeholder:text-admin-faint focus:border-admin-accent focus:ring-4 focus:ring-admin-accent/10 resize-y";

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

function sectionLabel(section: string, partnersTitle: string) {
  if (section === "paydaşlar") return partnersTitle;
  if (section === "hukuki") return "Hukuki";
  if (section === "kaynaklar") return "Kaynaklar";
  return section;
}

export default async function FooterSettingsPage({ searchParams }: PageProps) {
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
    <AdminPage width="narrow">
      <PageHeader title="Alt bilgi" description="Footer metinleri, bağlantılar ve sosyal medya hesapları." />
      <FlashBanner success={params?.success} error={params?.error} />

        <div className="space-y-6">
          {/* ── Genel bilgiler formu ── */}
          <form action={updateFooterSettings} className="space-y-6">
            <FormSection
              title="Hakkında ve telif hakkı"
              description="Footer sol sütununda görünen açıklama metni ve alt bardaki telif metni."
            >
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-admin-body">
                    Hakkında metni
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
                  <span className="mb-2 block text-sm font-semibold text-admin-body">
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
              title="İletişim bilgileri"
              description="Footer'ın iletişim sütununda görünen bilgiler."
            >
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-admin-body">
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
                  <span className="mb-2 block text-sm font-semibold text-admin-body">
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
                  <span className="mb-2 block text-sm font-semibold text-admin-body">
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

            <div className="rounded-xl border border-admin-line bg-white p-4 shadow-admin-card">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm font-bold text-admin-ink">
                  Footer genel ayarlarını kaydet
                </p>
                <AdminSubmitButton label="Kaydet" />
              </div>
            </div>
          </form>

          {/* ── Footer Linkleri ── */}
          <FormSection
            title="Footer bağlantıları"
            description="Bağlantıları bölümler halinde yönetin; paydaşlar bölümünün görünen adını doğrudan değiştirebilirsiniz."
          >
            <div className="space-y-6">
              {/* Mevcut linkler — section'a göre gruplu */}
              {Object.keys(linksBySection).length === 0 ? (
                <p className="text-sm text-admin-muted">Henüz link yok.</p>
              ) : (
                Object.entries(linksBySection).map(([section, links]) => (
                  <div key={section}>
                    {section === "paydaşlar" ? (
                      <form
                        action={updateFooterSectionTitle}
                        className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end"
                      >
                        <label className="min-w-0 flex-1">
                          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-admin-faint">
                            Bölüm adı
                          </span>
                          <input
                            name="partners_title"
                            defaultValue={partnersTitle}
                            required
                            maxLength={80}
                            className="w-full rounded-xl border border-admin-line bg-white px-3 py-2.5 text-sm font-semibold text-admin-ink outline-none focus:border-admin-accent focus:ring-4 focus:ring-admin-accent/10"
                          />
                        </label>
                        <AdminSubmitButton
                          label="Başlığı kaydet"
                          pendingLabel="Kaydediliyor…"
                        />
                      </form>
                    ) : (
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-admin-faint">
                        {sectionLabel(section, partnersTitle)}
                      </p>
                    )}
                    <div className="space-y-2">
                      {links.map((link) => (
                        <div
                          key={link.id}
                          className="flex items-center gap-3 rounded-xl border border-admin-line bg-admin-ground px-4 py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-admin-ink">{link.label}</span>
                            <span className="ml-2 font-mono text-xs text-admin-faint">
                              {link.href}
                            </span>
                          </div>
                          <form action={deleteFooterLink}>
                            <input type="hidden" name="id" value={link.id} />
                            <ConfirmButton
            message={`"${link.label}" bağlantısını silmek istediğinize emin misiniz?`}
                                                            aria-label={`${link.label} linkini sil`}
                              className={adminButton({ variant: "danger", size: "sm" })}
                            >
                              <X aria-hidden="true" className="h-4 w-4" />
                            </ConfirmButton>
                          </form>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}

              {/* Yeni link ekle */}
              <div className="rounded-xl border border-dashed border-admin-line-strong p-4">
                <p className="mb-3 text-sm font-semibold text-admin-body">
                  Yeni Bağlantı Ekle
                </p>
                <form action={createFooterLink} className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-admin-body">
                        Bölüm Adı
                      </span>
                      <input
                        name="section_title"
                        required
                        maxLength={80}
                        list="footer-section-options"
                        defaultValue={partnersTitle}
                        className="w-full rounded-xl border border-admin-line bg-white px-3 py-2.5 text-sm text-admin-ink outline-none focus:border-admin-accent focus:ring-4 focus:ring-admin-accent/10"
                        placeholder="Örneğin: Proje Destekçileri"
                      />
                      <datalist id="footer-section-options">
                        <option value={partnersTitle} />
                        <option value="Hukuki" />
                        <option value="Kaynaklar" />
                      </datalist>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-admin-body">
                        Etiket
                      </span>
                      <input
                        name="label"
                        required
                        className="w-full rounded-xl border border-admin-line bg-white px-3 py-2.5 text-sm text-admin-ink outline-none placeholder:text-admin-faint focus:border-admin-accent focus:ring-4 focus:ring-admin-accent/10"
                        placeholder="Gizlilik Politikası"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-admin-body">
                        Bağlantı
                      </span>
                      <input
                        name="href"
                        required
                        className="w-full rounded-xl border border-admin-line bg-white px-3 py-2.5 text-sm text-admin-ink outline-none placeholder:text-admin-faint focus:border-admin-accent focus:ring-4 focus:ring-admin-accent/10"
                        placeholder="/gizlilik"
                      />
                    </label>
                  </div>
                  <AdminSubmitButton label="Bağlantı ekle" pendingLabel="Ekleniyor…" />
                </form>
              </div>
            </div>
          </FormSection>

          {/* ── Sosyal Medya ── */}
          <FormSection
            title="Sosyal medya bağlantıları"
            description="Footer alt barında gösterilecek sosyal medya hesapları."
          >
            <div className="space-y-4">
              {/* Mevcut sosyal linkler */}
              {socialLinks.length === 0 ? (
                <p className="text-sm text-admin-muted">Henüz sosyal medya linki yok.</p>
              ) : (
                <div className="space-y-2">
                  {socialLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center gap-3 rounded-xl border border-admin-line bg-admin-ground px-4 py-2.5"
                    >
                      <span className="w-24 shrink-0 font-medium capitalize text-admin-ink">
                        {link.platform}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-mono text-xs text-admin-faint">
                        {link.url}
                      </span>
                      <form action={deleteSocialLink}>
                        <input type="hidden" name="id" value={link.id} />
                        <ConfirmButton
            message={`${link.platform} bağlantısını silmek istediğinize emin misiniz?`}
                                                    aria-label={`${link.platform} linkini sil`}
                          className={adminButton({ variant: "danger", size: "sm" })}
                        >
                          <X aria-hidden="true" className="h-4 w-4" />
                        </ConfirmButton>
                      </form>
                    </div>
                  ))}
                </div>
              )}

              {/* Yeni sosyal link ekle */}
              <div className="rounded-xl border border-dashed border-admin-line-strong p-4">
                <p className="mb-3 text-sm font-semibold text-admin-body">
                  Yeni Sosyal Medya Linki Ekle
                </p>
                <form action={createSocialLink} className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-admin-body">
                        Platform
                      </span>
                      <select
                        name="platform"
                        required
                        className="w-full rounded-xl border border-admin-line bg-white px-3 py-2.5 text-sm text-admin-ink outline-none focus:border-admin-accent focus:ring-4 focus:ring-admin-accent/10"
                      >
                        {SOCIAL_PLATFORMS.map((p) => (
                          <option key={p} value={p}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-admin-body">
                        URL
                      </span>
                      <input
                        name="url"
                        type="url"
                        required
                        className="w-full rounded-xl border border-admin-line bg-white px-3 py-2.5 text-sm text-admin-ink outline-none placeholder:text-admin-faint focus:border-admin-accent focus:ring-4 focus:ring-admin-accent/10"
                        placeholder="https://instagram.com/..."
                      />
                    </label>
                  </div>
                  <AdminSubmitButton label="Ekle" pendingLabel="Ekleniyor…" />
                </form>
              </div>
            </div>
          </FormSection>
        </div>
    </AdminPage>
  );
}
