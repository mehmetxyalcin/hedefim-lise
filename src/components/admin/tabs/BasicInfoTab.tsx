import { SmartSchoolBasicFields } from "@/components/admin/SmartSchoolBasicFields";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { School } from "@/types/school";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

type Props = { school?: School };

export function BasicInfoTab({ school }: Props) {
  return (
    <div className="space-y-6">
      {/* Temel alanlar (ad, slug, tür, ilçe, yüzdelik, logo, renk) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900">Kimlik Bilgileri</h2>
        </div>
        <SmartSchoolBasicFields
          initialColor={school?.color}
          initialDistrict={school?.district}
          initialLogo={school?.logo}
          initialName={school?.name}
          initialPercentile={school?.percentile}
          initialSlug={school?.slug}
          initialType={school?.type}
        />
      </section>

      {/* Açıklama + Görsel */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900">Tanıtım ve Görsel</h2>
        </div>
        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Açıklama</span>
            <textarea
              name="description"
              defaultValue={school?.description ?? ""}
              required
              rows={4}
              className={inputCls}
            />
          </label>
          <ImageUploadField
            currentImage={school?.images?.[0]}
            schoolName={school?.name}
          />
        </div>
      </section>

      {/* Kurumsal özellikler */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900">Kurumsal Özellikler</h2>
          <p className="mt-1 text-sm text-slate-500">
            Yerleştirme türü, eğitim şekli, pansiyon ve okul saatleri.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Yerleştirme türü */}
          <fieldset>
            <legend className="mb-3 block text-sm font-semibold text-slate-700">
              Yerleştirme Türü
            </legend>
            <div className="flex gap-4">
              {[
                { value: "yerel", label: "Yerel" },
                { value: "merkezi", label: "Merkezi" },
              ].map(({ value, label }) => (
                <label key={value} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="placement_type"
                    value={value}
                    defaultChecked={(school?.placementType ?? "yerel") === value}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Eğitim şekli */}
          <fieldset>
            <legend className="mb-3 block text-sm font-semibold text-slate-700">
              Eğitim Şekli
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
                    className="h-4 w-4 accent-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Pansiyon */}
          <fieldset>
            <legend className="mb-3 block text-sm font-semibold text-slate-700">
              Pansiyon
            </legend>
            <div className="flex flex-wrap gap-4">
              {[
                { value: "yok", label: "Yok" },
                { value: "kiz_erkek", label: "Kız & Erkek" },
                { value: "kiz", label: "Kız" },
                { value: "erkek", label: "Erkek" },
              ].map(({ value, label }) => (
                <label key={value} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="boarding_type"
                    value={value}
                    defaultChecked={(school?.boardingType ?? "yok") === value}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Okul saatleri */}
          <div>
            <span className="mb-3 block text-sm font-semibold text-slate-700">
              Okul Saatleri
            </span>
            <div className="flex items-center gap-3">
              <input
                type="time"
                name="school_hours_start"
                defaultValue={school?.schoolHoursStart ?? ""}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
              <span className="text-sm text-slate-400">–</span>
              <input
                type="time"
                name="school_hours_end"
                defaultValue={school?.schoolHoursEnd ?? ""}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          {/* Okul saati notu (tam genişlik) */}
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Saat Notu (opsiyonel)
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
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900">İçerik Listeleri</h2>
          <p className="mt-1 text-sm text-slate-500">
            Her satıra bir madde veya virgülle ayırın.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Özellikler</span>
            <textarea
              name="features"
              defaultValue={school?.features?.join("\n") ?? ""}
              rows={5}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Diller</span>
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
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900">Yayın Durumu</h2>
          <p className="mt-1 text-sm text-slate-500">
            Pasif okullar listeye ve detay sayfasına yansımaz.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={school ? school.isActive !== false : true}
            className="h-4 w-4"
          />
          <span className="text-sm font-semibold text-slate-700">Yayında / Aktif</span>
        </label>
      </section>
    </div>
  );
}
