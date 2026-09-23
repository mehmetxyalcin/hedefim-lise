"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SearchX } from "lucide-react";
import {
  applyLedgerFilters,
  ledgerSearch,
  parseLedgerFilters,
  type LedgerFilters as Filters,
  type LedgerRow,
} from "@/lib/admin-ledger";
import { LedgerFilters } from "@/components/admin/ledger/LedgerFilters";
import { LedgerTable } from "@/components/admin/ledger/LedgerTable";
import { SchoolDetailPanel } from "@/components/admin/ledger/SchoolDetailPanel";
import { BulkActionBar } from "@/components/admin/ledger/BulkActionBar";
import { HealthLegend } from "@/components/admin/ui/HealthPips";
import { HEALTH_CHECKS, countMissing, type HealthCheckId } from "@/lib/school-health";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { AdminButton } from "@/components/admin/ui/Button";

type Action = (formData: FormData) => void | Promise<void>;

type Props = {
  rows: LedgerRow[];
  nowIso: string;
  bulkStatusAction: Action;
  toggleStatusAction: Action;
  deleteAction: Action;
};

const compareText = (a: string, b: string) => a.localeCompare(b, "tr", { sensitivity: "base" });

export function SchoolLedger({ rows, nowIso, bulkStatusAction, toggleStatusAction, deleteAction }: Props) {
  const pathname = usePathname() ?? "/admin";
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseLedgerFilters(searchParams), [searchParams]);
  const selectedSlug = searchParams.get("okul");
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const [checked, setChecked] = useState<Set<number>>(() => new Set());
  const lastOpener = useRef<string | null>(null);

  const districts = useMemo(
    () => [...new Set(rows.map((row) => row.district).filter(Boolean))].sort(compareText),
    [rows],
  );
  const types = useMemo(
    () => [...new Set(rows.map((row) => row.type).filter(Boolean))].sort(compareText),
    [rows],
  );
  const visible = useMemo(() => applyLedgerFilters(rows, filters), [rows, filters]);
  const missingCounts = useMemo(() => {
    const healths = rows.map((row) => row.health);
    return Object.fromEntries(
      HEALTH_CHECKS.map((check) => [check.id, countMissing(healths, check.id)]),
    ) as Record<HealthCheckId, number>;
  }, [rows]);
  const incompleteCount = useMemo(() => rows.filter((row) => !row.health.complete).length, [rows]);
  const selected = selectedSlug ? (rows.find((row) => row.slug === selectedSlug) ?? null) : null;
  const checkedIds = useMemo(() => {
    const known = new Set(rows.map((row) => row.id));
    return [...checked].filter((id) => known.has(id));
  }, [checked, rows]);
  const checkedSet = useMemo(() => new Set(checkedIds), [checkedIds]);

  // Filtreler istemcide uygulanır; URL yalnız paylaşım ve geri tuşu için.
  // Native replaceState, Next yönlendiricisiyle eşleşir ve sunucu turu yapmaz.
  const navigate = useCallback(
    (next: Filters, okul: string | null) => {
      window.history.replaceState(null, "", `${pathname}${ledgerSearch(next, { okul })}`);
    },
    [pathname],
  );

  const close = useCallback(() => {
    navigate(filters, null);
    const slug = lastOpener.current;
    if (slug) {
      window.requestAnimationFrame(() =>
        document.querySelector<HTMLElement>(`[data-ledger-slug="${CSS.escape(slug)}"]`)?.focus(),
      );
    }
  }, [filters, navigate]);

  function toggle(id: number) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setChecked((current) => {
      const next = new Set(current);
      const allVisible = visible.length > 0 && visible.every((row) => next.has(row.id));
      for (const row of visible) {
        if (allVisible) next.delete(row.id);
        else next.add(row.id);
      }
      return next;
    });
  }

  return (
    <div className={selected ? "grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start" : undefined}>
      <div className="min-w-0">
        <LedgerFilters
          key={filters.ara}
          filters={filters}
          districts={districts}
          types={types}
          shown={visible.length}
          total={rows.length}
          missingCounts={missingCounts}
          incompleteCount={incompleteCount}
          compact={Boolean(selected)}
          onChange={(next) => navigate(next, selectedSlug)}
        />
        <div className="mb-3">
          <HealthLegend />
        </div>
        {visible.length === 0 ? (
          <div className="rounded-xl border border-admin-line bg-white shadow-admin-card">
            <EmptyState
              icon={<SearchX aria-hidden="true" className="h-8 w-8" />}
              title="Bu filtrelere uyan okul yok"
              body="Filtreleri gevşetin ya da sıfırlayın."
              action={
                <AdminButton
                  onClick={() =>
                    navigate({ ...filters, ara: "", ilce: null, tur: null, durum: null, eksik: null }, null)
                  }
                >
                  Filtreleri sıfırla
                </AdminButton>
              }
            />
          </div>
        ) : (
          <LedgerTable
            rows={visible}
            now={now}
            selectedSlug={selectedSlug}
            checkedIds={checkedSet}
            onOpen={(slug) => {
              lastOpener.current = slug;
              navigate(filters, slug);
            }}
            onToggleChecked={toggle}
            onToggleAll={toggleAll}
            activeMissing={filters.eksik}
            missingCounts={missingCounts}
            onFilterMissing={(id) => navigate({ ...filters, eksik: id }, selectedSlug)}
          />
        )}
        <BulkActionBar ids={checkedIds} onClear={() => setChecked(new Set())} action={bulkStatusAction} />
      </div>
      {selected && (
        <SchoolDetailPanel
          row={selected}
          onClose={close}
          toggleStatusAction={toggleStatusAction}
          deleteAction={deleteAction}
        />
      )}
    </div>
  );
}
