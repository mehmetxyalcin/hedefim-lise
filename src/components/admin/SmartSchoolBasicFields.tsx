"use client";

import { useMemo, useState } from "react";
import { DISTRICTS } from "@/data/districts";
import { SCHOOL_TYPES } from "@/data/schoolTypes";
import { adminInput } from "@/components/admin/ui/styles";

type SmartSchoolBasicFieldsProps = {
  initialColor?: string;
  initialDistrict?: string;
  initialInstitutionCode?: string;
  initialLogo?: string;
  initialName?: string;
  initialSlug?: string;
  initialType?: string;
};

const inputClassName = adminInput;

const errorInputClassName =
  "min-h-10 w-full rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-admin-ink outline-none transition-colors duration-150 placeholder:text-admin-faint focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20";

function slugify(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function getRequiredError(value: string, label: string) {
  return value.trim() ? "" : `${label} zorunludur.`;
}

function getSlugError(value: string) {
  if (!value.trim()) {
    return "Slug zorunludur.";
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    return "Slug sadece küçük harf, rakam ve tire içermelidir.";
  }

  return "";
}

export function SmartSchoolBasicFields({
  initialColor = "bg-gradient-to-br from-slate-700 to-slate-900",
  initialDistrict = "",
  initialInstitutionCode = "",
  initialLogo = "",
  initialName = "",
  initialSlug = "",
  initialType = "",
}: SmartSchoolBasicFieldsProps) {
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [institutionCode, setInstitutionCode] = useState(initialInstitutionCode);
  const [type, setType] = useState(initialType);
  const [district, setDistrict] = useState(initialDistrict);
  const [logo, setLogo] = useState(initialLogo);
  const [color, setColor] = useState(initialColor);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialSlug));
  const [touchedFields, setTouchedFields] = useState<Set<string>>(() => new Set());

  const generatedSlug = useMemo(() => slugify(name), [name]);
  const errors = {
    color: getRequiredError(color, "Renk sınıfı"),
    district: getRequiredError(district, "İlçe"),
    logo: getRequiredError(logo, "Logo / kısa kod"),
    name: getRequiredError(name, "Okul adı"),
    slug: getSlugError(slug),
    type: getRequiredError(type, "Tür"),
  };

  function markTouched(field: string) {
    setTouchedFields((current) => new Set(current).add(field));
  }

  function shouldShowError(field: keyof typeof errors) {
    return touchedFields.has(field) && Boolean(errors[field]);
  }

  function updateName(value: string) {
    setName(value);

    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function regenerateSlug() {
    setSlug(generatedSlug);
    setSlugTouched(false);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-admin-body">
          Okul adı
        </span>
        <input
          name="name"
          value={name}
          onBlur={() => markTouched("name")}
          onChange={(event) => updateName(event.target.value)}
          onInvalid={() => markTouched("name")}
          required
          className={shouldShowError("name") ? errorInputClassName : inputClassName}
        />
        {shouldShowError("name") && (
          <span className="mt-2 block text-xs font-medium text-rose-600">
            {errors.name}
          </span>
        )}
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-admin-body">
          Kurum kodu
        </span>
        <input
          name="institution_code"
          value={institutionCode}
          onChange={(event) => setInstitutionCode(event.target.value)}
          placeholder="Örn: 733521"
          className={inputClassName}
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-admin-body">Slug</span>
        <input
          name="slug"
          value={slug}
          onBlur={() => markTouched("slug")}
          onChange={(event) => {
            setSlug(slugify(event.target.value));
            setSlugTouched(true);
          }}
          onInvalid={() => markTouched("slug")}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          required
          title="Slug sadece küçük harf, rakam ve tire içermelidir."
          className={shouldShowError("slug") ? errorInputClassName : inputClassName}
        />
        {shouldShowError("slug") ? (
          <span className="mt-2 block text-xs font-medium text-rose-600">
            {errors.slug}
          </span>
        ) : (
          <span className="mt-2 block text-xs text-admin-muted">
            Sitedeki adres: /okullar/{slug || "slug"}
          </span>
        )}
        <button
          type="button"
          onClick={regenerateSlug}
          disabled={!generatedSlug}
          className="mt-2 text-xs font-bold text-admin-accent hover:text-admin-accent-deep disabled:cursor-not-allowed disabled:text-admin-faint"
        >
          Okul adından yeniden oluştur
        </button>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-admin-body">Tür</span>
        <select
          name="type"
          value={type}
          onBlur={() => markTouched("type")}
          onChange={(event) => setType(event.target.value)}
          required
          className={shouldShowError("type") ? errorInputClassName : inputClassName}
        >
          <option value="">— Seçin —</option>
          {SCHOOL_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {shouldShowError("type") && (
          <span className="mt-2 block text-xs font-medium text-rose-600">
            {errors.type}
          </span>
        )}
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-admin-body">İlçe</span>
        <select
          name="district"
          value={district}
          onBlur={() => markTouched("district")}
          onChange={(event) => setDistrict(event.target.value)}
          required
          className={shouldShowError("district") ? errorInputClassName : inputClassName}
        >
          <option value="">— Seçin —</option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        {shouldShowError("district") && (
          <span className="mt-2 block text-xs font-medium text-rose-600">
            {errors.district}
          </span>
        )}
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-admin-body">
          Logo / kısa kod
        </span>
        <input
          name="logo"
          value={logo}
          onBlur={() => markTouched("logo")}
          onChange={(event) => setLogo(event.target.value)}
          onInvalid={() => markTouched("logo")}
          required
          className={shouldShowError("logo") ? errorInputClassName : inputClassName}
        />
        {shouldShowError("logo") && (
          <span className="mt-2 block text-xs font-medium text-rose-600">
            {errors.logo}
          </span>
        )}
      </label>

      <label className="block md:col-span-2">
        <span className="mb-2 block text-sm font-semibold text-admin-body">
          Renk sınıfı
        </span>
        <input
          name="color"
          value={color}
          onBlur={() => markTouched("color")}
          onChange={(event) => setColor(event.target.value)}
          onInvalid={() => markTouched("color")}
          required
          className={shouldShowError("color") ? errorInputClassName : inputClassName}
        />
        {shouldShowError("color") && (
          <span className="mt-2 block text-xs font-medium text-rose-600">
            {errors.color}
          </span>
        )}
      </label>
    </div>
  );
}
