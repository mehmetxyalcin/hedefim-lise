"use client";

import { useRef, useState } from "react";
import { Search } from "lucide-react";
import { HEALTH_CHECKS, type HealthCheckId } from "@/lib/school-health";
import {
  LEDGER_SORT_LABELS,
  countActiveFilters,
  type LedgerFilters as Filters,
  type LedgerMissing,
  type LedgerSort,
  type LedgerStatus,
} from "@/lib/admin-ledger";
import { adminControl, adminInput } from "@/components/admin/ui/styles";
import { AdminButton } from "@/components/admin/ui/Button";
import { cn } from "@/lib/cn";

type Props = {
  filters: Filters;
  districts: string[];
  types: string[];
  shown: number;
  total: number;
  // Kontrol başına eksik okul sayısı; seçenekler aynı zamanda sıralama gibi okunur.
  missingCounts: Record<HealthCheckId, number>;
  incompleteCount: number;
  // Künye paneli açıkken satır daralır: arama kendi satırına geçer.
  compact: boolean;
  onChange: (next: Filters) => void;
};

// Mobilde satır başına iki kutu; geniş ekranda içeriğe göre, en fazla 11rem.
const selectClass = cn(adminControl, "min-w-0 grow basis-[calc(50%-0.25rem)] sm:max-w-44 sm:grow-0 sm:basis-auto");

export function LedgerFilters({
  filters,
  districts,
  types,
  shown,
  total,
  missingCounts,
  incompleteCount,
  compact,
  onChange,
}: Props) {
  const [query, setQuery] = useState(filters.ara);
  const timer = useRef<number | undefined>(undefined);
  const active = countActiveFilters(filters);

  function onQuery(value: string) {
    setQuery(value);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onChange({ ...filters, ara: value.trim() }), 200);
  }

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className={cn("relative w-full min-w-0", !compact && "sm:w-auto sm:min-w-56 sm:flex-1")}>
          <span className="sr-only">Bu listede ara</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-admin-faint"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Ad, ilçe, tür veya slug"
            className={cn(adminInput, "pl-9")}
          />
        </label>
        <select
          aria-label="İlçe"
          value={filters.ilce ?? ""}
          onChange={(event) => onChange({ ...filters, ilce: event.target.value || null })}
          className={selectClass}
        >
          <option value="">Tüm ilçeler</option>
          {districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
        <select
          aria-label="Okul türü"
          value={filters.tur ?? ""}
          onChange={(event) => onChange({ ...filters, tur: event.target.value || null })}
          className={selectClass}
        >
          <option value="">Tüm türler</option>
          {types.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <select
          aria-label="Durum"
          value={filters.durum ?? ""}
          onChange={(event) =>
            onChange({ ...filters, durum: (event.target.value || null) as LedgerStatus | null })
          }
          className={selectClass}
        >
          <option value="">Tüm durumlar</option>
          <option value="aktif">Yayında</option>
          <option value="pasif">Pasif</option>
        </select>
        <select
          aria-label="Eksik kontrol"
          value={filters.eksik ?? ""}
          onChange={(event) =>
            onChange({ ...filters, eksik: (event.target.value || null) as LedgerMissing | null })
          }
          className={cn(
            filters.eksik
              ? "min-h-10 min-w-0 grow basis-[calc(50%-0.25rem)] sm:max-w-44 sm:grow-0 sm:basis-auto rounded-lg border border-admin-accent-soft bg-admin-tint px-3 py-2 text-sm font-medium text-admin-tint-ink outline-none focus:ring-2 focus:ring-admin-accent/20"
              : selectClass,
          )}
        >
          <option value="">Eksik: hepsi</option>
          <option value="herhangi">Eksiği olan ({incompleteCount})</option>
          {HEALTH_CHECKS.map((check) => (
            <option key={check.id} value={check.id}>
              Eksik: {check.label} ({missingCounts[check.id]})
            </option>
          ))}
        </select>

      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-admin-muted">
        <span className="mr-auto tabular-nums" aria-live="polite">
          {shown} / {total} okul
        </span>
        {active > 0 && (
          <AdminButton
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              onChange({ ara: "", ilce: null, tur: null, durum: null, eksik: null, sirala: filters.sirala });
            }}
          >
            Filtreleri sıfırla ({active})
          </AdminButton>
        )}
        <label className="flex items-center gap-2">
          <span aria-hidden="true">Sırala</span>
          <select
            aria-label="Sıralama"
            value={filters.sirala}
            onChange={(event) => onChange({ ...filters, sirala: event.target.value as LedgerSort })}
            className={adminControl}
          >
            {Object.entries(LEDGER_SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
