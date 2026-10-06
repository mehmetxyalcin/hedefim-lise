import Link from "next/link";
import { cn } from "@/lib/cn";
import { adminFocus } from "@/components/admin/ui/styles";
import { QA_TABS, qaAdminHref, type QaTab } from "@/lib/qa-admin";

type Props = {
  active: QaTab;
  counts: Record<QaTab, number | null>;
  /** Gelen sorular sekmesinde bekleyen yeni soru sayısı. */
  newCount: number;
};

export function QaTabs({ active, counts, newCount }: Props) {
  return (
    <nav aria-label="Soru-cevap bölümleri" className="mb-6 flex gap-1 overflow-x-auto border-b border-admin-line">
      {QA_TABS.map((tab) => {
        const isActive = tab.key === active;
        const count = counts[tab.key];
        return (
          <Link
            key={tab.key}
            href={qaAdminHref({ sekme: tab.key })}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "-mb-px inline-flex items-center gap-2 border-b-2 px-3 pt-2 pb-2.5 text-sm whitespace-nowrap transition-colors",
              isActive
                ? "border-admin-accent font-semibold text-admin-ink"
                : "border-transparent text-admin-muted hover:text-admin-ink",
              adminFocus,
            )}
          >
            {tab.label}
            {tab.key === "gelen" && newCount > 0 ? (
              <span className="rounded-full bg-admin-accent px-1.5 py-px text-xs font-semibold text-white tabular-nums">
                {newCount}
                <span className="sr-only"> yeni</span>
              </span>
            ) : count !== null ? (
              <span className="text-xs text-admin-muted tabular-nums">{count}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
