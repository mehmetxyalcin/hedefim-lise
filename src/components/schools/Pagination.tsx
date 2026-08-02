import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string>;
};

function buildHref(page: number, searchParams: Record<string, string>): string {
  const params = new URLSearchParams(searchParams);
  if (page === 1) {
    params.delete("sayfa");
  } else {
    params.set("sayfa", String(page));
  }
  const qs = params.toString();
  return `/okullar${qs ? `?${qs}` : ""}`;
}

function buildPageList(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  for (let i = Math.max(2, current - 2); i <= Math.min(total - 1, current + 2); i++) {
    pages.add(i);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: (number | "...")[] = [];

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push("...");
    }
    result.push(sorted[i]);
  }

  return result;
}

export function Pagination({ currentPage, totalPages, searchParams }: Props) {
  if (totalPages <= 1) return null;

  const pageList = buildPageList(currentPage, totalPages);
  const prevHref = currentPage > 1 ? buildHref(currentPage - 1, searchParams) : null;
  const nextHref = currentPage < totalPages ? buildHref(currentPage + 1, searchParams) : null;

  return (
    <div className="mt-8 flex items-center justify-center gap-1">
      {prevHref ? (
        <Link
          href={prevHref}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 sm:h-10 sm:w-10"
          aria-label="Önceki sayfa"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className="flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-300 sm:h-10 sm:w-10">
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      <div className="hidden items-center gap-1 sm:flex">
        {pageList.map((page, i) =>
          page === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="flex h-10 w-10 items-center justify-center text-sm text-slate-400"
            >
              …
            </span>
          ) : (
            <Link
              key={page}
              href={buildHref(page, searchParams)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition-colors ${
                page === currentPage
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </Link>
          ),
        )}
      </div>

      <span className="flex h-10 items-center px-4 text-sm font-semibold text-slate-700 sm:hidden">
        {currentPage}/{totalPages}
      </span>

      {nextHref ? (
        <Link
          href={nextHref}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 sm:h-10 sm:w-10"
          aria-label="Sonraki sayfa"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-300 sm:h-10 sm:w-10">
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}
