import { SmartSchoolBasicFields } from "@/components/admin/SmartSchoolBasicFields";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { DescriptionField } from "@/components/admin/school-form/DescriptionField";
import type { School } from "@/types/school";
import { adminInput } from "@/components/admin/ui/styles";

const inputCls = adminInput;

type Props = { school?: School };

export function BasicInfoTab({ school }: Props) {
  return (
    <div className="space-y-6">
      {/* Temel alanlar (ad, slug, tür, ilçe, yüzdelik, logo, renk) */}
      <section className="rounded-xl border border-admin-line bg-white p-5 shadow-admin-card">
        <div className="mb-5 border-b border-admin-line-soft pb-4">
          <h2 className="text-base font-bold text-admin-ink">Kimlik</h2>
        </div>
        <SmartSchoolBasicFields
          initialColor={school?.color}
          initialDistrict={school?.district}
          initialInstitutionCode={school?.institutionCode ?? ""}
          initialLogo={school?.logo}
          initialName={school?.name}
          initialSlug={school?.slug}
          initialType={school?.type}
          initialPrograms={school?.programs}
        />
      </section>

      {/* Açıklama + Görsel */}
      <section className="rounded-xl border border-admin-line bg-white p-5 shadow-admin-card">
        <div className="mb-5 border-b border-admin-line-soft pb-4">
          <h2 className="text-base font-bold text-admin-ink">Tanıtım ve görsel</h2>
        </div>
        <div className="space-y-5">
          <DescriptionField defaultValue={school?.description ?? ""} />
          <ImageUploadField
            currentImage={school?.images?.[0]}
            schoolName={school?.name}
          />
        </div>
      </section>

      {/* Kurumsal özellikler */}
      <section className="rounded-xl border border-admin-line bg-white p-5 shadow-admin-card">
        <div className="mb-5 border-b border-admin-line-soft pb-4">
          <h2 className="text-base font-bold text-admin-ink">Kurumsal özellikler</h2>
          <p className="mt-1 text-sm text-admin-muted">
            Yerleştirme türü, eğitim şekli, pansiyon ve okul saatleri.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Yerleştirme türü */}
          <fieldset>
            <legend className="mb-3 block text-sm font-semibold text-admin-body">
              Yerleştirme türü
            </legend>
            <div className="flex flex-wrap gap-4">
              {[
                { value: "yerel", label: "Yerel yerleştirme" },
                { value: "merkezi", label: "Merkezi yerleştirme" },
                { value: "yerel_merkezi", label: "Yerel ve Merkezi" },
              ].map(({ value, label }) => (
                <label key={value} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="placement_type"
                    value={value}
                    defaultChecked={(school?.placementType ?? "yerel") === value}
                    className="h-4 w-4 accent-admin-accent"
                  />
                  <span className="text-sm font-medium text-admin-body">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Eğitim şekli */}
          <fieldset>
            <legend className="mb-3 block text-sm font-semibold text-admin-body">
              Eğitim şekli
            </legend>
            <div className="flex gap-4">
              {[
                { value: "normal", label: "Normal" },
                { value: "ikili", label: "İkili" },
              ].map(({ value, label }) => (
                <label key={value} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="education_type"
                    value={value}
                    defaultChecked={(school?.educationType ?? "normal") === value}
                    className="h-4 w-4 accent-admin-accent"
                  />
                  <span className="text-sm font-medium text-admin-body">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Pansiyon */}
          <fieldset>
            <legend className="mb-3 block text-sm font-semibold text-admin-body">
              Pansiyon
            </legend>
            <div className="flex flex-wrap gap-4">
              {[
                { value: "yok", label: "Yok" },
                { value: "kiz_erkek", label: "Kız ve erkek" },
                { value: "kiz", label: "Kız" },
                { value: "erkek", label: "Erkek" },
              ].map(({ value, label }) => (
                <label key={value} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="boarding_type"
                    value={value}
                    defaultChecked={(school?.boardingType ?? "yok") === value}
                    className="h-4 w-4 accent-admin-accent"
                  />
                  <span className="text-sm font-medium text-admin-body">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Okul saatleri */}
          <div>
            <span className="mb-3 block text-sm font-semibold text-admin-body">
              Okul saatleri
            </span>
            <div className="flex items-center gap-3">
              <input
                type="time"
                name="school_hours_start"
                defaultValue={school?.schoolHoursStart ?? ""}
                className="rounded-xl border border-admin-line bg-white px-3 py-2.5 text-sm text-admin-ink outline-none focus:border-admin-accent focus:ring-4 focus:ring-admin-accent/10"
              />
              <span className="text-sm text-admin-faint">–</span>
              <input
                type="time"
                name="school_hours_end"
                defaultValue={school?.schoolHoursEnd ?? ""}
                className="rounded-xl border border-admin-line bg-white px-3 py-2.5 text-sm text-admin-ink outline-none focus:border-admin-accent focus:ring-4 focus:ring-admin-accent/10"
              />
            </div>
          </div>

          {/* Okul saati notu (tam genişlik) */}
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-admin-body">
              Saat notu (isteğe bağlı)
            </span>
            <input
              name="school_hours_note"
              defaultValue={school?.schoolHoursNote ?? ""}
              placeholder="Örn: Cuma günleri 14:00'te biter"
              className={inputCls}
            />
          </label>
        </div>
      </section>

      {/* Diller / Özellikler / Projeler - mevcut text[] alanlar */}
      <section className="rounded-xl border border-admin-line bg-white p-5 shadow-admin-card">
        <div className="mb-5 border-b border-admin-line-soft pb-4">
          <h2 className="text-base font-bold text-admin-ink">İçerik listeleri</h2>
          <p className="mt-1 text-sm text-admin-muted">
            Her satıra bir madde veya virgülle ayırın.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-admin-body">Özellikler</span>
            <textarea
              name="features"
              defaultValue={school?.features?.join("\n") ?? ""}
              rows={5}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-admin-body">Diller</span>
            <textarea
              name="languages"
              defaultValue={school?.languages?.join("\n") ?? ""}
              rows={5}
              className={inputCls}
            />
          </label>
        </div>
      </section>

      {/* Yayın durumu */}
      <section className="rounded-xl border border-admin-line bg-white p-5 shadow-admin-card">
        <div className="mb-5 border-b border-admin-line-soft pb-4">
          <h2 className="text-base font-bold text-admin-ink">Yayın durumu</h2>
          <p className="mt-1 text-sm text-admin-muted">
            Pasif okullar listeye ve detay sayfasına yansımaz.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-admin-line bg-admin-ground px-4 py-3">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={school ? school.isActive !== false : true}
            className="h-4 w-4"
          />
          <span className="text-sm font-semibold text-admin-body">Yayında / Aktif</span>
        </label>
      </section>
    </div>
  );
}
