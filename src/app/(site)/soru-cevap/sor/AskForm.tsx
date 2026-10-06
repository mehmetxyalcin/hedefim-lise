"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  checkSubmission,
  DETAILS_MAX,
  indexFaqs,
  NICKNAME_MAX,
  QUESTION_MAX,
  QUESTION_MIN,
  similarFaqs,
  type SubmissionInput,
} from "@/lib/qa";
import type { Faq } from "@/types/faq";
import { submitQuestion } from "../actions";
import { DT, FOCUS, MICRO, TEXT_ACTION } from "@/components/school/doc-styles";
import { CopyLinkButton } from "@/components/qa/CopyLinkButton";
import { FaqItem } from "@/components/qa/FaqItem";
import { rememberQuestion } from "@/components/qa/my-questions";
import { QA_HOME, trackHref } from "@/components/qa/qa-format";

export type AskCategory = { id: string; slug: string; title: string };

type Props = {
  faqs: Faq[];
  categories: AskCategory[];
  initialQuestion: string;
};

type Field = keyof SubmissionInput;
type Errors = Partial<Record<Field, string>>;
type Sent = { token: string; url: string; saved: boolean };

// İletişim formunun kontrol dili: kâğıt zeminli kutu, odakta teal çerçeve.
const INPUT =
  "w-full rounded-xl border bg-[var(--doc-ground)] px-4 py-2.5 text-base text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-faint)] focus:border-[var(--teal)] focus:bg-[var(--doc-panel)] focus:ring-4 focus:ring-[var(--teal-ring)]";
const LABEL = "flex items-baseline gap-2 font-display text-sm font-bold text-[var(--ink)]";
const ERROR = "mt-2 font-mono text-[12px] leading-snug font-semibold text-[var(--vermilion-deep)]";
const HINT = "mt-2 text-[13px] leading-snug text-[var(--ink-faint)]";
const OPTIONAL = (
  <span className="font-mono text-[10px] font-medium tracking-[0.14em] text-[var(--ink-faint)] uppercase">
    isteğe bağlı
  </span>
);
// Sunucu 3 saniyeden kısa sürede gelen gönderimi bot sayar. Önceden doldurulmuş
// soruyu hemen gönderen gerçek ziyaretçi için kalan süre beklenir.
const MIN_FILL_MS = 3200;

const borderFor = (error?: string) =>
  error ? "border-[var(--vermilion-deep)]" : "border-[var(--line)]";

function Counter({ id, length, max, min }: { id: string; length: number; max: number; min?: number }) {
  const short = min != null && length > 0 && length < min;
  return (
    <span
      id={id}
      className={cn(
        "tabular font-mono text-[11px] font-medium tracking-[0.06em]",
        length >= max ? "text-[var(--vermilion-deep)]" : short || length === 0 ? "text-[var(--ink-faint)]" : "text-[var(--teal)]",
      )}
    >
      <span className="sr-only">Karakter sayısı: </span>
      {length} / {max}
    </span>
  );
}

