// Soru-cevap merkezinin saf kuralları: arama, gruplama, adres üretimi ve
// ziyaretçi sorusu doğrulaması. Veritabanına dokunmaz; hem sunucu hem tarayıcı
// tarafında ve testlerde kullanılır.

import type { Faq, FaqCategory } from "@/types/faq";

export const QUESTION_MIN = 10;
export const QUESTION_MAX = 300;
export const NICKNAME_MAX = 40;
export const NOTE_MAX = 600;
export const ANSWER_MAX = 6000;

/** /soru-cevap altında sabit sayfaların adresleri; kategori adresi olamaz. */
export const RESERVED_CATEGORY_SLUGS: readonly string[] = ["sor", "takip"];

/** Takip anahtarı: 64 küçük onaltılık karakter. */
export const TOKEN_PATTERN = /^[0-9a-f]{64}$/;

/** Tarayıcıda "Sorduklarım" listesinin saklandığı anahtar. */
export const MY_QUESTIONS_STORAGE_KEY = "hedefim:sorularim";

export function foldTr(value: string): string {
  return value
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function slugifyQuestion(value: string): string {
  return foldTr(value).replace(/ /g, "-").slice(0, 90).replace(/-+$/g, "") || "soru";
}

/** Var olan adreslerle çakışmayan bir adres: soru, soru-2, soru-3 … */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; ; n += 1) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
}

// Aramada anlam taşımayan sık kelimeler. Kısa tutuldu: "okul", "puan" gibi
// alan kelimeleri bilerek dışarıda değil.
const STOP_WORDS = new Set([
  "ve", "ile", "mi", "mu", "mı", "mü", "bir", "bu", "su", "o", "ne", "nasil",
  "neden", "icin", "de", "da", "ki", "ya", "veya", "hangi", "kac", "olur",
  "var", "yok", "mi", "midir", "nedir", "ben", "benim", "acaba",
].map(foldTr));

export function searchTerms(query: string): string[] {
  const folded = foldTr(query);
  if (!folded) return [];
  const terms = [...new Set(folded.split(" ").filter(Boolean))];
  const meaningful = terms.filter((term) => !STOP_WORDS.has(term) && term.length > 1);
  return meaningful.length > 0 ? meaningful : terms;
}

export type FaqSearchHit = { faq: Faq; score: number };

type Indexed = { faq: Faq; question: string; answer: string; category: string; order: number };

export function indexFaqs(faqs: Faq[]): Indexed[] {
  return faqs.map((faq, order) => ({
    faq,
    order,
    question: foldTr(faq.question),
    answer: foldTr(faq.answer),
    category: foldTr(faq.category),
  }));
}

/**
 * Tüm terimler sorunun, yanıtın ya da kategorinin bir yerinde geçmeli
 * (kelime başı eşleşmesi; "tercih" → "tercihler" bulur, "rci" bulmaz).
 * Soruda geçen terim yanıtta geçenden çok daha değerlidir.
 */
export function searchFaqs(index: Indexed[], query: string, limit = Infinity): FaqSearchHit[] {
  const terms = searchTerms(query);
  if (terms.length === 0) return [];
  const phrase = foldTr(query);
  const hits: (FaqSearchHit & { order: number })[] = [];

  for (const item of index) {
    const haystack = ` ${item.question} ${item.answer} ${item.category}`;
    if (!terms.every((term) => haystack.includes(` ${term}`))) continue;
    let score = item.question.includes(phrase) ? 100 : 0;
    for (const term of terms) {
      if (` ${item.question}`.includes(` ${term}`)) score += 10;
      else if (` ${item.category}`.includes(` ${term}`)) score += 4;
      else score += 2;
    }
    if (item.faq.isFeatured) score += 1;
    hits.push({ faq: item.faq, score, order: item.order });
  }

  return hits
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map(({ faq, score }) => ({ faq, score }));
}

/**
 * Ziyaretçi soru yazarken gösterilen "benzer sorular". Tüm terimlerin geçmesi
 * şart değil; tek bir ayırt edici terim yeter. Soruların yarısından çoğunda
 * geçen terimler ("okul", "tercih") tek başına öneri üretmez, yalnız sıralamaya
 * katkı verir. Soruda geçen terim yanıtta geçenden ağır basar.
 */
