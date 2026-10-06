import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getQaContent } from "@/lib/faqs";
import { groupByCategory, QUESTION_MAX } from "@/lib/qa";
import { DT, TEXT_ACTION } from "@/components/school/doc-styles";
import { AskForm, type AskCategory } from "./AskForm";

export const metadata: Metadata = {
  title: "Soru sor · Soru-Cevap",
  description:
    "Lise tercihi ve yerleştirme hakkında aklına takılanı sor. Üyelik, e-posta ya da telefon gerekmez; yanıtı sana özel takip bağlantısından okursun.",
  alternates: { canonical: "/soru-cevap/sor" },
};

type PageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

const STEPS = [
  {
    title: "Sorunu yaz",
    text: "Kısa ve açık yazman yeter. Durumunu anlatırsan daha iyi yanıt verebiliriz.",
  },
  {
    title: "Bağlantını sakla",
    text: "Gönderince sana özel bir takip bağlantısı veririz. Bu cihazda Sorduklarım listesine de eklenir.",
  },
  {
    title: "Yanıtı oku",
    text: "Yanıt yazılınca bağlantıdaki sayfada görünür. Bazı sorular düzenlenip herkese açık soru-cevaba da eklenebilir.",
  },
];

// Soru formu, iletişim sayfasının iskeletinde: afiş başlık, hairline'ın
// altında 8 sütun form paneli ve 4 sütun künye ("Nasıl işler?").
export default async function SoruSorPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const initialQuestion = (Array.isArray(q) ? q[0] : q ?? "").replace(/\s+/g, " ").trim().slice(0, QUESTION_MAX);

  const { categories, faqs } = await getQaContent();
  const groups = groupByCategory(categories, faqs);
  const askCategories: AskCategory[] = categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    title: category.title,
  }));

  return (
    <div className="landing">
      <section className="container mx-auto max-w-6xl px-4 pt-6 pb-8 sm:px-6 md:pt-8">
        <nav aria-label="Konum">
          <Link href="/soru-cevap" className={TEXT_ACTION}>
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Soru-cevap
          </Link>
        </nav>
        <div className="mt-5 grid gap-5 lg:grid-cols-12 lg:items-end lg:gap-12">
          <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.02] font-extrabold tracking-[-0.02em] text-balance text-[var(--ink)] lg:col-span-7">
            Sorunu <span className="text-[var(--teal)]">bize sor.</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-[var(--ink-soft)] md:text-xl lg:col-span-5 lg:pb-2">
            Aklına takılanı yaz; yanıtı sana özel bir bağlantıdan okursun. Üyelik,
            e-posta ya da telefon istemiyoruz.
          </p>
        </div>
      </section>

      <div className="border-t border-[var(--line)]">
        <div className="container mx-auto grid max-w-6xl gap-12 px-4 pt-8 pb-16 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:pb-20">
          <section
            aria-labelledby="form-baslik"
            className="relative min-w-0 self-start rounded-2xl border border-[var(--line)] bg-[var(--doc-panel)] p-5 shadow-sm sm:p-8 lg:col-span-8"
          >
            <h2
              id="form-baslik"
              className="font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] md:text-3xl"
            >
              Ne merak ediyorsun?
            </h2>
            <p className="mt-1.5 mb-6 text-[var(--ink-soft)]">
              Yazarken benzer soruları gösteririz; yanıtın hazır olabilir.
            </p>
            <AskForm
              faqs={groups.flatMap((group) => group.faqs)}
              categories={askCategories}
              initialQuestion={initialQuestion}
            />
          </section>

          <aside className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
            <div className="border-t border-[var(--ink)] pt-5 pb-6">
              <h2 className={DT}>Nasıl işler?</h2>
              <ol className="mt-4 space-y-5">
                {STEPS.map((step, i) => (
                  <li key={step.title} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-2">
                    <span
                      aria-hidden="true"
                      className="tabular font-display text-2xl leading-none font-extrabold text-[var(--teal)]"
                    >
                      {i + 1}
                    </span>
                    <span>
                      <span className="block font-display text-base leading-snug font-bold text-[var(--ink)]">
                        {step.title}
                      </span>
                      <span className="mt-1 block text-[15px] leading-relaxed text-[var(--ink-soft)]">
                        {step.text}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="border-t border-[var(--line)] py-5">
              <h2 className={DT}>Bilmen gerekenler</h2>
              <ul className="mt-3 space-y-2.5 text-[15px] leading-relaxed text-[var(--ink-soft)]">
                <li className="flex gap-2.5">
                  <span aria-hidden="true" className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-[1px] bg-[var(--teal)]" />
                  Yanıtları güncel tercih ve yerleştirme kılavuzuna bakarak yazıyoruz.
                </li>
                <li className="flex gap-2.5">
                  <span aria-hidden="true" className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-[1px] bg-[var(--teal)]" />
                  Senin adına resmî bir karar veremeyiz. Kesin bilgi için okulundaki rehber
                  öğretmene ya da ilçe millî eğitim müdürlüğüne danış.
                </li>
                <li className="flex gap-2.5">
                  <span aria-hidden="true" className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-[1px] bg-[var(--teal)]" />
                  Her soruyu yanıtlayamayabiliriz; yanıtlamadığımızda da takip sayfanda
                  yazar.
                </li>
              </ul>
            </div>

            <p className="border-t border-[var(--line)] pt-5 font-mono text-[11px] leading-relaxed text-[var(--ink-faint)]">
              Hedefim Lise bağımsız bir rehberdir; MEB veya okullar adına işlem yapmaz.
              Tercih yapmadan önce güncel MEB ve e-Okul duyurularını kontrol et.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
