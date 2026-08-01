"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";

type SchoolQuota = {
  year: number;
  sinavli_count: number | null;
  sinavsiz_count: number | null;
};

type Props = { quotas: SchoolQuota[] };

export function SchoolQuotaCard({ quotas }: Props) {
  if (!quotas || quotas.length === 0) return null;

  const sorted = [...quotas].sort((a, b) => b.year - a.year);

  const [activeYear, setActiveYear] = useState(sorted[0].year);
  const active = sorted.find((q) => q.year === activeYear)!;

  return (
    <SectionCard icon={Users} title="Kontenjan Bilgileri">
      {/* Yıl Tabları */}
      <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1">
        {sorted.map((q) => (
          <button
            key={q.year}
            type="button"
            onClick={() => setActiveYear(q.year)}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-all duration-150 ${
              activeYear === q.year
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {q.year}
          </button>
        ))}
      </div>

      {/* Kontenjan Bilgileri */}
      <div className="space-y-3">
        {active.sinavli_count != null && (
          <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
            <div>
              <p className="text-xs font-medium text-blue-500">Sınavlı Kontenjan</p>
              <p className="text-2xl font-bold text-blue-700">
                {active.sinavli_count}
                <span className="ml-1 text-sm font-normal">öğrenci</span>
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-200" />
          </div>
        )}

        {active.sinavsiz_count != null && (
          <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
            <div>
              <p className="text-xs font-medium text-emerald-500">Sınavsız Kontenjan</p>
              <p className="text-2xl font-bold text-emerald-700">
                {active.sinavsiz_count}
                <span className="ml-1 text-sm font-normal">öğrenci</span>
              </p>
            </div>
            <Users className="h-8 w-8 text-emerald-200" />
          </div>
        )}

        {active.sinavli_count == null && active.sinavsiz_count == null && (
          <p className="py-2 text-center text-sm text-slate-400">
            {activeYear} yılı kontenjan bilgisi henüz eklenmemiş.
          </p>
        )}
      </div>
    </SectionCard>
  );
}
