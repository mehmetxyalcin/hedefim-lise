"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { getQuestionStatuses } from "@/app/(site)/soru-cevap/actions";
import type { QuestionStatus } from "@/types/faq";
import { DT, FOCUS } from "@/components/school/doc-styles";
import { forgetQuestion, useMyQuestions } from "./my-questions";
import { formatQaDateShort, trackHref } from "./qa-format";
import { StatusMark } from "./StatusMark";

type StatusMap = Record<string, QuestionStatus | null>;

// İki yerleşim (telefonda aramanın altında, masaüstünde künyede) aynı anda
// bağlanabilir; aynı anahtarlar için tek istek gitsin diye sonuç paylaşılır.
const pending = new Map<string, Promise<StatusMap | null>>();

function loadStatuses(tokens: string[]): Promise<StatusMap | null> {
  const key = tokens.join(",");
  let request = pending.get(key);
  if (!request) {
    request = getQuestionStatuses(tokens)
      .then((rows) => Object.fromEntries(rows.map((row) => [row.token, row.status])))
      .catch(() => null)
      .then((map) => {
        // Sonuç kısa süre paylaşılır; sonra yeni bir ziyarette taze durum okunur.
        window.setTimeout(() => pending.delete(key), map ? 60_000 : 0);
        return map;
      });
    pending.set(key, request);
  }
  return request;
}

/**
 * "Sorduklarım": bu cihazdan sorulan soruların durumları. Liste boşsa hiçbir
 * şey basmaz. Satır takip sayfasına gider; satır bu cihazdan kaldırılabilir
 * (soru silinmez, yalnız bu tarayıcıdaki bağlantı unutulur).
 */
export function MyQuestions({
  className,
  rule = "line",
}: {
  className?: string;
  /** Üst çizgi: künyede hairline, telefonda bölüm başı olarak mürekkep. */
  rule?: "ink" | "line";
}) {
  const list = useMyQuestions();
  const [known, setKnown] = useState<StatusMap>({});
  const [failed, setFailed] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const headingId = useId();

  const missing = list.map((item) => item.token).filter((token) => !(token in known));
  const missingKey = missing.join(",");

  useEffect(() => {
    if (!missingKey) return;
    let alive = true;
    loadStatuses(missingKey.split(",")).then((map) => {
      if (!alive) return;
      if (map) setKnown((current) => ({ ...current, ...map }));
      else setFailed(true);
    });
    return () => {
      alive = false;
    };
  }, [missingKey]);

  if (list.length === 0) return null;

  const answered = list.filter((item) => known[item.token]?.status === "answered").length;

  return (
    <section aria-labelledby={headingId} className={cn("border-t pt-5 pb-6", rule === "ink" ? "border-[var(--ink)]" : "border-[var(--line)]", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={headingId} className={DT}>
          Sorduklarım
        </h2>
        {answered > 0 && (
          <p className="tabular font-mono text-[11px] font-semibold tracking-[0.06em] text-[var(--teal)]">
            {answered} yanıt geldi
          </p>
        )}
      </div>
      <p className="mt-1.5 text-[13px] leading-snug text-[var(--ink-faint)]">
        Yalnız bu cihazda görünür.
      </p>

      <ul className="mt-3 divide-y divide-[color-mix(in_srgb,var(--line)_70%,transparent)]">
        {list.map((item) => {
          const loaded = item.token in known;
          const status = known[item.token] ?? null;
          const question = status?.question || item.question || "Soru";
          const asking = confirming === item.token;
          return (
            <li key={item.token} className="py-2">
              <div className="flex items-start gap-1">
                <Link
                  href={trackHref(item.token)}
                  prefetch={false}
                  className={`group -mx-2 min-w-0 flex-1 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--doc-panel)] ${FOCUS}`}
                >
                  <span className="line-clamp-2 font-display break-words text-[15px] leading-snug font-bold text-[var(--ink)] transition-colors group-hover:text-[var(--teal)]">
                    {question}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                    {loaded ? (
                      <StatusMark status={status ? status.status : null} />
                    ) : (
                      <span className="font-mono text-[11px] font-medium tracking-[0.06em] text-[var(--ink-faint)]">
                        {failed ? "Durum alınamadı" : "Durum yükleniyor…"}
                      </span>
                    )}
                    {item.createdAt && (
                      <span className="font-mono text-[11px] font-medium text-[var(--ink-faint)]">
                        {formatQaDateShort(item.createdAt)}
                      </span>
                    )}
                  </span>
                </Link>
                {!asking && (
                  <button
                    type="button"
                    onClick={() => setConfirming(item.token)}
                    aria-label={`“${question.slice(0, 60)}” sorusunu bu cihazdaki listeden kaldır`}
                    className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--ink-faint)] transition-colors hover:bg-[var(--doc-panel)] hover:text-[var(--ink)] ${FOCUS}`}
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                  </button>
                )}
              </div>
              {asking && (
                <div role="group" aria-label="Kaldırmayı onayla" className="mt-1 rounded-lg bg-[var(--doc-panel)] px-3 py-2.5">
                  <p className="text-[13px] leading-snug text-[var(--ink-soft)]">
                    Bağlantıyı başka bir yere kaydetmediysen bu sorunun yanıtını bir daha göremezsin.
                  </p>
                  <div className="mt-2 flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        forgetQuestion(item.token);
                        setConfirming(null);
                      }}
                      className={`rounded-md font-display text-sm font-bold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--ink)] ${FOCUS}`}
                    >
                      Listeden kaldır
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(null)}
                      className={`rounded-md font-display text-sm font-bold text-[var(--teal)] hover:text-[var(--teal-deep)] ${FOCUS}`}
                    >
                      Vazgeç
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
