import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import { getFooterSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "İletişim",
  description:
    "Okul bilgisi güncelleme, hatalı bilgi bildirimi veya öneri ve görüşleriniz için bizimle iletişime geçin.",
};

// İletişim, anasayfanın belge dünyasında (.landing) durur: aynı kâğıt, aynı
// teal eylem rengi, aynı mono etiket grameri. Form tek panel; yan sütun bir
// künye gibi hairline'larla ayrılmış bilgi listesi, kart yığını değil.
export default async function IletisimPage() {
  const { contact_email, address } = await getFooterSettings();

  return (
    <div className="landing">
      <section className="container mx-auto max-w-6xl px-6 pt-8 pb-8 md:pt-10 md:pb-8">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-12">
          <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[1.02] tracking-[-0.02em] text-balance text-[var(--ink)] lg:col-span-7">
            Bize <span className="text-[var(--teal)]">yazın.</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-[var(--ink-soft)] md:text-xl lg:col-span-5 lg:pb-2">
            Soru, öneri veya bilgi güncelleme talepleriniz için bize ulaşın.
          </p>
        </div>
      </section>

      <div className="border-t border-[var(--line)]">
        <div className="container mx-auto grid max-w-6xl gap-12 px-6 pt-8 pb-16 lg:grid-cols-12 lg:gap-12 lg:pb-20">
          <section
            aria-labelledby="form-title"
            className="rounded-2xl border border-[var(--line)] bg-[var(--doc-panel)] p-6 shadow-sm sm:p-8 lg:col-span-8"
          >
            <h2
              id="form-title"
              className="font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] md:text-3xl"
            >
              Mesaj gönder
            </h2>
            <p className="mt-1.5 mb-6 text-[var(--ink-soft)]">
              Önce konuyu seçin; okul bilgisiyle ilgiliyse okulu da işaretleyin.
            </p>
            <ContactForm />
          </section>

          <aside className="lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
            <dl>
              <div className="border-t border-[var(--ink)] pt-5 pb-7">
                <dt className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ink-faint)]">
                  Yanıt süresi
                </dt>
                <dd className="mt-3">
                  <span className="tabular font-display text-5xl font-extrabold leading-none tracking-tight text-[var(--ink)]">
                    1–2
                  </span>
                  <span className="ml-2 font-display text-lg font-bold text-[var(--ink)]">
                    iş günü
                  </span>
                  <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-soft)]">
                    Mesajınızı aldıktan sonra mümkün olan en kısa sürede yanıt
                    vermeye çalışıyoruz.
                  </p>
                </dd>
              </div>

              {contact_email && (
                <div className="border-t border-[var(--line)] py-5">
                  <dt className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ink-faint)]">
                    E-posta
                  </dt>
                  <dd className="mt-2">
                    <a
                      href={`mailto:${contact_email}`}
                      className="font-display text-lg font-bold break-all text-[var(--ink)] underline decoration-[var(--line)] decoration-2 underline-offset-4 transition-colors hover:text-[var(--teal)] hover:decoration-[var(--teal)]"
                    >
                      {contact_email}
                    </a>
                  </dd>
                </div>
              )}

              <div className="border-t border-[var(--line)] py-5">
                <dt className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ink-faint)]">
                  Konum
                </dt>
                <dd className="mt-2 font-display text-lg font-bold text-[var(--ink)]">
                  {address || "Mersin, Türkiye"}
                </dd>
              </div>

            </dl>

            <p className="mt-10 font-mono text-[11px] leading-relaxed text-[var(--ink-faint)]">
              Bağımsız bir rehberdir; MEB veya okullar adına işlem yapmaz.
              Yerleştirme ve kayıt işlemleri için okulunuza ya da ilçe millî
              eğitim müdürlüğüne başvurun.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
