// Panelin ortak sınıf sözlüğü. Her ekran girişlerini, kartlarını ve odak
// halkasını buradan alır; sekmelerde kopya sınıf tanımı tutulmaz.
export const adminFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white";

// Genişliksiz taban: seçim kutuları içeriğe göre genişler, girişler tam genişlik alır.
// (Tailwind'de sınıf sırası önceliği belirlemez; w-full ile w-auto aynı dizede çakışır.)
export const adminControl =
  "min-h-10 rounded-lg border border-admin-line-strong bg-white px-3 py-2 text-sm text-admin-ink outline-none transition-colors duration-150 placeholder:text-admin-faint hover:border-admin-faint focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20 disabled:bg-admin-line-soft disabled:text-admin-muted";

export const adminInput = `${adminControl} w-full`;

export const adminLabel = "mb-1.5 block text-[13px] font-semibold text-admin-body";

export const adminHint = "mt-1.5 block text-xs text-admin-muted";

export const adminCard = "rounded-xl border border-admin-line bg-white shadow-admin-card";
