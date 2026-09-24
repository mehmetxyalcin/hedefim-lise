"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck, ExternalLink } from "lucide-react";
import { UnsavedChangesWarning } from "@/components/admin/UnsavedChangesWarning";
import { AdminButton, adminButton } from "@/components/admin/ui/Button";
import { adminCard, adminHint, adminInput, adminLabel } from "@/components/admin/ui/styles";
import { cn } from "@/lib/cn";
import { slugifyTr } from "@/lib/blog";
import type { AuthorFormState } from "@/app/admin/blog/yazarlar/actions";
import type { BlogAuthor } from "@/types/blog";

type Props = {
  author: BlogAuthor | null;
  action: (state: AuthorFormState, formData: FormData) => Promise<AuthorFormState>;
};

const CONTACT_FIELDS: { name: keyof BlogAuthor & string; field: string; label: string; type: string; placeholder: string }[] = [
  { name: "email", field: "email", label: "E-posta", type: "email", placeholder: "ad.soyad@ornek.com" },
  { name: "phone", field: "phone", label: "Telefon", type: "tel", placeholder: "0 5xx xxx xx xx" },
  { name: "websiteUrl", field: "website_url", label: "Web sitesi", type: "url", placeholder: "https://" },
  { name: "instagramUrl", field: "instagram_url", label: "Instagram", type: "url", placeholder: "https://instagram.com/…" },
  { name: "xUrl", field: "x_url", label: "X", type: "url", placeholder: "https://x.com/…" },
  { name: "linkedinUrl", field: "linkedin_url", label: "LinkedIn", type: "url", placeholder: "https://linkedin.com/in/…" },
  { name: "youtubeUrl", field: "youtube_url", label: "YouTube", type: "url", placeholder: "https://youtube.com/@…" },
];

