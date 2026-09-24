"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bold, CircleCheck, Eye, Heading2, Heading3, Highlighter, Link2, List, ListOrdered, MessageSquareWarning } from "lucide-react";
import { UnsavedChangesWarning } from "@/components/admin/UnsavedChangesWarning";
import { AdminButton, adminButton } from "@/components/admin/ui/Button";
import { adminCard, adminFocus, adminHint, adminInput, adminLabel } from "@/components/admin/ui/styles";
import { cn } from "@/lib/cn";
import { readingMinutes, slugifyTr, toIstanbulInput } from "@/lib/blog";
import type { BlogFormState } from "@/app/admin/blog/actions";
import type { BlogAuthor, BlogPost } from "@/types/blog";

type Props = {
  post: BlogPost | null;
  categories: string[];
  authors: Pick<BlogAuthor, "id" | "name" | "title">[];
  action: (state: BlogFormState, formData: FormData) => Promise<BlogFormState>;
};

type Snippet = { label: string; icon: typeof Bold; before: string; after?: string; placeholder: string; block?: boolean };

// Araç çubuğu yalnız blog-markdown.ts'nin tanıdığı sözdizimini üretir.
const SNIPPETS: Snippet[] = [
  { label: "Ara başlık", icon: Heading2, before: "## ", placeholder: "Ara başlık", block: true },
  { label: "Alt başlık", icon: Heading3, before: "### ", placeholder: "Alt başlık", block: true },
  { label: "Kalın", icon: Bold, before: "**", after: "**", placeholder: "kalın metin" },
  { label: "Fosforlu vurgu", icon: Highlighter, before: "==", after: "==", placeholder: "vurgulanan terim" },
  { label: "Bağlantı", icon: Link2, before: "[", after: "](/okullar)", placeholder: "bağlantı metni" },
  { label: "Madde listesi", icon: List, before: "- ", placeholder: "madde", block: true },
  { label: "Numaralı liste", icon: ListOrdered, before: "1. ", placeholder: "adım", block: true },
  { label: "Not kutusu", icon: MessageSquareWarning, before: "> [!ipucu]\n> ", placeholder: "Okura kısa bir ipucu", block: true },
];

function Counter({ value, max, ideal }: { value: string; max: number; ideal?: [number, number] }) {
  const length = value.trim().length;
  const over = length > max;
  const outside = ideal && length > 0 && (length < ideal[0] || length > ideal[1]);
  return (
    <span className={cn("text-xs tabular-nums", over ? "font-semibold text-rose-700" : outside ? "text-amber-800" : "text-admin-muted")}>
      {length} / {max}
    </span>
  );
}

