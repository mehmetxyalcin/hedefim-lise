"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Plus } from "lucide-react";
import { FOCUS } from "@/components/school/doc-styles";
import { rememberQuestion, useMyQuestions, type MyQuestion } from "./my-questions";

const noopSubscribe = () => () => {};

/**
 * Takip sayfasında: bağlantı başka bir cihazdan açıldıysa soruyu bu cihazın
 * "Sorduklarım" listesine ekler. Kendiliğinden eklemez; ziyaretçi seçer.
 */
export function SaveToDevice({ entry }: { entry: MyQuestion }) {
  const list = useMyQuestions();
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [failed, setFailed] = useState(false);

  if (!hydrated) return null;

  if (list.some((item) => item.token === entry.token))
    return (
      <p className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium tracking-[0.06em] text-[var(--ink-faint)]">
        <Check aria-hidden="true" className="h-3.5 w-3.5 text-[var(--teal)]" strokeWidth={2.5} />
        Bu cihazda Sorduklarım listende
      </p>
    );

  return (
    <div>
      <button
        type="button"
        onClick={() => setFailed(!rememberQuestion(entry))}
        className={`inline-flex items-center gap-1.5 rounded-md font-display text-sm font-bold text-[var(--teal)] transition-colors hover:text-[var(--teal-deep)] ${FOCUS}`}
      >
        <Plus aria-hidden="true" className="h-4 w-4" />
        Bu cihazda Sorduklarım’a ekle
      </button>
      {failed && (
        <p role="alert" className="mt-2 font-mono text-[12px] font-semibold text-[var(--vermilion-deep)]">
          Bu tarayıcı listeyi saklayamıyor. Bağlantıyı kopyalayıp bir yere not et.
        </p>
      )}
    </div>
  );
}
