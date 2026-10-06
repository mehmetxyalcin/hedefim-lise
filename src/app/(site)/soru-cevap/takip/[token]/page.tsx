import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getQuestionStatus } from "../../actions";
import { TOKEN_PATTERN } from "@/lib/qa";
import type { QuestionStatus } from "@/types/faq";
import { DT, FOCUS, MICRO, TEXT_ACTION } from "@/components/school/doc-styles";
import { AnswerBody } from "@/components/qa/AnswerBody";
import { CopyLinkButton } from "@/components/qa/CopyLinkButton";
import { MyQuestions } from "@/components/qa/MyQuestions";
import { AskPrompt, PRIMARY_BUTTON, SourceNote } from "@/components/qa/QaKunye";
import { SaveToDevice } from "@/components/qa/SaveToDevice";
import { StatusLine } from "@/components/qa/StatusLine";
import { formatQaDate, QA_ASK, QA_HOME, trackHref } from "@/components/qa/qa-format";

// Takip sayfası kişiye özeldir: her istekte okunur, arama motoruna kapalıdır
// ve adresi (anahtar) başka sitelere yönlendiren olarak gitmez.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Soru takibi",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type PageProps = {
  params: Promise<{ token: string }>;
};

const PANEL = "min-w-0 self-start rounded-2xl border border-[var(--line)] bg-[var(--doc-panel)] shadow-sm lg:col-span-8";

export default async function SoruTakipPage({ params }: PageProps) {
  const { token: raw } = await params;
  const token = raw.trim().toLowerCase();
  const status = TOKEN_PATTERN.test(token) ? await getQuestionStatus(token) : null;

  return (
    <div className="landing">
      <section className="container mx-auto max-w-6xl px-4 pt-6 pb-8 sm:px-6 md:pt-8">
        <nav aria-label="Konum">
          <Link href={QA_HOME} className={TEXT_ACTION}>
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Soru-cevap
          </Link>
        </nav>
        <p className={`mt-6 ${MICRO}`}>Soru takibi</p>
        {status ? (
          <>
            <h1 className="mt-2 max-w-[30ch] font-display text-[clamp(1.625rem,3.6vw,2.625rem)] leading-[1.12] font-extrabold tracking-[-0.015em] text-balance break-words text-[var(--ink)]">
              {status.question}
            </h1>
            <p className="mt-3 font-mono text-[11px] font-medium tracking-[0.06em] text-[var(--ink-faint)]">
              {formatQaDate(status.createdAt)} tarihinde soruldu
              {status.categoryTitle && ` · ${status.categoryTitle}`}
            </p>
          </>
        ) : (
          <h1 className="mt-2 font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.04] font-extrabold tracking-[-0.02em] text-balance text-[var(--ink)]">
            Bu bağlantıyla bir soru <span className="text-[var(--teal)]">bulamadık.</span>
          </h1>
        )}
      </section>

      <div className="border-t border-[var(--line)]">
        <div className="container mx-auto grid max-w-6xl gap-12 px-4 pt-8 pb-16 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:pb-20">
          {status ? <Found status={status} /> : <Missing />}

          <aside className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
            {status ? (
              <div className="border-t border-[var(--ink)] pt-5 pb-6">
                <h2 className={DT}>Bu bağlantı</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--ink-soft)]">
                  Bu sayfanın adresi sorunun anahtarı. Bağlantıyı kaydet ama kimseyle
                  paylaşma; paylaşırsan yanıtı o kişi de görür.
                </p>
                <div className="mt-4 flex flex-col items-start gap-3">
                  <CopyLinkButton path={trackHref(token)} />
                  <SaveToDevice
                    entry={{ token, question: status.question, createdAt: status.createdAt }}
                  />
                </div>
              </div>
            ) : (
              <MyQuestions rule="ink" />
            )}
            <AskPrompt title="Başka bir sorun mu var?" />
            <SourceNote />
          </aside>
        </div>
      </div>
    </div>
  );
}