export function AskForm({ faqs, categories, initialQuestion }: Props) {
  const [question, setQuestion] = useState(initialQuestion);
  const [details, setDetails] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [nickname, setNickname] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<Sent | null>(null);

  const startedAt = useRef(0);
  const fields = useRef<Partial<Record<Field, HTMLElement | null>>>({});
  const doneHeading = useRef<HTMLHeadingElement>(null);

  // Formun açıldığı an: sunucudaki alt süre denetimi buna bakar.
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (sent) doneHeading.current?.focus();
  }, [sent]);

  const index = useMemo(() => indexFaqs(faqs), [faqs]);
  const categoryOf = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const deferredQuestion = useDeferredValue(question);
  const similar = useMemo(
    () => (deferredQuestion.trim().length >= 6 ? similarFaqs(index, deferredQuestion, 4) : []),
    [index, deferredQuestion],
  );

  function update(field: Field, value: string) {
    const setters: Record<Field, (v: string) => void> = {
      question: setQuestion,
      details: setDetails,
      categoryId: setCategoryId,
      nickname: setNickname,
    };
    setters[field](value);
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
    if (serverError) setServerError("");
  }

  function showError(field: Field, message: string) {
    setErrors({ [field]: message });
    window.requestAnimationFrame(() => fields.current[field]?.focus());
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setServerError("");

    const input: SubmissionInput = { question, details, categoryId, nickname };
    const check = checkSubmission(input);
    if (!check.ok) {
      showError(check.field, check.error);
      return;
    }

    setSubmitting(true);
    const wait = MIN_FILL_MS - (Date.now() - startedAt.current);
    if (wait > 0) await new Promise((resolve) => window.setTimeout(resolve, wait));

    let result: Awaited<ReturnType<typeof submitQuestion>>;
    try {
      result = await submitQuestion({ ...input, website, startedAt: startedAt.current });
    } catch {
      result = { ok: false, error: "Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene." };
    }
    setSubmitting(false);

    if (!result.ok) {
      if (result.field) showError(result.field, result.error);
      else setServerError(result.error);
      return;
    }

    const path = trackHref(result.token);
    const saved = rememberQuestion({
      token: result.token,
      question: check.value.question,
      createdAt: new Date().toISOString(),
    });
    setSent({ token: result.token, url: new URL(path, window.location.origin).toString(), saved });
  }

  function reset() {
    setQuestion("");
    setDetails("");
    setCategoryId("");
    setNickname("");
    setErrors({});
    setServerError("");
    setSent(null);
    startedAt.current = Date.now();
  }

  if (sent) {
    const path = trackHref(sent.token);
    return (
      <div>
        <p className={MICRO}>Soru alındı</p>
        <h2
          ref={doneHeading}
          tabIndex={-1}
          className="mt-2 font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] outline-none md:text-3xl"
        >
          Sorun bize ulaştı.
        </h2>
        <p className="mt-2 max-w-[56ch] text-[var(--ink-soft)]">
          Yanıtı aşağıdaki bağlantıdan okuyacaksın. Yanıt yazılınca o sayfada görünür.
        </p>

        <div className="mt-6 rounded-xl border border-[var(--teal)] bg-[var(--teal-tint)] p-4 sm:p-5">
          <p className={DT}>Takip bağlantın</p>
          <p className="mt-2 font-mono text-[13px] leading-relaxed break-all text-[var(--ink)] select-all sm:text-sm">
            {sent.url}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <CopyLinkButton path={path} variant="primary" />
            <Link href={path} className={TEXT_ACTION}>
              Takip sayfasını aç
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <p className="mt-5 flex max-w-[60ch] gap-2.5 text-[15px] leading-relaxed text-[var(--ink-soft)]">
          <span aria-hidden="true" className="mt-[0.4em] h-3.5 w-[2px] shrink-0 bg-[var(--vermilion)]" />
          <span>
            <strong className="font-display font-bold text-[var(--ink)]">Bağlantıyı bir yere kaydet.</strong>{" "}
            E-posta ya da telefon istemediğimiz için sana başka yoldan ulaşamayız;
            bağlantıyı kaybedersen yanıtı göremezsin.
          </span>
        </p>
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-[var(--ink-faint)]">
          {sent.saved
            ? "Bu cihazda Sorduklarım listene de ekledik; soru-cevap sayfasından bakabilirsin."
            : "Bu tarayıcı bağlantıyı saklayamadı (gizli pencere olabilir). Bağlantıyı mutlaka kopyala."}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-[var(--line)] pt-6">
          <button
            type="button"
            onClick={reset}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--line)] px-5 py-3 font-display text-sm font-bold tracking-wide text-[var(--ink)] transition-colors hover:border-[var(--teal)] hover:text-[var(--teal)] ${FOCUS}`}
          >
            Yeni soru sor
          </button>
          <Link href={QA_HOME} className={TEXT_ACTION}>
            Soru-cevaba dön
          </Link>
        </div>
      </div>
    );
  }

  const questionLength = question.trim().length;
  const describedBy = (field: Field, ...ids: string[]) =>
    [...ids, errors[field] ? `${field}-hata` : null].filter(Boolean).join(" ") || undefined;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {/* Bal küpü: ekranda ve ekran okuyucuda yok; yalnız botlar doldurur. */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Web siteniz</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between gap-4">
          <label htmlFor="question" className={LABEL}>
            Sorun
          </label>
          <Counter id="question-sayac" length={questionLength} max={QUESTION_MAX} min={QUESTION_MIN} />
        </div>
        <textarea
          id="question"
          ref={(node) => {
            fields.current.question = node;
          }}
          value={question}
          onChange={(event) => update("question", event.target.value)}
          rows={3}
          maxLength={QUESTION_MAX}
          placeholder="Örneğin: Pansiyonlu bir okulu nasıl tercih ederim?"
          aria-invalid={errors.question ? true : undefined}
          aria-describedby={describedBy("question", "question-ipucu", "question-sayac")}
          className={cn(INPUT, borderFor(errors.question), "resize-y font-display text-[1.0625rem] leading-snug font-semibold placeholder:font-reading placeholder:font-normal")}
        />
        {errors.question ? (
          <p id="question-hata" className={ERROR}>
            {errors.question}
          </p>
        ) : (
          <p id="question-ipucu" className={HINT}>
            Tek bir soru, kısa ve açık. En az {QUESTION_MIN} karakter.
          </p>
        )}

        <p aria-live="polite" className="sr-only">
          {similar.length > 0 ? `Sorunu yanıtlıyor olabilecek ${similar.length} soru bulundu.` : ""}
        </p>
        <div>
          {similar.length > 0 && (
            <section
              aria-label="Benzer sorular"
              className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--doc-ground)] px-2 pt-3 pb-1 sm:px-3"
            >
              <p className="px-2 font-display text-[15px] font-bold text-[var(--ink)]">
                Bunlar sorunu yanıtlıyor olabilir
              </p>
              <p className="px-2 pt-0.5 pb-1 text-[13px] text-[var(--ink-faint)]">
                Önce bir bak; yanıt buradaysa beklemene gerek yok.
              </p>
              <ul className="divide-y divide-[color-mix(in_srgb,var(--line)_80%,transparent)]">
                {similar.map((faq) => {
                  const category = faq.categoryId ? categoryOf.get(faq.categoryId) : undefined;
                  if (!category) return null;
                  return (
                    <li key={faq.id}>
                      <FaqItem faq={faq} categorySlug={category.slug} categoryTitle={category.title} tone="ground" />
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between gap-4">
          <label htmlFor="details" className={LABEL}>
            Açıklama {OPTIONAL}
          </label>
          {details.length > 0 && <Counter id="details-sayac" length={details.trim().length} max={DETAILS_MAX} />}
        </div>
        <textarea
          id="details"
          ref={(node) => {
            fields.current.details = node;
          }}
          value={details}
          onChange={(event) => update("details", event.target.value)}
          rows={4}
          maxLength={DETAILS_MAX}
          placeholder="Durumunu biraz anlat: hangi okul türü, hangi aşama, neyi merak ediyorsun?"
          aria-invalid={errors.details ? true : undefined}
          aria-describedby={describedBy("details", details.length > 0 ? "details-sayac" : "")}
          className={cn(INPUT, borderFor(errors.details), "resize-y leading-relaxed")}
        />
        {errors.details && (
          <p id="details-hata" className={ERROR}>
            {errors.details}
          </p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {categories.length > 0 && (
          <div>
            <label htmlFor="categoryId" className={cn(LABEL, "mb-2")}>
              Konu {OPTIONAL}
            </label>
            <div className="relative">
              <select
                id="categoryId"
                ref={(node) => {
                  fields.current.categoryId = node;
                }}
                value={categoryId}
                onChange={(event) => update("categoryId", event.target.value)}
                aria-invalid={errors.categoryId ? true : undefined}
                aria-describedby={describedBy("categoryId")}
                className={cn(INPUT, borderFor(errors.categoryId), "cursor-pointer appearance-none pr-10 font-display text-[15px] font-bold")}
              >
                <option value="">Emin değilim</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-faint)]"
              />
            </div>
            {errors.categoryId && (
              <p id="categoryId-hata" className={ERROR}>
                {errors.categoryId}
              </p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="nickname" className={cn(LABEL, "mb-2")}>
            Rumuz {OPTIONAL}
          </label>
          <input
            id="nickname"
            ref={(node) => {
              fields.current.nickname = node;
            }}
            type="text"
            value={nickname}
            onChange={(event) => update("nickname", event.target.value)}
            maxLength={NICKNAME_MAX}
            autoComplete="off"
            placeholder="Örneğin: Mersinli 8. sınıf"
            aria-invalid={errors.nickname ? true : undefined}
            aria-describedby={describedBy("nickname", "nickname-ipucu")}
            className={cn(INPUT, borderFor(errors.nickname))}
          />
          {errors.nickname ? (
            <p id="nickname-hata" className={ERROR}>
              {errors.nickname}
            </p>
          ) : (
            <p id="nickname-ipucu" className={HINT}>
              Gerçek adını yazma; takma bir ad yeter.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--doc-ground)] px-4 py-3.5">
        <p className={DT}>Yazmadan önce</p>
        <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--ink-soft)]">
          Adını, telefonunu, e-postanı ya da okul numaranı yazma. Sorunu düzenleyip
          herkesin görebileceği soru-cevaba ekleyebiliriz; seni tanıtan bir bilgi orada
          yer almamalı.
        </p>
      </div>

      {serverError && (
        <p role="alert" className={ERROR}>
          {serverError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-4 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[42ch] text-sm leading-relaxed text-[var(--ink-faint)]">
          Gönderince sana özel bir takip bağlantısı vereceğiz. Yanıtı oradan okuyacaksın.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--teal)] px-6 py-3 font-display text-sm font-bold tracking-wide text-white transition-colors hover:bg-[var(--teal-deep)] disabled:cursor-wait disabled:opacity-60 ${FOCUS}`}
        >
          {submitting ? (
            <>
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />
              Gönderiliyor
            </>
          ) : (
            <>
              Soruyu gönder
              <Send aria-hidden="true" className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
