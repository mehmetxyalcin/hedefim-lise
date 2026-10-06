// Soru-cevap yüzeyinin ortak, saf yardımcıları: kaynak notu, tarih biçimi,
// yanıtın düz metni (JSON-LD için). React içermez; sunucu ve tarayıcı
// bileşenleri birlikte kullanır.

import { inlineText, parseMarkdown, type Block } from "@/lib/blog-markdown";
import type { Faq } from "@/types/faq";

export const GUIDE_TITLE = "2026 Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu";

/** Soru-cevap ana sayfası, sorma formu ve takip adresleri. */
export const QA_HOME = "/soru-cevap";
export const QA_ASK = "/soru-cevap/sor";
export const trackHref = (token: string) => `/soru-cevap/takip/${token}`;
export const askHref = (text: string) => {
  const q = text.trim().slice(0, 300);
  return q ? `${QA_ASK}?q=${encodeURIComponent(q)}` : QA_ASK;
};

const dateFormat = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});
const shortDateFormat = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Istanbul",
});

export function formatQaDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : dateFormat.format(date);
}

export function formatQaDateShort(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : shortDateFormat.format(date);
}

/** "Kaynak: … , s. 14" — yalnız sayfa bilgisi olan sorularda. */
export function sourceNote(faq: Pick<Faq, "sourcePage" | "sourceTitle">): string | null {
  if (faq.sourcePage == null) return null;
  const title = faq.sourceTitle?.trim() || GUIDE_TITLE;
  return `Kaynak: ${title}, s. ${faq.sourcePage}`;
}

/** Yanıt bloklarının düz metni: arama motoru (FAQPage) ve kısa özetler için. */
export function blocksToText(blocks: Block[]): string {
  const parts: string[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case "heading":
      case "paragraph":
        parts.push(inlineText(block.children));
        break;
      case "list":
        parts.push(block.items.map((item) => `• ${inlineText(item)}`).join("\n"));
        break;
      case "quote":
      case "callout":
        parts.push(block.paragraphs.map(inlineText).join("\n"));
        break;
      case "table":
        parts.push(
          [block.head, ...block.rows].map((row) => row.map(inlineText).join(" · ")).join("\n"),
        );
        break;
      case "image":
        if (block.alt) parts.push(block.alt);
        break;
      case "rule":
        break;
    }
  }
  return parts.filter(Boolean).join("\n\n");
}

export function answerText(answer: string): string {
  return blocksToText(parseMarkdown(answer));
}
