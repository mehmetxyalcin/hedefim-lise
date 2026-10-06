import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getQaContent } from "@/lib/faqs";
import { groupByCategory } from "@/lib/qa";
import { faqHref, type Faq } from "@/types/faq";
import { DT, FOCUS, MICRO, SECTION_TITLE } from "@/components/school/doc-styles";
import { CommunityTag } from "@/components/qa/CommunityTag";
import { FaqItem } from "@/components/qa/FaqItem";
import { MyQuestions } from "@/components/qa/MyQuestions";
import { QaHubBody, type HubCategory } from "@/components/qa/QaHubBody";
import { AskPrompt, SourceNote } from "@/components/qa/QaKunye";
import { QA_ASK } from "@/components/qa/qa-format";

// Yönetim eylemleri "faqs" etiketini ve bu yolu tazeler; bu süre yalnızca
// hiçbir eylem tetiklenmediğinde geçerli olan tavan.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Soru-Cevap",
  description:
    "Lise tercihi, yerleştirme ve nakil hakkında sık sorulan sorular ve yanıtları. Aradığını bulamazsan sorunu sor, yanıtını takip bağlantınla gör.",
  alternates: { canonical: "/soru-cevap" },
  openGraph: {
    title: "Soru-Cevap | Hedefim Lise",
    description: "Lise tercihi, yerleştirme ve nakil hakkında sık sorulan sorular ve yanıtları.",
    url: "/soru-cevap",
  },
};

const pad = (n: number) => String(n).padStart(2, "0");

