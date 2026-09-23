"use client";

import { useEffect, useRef } from "react";
import { HEALTH_CHECKS, type HealthCheckId } from "@/lib/school-health";
import { formatFullDate, formatRelativeDate, type LedgerRow } from "@/lib/admin-ledger";
import { HealthCodes, HealthPips } from "@/components/admin/ui/HealthPips";
import { cn } from "@/lib/cn";
import { adminFocus } from "@/components/admin/ui/styles";

type Props = {
  rows: LedgerRow[];
  now: Date;
  selectedSlug: string | null;
  checkedIds: Set<number>;
  onOpen: (slug: string) => void;
  onToggleChecked: (id: number) => void;
  onToggleAll: () => void;
  activeMissing: string | null;
  missingCounts: Record<HealthCheckId, number>;
  onFilterMissing: (id: HealthCheckId | null) => void;
};

export function LedgerTable({
  rows,
  now,
  selectedSlug,
  checkedIds,
  onOpen,
  onToggleChecked,
  onToggleAll,
  activeMissing,
  missingCounts,
  onFilterMissing,
}: Props) {
  const allRef = useRef<HTMLInputElement>(null);
  const checkedVisible = rows.filter((row) => checkedIds.has(row.id)).length;
  const allChecked = rows.length > 0 && checkedVisible === rows.length;

  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = checkedVisible > 0 && !allChecked;
  }, [checkedVisible, allChecked]);

  return (
    <div className="rounded-xl border border-admin-line bg-white shadow-admin-card">
      <table className="w-full table-fixed border-collapse text-left text-sm">
        <thead className="sticky top-16 z-10 text-xs text-admin-muted">
          <tr className="border-b border-admin-line">
            <th scope="col" className="w-11 rounded-tl-xl bg-admin-ground/95 py-2.5 pl-4 backdrop-blur">
              <input
                ref={allRef}
                type="checkbox"
                checked={allChecked}
                disabled={rows.length === 0}
                onChange={onToggleAll}
                aria-label="Görünen okulların hepsini seç"
                className="h-4 w-4"
              />
            </th>
            <th scope="col" className="bg-admin-ground/95 py-2.5 pr-3 font-semibold backdrop-blur">
              Okul
            </th>
            <th
              scope="col"
              className="hidden w-[124px] bg-admin-ground/95 py-2.5 pr-3 font-semibold backdrop-blur md:table-cell"
            >
              {/* Kodlar aynı zamanda filtre: tıklayınca o kontrolde eksik okullar kalır. */}
              <span className="inline-flex items-center gap-1 text-[11px] leading-none">
                {HEALTH_CHECKS.map((check) => {
                  const active = activeMissing === check.id;
                  return (
                    <button
                      key={check.id}
                      type="button"
                      onClick={() => onFilterMissing(active ? null : check.id)}
                      aria-pressed={active}
                      title={`${check.label}: ${missingCounts[check.id]} okulda eksik${active ? " (filtreyi kaldır)" : ""}`}
                      aria-label={`${check.label} eksik olanları göster (${missingCounts[check.id]})`}
                      className={cn(
                        "flex h-5 w-2.5 items-center justify-center rounded-sm",
                        active ? "bg-admin-tint text-admin-tint-ink" : "hover:text-admin-ink",
                        adminFocus,
                      )}
                    >
                      <HealthCodes id={check.id} />
                    </button>
                  );
                })}
              </span>
            </th>
            <th
              scope="col"
              className="hidden w-28 rounded-tr-xl bg-admin-ground/95 py-2.5 pr-4 text-right font-semibold backdrop-blur md:table-cell"
            >
              Güncel
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const selected = row.slug === selectedSlug;
            return (
              <tr
                key={row.id}
                onClick={() => onOpen(row.slug)}
                className={cn(
                  "cursor-pointer border-b border-admin-line-soft transition-colors duration-150 last:border-0",
                  selected ? "bg-admin-tint" : "hover:bg-admin-ground",
                )}
              >
                <td className="py-2.5 pl-4 align-top" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={checkedIds.has(row.id)}
                    onChange={() => onToggleChecked(row.id)}
                    aria-label={`${row.name} okulunu seç`}
                    className="mt-0.5 h-4 w-4"
                  />
                </td>
                <td className="py-2.5 pr-3">
                  <button
                    type="button"
                    data-ledger-slug={row.slug}
                    aria-pressed={selected}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpen(row.slug);
                    }}
                    className={cn(
                      "block max-w-full rounded text-left font-semibold md:truncate",
                      selected ? "text-admin-tint-ink" : "text-admin-ink",
                      adminFocus,
                    )}
                  >
                    {row.name}
                  </button>
                  <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-admin-muted">
                    <span
                      aria-hidden="true"
                      className={cn("h-1.5 w-1.5 shrink-0 rounded-full", row.isActive ? "bg-emerald-600" : "bg-amber-600")}
                    />
                    <span className="shrink-0">{row.isActive ? "Yayında" : "Pasif"}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">
                      {row.district} · {row.type}
                    </span>
                  </span>
                  <span className="mt-1.5 block md:hidden">
                    <HealthPips items={row.health.items} />
                  </span>
                </td>
                <td className="hidden py-2.5 pr-3 md:table-cell">
                  <HealthPips items={row.health.items} />
                </td>
                <td
                  className="hidden py-2.5 pr-4 text-right text-xs whitespace-nowrap text-admin-muted tabular-nums md:table-cell"
                  title={formatFullDate(row.updatedAt)}
                >
                  {formatRelativeDate(row.updatedAt, now)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
