// Okul detayının belge dünyası (.landing) sınıfları; alan sayfasıyla aynı dil.

export const MICRO =
  "font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--ink-faint)]";
export const DT =
  "font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ink-faint)]";
export const FOCUS =
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--teal-ring)]";
export const TEXT_ACTION = `inline-flex items-center gap-1.5 rounded-md font-display text-sm font-bold text-[var(--teal)] transition-colors hover:text-[var(--teal-deep)] ${FOCUS}`;
export const INLINE_LINK = `rounded-sm underline decoration-[var(--line)] decoration-1 underline-offset-4 transition-colors hover:text-[var(--teal)] hover:decoration-[var(--teal)] ${FOCUS}`;
/** Ana sütundaki bölüm başlığı: cevapladığı soruyu sorar. */
export const SECTION_TITLE =
  "font-display text-[1.375rem] leading-tight font-extrabold tracking-tight text-[var(--ink)] md:text-2xl";