export function similarFaqs(index: Indexed[], text: string, limit = 4): Faq[] {
  const terms = searchTerms(text).filter((term) => term.length > 2);
  if (terms.length === 0 || index.length === 0) return [];
  const docs = index.map((item) => ({ item, question: ` ${item.question}`, body: ` ${item.answer}` }));
  const common = new Set(
    terms.filter(
      (term) =>
        docs.filter((doc) => doc.question.includes(` ${term}`) || doc.body.includes(` ${term}`)).length >
        index.length / 2,
    ),
  );
  const scored: { faq: Faq; score: number; order: number }[] = [];
  for (const { item, question, body } of docs) {
    let distinctive = 0;
    let matched = 0;
    let score = 0;
    for (const term of terms) {
      const inQuestion = question.includes(` ${term}`);
      if (!inQuestion && !body.includes(` ${term}`)) continue;
      matched += 1;
      if (!common.has(term)) distinctive += 1;
      score += (inQuestion ? 3 : 1) * (common.has(term) ? 1 : 2);
    }
    if (distinctive >= 1 || matched >= 3) scored.push({ faq: item.faq, score, order: item.order });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map(({ faq }) => faq);
}

/** Bir metinde arama terimlerinin geçtiği aralıklar (vurgulama için). */
export function highlightRanges(text: string, terms: string[]): [number, number][] {
  if (terms.length === 0) return [];
  // Katlanmış metinle özgün metin aynı uzunlukta olmayabilir; harf harf eşle.
  const chars = [...text];
  const folded = chars.map((ch) => foldTr(ch) || " ");
  const flat = folded.join("");
  const offsets: number[] = [];
  let pos = 0;
  for (const piece of folded) { offsets.push(pos); pos += piece.length; }
  const indexAt = (flatIndex: number) => {
    let i = 0;
    while (i + 1 < offsets.length && offsets[i + 1] <= flatIndex) i += 1;
    return i;
  };
  const ranges: [number, number][] = [];
  for (const term of terms) {
    let from = 0;
    for (;;) {
      const at = flat.indexOf(term, from);
      if (at === -1) break;
      const startsWord = at === 0 || flat[at - 1] === " ";
      if (startsWord) {
        const start = indexAt(at);
        const end = indexAt(at + term.length - 1) + 1;
        ranges.push([start, end]);
      }
      from = at + term.length;
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const range of ranges) {
    const last = merged.at(-1);
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }
  // Aralıklar kod noktası (Array.from) indeksidir; dizeye dönüştürürken
  // [...text].slice(start, end).join("") kullanılmalı.
  return merged;
}

export type CategoryGroup = { category: FaqCategory; faqs: Faq[] };

/** Kategorileri sırasıyla, içlerindeki sorularla döndürür; boş kategoriler atılır. */
export function groupByCategory(categories: FaqCategory[], faqs: Faq[]): CategoryGroup[] {
  const byId = new Map<string, Faq[]>();
  for (const faq of faqs) {
    if (!faq.categoryId) continue;
    const list = byId.get(faq.categoryId) ?? [];
    list.push(faq);
    byId.set(faq.categoryId, list);
  }
  return categories
    .map((category) => ({ category, faqs: byId.get(category.id) ?? [] }))
    .filter((group) => group.faqs.length > 0);
}

export type SubmissionInput = {
  question: string;
  categoryId: string;
  nickname: string;
};

export type SubmissionCheck =
  | { ok: true; value: { question: string; categoryId: string | null; nickname: string | null } }
  | { ok: false; field: keyof SubmissionInput; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Telefon numarası ya da e-posta paylaşımını engelle: soru herkese açık
// olabilir ve soranların çoğu reşit değil.
const PHONE = /(?:\+?90[\s-]?)?0?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/;
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;

export function checkSubmission(input: SubmissionInput): SubmissionCheck {
  const question = input.question.replace(/\s+/g, " ").trim();
  const nickname = input.nickname.replace(/\s+/g, " ").trim();
  const categoryId = input.categoryId.trim();

  if (question.length < QUESTION_MIN)
    return { ok: false, field: "question", error: `Sorun en az ${QUESTION_MIN} karakter olmalı.` };
  if (question.length > QUESTION_MAX)
    return { ok: false, field: "question", error: `Sorun en fazla ${QUESTION_MAX} karakter olabilir.` };
  if (nickname.length > NICKNAME_MAX)
    return { ok: false, field: "nickname", error: `Rumuz en fazla ${NICKNAME_MAX} karakter olabilir.` };
  for (const [field, value] of [["question", question], ["nickname", nickname]] as const) {
    if (PHONE.test(value) || EMAIL.test(value))
      return { ok: false, field, error: "Telefon numarası ya da e-posta adresi yazma; yanıtı takip bağlantından göreceksin." };
  }
  if (categoryId && !UUID.test(categoryId))
    return { ok: false, field: "categoryId", error: "Listeden bir konu seç." };

  return {
    ok: true,
    value: {
      question,
      categoryId: categoryId || null,
      nickname: nickname || null,
    },
  };
}
