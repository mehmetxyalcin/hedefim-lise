import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CircleHelp, Eye, EyeOff, Trash2 } from "lucide-react";
import { FormSubmitButton } from "@/components/admin/FormSubmitButton";
import { requireAdmin } from "@/lib/admin-auth";
import { mapFaq, type FaqRow } from "@/types/faq";
import { createFaq, deleteFaq, updateFaq } from "./actions";

export const metadata: Metadata = {
  title: "Soru-Cevap Yönetimi | Admin",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams?: Promise<{ success?: string; error?: string }>;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const categories = [
  "Tercih İşlemleri",
  "Yerleştirme",
  "Nakil İşlemleri",
  "Özel Durumlar",
  "Pansiyon ve Kayıt",
];

export default async function AdminFaqPage({ searchParams }: PageProps) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) return <h1>Yetkisiz erişim.</h1>;

  const params = searchParams ? await searchParams : undefined;
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .order("sort_order")
    .order("created_at");

  if (error) {
    return (
      <div className="min-h-[70vh] bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/admin"
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Admin Paneli
          </Link>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
            <h1 className="font-bold">Soru-cevap tablosu yüklenemedi</h1>
            <p className="mt-2 text-sm">
              Supabase üzerinde 010_faqs.sql migration dosyasını uygulayın.
              Hata: {error.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const faqs = ((data ?? []) as FaqRow[]).map(mapFaq);
  const nextSortOrder = (faqs.at(-1)?.sortOrder ?? 0) + 10;

  return (
    <div className="min-h-[70vh] bg-slate-50 px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link
            href="/admin"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Admin Paneli
          </Link>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-slate-900">
                <CircleHelp className="h-8 w-8 text-blue-600" />
                Soru-Cevap Yönetimi
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Yayındaki soruları düzenleyin veya yeni soru-cevap ekleyin.
              </p>
            </div>
            <Link
              href="/soru-cevap"
              target="_blank"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Sayfayı Görüntüle ↗
            </Link>
          </div>
        </div>

        {params?.success && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {params.success}
          </div>
        )}
        {params?.error && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {params.error}
          </div>
        )}

        <section className="mb-8 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm md:p-7">
          <div className="mb-5 border-b border-slate-100 pb-4">
            <h2 className="text-xl font-extrabold text-slate-900">
              Yeni soru-cevap ekle
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Kaydedilen içerik yayın seçeneği açıksa ziyaretçilere gösterilir.
            </p>
          </div>
          <form action={createFaq} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Soru</span>
              <input name="question" required className={inputClassName} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Yanıt</span>
              <textarea
                name="answer"
                required
                rows={5}
                className={inputClassName}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <label>
                <span className="mb-1.5 block text-sm font-bold text-slate-700">
                  Kategori
                </span>
                <input
                  name="category"
                  list="faq-categories"
                  defaultValue={categories[0]}
                  required
                  className={inputClassName}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-bold text-slate-700">
                  Sıra
                </span>
                <input
                  name="sort_order"
                  type="number"
                  min="0"
                  defaultValue={nextSortOrder}
                  className={inputClassName}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-bold text-slate-700">
                  Kaynak sayfa
                </span>
                <input
                  name="source_page"
                  type="number"
                  min="1"
                  max="15"
                  className={inputClassName}
                />
              </label>
            </div>
            <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex items-center gap-3 text-sm font-bold text-slate-700">
                <input
                  name="is_published"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                Yayında
              </label>
              <FormSubmitButton label="Soru-Cevap Ekle" pendingLabel="Ekleniyor..." />
            </div>
          </form>
        </section>

        <datalist id="faq-categories">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900">Mevcut Sorular</h2>
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
              {faqs.length} kayıt
            </span>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.id}
                className="group rounded-2xl border border-slate-200 bg-white shadow-sm open:border-blue-200"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5 marker:content-none">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                        {faq.category}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          faq.isPublished
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {faq.isPublished ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                        {faq.isPublished ? "Yayında" : "Taslak"}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        Sıra: {faq.sortOrder}
                      </span>
                    </div>
                    <h3 className="font-bold leading-6 text-slate-900">
                      {faq.question}
                    </h3>
                  </div>
                  <span className="text-xl text-slate-400 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>

                <div className="border-t border-slate-100 p-5">
                  <form action={updateFaq} className="space-y-4">
                    <input type="hidden" name="id" value={faq.id} />
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-bold text-slate-700">
                        Soru
                      </span>
                      <input
                        name="question"
                        defaultValue={faq.question}
                        required
                        className={inputClassName}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-bold text-slate-700">
                        Yanıt
                      </span>
                      <textarea
                        name="answer"
                        defaultValue={faq.answer}
                        required
                        rows={6}
                        className={inputClassName}
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <label>
                        <span className="mb-1.5 block text-sm font-bold text-slate-700">
                          Kategori
                        </span>
                        <input
                          name="category"
                          list="faq-categories"
                          defaultValue={faq.category}
                          required
                          className={inputClassName}
                        />
                      </label>
                      <label>
                        <span className="mb-1.5 block text-sm font-bold text-slate-700">
                          Sıra
                        </span>
                        <input
                          name="sort_order"
                          type="number"
                          min="0"
                          defaultValue={faq.sortOrder}
                          className={inputClassName}
                        />
                      </label>
                      <label>
                        <span className="mb-1.5 block text-sm font-bold text-slate-700">
                          Kaynak sayfa
                        </span>
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
                    <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <label className="inline-flex items-center gap-3 text-sm font-bold text-slate-700">
                        <input
                          name="is_published"
                          type="checkbox"
                          defaultChecked={faq.isPublished}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        Yayında
                      </label>
                      <FormSubmitButton label="Değişiklikleri Kaydet" />
                    </div>
                  </form>

                  <form action={deleteFaq} className="mt-3 flex justify-end border-t border-slate-100 pt-3">
                    <input type="hidden" name="id" value={faq.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" /> Sil
                    </button>
                  </form>
                </div>
              </details>
            ))}

            {faqs.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
                Henüz soru-cevap kaydı bulunmuyor.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
