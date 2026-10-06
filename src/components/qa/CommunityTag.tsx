// Ziyaretçi sorusundan doğan yanıtların küçük mono etiketi. Her göründüğü
// yerde aynı biçim: hairline çerçeve, kâğıt zemin, mürekkep soluk.
export function CommunityTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-[4px] border border-[var(--line)] bg-[var(--doc-ground)] px-1.5 py-px font-mono text-[10px] font-medium tracking-[0.14em] whitespace-nowrap text-[var(--ink-soft)] uppercase ${className}`}
    >
      Ziyaretçi sorusu
    </span>
  );
}