function Found({ status }: { status: QuestionStatus }) {
  const note = status.note?.trim();
  return (
    <section aria-labelledby="durum-baslik" className={PANEL}>
      <div className="px-5 pt-5 pb-6 sm:px-7 sm:pt-6">
        <h2 id="durum-baslik" className="sr-only">
          Sorunun durumu
        </h2>
        <StatusLine status={status.status} createdAt={status.createdAt} answeredAt={status.answeredAt} />
      </div>

      <div className="border-t border-[var(--line)] px-5 py-6 sm:px-7 sm:py-7">
        {status.status === "answered" && (
          <>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] md:text-[1.75rem]">
              Yanıtın
            </h2>
            <AnswerBody answer={status.answer ?? ""} className="mt-4" />
            {note && <NoteBox note={note} />}
            {status.publishedHref && (
              <p className="mt-6 flex flex-col gap-2 border-t border-[var(--line)] pt-4 text-[15px] text-[var(--ink-soft)] sm:flex-row sm:items-center sm:justify-between">
                Bu soruyu herkese açık soru-cevaba da ekledik.
                <Link href={status.publishedHref} className={TEXT_ACTION}>
                  Orada gör
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </p>
            )}
          </>
        )}

        {status.status === "rejected" && (
          <>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] md:text-[1.75rem]">
              Bu soruyu yanıtlamadık.
            </h2>
            {note ? (
              <p className="mt-3 max-w-[64ch] text-[1.0625rem] leading-[1.7] whitespace-pre-line text-[var(--ink-soft)]">
                {note}
              </p>
            ) : (
              <p className="mt-3 max-w-[64ch] text-[1.0625rem] leading-[1.7] text-[var(--ink-soft)]">
                Bazı soruları yanıtlayamıyoruz: konu bu bölümün dışında kalmış ya da
                kişisel bir karar gerektiriyor olabilir.
              </p>
            )}
            {status.relatedHref && (
              <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--doc-ground)] px-4 py-4">
                <p className="font-display text-base font-bold text-[var(--ink)]">
                  Bu sorunun yanıtı zaten var.
                </p>
                <Link href={status.relatedHref} className={`mt-2 ${TEXT_ACTION}`}>
                  Yanıtı oku
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
            )}
            <p className="mt-6 text-[15px] text-[var(--ink-soft)]">
              Sorunu farklı anlatmak istersen{" "}
              <Link
                href={QA_ASK}
                className={`rounded-sm font-semibold text-[var(--teal)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--teal)] ${FOCUS}`}
              >
                yeniden sorabilirsin
              </Link>
              .
            </p>
          </>
        )}

        {status.status === "new" && (
          <>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] md:text-[1.75rem]">
              Sorun sırada.
            </h2>
            <p className="mt-3 max-w-[60ch] text-[1.0625rem] leading-[1.7] text-[var(--ink-soft)]">
              Soruyu okuyup yanıtını yazacağız. Yanıt hazır olunca bu sayfada görünür;
              ara sıra bu bağlantıya dönüp bakabilirsin.
            </p>
            <p className="mt-5 flex max-w-[60ch] gap-2.5 text-[15px] leading-relaxed text-[var(--ink-soft)]">
              <span aria-hidden="true" className="mt-[0.4em] h-3.5 w-[2px] shrink-0 bg-[var(--vermilion)]" />
              <span>
                <strong className="font-display font-bold text-[var(--ink)]">Bağlantıyı kaybetme.</strong>{" "}
                Sana başka yoldan ulaşamayız; yanıtı yalnız bu sayfada görebilirsin.
              </span>
            </p>
          </>
        )}
      </div>

      {status.details?.trim() && (
        <div className="border-t border-[var(--line)] px-5 py-5 sm:px-7">
          <h2 className={DT}>Yazdığın açıklama</h2>
          <p className="mt-2 max-w-[64ch] text-[15px] leading-relaxed whitespace-pre-line text-[var(--ink-soft)]">
            {status.details.trim()}
          </p>
        </div>
      )}
    </section>
  );
}

function NoteBox({ note }: { note: string }) {
  return (
    <aside aria-label="Not" className="mt-6 max-w-[68ch] rounded-xl border border-[var(--line)] bg-[var(--doc-ground)] px-4 py-3.5">
      <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-[var(--teal)] uppercase">Not</p>
      <p className="mt-1.5 text-[1rem] leading-relaxed whitespace-pre-line text-[var(--ink-soft)]">{note}</p>
    </aside>
  );
}

function Missing() {
  return (
    <section aria-labelledby="bulunamadi-baslik" className={`${PANEL} p-5 sm:p-7`}>
      <h2 id="bulunamadi-baslik" className="font-display text-2xl font-extrabold tracking-tight text-[var(--ink)]">
        Ne olmuş olabilir?
      </h2>
      <ul className="mt-4 space-y-3 text-[1.0625rem] leading-[1.65] text-[var(--ink-soft)]">
        <li className="flex gap-3">
          <span aria-hidden="true" className="mt-[0.62em] h-1.5 w-1.5 shrink-0 rounded-[1px] bg-[var(--teal)]" />
          <span>
            Bağlantı eksik kopyalanmış olabilir. Adresin sonundaki uzun kodun tamamı
            gerekiyor; bir harfi bile eksikse soru bulunamaz.
          </span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="mt-[0.62em] h-1.5 w-1.5 shrink-0 rounded-[1px] bg-[var(--teal)]" />
          <span>
            Soruyu bu cihazdan sorduysan soru-cevap sayfasındaki{" "}
            <strong className="font-semibold text-[var(--ink)]">Sorduklarım</strong>{" "}
            listesinde bulabilirsin.
          </span>
        </li>
      </ul>
      <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-[var(--line)] pt-6">
        <Link href={QA_HOME} className={PRIMARY_BUTTON}>
          Soru-cevaba dön
        </Link>
        <Link href={QA_ASK} className={TEXT_ACTION}>
          Yeni soru sor
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
