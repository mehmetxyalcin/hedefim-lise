import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { FormSubmitButton } from "@/components/admin/FormSubmitButton";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { SmartSchoolBasicFields } from "@/components/admin/SmartSchoolBasicFields";
import { UnsavedChangesWarning } from "@/components/admin/UnsavedChangesWarning";
import type { School } from "@/types/school";
import type { VocationalField } from "@/types/vocationalField";
import type { ReactNode } from "react";

type SchoolFormProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: (formData: FormData) => any;
  cancelHref?: string;
  publicHref?: string;
  school?: School;
  submitLabel: string;
  vocationalFields: Pick<VocationalField, "id" | "title">[];
};

type FormSectionProps = {
  children: ReactNode;
  description?: string;
  title: string;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

function joinLines(values?: string[]) {
  return values?.join("\n") ?? "";
}

function FormSection({ children, description, title }: FormSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

export function SchoolForm({
  action,
  cancelHref = "/admin",
  publicHref,
  school,
  submitLabel,
  vocationalFields,
}: SchoolFormProps) {
  const actionTitle = school ? "Değişiklikleri kaydet" : "Okulu kaydet";
  const actionDescription = school
    ? "Kaydettiğinizde admin listesi ve public okul sayfaları yeniden doğrulanır."
    : "Kaydettiğinizde yeni okul admin listesine eklenir.";

  return (
    <form action={action} className="space-y-6" data-admin-school-form="true">
      <UnsavedChangesWarning />
      {school && <input type="hidden" name="id" value={school.id} />}

      <FormSection
        title="Temel Bilgiler"
        description="Okulun yönetim panelinde ve public sayfalarda kullanılan ana bilgileri."
      >
        <SmartSchoolBasicFields
          initialColor={school?.color}
          initialDistrict={school?.district}
          initialInstitutionCode={school?.institutionCode ?? ""}
          initialLogo={school?.logo}
          initialName={school?.name}
          initialSlug={school?.slug}
          initialType={school?.type}
        />
      </FormSection>

      <FormSection
        title="Tanıtım ve Görsel"
        description="Okul detay sayfasında görünen açıklama ve kapak görseli."
      >
        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Açıklama
            </span>
            <textarea
              name="description"
              defaultValue={school?.description ?? ""}
              required
              rows={5}
              className={inputClassName}
            />
          </label>

          <ImageUploadField
            currentImage={school?.images?.[0]}
            schoolName={school?.name}
          />
        </div>
      </FormSection>

      <FormSection
        title="İletişim Bilgileri"
        description="Zorunlu olmayan, okul detay sayfasında yardımcı bilgi olarak kullanılan alanlar."
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Adres
            </span>
            <textarea
              name="address"
              defaultValue={school?.address ?? ""}
              rows={2}
              placeholder="Örn: Şevket Sümer Mah. 2413 Sok. No:1 Akdeniz/Mersin"
              className={inputClassName}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Telefon
              </span>
              <input
                type="tel"
                name="phone"
                defaultValue={school?.phone ?? ""}
                placeholder="0324 xxx xx xx"
                className={inputClassName}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Website
              </span>
              <input
                type="url"
                name="website"
                defaultValue={school?.website ?? ""}
                placeholder="https://okul.meb.gov.tr"
                className={inputClassName}
              />
            </label>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="İçerik Listeleri"
        description="Özellik, proje ve dil alanlarını satır satır düzenleyebilirsiniz."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Özellikler
            </span>
            <textarea
              name="features"
              defaultValue={joinLines(school?.features)}
              rows={6}
              className={inputClassName}
            />
            <span className="mt-2 block text-xs text-slate-500">
              Her satıra bir madde yazabilir veya virgül ile ayırabilirsiniz.
            </span>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Projeler
            </span>
            <textarea
              name="projects"
              defaultValue={joinLines(school?.projects)}
              rows={6}
              className={inputClassName}
            />
            <span className="mt-2 block text-xs text-slate-500">
              Her satıra bir proje yazabilir veya virgül ile ayırabilirsiniz.
            </span>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Diller
            </span>
            <textarea
              name="languages"
              defaultValue={joinLines(school?.languages)}
              rows={4}
              className={inputClassName}
            />
            <span className="mt-2 block text-xs text-slate-500">
              Her satıra bir dil yazabilir veya virgül ile ayırabilirsiniz.
            </span>
          </label>
        </div>
      </FormSection>

      <FormSection
        title="Meslek Alanları"
        description="Bu okulla ilişkilendirilecek mesleki alanları seçin."
      >
        {vocationalFields.length === 0 ? (
          <p className="text-sm text-slate-500">Henüz meslek alanı bulunmuyor.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {vocationalFields.map((field) => (
              <label
                key={field.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-colors hover:bg-white"
              >
                <input
                  type="checkbox"
                  name="vocational_field_ids"
                  value={field.id}
                  defaultChecked={school?.vocationalFields?.includes(field.id)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium text-slate-700">
                  {field.title}
                </span>
              </label>
            ))}
          </div>
        )}
      </FormSection>

      <FormSection
        title="Yayın Durumu"
        description="Pasif okullar public okul listesinde ve detay sayfasında görünmez."
      >
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={school ? school.isActive !== false : true}
            className="h-4 w-4"
          />
          <span className="text-sm font-semibold text-slate-700">
            Yayında / aktif
          </span>
        </label>
      </FormSection>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">
              {actionTitle}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {actionDescription}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {publicHref && (
              <Link
                href={publicHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ExternalLink className="h-4 w-4" />
                Public sayfayı aç
              </Link>
            )}
            <Link
              href={cancelHref}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              İptal
            </Link>
            <FormSubmitButton label={submitLabel} />
          </div>
        </div>
      </div>
    </form>
  );
}
