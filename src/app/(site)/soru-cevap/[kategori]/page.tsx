import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getQaContent } from "@/lib/faqs";
import { groupByCategory } from "@/lib/qa";
import { getSiteUrlWithPath } from "@/lib/site";
import { cn } from "@/lib/cn";
import { DT, FOCUS, TEXT_ACTION } from "@/components/school/doc-styles";
import { FaqItem } from "@/components/qa/FaqItem";
import { HashOpener } from "@/components/qa/HashOpener";
import { AskPrompt, SourceNote } from "@/components/qa/QaKunye";
import { answerText, QA_ASK } from "@/components/qa/qa-format";

// İlk istekte üretilir ve önbellekte kalır; yönetim eylemleri "faqs"
// etiketini tazeler. Bu süre hiçbir eylem tetiklenmediğinde geçerli tavan.
export const revalidate = 300;

type PageProps = {
  params: Promise<{ kategori: string }>;
};

/** Yayındaki, içinde soru olan kategoriler; boş kategorinin sayfası yok. */
async function loadCategory(slug: string) {
  const { categories, faqs } = await getQaContent();
  const groups = groupByCategory(categories, faqs);
  return { groups, group: groups.find((item) => item.category.slug === slug) ?? null };
}

export async function generateStaticParams() {
  const { categories, faqs } = await getQaContent();
  return groupByCategory(categories, faqs).map(({ category }) => ({ kategori: category.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { kategori } = await params;
  const { group } = await loadCategory(kategori);
  if (!group) return { title: "Konu bulunamadı", robots: { index: false, follow: false } };

  const { category, faqs } = group;
  const path = `/soru-cevap/${category.slug}`;
  const description =
    category.description?.trim() ||
    `${category.title} hakkında sık sorulan ${faqs.length} soru ve yanıtı.`;
  return {
    title: `${category.title} · Soru-Cevap`,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${category.title} · Soru-Cevap | Hedefim Lise`,
      description,
      url: path,
    },
  };
}


// Kategori sayfası hub'ın dizininin devamı: başlık ve dek, hairline'ın altında
// 8 sütun soru paneli (her soru kendi çapasıyla açılır), 4 sütun künye.
export default async function SoruCevapKategoriPage({ params }: PageProps) {
  const { kategori } = await params;
  const { groups, group } = await loadCategory(kategori);
  if (!group) notFound();

  const { category, faqs } = group;
  const url = getSiteUrlWithPath(`/soru-cevap/${category.slug}`);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      url,
      name: `${category.title} · Soru-Cevap`,
      inLanguage: "tr-TR",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        url: `${url}#${faq.slug}`,
        acceptedAnswer: { "@type": "Answer", text: answerText(faq.answer) },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Soru-Cevap", item: getSiteUrlWithPath("/soru-cevap") },
        { "@type": "ListItem", position: 2, name: category.title, item: url },
      ],
    },
  ];

  return (
    <div className="landing">
      <script
        type="application/ld+json"
        // JSON-LD'de "<" kaçırılır; soru ya da yanıt metni script bloğunu kapatamaz.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <HashOpener />

      <section className="container mx-auto max-w-6xl px-4 pt-6 pb-8 sm:px-6 md:pt-8">
        <nav aria-label="Konum">
          <Link href="/soru-cevap" className={TEXT_ACTION}>
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Soru-cevap
          </Link>
        </nav>
        <div className="mt-5 grid gap-5 lg:grid-cols-12 lg:items-end lg:gap-12">
          <h1 className="font-display text-[clamp(2.25rem,5vw,4rem)] leading-[1.04] font-extrabold tracking-[-0.02em] text-balance text-[var(--ink)] lg:col-span-7">
            {category.title}
          </h1>
          {category.description && (
            <p className="max-w-xl text-lg leading-relaxed text-[var(--ink-soft)] md:text-xl lg:col-span-5 lg:pb-2">
              {category.description}
            </p>
          )}
        </div>
      </section>

      <div className="border-t border-[var(--line)]">
        <div className="container mx-auto grid max-w-6xl gap-12 px-4 pt-8 pb-16 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:pb-20">
          <section
            aria-labelledby="sorular-baslik"
            className="min-w-0 self-start rounded-2xl border border-[var(--line)] bg-[var(--doc-panel)] shadow-sm lg:col-span-8"
          >
            <h2 id="sorular-baslik" className="sr-only">
              {category.title}: sorular ve yanıtlar
            </h2>
            <ol className="divide-y divide-[color-mix(in_srgb,var(--line)_70%,transparent)] px-2 py-1 sm:px-3">
              {faqs.map((faq) => (
                <li key={faq.id}>
                  <FaqItem faq={faq} categorySlug={category.slug} anchor />
                </li>
              ))}
            </ol>
            <div className="flex flex-col gap-2 border-t border-[var(--line)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-[15px] text-[var(--ink-soft)]">Sorun bunların arasında yok mu?</p>
              <Link href={QA_ASK} className={cn(TEXT_ACTION, "shrink-0")}>
                Bize sor
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </section>

          <aside className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
            <nav aria-labelledby="konular-baslik" className="border-t border-[var(--ink)] pt-5 pb-5">
              <h2 id="konular-baslik" className={DT}>
                Bütün konular
              </h2>
              <ul className="mt-2">
                {groups.map(({ category: item }) => {
                  const current = item.id === category.id;
                  return (
                    <li key={item.id}>
                      <Link
                        href={`/soru-cevap/${item.slug}`}
                        aria-current={current ? "page" : undefined}
                        className={cn(
                          "group relative -mx-2 flex items-baseline justify-between gap-4 rounded-lg px-2 py-2 transition-colors hover:bg-[var(--doc-panel)]",
                          FOCUS,
                        )}
                      >
                        {current && (
                          <span
                            aria-hidden="true"
                            className="absolute top-2 bottom-2 left-0 w-[2px] rounded-full bg-[var(--vermilion)]"
                          />
                        )}
                        <span
                          className={cn(
                            "font-display text-[15px] leading-snug font-bold transition-colors group-hover:text-[var(--teal)]",
                            current ? "text-[var(--ink)]" : "text-[var(--ink-soft)]",
                          )}
                        >
                          {item.title}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <AskPrompt />
            <SourceNote />
          </aside>
        </div>
      </div>
    </div>
  );
}