export function AuthorForm({ author, action }: Props) {
  const router = useRouter();
  const [state, dispatch, pending] = useActionState(action, null);
  const [name, setName] = useState(author?.name ?? "");
  const [slug, setSlug] = useState(author?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(author));
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const savedPhoto = state?.success ? state.photoUrl : (author?.photoUrl ?? null);
  const shownPhoto = removePhoto ? null : (photoPreview ?? savedPhoto);
  const effectiveSlug = slugTouched ? slug : slugifyTr(name);

  useEffect(() => {
    if (!state) return;
    window.dispatchEvent(new window.CustomEvent("admin-form-settled", { detail: { success: state.success } }));
    if (state.success) router.refresh();
  }, [state, router]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

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
      {author && <input type="hidden" name="id" value={author.id} />}
      <input type="hidden" name="current_photo" value={savedPhoto ?? ""} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div className="min-w-0 space-y-6">
          <section className={cn(adminCard, "space-y-5 p-5")}>
            <h2 className="text-[15px] font-bold text-admin-ink">Profil</h2>
            <label className="block">
              <span className={adminLabel}>Ad soyad</span>
              <input
                name="name"
                required
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={cn(adminInput, "text-base font-semibold")}
              />
            </label>
            <label className="block">
              <span className={adminLabel}>Profil adresi (slug)</span>
              <span className="flex items-stretch overflow-hidden rounded-lg border border-admin-line-strong focus-within:border-admin-accent focus-within:ring-2 focus-within:ring-admin-accent/20">
                <span className="flex items-center border-r border-admin-line bg-admin-line-soft px-3 text-sm text-admin-muted">/blog/yazar/</span>
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
              <span className={adminHint}>Addan otomatik oluşur.</span>
            </label>
            <label className="block">
              <span className={adminLabel}>Unvan</span>
              <input
                name="title"
                maxLength={160}
                defaultValue={author?.title ?? ""}
                placeholder="Ör. Psikolojik danışman ve rehber öğretmen"
                className={adminInput}
              />
            </label>
            <label className="block">
              <span className={adminLabel}>Hakkında</span>
              <textarea name="bio" rows={8} maxLength={5000} defaultValue={author?.bio ?? ""} className={cn(adminInput, "leading-relaxed")} />
              <span className={adminHint}>
                Paragrafları boş bir satırla ayırın. İlk paragraf yazıların altındaki yazar kartında da görünür.
              </span>
            </label>
          </section>

          <section className={cn(adminCard, "space-y-4 p-5")}>
            <div>
              <h2 className="text-[15px] font-bold text-admin-ink">İletişim</h2>
              <p className="mt-1 text-[13px] text-admin-muted">
                Hepsi isteğe bağlı; doldurulan bilgi profil sayfasında herkese açık görünür. Yalnız yazarın paylaşmaya
                onay verdiği kişisel bilgileri girin. Bir kurumun resmî telefonu veya e-postası, projenin iletişim
                bilgisi gibi okunabileceği için kullanılmamalı.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {CONTACT_FIELDS.map((contact) => (
                <label key={contact.field} className="block">
                  <span className={adminLabel}>{contact.label}</span>
                  <input
                    name={contact.field}
                    type={contact.type}
                    inputMode={contact.type === "tel" ? "tel" : undefined}
                    defaultValue={(author?.[contact.name] as string | null) ?? ""}
                    placeholder={contact.placeholder}
                    className={adminInput}
                  />
                </label>
              ))}
            </div>
          </section>
        </div>

        <section className={cn(adminCard, "space-y-4 p-5 xl:sticky xl:top-20")}>
          <h2 className="text-[15px] font-bold text-admin-ink">Fotoğraf</h2>
          {shownPhoto ? (
            // Yerel önizleme (blob:) ve kayıtlı fotoğraf; boyut optimizasyonu gerekmez.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shownPhoto} alt="" className="aspect-square w-full rounded-lg border border-admin-line object-cover" />
          ) : (
            <p className="rounded-lg bg-admin-ground px-4 py-6 text-center text-sm text-admin-muted">
              Fotoğraf yoksa profilde baş harflerden oluşan bir kapak gösterilir.
            </p>
          )}
          <label className="block">
            <span className={adminLabel}>{savedPhoto ? "Fotoğrafı değiştir" : "Fotoğraf yükle (isteğe bağlı)"}</span>
            <input
              key={state?.success ? state.savedAt : "photo"}
              type="file"
              name="photo_file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setPhotoPreview(file ? URL.createObjectURL(file) : null);
                if (file) setRemovePhoto(false);
              }}
              className="block w-full text-sm text-admin-body file:mr-3 file:rounded-lg file:border file:border-admin-line-strong file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-admin-body hover:file:bg-admin-line-soft"
            />
            <span className={adminHint}>Kare ve yüzün ortada olduğu bir fotoğraf en iyi sonucu verir. En fazla 5 MB.</span>
          </label>
          {savedPhoto && (
            <label className="inline-flex items-center gap-2 text-sm text-admin-body">
              <input
                type="checkbox"
                name="remove_photo"
                checked={removePhoto}
                onChange={(event) => setRemovePhoto(event.target.checked)}
                className="h-4 w-4"
              />
              Fotoğrafı kaldır
            </label>
          )}
        </section>
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
          ) : (
            "Değişiklikler kaydedildiğinde profil ve yazı sayfaları güncellenir."
          )}
        </p>
        <div className="flex shrink-0 justify-end gap-2">
          {author && (
            <a href={`/blog/yazar/${author.slug}`} target="_blank" rel="noopener noreferrer" className={adminButton({ variant: "ghost" })}>
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
              Profili aç
            </a>
          )}
          {/* Dar ekranda sayfa başındaki geri bağlantısı aynı işi görür. */}
          <span className="hidden sm:block">
            <Link href="/admin/blog/yazarlar" className={adminButton()}>
              {author ? "Listeye dön" : "İptal"}
            </Link>
          </span>
          <AdminButton type="submit" variant="primary" loading={pending}>
            {pending ? "Kaydediliyor…" : author ? "Kaydet" : "Yazarı ekle"}
          </AdminButton>
        </div>
      </div>
    </form>
  );
}
