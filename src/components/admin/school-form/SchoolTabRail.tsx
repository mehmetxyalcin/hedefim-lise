"use client";

import { useEffect, useRef } from "react";
import { Lock } from "lucide-react";
import { missingTabs, type SchoolHealth } from "@/lib/school-health";
import { cn } from "@/lib/cn";
import { adminFocus } from "@/components/admin/ui/styles";

type Tab = { id: string; label: string };

type Props = {
  tabs: Tab[];
  activeTab: string;
  hrefFor: (id: string) => string;
  health?: SchoolHealth;
  lockedTabs: string[];
};

// Sekmeler düz <a href>: UnsavedChangesWarning bağlantı tıklamalarını yakalar.
export function SchoolTabRail({ tabs, activeTab, hrefFor, health, lockedTabs }: Props) {
  const gaps: Set<string> = health ? missingTabs(health) : new Set();
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Dar ekranda sekmeler yatay kayar: etkin sekme görünür alana gelsin.
  useEffect(() => {
    activeRef.current?.scrollIntoView?.({ block: "nearest", inline: "center" });
  }, [activeTab]);

  return (
    <nav
      aria-label="Okul bölümleri"
      className="rounded-xl border border-admin-line bg-white shadow-admin-card lg:sticky lg:top-20"
    >
      {health && (
        <div className="hidden border-b border-admin-line px-4 py-3 lg:block">
          <p className="text-xs text-admin-muted">Veri sağlığı</p>
          <p className="text-sm font-bold text-admin-ink tabular-nums">
            {health.required - health.missing} / {health.required} tamam
          </p>
        </div>
      )}
      <ul className="hide-scrollbar flex gap-0.5 overflow-x-auto p-1.5 lg:flex-col lg:overflow-visible">
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          const locked = lockedTabs.includes(tab.id);
          const hasGap = gaps.has(tab.id);
          const body = (
            <>
              <span className="flex-1 whitespace-nowrap">{tab.label}</span>
              {locked && <Lock aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}
              {!locked && hasGap && (
                <>
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-[3px] border-[1.5px] border-admin-missing"
                  />
                  <span className="sr-only">(eksik var)</span>
                </>
              )}
            </>
          );
          const classes = cn(
            "flex h-9 items-center gap-2 rounded-lg px-3 text-sm transition-colors duration-150",
            active ? "bg-admin-tint font-semibold text-admin-tint-ink" : "text-admin-body hover:bg-admin-line-soft",
          );
          return (
            <li key={tab.id} className="shrink-0">
              {locked ? (
                <span
                  aria-disabled="true"
                  title="Önce temel bilgileri kaydedin"
                  className={cn(classes, "cursor-not-allowed text-admin-faint hover:bg-transparent")}
                >
                  {body}
                </span>
              ) : (
                <a
                  ref={active ? activeRef : undefined}
                  href={hrefFor(tab.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(classes, adminFocus)}
                >
                  {body}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
