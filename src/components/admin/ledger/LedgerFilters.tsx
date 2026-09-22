"use client";

import { useRef, useState } from "react";
import { Search } from "lucide-react";
import { HEALTH_CHECKS } from "@/lib/school-health";
import {
  LEDGER_SORT_LABELS,
  countActiveFilters,
  type LedgerFilters as Filters,
  type LedgerMissing,
  type LedgerSort,
  type LedgerStatus,
} from "@/lib/admin-ledger";
import { adminInput } from "@/components/admin/ui/styles";
import { AdminButton } from "@/components/admin/ui/Button";
import { cn } from "@/lib/cn";

type Props = {
  filters: Filters;
  districts: string[];
  types: string[];
  shown: number;
  total: number;
  onChange: (next: Filters) => void;
};

const selectClass = cn(adminInput, "w-auto min-w-0 max-w-full");

export function LedgerFilters({ filters, districts, types, shown, total, onChange }: Props) {
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
        <label className="relative min-w-56 flex-1">
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
          className={cn(selectClass, filters.eksik && "border-admin-accent-soft bg-admin-tint text-admin-tint-ink")}
        >
          <option value="">Eksik: hepsi</option>
          <option value="herhangi">Eksiği olan</option>
          {HEALTH_CHECKS.map((check) => (
            <option key={check.id} value={check.id}>
              Eksik: {check.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Sıralama"
          value={filters.sirala}
          onChange={(event) => onChange({ ...filters, sirala: event.target.value as LedgerSort })}
          className={selectClass}
        >
          {Object.entries(LEDGER_SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex min-h-8 items-center justify-between gap-3 text-xs text-admin-muted">
        <span className="tabular-nums" aria-live="polite">
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
      </div>
    </div>
  );
}
