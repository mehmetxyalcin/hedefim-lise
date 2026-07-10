import type { Metadata } from "next";
import { CircleHelp } from "lucide-react";
import { FaqSearch } from "@/components/faq/FaqSearch";
import { getPublishedFaqs } from "@/lib/faqs";

export const metadata: Metadata = {
  title: "Soru-Cevap",
  description:
    "2026 lise tercih, yerleştirme ve nakil süreci hakkında sık sorulan sorular ve yanıtları.",
};

export default async function SoruCevapPage() {
  const faqs = await getPublishedFaqs();

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <section className="border-b border-blue-100 bg-gradient-to-b from-blue-50 via-white to-slate-50 px-4 py-16 md:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <CircleHelp aria-hidden="true" className="h-7 w-7" />
          </div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
            2026 tercih rehberi
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 md:text-5xl">
            Soru-Cevap
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Tercih, yerleştirme ve nakil sürecindeki önemli kuralları kolayca
            bulun ve anlaşılır yanıtlarla inceleyin.
          </p>
        </div>
      </section>

      <section className="px-4 py-10 md:py-12">
        <FaqSearch faqs={faqs} />

        <aside className="mx-auto mt-12 max-w-4xl rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
          <strong>Bilgilendirme:</strong> Bu sayfa, 2026 Yılı Ortaöğretime
          Geçiş Tercih ve Yerleştirme Kılavuzu esas alınarak hazırlanmıştır.
          Tercih işlemlerinde güncel MEB ve e-Okul duyurularını kontrol ediniz.
        </aside>
      </section>
    </div>
  );
}
