import Link from "next/link";
import type { ReactNode } from "react";

export type LegalSection = { id: string; title: string; body: ReactNode };

type Props = {
  title: string;
  lead: ReactNode;
  updated: { iso: string; label: string };
  sections: LegalSection[];
  related: { href: string; label: string };
};

const MICRO =
  "font-mono text-[11px] font-medium tracking-[0.16em] uppercase text-[var(--ink-faint)]";
const FOCUS =
  "rounded-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--teal-ring)]";

// Gizlilik ve kullanım koşulları: landing'in belge dünyasında okunacak metin.
// Solda bölüm dizini (geniş ekranda yapışkan), sağda tek bir belge paneli;
// bölümler panelin içinde kıl çizgiyle ayrılır, her biri kendi çapasıyla.
export function LegalDocument({ title, lead, updated, sections, related }: Props) {
  return (
    <div className="landing">
      <article className="container mx-auto max-w-6xl px-6 pt-10 pb-20 md:pt-14">
        <header className="max-w-3xl">
          <h1 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] font-extrabold tracking-[-0.02em] text-balance text-[var(--ink)]">
            {title}
          </h1>
          <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-pretty text-[var(--ink-soft)]">
            {lead}
          </p>
          <p className={`mt-6 ${MICRO}`}>
            Son güncelleme <span aria-hidden>·</span>{" "}
            <time dateTime={updated.iso}>{updated.label}</time>
          </p>
        </header>

        <div className="mt-10 grid gap-8 lg:mt-14 lg:grid-cols-12 lg:gap-12">
          <nav aria-label="Bu sayfadaki bölümler" className="lg:col-span-3">
            <div className="lg:sticky lg:top-24">
              <p className={MICRO}>Bölümler</p>
              <ol className="mt-3 grid gap-1 border-l border-[var(--line)] sm:grid-cols-2 lg:grid-cols-1">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className={`-ml-px block border-l border-transparent py-1 pl-4 font-display text-sm leading-snug font-semibold text-[var(--ink-soft)] transition-colors hover:border-[var(--teal)] hover:text-[var(--teal)] ${FOCUS}`}
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <div className="min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--doc-panel)] shadow-sm lg:col-span-9">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-baslik`}
                className="scroll-mt-24 border-t border-[var(--line)] px-5 py-8 first:border-t-0 sm:px-10 sm:py-10"
              >
                <h2
                  id={`${section.id}-baslik`}
                  className="font-display text-xl leading-snug font-bold tracking-[-0.01em] text-[var(--ink)]"
                >
                  {section.title}
                </h2>
                <div className="legal-prose mt-4">{section.body}</div>
              </section>
            ))}
          </div>
        </div>

        <p className="mt-10 text-base text-[var(--ink-soft)] lg:ml-[25%] lg:pl-12">
          Ayrıca bakın:{" "}
          <Link
            href={related.href}
            className={`font-semibold text-[var(--teal)] underline decoration-1 underline-offset-[3px] hover:text-[var(--teal-deep)] ${FOCUS}`}
          >
            {related.label}
          </Link>
        </p>
      </article>
    </div>
  );
}

type Row = { label: string; what: ReactNode; why: ReactNode; keep: ReactNode };

// "Ne, neden, ne kadar" tablosu. Geniş ekranda üç sütun; telefonda her satır
// kendi etiketleriyle alt alta okunur, yatay kaydırma gerekmez.
export function DataRows({ rows }: { rows: Row[] }) {
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-[var(--line)]">
      <div
        aria-hidden
        className={`hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_minmax(0,1.3fr)_minmax(0,1.2fr)] gap-6 border-b border-[var(--line)] bg-[var(--doc-ground)] px-5 py-3 md:grid ${MICRO}`}
      >
        <span>Ne zaman</span>
        <span>Hangi bilgi</span>
        <span>Neden</span>
        <span>Ne kadar süre</span>
      </div>
      <dl>
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-3 border-t border-[var(--line)] px-5 py-5 first:border-t-0 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_minmax(0,1.3fr)_minmax(0,1.2fr)] md:gap-6"
          >
            <dt className="font-display text-[0.9375rem] leading-snug font-bold text-[var(--ink)]">
              {row.label}
            </dt>
            {(
              [
                ["Hangi bilgi", row.what],
                ["Neden", row.why],
                ["Ne kadar süre", row.keep],
              ] as const
            ).map(([caption, value]) => (
              <dd key={caption} className="text-[0.9375rem] leading-relaxed text-[var(--ink-soft)]">
                <span className={`mb-1 block md:hidden ${MICRO}`}>{caption}</span>
                {value}
              </dd>
            ))}
          </div>
        ))}
      </dl>
    </div>
  );
}

const LINK = `font-semibold text-[var(--teal)] underline decoration-1 underline-offset-[3px] hover:text-[var(--teal-deep)] ${FOCUS}`;

export function Mail() {
  return (
    <a href="mailto:info@hedefimlise.com" className={LINK}>
      info@hedefimlise.com
    </a>
  );
}

export function DocLink({ href, children }: { href: string; children: ReactNode }) {
  if (href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={LINK}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={LINK}>
      {children}
    </Link>
  );
}
