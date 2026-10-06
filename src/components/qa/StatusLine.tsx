import { cn } from "@/lib/cn";
import type { SubmissionStatus } from "@/types/faq";
import { formatQaDate } from "./qa-format";

type Step = { label: string; date?: string; state: "done" | "current" | "todo" };

function stepsFor(status: SubmissionStatus, createdAt: string, answeredAt: string | null): Step[] {
  const closedLabel = status === "rejected" ? "Yanıtlanmadı" : "Yanıtlandı";
  return [
    { label: "Alındı", date: formatQaDate(createdAt), state: "done" },
    { label: "İnceleniyor", state: status === "new" ? "current" : "done" },
    {
      label: status === "new" ? "Yanıt" : closedLabel,
      date: status === "new" ? undefined : formatQaDate(answeredAt) || undefined,
      state: status === "new" ? "todo" : "done",
    },
  ];
}

// Takip sayfasının durum çizgisi: Alındı → İnceleniyor → Yanıtlandı ya da
// Yanıtlanmadı. Biten adım dolu teal nokta, sıradaki içi boş teal halka,
// gelecek adım soluk halka; adımları ince bir çizgi bağlar.
export function StatusLine({
  status,
  createdAt,
  answeredAt,
}: {
  status: SubmissionStatus;
  createdAt: string;
  answeredAt: string | null;
}) {
  const steps = stepsFor(status, createdAt, answeredAt);
  return (
    <ol className="grid grid-cols-3" aria-label="Sorunun durumu">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        const nextDone = !last && steps[i + 1].state === "done";
        return (
          <li key={step.label} aria-current={step.state === "current" ? "step" : undefined} className="min-w-0">
            <span aria-hidden="true" className="flex items-center">
              <span
                className={cn(
                  "h-3.5 w-3.5 shrink-0 rounded-full",
                  step.state === "done" && "bg-[var(--teal)]",
                  step.state === "current" && "border-[3px] border-[var(--teal)] bg-[var(--doc-panel)]",
                  step.state === "todo" && "border-2 border-[var(--line)] bg-[var(--doc-panel)]",
                )}
              />
              {!last && (
                <span
                  className={cn(
                    "mx-1.5 h-[2px] flex-1 rounded-full",
                    nextDone ? "bg-[var(--teal)]" : "bg-[var(--line)]",
                  )}
                />
              )}
            </span>
            <span
              className={cn(
                "mt-2.5 block pr-2 font-display text-[15px] leading-tight font-bold",
                step.state === "todo" ? "text-[var(--ink-faint)]" : "text-[var(--ink)]",
              )}
            >
              {step.label}
              {step.state === "done" && <span className="sr-only"> (tamamlandı)</span>}
            </span>
            {step.date && (
              <span className="mt-1 block pr-2 font-mono text-[10px] font-medium tracking-[0.06em] text-[var(--ink-faint)] sm:text-[11px]">
                {step.date}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
