import type { Metadata } from "next";
import { ChevronDown, ExternalLink, Eye, EyeOff, Plus, Search, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminPage } from "@/components/admin/ui/AdminPage";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { FlashBanner } from "@/components/admin/ui/FlashBanner";
import { Badge } from "@/components/admin/ui/Badge";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { AdminSubmitButton } from "@/components/admin/ui/AdminSubmitButton";
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton";
import { adminButton } from "@/components/admin/ui/Button";
import { adminCard, adminControl, adminInput, adminLabel } from "@/components/admin/ui/styles";
import { cn } from "@/lib/cn";
import { mapFaq, type FaqRow } from "@/types/faq";
import { createFaq, deleteFaq, updateFaq } from "./actions";

export const metadata: Metadata = {
  title: "Soru-cevap | Yönetim",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams?: Promise<{ success?: string; error?: string; ara?: string; kategori?: string }>;
};

const inputClassName = adminInput;

const categories = [
  "Tercih İşlemleri",
  "Yerleştirme",
  "Nakil İşlemleri",
  "Özel Durumlar",
  "Pansiyon ve Kayıt",
];

export default async function AdminFaqPage({ searchParams }: PageProps) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) {
    return (
      <AdminPage width="narrow">
        <PageHeader title="Yetkisiz erişim" />
      </AdminPage>
    );
  }

  const params = searchParams ? await searchParams : undefined;
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .order("sort_order")
    .order("created_at");

  if (error) {
    return (
      <AdminPage width="narrow">
        <PageHeader title="Soru-cevap" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
          <h2 className="font-bold">Soru-cevap tablosu yüklenemedi</h2>
          <p className="mt-2 text-sm">
            Supabase üzerinde 010_faqs.sql migration dosyasını uygulayın. Hata: {error.message}
          </p>
        </div>
      </AdminPage>
    );
  }

  const faqs = ((data ?? []) as FaqRow[]).map(mapFaq);
  const nextSortOrder = (faqs.at(-1)?.sortOrder ?? 0) + 10;
  const query = (params?.ara ?? "").trim().toLocaleLowerCase("tr-TR");
  const categoryFilter = params?.kategori ?? "";
  const visible = faqs.filter(
    (faq) =>
      (!categoryFilter || faq.category === categoryFilter) &&
      (!query || `${faq.question} ${faq.answer}`.toLocaleLowerCase("tr-TR").includes(query)),
  );
  const groups = [...new Set(visible.map((faq) => faq.category))].map((category) => ({
    category,
    items: visible.filter((faq) => faq.category === category),
  }));
  const allCategories = [...new Set([...categories, ...faqs.map((faq) => faq.category)])];
  const published = faqs.filter((faq) => faq.isPublished).length;

  return (
    <AdminPage width="narrow">
      <PageHeader
        title="Soru-cevap"
        description={`${faqs.length} soru · ${published} yayında`}
        actions={
          <a href="/soru-cevap" target="_blank" rel="noopener noreferrer" className={adminButton({ variant: "ghost" })}>
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
            Sayfayı görüntüle
          </a>
        }
      />
      <FlashBanner success={params?.success} error={params?.error} />

      <details className={cn(adminCard, "group mb-6")}>
        <summary
          className={cn(
            adminButton({ variant: "primary" }),
            "m-4 w-fit cursor-pointer list-none [&::-webkit-details-marker]:hidden",
          )}
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Yeni soru
        </summary>
        <div className="border-t border-admin-line p-5">
          <p className="mb-4 text-sm text-admin-muted">
            Yayında seçeneği açıksa kaydedilen soru ziyaretçilere gösterilir.
          </p>
          <form action={createFaq} className="space-y-4">
            <label className="block">
              <span className={adminLabel}>Soru</span>
              <input name="question" required className={inputClassName} />
            </label>
            <label className="block">
              <span className={adminLabel}>Yanıt</span>
              <textarea name="answer" required rows={5} className={inputClassName} />
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <label>
                <span className={adminLabel}>Kategori</span>
                <input name="category" list="faq-categories" defaultValue={categories[0]} required className={inputClassName} />
              </label>
              <label>
                <span className={adminLabel}>Sıra</span>
                <input name="sort_order" type="number" min="0" defaultValue={nextSortOrder} className={inputClassName} />
              </label>
              <label>
                <span className={adminLabel}>Kaynak sayfa</span>
                <input name="source_page" type="number" min="1" max="15" className={inputClassName} />
              </label>
            </div>
            <div className="flex flex-col gap-4 border-t border-admin-line pt-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex items-center gap-3 text-sm font-semibold text-admin-body">
                <input name="is_published" type="checkbox" defaultChecked className="h-4 w-4" />
                Yayında
              </label>
              <AdminSubmitButton label="Soruyu kaydet" pendingLabel="Kaydediliyor…" />
            </div>
          </form>
        </div>
      </details>

      <datalist id="faq-categories">
        {categories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>

      <form method="get" className="mb-2 flex flex-wrap gap-2" role="search">
        <label className="relative min-w-0 grow basis-60">
          <span className="sr-only">Sorularda ara</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-admin-faint"
          />
          <input
            type="search"
            name="ara"
            defaultValue={params?.ara ?? ""}
            placeholder="Soru veya yanıtta ara"
            className={cn(inputClassName, "pl-9")}
          />
        </label>
        <select name="kategori" defaultValue={categoryFilter} aria-label="Kategori" className={cn(adminControl, "grow sm:grow-0")}>
          <option value="">Tüm kategoriler</option>
          {allCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <button type="submit" className={adminButton()}>
          Uygula
        </button>
      </form>

      {visible.length === 0 ? (
        <div className={cn(adminCard, "mt-4")}>
          <EmptyState
            title={faqs.length === 0 ? "Henüz soru yok" : "Eşleşen soru yok"}
            body={
              faqs.length === 0
                ? "İlk soruyu “Yeni soru” ile ekleyin."
                : "Aramayı ya da kategoriyi değiştirin."
            }
          />
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.category} aria-label={group.category}>
            <h2 className="mt-6 mb-2 text-sm font-semibold text-admin-muted">
              {group.category} <span className="tabular-nums">· {group.items.length}</span>
            </h2>
            <div className="space-y-2">
              {group.items.map((faq) => (
                <details key={faq.id} className={cn(adminCard, "group open:ring-1 open:ring-admin-accent-soft")}>
                  <summary className="flex cursor-pointer list-none items-start gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                    <span className="mt-0.5 w-8 shrink-0 text-xs text-admin-muted tabular-nums">
                      #{faq.sortOrder}
                    </span>
                    <span className="flex-1 font-semibold leading-6 text-admin-ink">{faq.question}</span>
                    <Badge
                      tone={faq.isPublished ? "success" : "neutral"}
                      icon={
                        faq.isPublished ? (
                          <Eye aria-hidden="true" className="h-3 w-3" />
                        ) : (
                          <EyeOff aria-hidden="true" className="h-3 w-3" />
                        )
                      }
                    >
                      {faq.isPublished ? "Yayında" : "Taslak"}
                    </Badge>
                    <ChevronDown
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-admin-faint transition-transform group-open:rotate-180"
                    />
                  </summary>

                  <div className="border-t border-admin-line p-5">
                    <form action={updateFaq} className="space-y-4">
                      <input type="hidden" name="id" value={faq.id} />
                      <label className="block">
                        <span className={adminLabel}>Soru</span>
                        <input name="question" defaultValue={faq.question} required className={inputClassName} />
                      </label>
                      <label className="block">
                        <span className={adminLabel}>Yanıt</span>
                        <textarea name="answer" defaultValue={faq.answer} required rows={6} className={inputClassName} />
                      </label>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <label>
                          <span className={adminLabel}>Kategori</span>
                          <input name="category" list="faq-categories" defaultValue={faq.category} required className={inputClassName} />
                        </label>
                        <label>
                          <span className={adminLabel}>Sıra</span>
                          <input name="sort_order" type="number" min="0" defaultValue={faq.sortOrder} className={inputClassName} />
                        </label>
                        <label>
                          <span className={adminLabel}>Kaynak sayfa</span>
                          <input
                            name="source_page"
                            type="number"
                            min="1"
                            max="15"
                            defaultValue={faq.sourcePage ?? ""}
                            className={inputClassName}
                          />
                        </label>
                      </div>
                      <div className="flex flex-col gap-3 border-t border-admin-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <label className="inline-flex items-center gap-3 text-sm font-semibold text-admin-body">
                          <input name="is_published" type="checkbox" defaultChecked={faq.isPublished} className="h-4 w-4" />
                          Yayında
                        </label>
                        <AdminSubmitButton label="Değişiklikleri kaydet" />
                      </div>
                    </form>

                    <form action={deleteFaq} className="mt-3 flex justify-end border-t border-admin-line pt-3">
                      <input type="hidden" name="id" value={faq.id} />
                      <ConfirmButton
                        message={`"${faq.question}" sorusunu silmek istediğinize emin misiniz? Bu işlem geri alınmaz.`}
                        className={adminButton({ variant: "danger", size: "sm" })}
                      >
                        <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                        Soruyu sil
                      </ConfirmButton>
                    </form>
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))
      )}
    </AdminPage>
  );
}