// Soru-cevap merkezi, anasayfanın belge dünyasında (.landing) durur: afiş
// başlık ve tek büyük arama, hairline'ın altında 8 sütun konu dizini ve öne
// çıkan sorular, yanında 4 sütun künye. Arama tarayıcıda yapılır.
export default async function SoruCevapPage() {
  const { categories, faqs } = await getQaContent();
  const groups = groupByCategory(categories, faqs);
  const visible = groups.flatMap((group) => group.faqs);
  const hubCategories: HubCategory[] = groups.map(({ category }) => ({
    id: category.id,
    slug: category.slug,
    title: category.title,
  }));
  const categoryOf = new Map(hubCategories.map((category) => [category.id, category]));

  const marked = visible.filter((faq) => faq.isFeatured);
  const featured = marked.length > 0 ? marked : groups.map((group) => group.faqs[0]);

  const community = visible
    .filter((faq) => faq.origin === "community")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const aside = (
    <>
      <dl>
        {visible.length > 0 && (
          <div className="border-t border-[var(--ink)] pt-5 pb-7">
            <dt className={DT}>Bu sayfada</dt>
            <dd className="mt-3">
              <span className="tabular font-display text-5xl leading-none font-extrabold tracking-tight text-[var(--ink)]">
                {visible.length}
              </span>
              <span className="ml-2 font-display text-lg font-bold text-[var(--ink)]">soru ve yanıt</span>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-soft)]">
                <span className="tabular">{groups.length}</span> konuda toplandı.
              </p>
            </dd>
          </div>
        )}
      </dl>

      <AskPrompt rule={visible.length === 0 ? "ink" : "line"} />

      <MyQuestions className="hidden lg:block" />

      {community.length > 0 && (
        <section aria-labelledby="ziyaretci-baslik" className="border-t border-[var(--line)] pt-5 pb-6">
          <h2 id="ziyaretci-baslik" className={DT}>
            Son yanıtlanan ziyaretçi soruları
          </h2>
          <ul className="mt-2 divide-y divide-[color-mix(in_srgb,var(--line)_70%,transparent)]">
            {community.map((faq) => (
              <CommunityRow key={faq.id} faq={faq} category={faq.categoryId ? categoryOf.get(faq.categoryId) : undefined} />
            ))}
          </ul>
        </section>
      )}

      <SourceNote />
    </>
  );

  return (
    <div className="landing">
      <section className="container mx-auto max-w-6xl px-4 pt-8 pb-7 sm:px-6 md:pt-10">
        <div className="grid gap-5 lg:grid-cols-12 lg:items-end lg:gap-12">
          <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.02] font-extrabold tracking-[-0.02em] text-balance text-[var(--ink)] lg:col-span-7">
            Sorunu yaz, <span className="text-[var(--teal)]">yanıtı bul.</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-[var(--ink-soft)] md:text-xl lg:col-span-5 lg:pb-2">
            Tercih, yerleştirme ve nakil hakkında merak ettiklerinin yanıtları burada.
            Bulamazsan bize sorabilirsin.
          </p>
        </div>
      </section>

      <QaHubBody faqs={visible} categories={hubCategories} aside={aside}>
        {groups.length === 0 ? (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--doc-panel)] p-6 shadow-sm sm:p-8">
            <p className="font-display text-xl font-bold text-[var(--ink)]">
              Soru-cevaplar şu anda yüklenemedi.
            </p>
            <p className="mt-2 text-[var(--ink-soft)]">
              Sayfayı biraz sonra yenile. Acil bir sorun varsa{" "}
              <Link
                href={QA_ASK}
                className={`rounded-sm font-semibold text-[var(--teal)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--teal)] ${FOCUS}`}
              >
                bize sorabilirsin
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            <section
              aria-labelledby="konular-baslik"
              className="rounded-2xl border border-[var(--line)] bg-[var(--doc-panel)] shadow-sm"
            >
              <div className="flex items-baseline justify-between gap-4 px-4 pt-5 pb-4 sm:px-5 sm:pt-6">
                <h2
                  id="konular-baslik"
                  className="font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] md:text-[1.75rem]"
                >
                  Konular
                </h2>
                <p className={`tabular ${MICRO}`}>
                  {groups.length} konu · {visible.length} soru
                </p>
              </div>
              <div
                aria-hidden="true"
                className={`flex justify-between border-t border-[var(--line)] px-4 pt-3 pb-1 sm:px-5 ${MICRO}`}
              >
                <span>No · konu</span>
                <span>Soru</span>
              </div>
              <ol className="divide-y divide-[color-mix(in_srgb,var(--line)_70%,transparent)] px-2 pb-2 sm:px-3">
                {groups.map(({ category, faqs: list }, i) => (
                  <li key={category.id}>
                    <Link
                      href={`/soru-cevap/${category.slug}`}
                      className={`group grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-start gap-x-3 rounded-lg px-2 py-4 transition-colors hover:bg-[var(--doc-ground)] sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:gap-x-4 ${FOCUS}`}
                    >
                      <span aria-hidden="true" className="tabular pt-[6px] font-mono text-[11px] font-medium text-[var(--ink-faint)]">
                        {pad(i + 1)}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-display text-[1.125rem] leading-snug font-bold text-[var(--ink)] transition-colors group-hover:text-[var(--teal)]">
                          {category.title}
                        </span>
                        {category.description && (
                          <span className="mt-1 block text-[15px] leading-snug text-[var(--ink-soft)]">
                            {category.description}
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-2 pt-0.5">
                        <span className="tabular font-display text-[1.375rem] leading-none font-extrabold tracking-tight text-[var(--ink)]">
                          {list.length}
                          <span className="sr-only"> soru</span>
                        </span>
                        <ArrowRight
                          aria-hidden="true"
                          className="hidden h-4 w-4 -translate-x-1 text-[var(--teal)] opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transition-none sm:block"
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>

            <section aria-labelledby="one-cikan-baslik" className="mt-14">
              <div className="border-t border-[var(--ink)] pt-5">
                <p className={MICRO}>Öne çıkanlar</p>
                <h2 id="one-cikan-baslik" className={`mt-1.5 ${SECTION_TITLE}`}>
                  Önce bunlara bak
                </h2>
                <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--ink-soft)]">
                  Tercih yapmadan önce bilmen gerekenler. Yanıtı görmek için soruyu aç.
                </p>
              </div>
              <ul className="-mx-2 mt-4 divide-y divide-[color-mix(in_srgb,var(--line)_80%,transparent)] border-y border-[var(--line)]">
                {featured.map((faq) => {
                  const category = faq.categoryId ? categoryOf.get(faq.categoryId) : undefined;
                  if (!category) return null;
                  return (
                    <li key={faq.id}>
                      <FaqItem faq={faq} categorySlug={category.slug} tone="ground" />
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        )}
      </QaHubBody>
    </div>
  );
}

function CommunityRow({ faq, category }: { faq: Faq; category?: HubCategory }) {
  if (!category) return null;
  return (
    <li>
      <Link
        href={faqHref(category.slug, faq.slug)}
        className={`group -mx-2 block rounded-lg px-2 py-3 transition-colors hover:bg-[var(--doc-panel)] ${FOCUS}`}
      >
        <span className="line-clamp-3 font-display break-words text-[15px] leading-snug font-bold text-[var(--ink)] transition-colors group-hover:text-[var(--teal)]">
          {faq.question}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <CommunityTag />
          <span className="font-mono text-[10px] font-medium tracking-[0.14em] text-[var(--ink-faint)] uppercase">
            {category.title}
          </span>
        </span>
      </Link>
    </li>
  );
}