export function BlogPostForm({ post, categories, authors, action }: Props) {
  const router = useRouter();
  const [state, dispatch, pending] = useActionState(action, null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [status, setStatus] = useState<"taslak" | "yayinda">(post?.isPublished ? "yayinda" : "taslak");
  const [removeCover, setRemoveCover] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const savedCover = state?.success ? state.coverImageUrl : (post?.coverImageUrl ?? null);
  const shownCover = removeCover ? null : (coverPreview ?? savedCover);
  const effectiveSlug = slugTouched ? slug : slugifyTr(title);
  const slugChanged = Boolean(post?.isPublished && post.slug !== slugifyTr(effectiveSlug || title));

  useEffect(() => {
    if (!state) return;
    window.dispatchEvent(new window.CustomEvent("admin-form-settled", { detail: { success: state.success } }));
    if (state.success) router.refresh();
  }, [state, router]);

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  function insert(snippet: Snippet) {
    const textarea = bodyRef.current;
    if (!textarea) return;
    const { selectionStart: start, selectionEnd: end, value } = textarea;
    const selected = value.slice(start, end) || snippet.placeholder;
    const lead = snippet.block && start > 0 && value[start - 1] !== "\n" ? "\n\n" : "";
    const text = `${lead}${snippet.before}${selected}${snippet.after ?? ""}`;
    const next = value.slice(0, start) + text + value.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + lead.length + snippet.before.length;
      textarea.setSelectionRange(cursor, cursor + selected.length);
    });
  }

  const minutes = readingMinutes(body);
  const words = body.split(/\s+/).filter(Boolean).length;

  return (
    <form
      data-admin-school-form="true"
      className="space-y-6"
      onSubmit={(event) => {
        // Elle gönderim: React'in hata yanıtında alanları sıfırlamasını önler.
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => dispatch(data));
      }}
    >
      <UnsavedChangesWarning />
      {post && <input type="hidden" name="id" value={post.id} />}
      <input type="hidden" name="current_cover" value={savedCover ?? ""} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="min-w-0 space-y-6">
          <section className={cn(adminCard, "space-y-5 p-5")}>
            <label className="block">
              <span className="flex items-baseline justify-between">
                <span className={adminLabel}>Başlık</span>
                <Counter value={title} max={200} ideal={[20, 80]} />
              </span>
              <input
                name="title"
                required
                maxLength={200}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ör. Yerel yerleştirme nasıl işler?"
                className={cn(adminInput, "text-base font-semibold")}
              />
            </label>

            <label className="block">
              <span className={adminLabel}>Adres (slug)</span>
              <span className="flex items-stretch overflow-hidden rounded-lg border border-admin-line-strong focus-within:border-admin-accent focus-within:ring-2 focus-within:ring-admin-accent/20">
                <span className="flex items-center border-r border-admin-line bg-admin-line-soft px-3 text-sm text-admin-muted">/blog/</span>
                <input
                  name="slug"
                  value={effectiveSlug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setSlug(event.target.value);
                  }}
                  onBlur={() => setSlug(slugifyTr(effectiveSlug))}
                  maxLength={120}
                  className="min-h-10 w-full min-w-0 bg-white px-3 text-sm text-admin-ink outline-none"
                />
              </span>
              <span className={adminHint}>
                {slugChanged
                  ? "Yayındaki yazının adresini değiştiriyorsunuz; paylaşılmış eski bağlantılar çalışmaz."
                  : "Başlıktan otomatik oluşur. Türkçe karakterler sadeleştirilir."}
              </span>
            </label>

            <label className="block">
              <span className="flex items-baseline justify-between">
                <span className={adminLabel}>Özet</span>
                <Counter value={excerpt} max={300} ideal={[80, 170]} />
              </span>
              <textarea
                name="excerpt"
                required
                rows={3}
                maxLength={300}
                value={excerpt}
                onChange={(event) => setExcerpt(event.target.value)}
                className={adminInput}
              />
              <span className={adminHint}>
                Listede başlığın altında ve arama sonuçlarında görünür. 80–170 karakter en iyi sonucu verir.
              </span>
            </label>
          </section>

          <section className={cn(adminCard, "p-5")}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <label htmlFor="blog-body" className="text-[13px] font-semibold text-admin-body">
                Yazı metni
              </label>
              <span className="text-xs text-admin-muted tabular-nums">
                {words} kelime · yaklaşık {minutes} dk okuma
              </span>
            </div>
            <div role="toolbar" aria-label="Biçimlendirme" className="mb-2 flex flex-wrap gap-1">
              {SNIPPETS.map((snippet) => {
                const Icon = snippet.icon;
                return (
                  <button
                    key={snippet.label}
                    type="button"
                    title={snippet.label}
                    aria-label={snippet.label}
                    onClick={() => insert(snippet)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-admin-body transition-colors duration-150 hover:bg-admin-line-soft",
                      adminFocus,
                    )}
                  >
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
            <textarea
              id="blog-body"
              ref={bodyRef}
              name="body"
              required
              rows={24}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className={cn(adminInput, "leading-relaxed")}
            />
            <details className="mt-3 rounded-lg bg-admin-ground px-4 py-3 text-sm text-admin-body">
              <summary className="cursor-pointer font-semibold">Biçimlendirme rehberi</summary>
              <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
                {[
                  ["## Başlık", "Ara başlık; yazının içindekiler listesine girer"],
                  ["### Başlık", "Alt başlık"],
                  ["**kalın**", "Kalın yazı"],
                  ["==terim==", "Fosforlu kalemle vurgulanmış terim"],
                  ["*italik*", "Eğik yazı"],
                  ["[metin](/okullar)", "Bağlantı; site içi yol veya https:// adresi"],
                  ["- madde / 1. adım", "Madde veya numaralı liste"],
                  ["> [!ipucu] …", "Kutu: not, ipucu, dikkat veya önemli"],
                  ["> alıntı", "Alıntı"],
                  ["| A | B |", "Tablo; ikinci satır | --- | --- |"],
                  ["![açıklama](https://…)", "Görsel (yalnız https)"],
                  ["---", "Bölüm ayracı"],
                ].map(([code, meaning]) => (
                  <div key={code} className="contents">
                    <dt>
                      <code className="rounded bg-white px-1.5 py-0.5 text-xs text-admin-ink">{code}</code>
                    </dt>
                    <dd className="text-admin-muted">{meaning}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-admin-muted">Paragrafları boş bir satırla ayırın. HTML etiketleri metin olarak gösterilir.</p>
            </details>
          </section>
        </div>

        <div className="space-y-6 xl:sticky xl:top-20">
          <section className={cn(adminCard, "space-y-4 p-5")}>
            <h2 className="text-[15px] font-bold text-admin-ink">Yayın</h2>
            <fieldset>
              <legend className="sr-only">Yayın durumu</legend>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-admin-line-soft p-1">
                {(["taslak", "yayinda"] as const).map((value) => (
                  <label
                    key={value}
                    className={cn(
                      "flex cursor-pointer items-center justify-center rounded-md px-3 py-2 text-sm font-semibold transition-colors duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-admin-accent",
                      status === value ? "bg-white text-admin-ink shadow-sm" : "text-admin-muted hover:text-admin-ink",
                    )}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={value}
                      checked={status === value}
                      onChange={() => setStatus(value)}
                      className="sr-only"
                    />
                    {value === "taslak" ? "Taslak" : "Yayında"}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className={adminLabel}>Yayın tarihi</span>
              <input
                type="datetime-local"
                name="published_at"
                defaultValue={toIstanbulInput(post?.publishedAt ?? null)}
                className={adminInput}
              />
              <span className={adminHint}>
                Türkiye saatiyle. Boş bırakıp yayına alırsanız hemen görünür; ileri bir tarih seçerseniz o gün yayına girer.
              </span>
            </label>
            <label className="block">
              <span className={adminLabel}>Kategori</span>
              <input name="category" list="blog-categories" required maxLength={60} defaultValue={post?.category ?? categories[0]} className={adminInput} />
              <datalist id="blog-categories">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </label>
            <label className="block">
              <span className={adminLabel}>Yazar</span>
              <select name="author_id" defaultValue={post?.authorId ?? ""} className={adminInput}>
                <option value="">
                  {post && !post.authorId ? post.authorName : "Hedefim Lise"} (yazar sayfası yok)
                </option>
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.title ? `${author.name} · ${author.title}` : author.name}
                  </option>
                ))}
              </select>
              <span className={adminHint}>
                Yeni yazarı{" "}
                <Link href="/admin/blog/yazarlar/yeni" className="font-semibold text-admin-accent hover:underline">
                  Yazarlar
                </Link>{" "}
                sayfasından ekleyin.
              </span>
            </label>
          </section>

          <section className={cn(adminCard, "space-y-4 p-5")}>
            <h2 className="text-[15px] font-bold text-admin-ink">Kapak</h2>
            <label className="block">
              <span className={adminLabel}>Kapak vurgusu</span>
              <input
                name="highlight"
                maxLength={24}
                defaultValue={post?.highlight ?? ""}
                placeholder="Ör. 5 tercih, %1, OBP"
                className={adminInput}
              />
              <span className={adminHint}>
                Görsel yoksa kapakta büyük harflerle yazılan kısa ifade. Boşsa kategori adı kullanılır.
              </span>
            </label>

            {shownCover && (
              // Yerel önizleme (blob:) ve kayıtlı kapak; boyut optimizasyonu gerekmez.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shownCover} alt="" className="aspect-[16/10] w-full rounded-lg border border-admin-line object-cover" />
            )}
            <label className="block">
              <span className={adminLabel}>{savedCover ? "Kapak görselini değiştir" : "Kapak görseli (isteğe bağlı)"}</span>
              <input
                key={state?.success ? state.savedAt : "cover"}
                type="file"
                name="cover_file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setCoverPreview(file ? URL.createObjectURL(file) : null);
                  if (file) setRemoveCover(false);
                }}
                className="block w-full text-sm text-admin-body file:mr-3 file:rounded-lg file:border file:border-admin-line-strong file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-admin-body hover:file:bg-admin-line-soft"
              />
              <span className={adminHint}>JPG, PNG, WebP veya AVIF; en fazla 5 MB. Yatay ve sade görseller en iyi sonucu verir.</span>
            </label>
            {(savedCover || coverPreview) && (
              <>
                <label className="block">
                  <span className={adminLabel}>Görsel açıklaması</span>
                  <input
                    name="cover_image_alt"
                    maxLength={300}
                    defaultValue={post?.coverImageAlt ?? ""}
                    placeholder="Görselde ne var? Ekran okuyucular için"
                    className={adminInput}
                  />
                </label>
                {savedCover && (
                  <label className="inline-flex items-center gap-2 text-sm text-admin-body">
                    <input
                      type="checkbox"
                      name="remove_cover"
                      checked={removeCover}
                      onChange={(event) => setRemoveCover(event.target.checked)}
                      className="h-4 w-4"
                    />
                    Kapak görselini kaldır, tipografik kapağı kullan
                  </label>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {state?.success === false && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
          {state.message}
        </div>
      )}

      <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-xl border border-admin-line bg-white px-4 py-3 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <p className={cn("text-sm text-admin-muted", !state?.success && "hidden sm:block")} aria-live="polite">
          {state?.success ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
              <CircleCheck aria-hidden="true" className="h-4 w-4" />
              {state.message}
            </span>
          ) : status === "yayinda" ? (
            "Kaydettiğinizde yazı yayın tarihine göre ziyaretçilere açılır."
          ) : (
            "Taslaklar yalnız yönetimde ve önizlemede görünür."
          )}
        </p>
        <div className="flex shrink-0 justify-end gap-2">
          {post && (
            <Link href={`/admin/blog/${post.id}/onizleme`} target="_blank" className={adminButton({ variant: "ghost" })}>
              <Eye aria-hidden="true" className="h-4 w-4" />
              Önizle
            </Link>
          )}
          {/* Dar ekranda sayfa başındaki "← Blog" bağlantısı aynı işi görür. */}
          <span className="hidden sm:block">
            <Link href="/admin/blog" className={adminButton()}>
              {post ? "Listeye dön" : "İptal"}
            </Link>
          </span>
          <AdminButton type="submit" variant="primary" loading={pending}>
            {pending ? "Kaydediliyor…" : status === "yayinda" ? "Kaydet ve yayınla" : "Taslağı kaydet"}
          </AdminButton>
        </div>
      </div>
    </form>
  );
}
