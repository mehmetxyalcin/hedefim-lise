"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import type { TocEntry } from "@/lib/blog-markdown";

// Okunan bölüm ve ilerleme: başlıkların ekrandaki konumundan hesaplanır.
// Etkin bölüm renkle değil şekille işaretlenir: küçük kare, uzun mürekkep çubuğa döner.
function useReadingPosition(entries: TocEntry[], articleId: string) {
  const [active, setActive] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const threshold = window.innerHeight * 0.3;
      let current: string | null = null;
      for (const entry of entries) {
        const element = document.getElementById(entry.id);
        if (element && element.getBoundingClientRect().top <= threshold) current = entry.id;
      }
      setActive(current);

      const article = document.getElementById(articleId);
      if (article) {
        const rect = article.getBoundingClientRect();
        const total = rect.height - window.innerHeight * 0.6;
        setProgress(total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [entries, articleId]);

  return { active, progress };
}

function TocList({ entries, active, onNavigate }: { entries: TocEntry[]; active: string | null; onNavigate?: () => void }) {
  return (
    <ol className="space-y-0.5">
      {entries.map((entry) => {
        const current = entry.id === active;
        return (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              onClick={onNavigate}
              aria-current={current ? "location" : undefined}
              className={cn(
                "group relative flex items-start gap-3 rounded-[3px] py-1.5 pr-2 text-[0.9375rem] leading-snug transition-colors duration-150 hover:text-blog-ink",
                entry.level === 3 ? "pl-7" : "pl-0",
                current ? "font-semibold text-blog-ink" : "text-blog-muted",
              )}
            >
              <span aria-hidden="true" className="flex h-[1.375em] w-4 shrink-0 items-center">
                <span
                  className={cn(
                    "block rounded-[1px] transition-all duration-200 ease-out",
                    current ? "h-[3px] w-4 bg-blog-ink" : "h-1.5 w-1.5 bg-blog-line group-hover:bg-blog-ink",
                  )}
                />
              </span>
              <span>{entry.text}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}

export function ArticleToc({ entries, articleId }: { entries: TocEntry[]; articleId: string }) {
  const { active, progress } = useReadingPosition(entries, articleId);
  const [open, setOpen] = useState(false);

  if (!entries.length) return null;

  return (
    <>
      {/* Geniş ekran: kenar sütununda sabit bölge. */}
      <nav aria-label="Bu yazıda" className="hidden font-blog-display lg:block">
        <p className="mb-3 text-[0.8125rem] font-bold tracking-[0.06em] text-blog-ink uppercase">Bu yazıda</p>
        <div className="mb-4 h-[3px] w-full overflow-hidden rounded-full bg-blog-line" aria-hidden="true">
          <div
            className="h-full origin-left bg-blog-ink transition-transform duration-150 ease-out"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
        <TocList entries={entries} active={active} />
      </nav>

      {/* Dar ekran: katlanmış paket, dokununca açılır. */}
      <div className="font-blog-display lg:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="blog-toc-mobile"
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-3 rounded-[4px] bg-blog-sheet px-4 py-3.5 text-left text-[0.9375rem] font-semibold text-blog-ink"
        >
          <span>
            Bu yazıda <span className="font-normal text-blog-muted tabular-nums">· {entries.length} bölüm</span>
          </span>
          <ChevronDown aria-hidden="true" className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")} />
        </button>
        <div id="blog-toc-mobile" hidden={!open} className="px-4 pt-3 pb-1">
          <TocList entries={entries} active={active} onNavigate={() => setOpen(false)} />
        </div>
      </div>
    </>
  );
}
