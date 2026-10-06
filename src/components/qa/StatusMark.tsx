import type { SubmissionStatus } from "@/types/faq";

const LABEL: Record<SubmissionStatus, string> = {
  new: "İnceleniyor",
  answered: "Yanıtlandı",
  rejected: "Yanıtlanmadı",
};

// Ziyaretçi sorusunun durumu, mono etiket + küçük işaret: dolu teal nokta =
// yanıt hazır; içi boş halka = sırada; kısa çizgi = yanıtlanmadı.
// null: anahtarla eşleşen kayıt yok.
export function StatusMark({ status }: { status: SubmissionStatus | null }) {
  if (status === null)
    return (
      <span className="font-mono text-[11px] font-medium tracking-[0.06em] text-[var(--ink-faint)]">
        Bulunamadı
      </span>
    );
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-[0.06em] ${
        status === "answered" ? "text-[var(--teal)]" : "text-[var(--ink-soft)]"
      }`}
    >
      {status === "answered" ? (
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--teal)]" />
      ) : status === "new" ? (
        <span aria-hidden="true" className="h-2 w-2 rounded-full border-[1.5px] border-[var(--ink-faint)]" />
      ) : (
        <span aria-hidden="true" className="h-[2px] w-2 bg-[var(--ink-faint)]" />
      )}
      {LABEL[status]}
    </span>
  );
}
