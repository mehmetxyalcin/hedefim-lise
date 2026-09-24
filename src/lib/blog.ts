// Blogun saf kuralları: slug, okuma süresi, tarih, yayın durumu, kategori
// tonu, arama ve sayfalama. Veri erişimi ve React içermez; testler bu
// dosyayı doğrudan yükler.

export type BlogPostState = "taslak" | "zamanlanmis" | "yayinda";

export type PlateTone = "lemon" | "ink" | "paper";

type Datable = { isPublished: boolean; publishedAt: string | null };

// Türkiye 2016'dan beri yıl boyu UTC+3; yaz saati yok. Yönetim formundaki
// datetime-local değeri bu saat diliminde okunur ve yazılır.
const ISTANBUL_OFFSET = "+03:00";
const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;

const FOLD: Record<string, string> = {
  ı: "i", ş: "s", ğ: "g", ü: "u", ö: "o", ç: "c", â: "a", î: "i", û: "u",
};

/** Türkçe büyük/küçük harf ve şapka farkını yok sayan karşılaştırma biçimi. */
export function foldTurkish(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/[ışğüöçâîû]/g, (ch) => FOLD[ch] ?? ch)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function slugifyTr(value: string): string {
  return foldTurkish(value.trim())
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Dakika cinsinden okuma süresi. Okurların çoğu 8. sınıf öğrencisi ve veli;
 * bilgilendirici Türkçe metin için dakikada ~180 kelime alınır, yukarı yuvarlanır.
 */
export function readingMinutes(body: string): number {
  const words = body
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#>*_=|`[\]()-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

export function postState(post: Datable, now: Date = new Date()): BlogPostState {
  if (!post.isPublished || !post.publishedAt) return "taslak";
  return new Date(post.publishedAt).getTime() > now.getTime() ? "zamanlanmis" : "yayinda";
}

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

const shortDateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

export function formatBlogDate(iso: string | null): string {
  return iso ? dateFormatter.format(new Date(iso)) : "";
}

export function formatBlogDateShort(iso: string | null): string {
  return iso ? shortDateFormatter.format(new Date(iso)) : "";
}

/** ISO zamanı, İstanbul saatinde `YYYY-MM-DDTHH:mm` (datetime-local) olarak verir. */
export function toIstanbulInput(iso: string | null): string {
  if (!iso) return "";
  const shifted = new Date(new Date(iso).getTime() + ISTANBUL_OFFSET_MS);
  return shifted.toISOString().slice(0, 16);
}

/** datetime-local değerini İstanbul saati kabul edip ISO'ya çevirir; geçersizse null. */
export function fromIstanbulInput(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00${ISTANBUL_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// Kategoriler mürekkep ya da kâğıt tonunu taşır; bilinenler sabit, yenileri
// adlarından türetilir. Limon kategoriye verilmez: sayfadaki tek spot renk
// olarak öne çıkan yazının plakasına ve vurgulara ayrılmıştır.
const KNOWN_TONES: Record<string, PlateTone> = {
  "tercih islemleri": "paper",
  yerlestirme: "ink",
  "nakil islemleri": "paper",
  "ozel durumlar": "ink",
  "pansiyon ve kayit": "ink",
  "okul secimi": "paper",
  genel: "ink",
};

const TONES: PlateTone[] = ["ink", "paper"];

export function plateTone(category: string): PlateTone {
  const key = foldTurkish(category.trim());
  if (KNOWN_TONES[key]) return KNOWN_TONES[key];
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length];
}

export function categoryParam(category: string): string {
  return slugifyTr(category);
}

export type CategoryCount = { name: string; param: string; count: number };

export function categoriesOf(posts: { category: string }[]): CategoryCount[] {
  const counts = new Map<string, CategoryCount>();
  for (const post of posts) {
    const param = categoryParam(post.category);
    const entry = counts.get(param);
    if (entry) entry.count += 1;
    else counts.set(param, { name: post.category, param, count: 1 });
  }
  return [...counts.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, "tr-TR"),
  );
}

type Searchable = { title: string; excerpt: string; body: string; category: string };

export function filterPosts<T extends Searchable>(
  posts: T[],
  { kategori = "", ara = "" }: { kategori?: string; ara?: string },
): T[] {
  const terms = foldTurkish(ara).split(/\s+/).filter(Boolean);
  return posts.filter((post) => {
    if (kategori && categoryParam(post.category) !== kategori) return false;
    if (!terms.length) return true;
    const haystack = foldTurkish(`${post.title} ${post.excerpt} ${post.category} ${post.body}`);
    return terms.every((term) => haystack.includes(term));
  });
}

export function pageCount(total: number, size: number): number {
  return Math.max(1, Math.ceil(total / size));
}

/** Sayfa parametresini 1..son aralığına sıkıştırır; bozuk değer 1 olur. */
export function clampPage(raw: string | undefined, total: number, size: number): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) return 1;
  return Math.min(value, pageCount(total, size));
}

export function truncate(value: string, max: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1).trimEnd()}…`;
}

/** Aynı kategoriden, yoksa en yeni yazılardan en fazla `limit` öneri. */
export function relatedPosts<T extends { id: string; category: string }>(
  current: T,
  posts: T[],
  limit = 3,
): T[] {
  const others = posts.filter((post) => post.id !== current.id);
  const same = others.filter((post) => post.category === current.category);
  const rest = others.filter((post) => post.category !== current.category);
  return [...same, ...rest].slice(0, limit);
}

export type TextSegment = { text: string; match: boolean };

/**
 * Metni arama terimlerine göre parçalar (Türkçe harf farkı gözetmeden).
 * Katlama karakter sayısını değiştirirse konumlar kayar; o durumda vurgu
 * yapılmaz, metin tek parça döner.
 */
export function highlightSegments(text: string, query: string): TextSegment[] {
  const terms = foldTurkish(query).split(/\s+/).filter((term) => term.length >= 2);
  const folded = foldTurkish(text);
  if (!terms.length || folded.length !== text.length) return [{ text, match: false }];

  const marked = new Array<boolean>(text.length).fill(false);
  for (const term of terms) {
    for (let at = folded.indexOf(term); at !== -1; at = folded.indexOf(term, at + term.length)) {
      marked.fill(true, at, at + term.length);
    }
  }

  const segments: TextSegment[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = segments.at(-1);
    if (last && last.match === marked[i]) last.text += text[i];
    else segments.push({ text: text[i], match: marked[i] });
  }
  return segments;
}
