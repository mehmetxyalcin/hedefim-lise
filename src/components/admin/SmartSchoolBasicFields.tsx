"use client";

import { useMemo, useState } from "react";

type SmartSchoolBasicFieldsProps = {
  initialColor?: string;
  initialDistrict?: string;
  initialLogo?: string;
  initialName?: string;
  initialPercentile?: string;
  initialSlug?: string;
  initialType?: string;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const errorInputClassName =
  "w-full rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10";

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
    .replace(/[\u0300-\u036f]/g, "")
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

function getPercentileError(value: string) {
  const normalized = value.trim().replace(",", ".");

  if (!normalized) {
    return "Yüzdelik zorunludur.";
  }

  if (!/^(?:100(?:\.0{1,2})?|\d{1,2}(?:\.\d{1,2})?)$/.test(normalized)) {
    return "Yüzdelik 0-100 arasında sayı olmalıdır. Örn: 2.15";
  }

  const numericValue = Number(normalized);

  if (Number.isNaN(numericValue) || numericValue < 0 || numericValue > 100) {
    return "Yüzdelik 0 ile 100 arasında olmalıdır.";
  }

  return "";
}

export function SmartSchoolBasicFields({
  initialColor = "bg-gradient-to-br from-slate-700 to-slate-900",
  initialDistrict = "",
  initialLogo = "",
  initialName = "",
  initialPercentile = "",
  initialSlug = "",
  initialType = "",
}: SmartSchoolBasicFieldsProps) {
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [type, setType] = useState(initialType);
  const [district, setDistrict] = useState(initialDistrict);
  const [percentile, setPercentile] = useState(initialPercentile);
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
    percentile: getPercentileError(percentile),
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
        <span className="mb-2 block text-sm font-semibold text-slate-700">
          Okul Adı
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
        <span className="mb-2 block text-sm font-semibold text-slate-700">Slug</span>
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
          <span className="mt-2 block text-xs text-slate-500">
            Public URL: /okullar/{slug || "slug"}
          </span>
        )}
        <button
          type="button"
          onClick={regenerateSlug}
          disabled={!generatedSlug}
          className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          Okul adından yeniden oluştur
        </button>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Tür</span>
        <input
          name="type"
          value={type}
          onBlur={() => markTouched("type")}
          onChange={(event) => setType(event.target.value)}
          onInvalid={() => markTouched("type")}
          required
          className={shouldShowError("type") ? errorInputClassName : inputClassName}
        />
        {shouldShowError("type") && (
          <span className="mt-2 block text-xs font-medium text-rose-600">
            {errors.type}
          </span>
        )}
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">İlçe</span>
        <input
          name="district"
          value={district}
          onBlur={() => markTouched("district")}
          onChange={(event) => setDistrict(event.target.value)}
          onInvalid={() => markTouched("district")}
          required
          className={shouldShowError("district") ? errorInputClassName : inputClassName}
        />
        {shouldShowError("district") && (
          <span className="mt-2 block text-xs font-medium text-rose-600">
            {errors.district}
          </span>
        )}
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">
          Yüzdelik
        </span>
        <input
          name="percentile"
          value={percentile}
          inputMode="decimal"
          onBlur={() => {
            markTouched("percentile");
            setPercentile((current) => current.trim().replace(",", "."));
          }}
          onChange={(event) => setPercentile(event.target.value)}
          onInvalid={() => markTouched("percentile")}
          pattern="(?:100([,.]0{1,2})?|\d{1,2}([,.]\d{1,2})?)"
          placeholder="Örn: 2.15"
          required
          title="Yüzdelik 0-100 arasında sayı olmalıdır. Örn: 2.15"
          className={
            shouldShowError("percentile") ? errorInputClassName : inputClassName
          }
        />
        {shouldShowError("percentile") ? (
          <span className="mt-2 block text-xs font-medium text-rose-600">
            {errors.percentile}
          </span>
        ) : (
          <span className="mt-2 block text-xs text-slate-500">
            0-100 arasında sayısal değer girin. Virgül otomatik noktaya çevrilir.
          </span>
        )}
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">
          Logo / Kısa Kod
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
        <span className="mb-2 block text-sm font-semibold text-slate-700">
          Renk Sınıfı
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
