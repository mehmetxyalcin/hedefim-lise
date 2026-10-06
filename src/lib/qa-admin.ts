// /admin/soru-cevap yönetim yüzeyinin saf yardımcıları: sekmeler, durum
// süzgeçleri ve adres kurma. Sunucu eylemleri ile sayfa aynı kuralları paylaşır;
// eylemler formdan gelen durumu burada doğrulayıp aynı görünüme geri yönlendirir.

export const QA_ADMIN_PATH = "/admin/soru-cevap";

export const QA_TABS = [
  { key: "sorular", label: "Sorular" },
  { key: "gelen", label: "Gelen sorular" },
  { key: "kategoriler", label: "Kategoriler" },
] as const;

export type QaTab = (typeof QA_TABS)[number]["key"];

export const SUBMISSION_FILTERS = [
  { key: "yeni", label: "Yeni", status: "new" },
  { key: "yanitlanan", label: "Yanıtlanan", status: "answered" },
  { key: "reddedilen", label: "Reddedilen", status: "rejected" },
  { key: "tumu", label: "Tümü", status: null },
] as const;

export type SubmissionFilterKey = (typeof SUBMISSION_FILTERS)[number]["key"];

export type QaAdminState = {
  sekme?: QaTab;
  /** Gelen sorular süzgeci. */
  durum?: SubmissionFilterKey;
  /** Seçili gelen soru (id). */
  soru?: string;
  /** Sorular sekmesi: arama metni. */
  ara?: string;
  /** Sorular sekmesi: kategori id. */
  kategori?: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseTab(value: unknown): QaTab | null {
  return QA_TABS.find((tab) => tab.key === value)?.key ?? null;
}

export function parseFilter(value: unknown): SubmissionFilterKey | null {
  return SUBMISSION_FILTERS.find((filter) => filter.key === value)?.key ?? null;
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

/** Yalnız bilinen parametreleri, geçerli değerlerle tutar. */
export function cleanState(input: Record<string, unknown>): QaAdminState {
  const state: QaAdminState = {};
  const sekme = parseTab(input.sekme);
  if (sekme) state.sekme = sekme;
  const durum = parseFilter(input.durum);
  if (durum) state.durum = durum;
  if (isUuid(input.soru)) state.soru = input.soru;
  if (isUuid(input.kategori)) state.kategori = input.kategori;
  if (typeof input.ara === "string" && input.ara.trim()) state.ara = input.ara.trim().slice(0, 100);
  return state;
}

/** Formun gizli alanlarından (ReturnFields) dönülecek görünümü okur. */
export function readReturnState(form: FormData): QaAdminState {
  return cleanState({
    sekme: form.get("sekme"),
    durum: form.get("durum"),
    soru: form.get("soru"),
    ara: form.get("ara"),
    kategori: form.get("kategori"),
  });
}

type Flash = { success?: string; error?: string };

export function qaAdminHref(state: QaAdminState = {}, flash: Flash = {}): string {
  const pairs: [string, string | undefined][] = [
    ["sekme", state.sekme],
    ["durum", state.durum],
    ["soru", state.soru],
    ["ara", state.ara],
    ["kategori", state.kategori],
    ["success", flash.success],
    ["error", flash.error],
  ];
  // encodeURIComponent: boşluk %20 olur (URLSearchParams'ın "+" biçimi değil).
  const search = pairs
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
    .join("&");
  return `${QA_ADMIN_PATH}${search ? `?${search}` : ""}`;
}
