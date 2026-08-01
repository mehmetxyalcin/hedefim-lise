"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";

type VocationalField = { id: number; name: string };

type SchoolScore = {
  id: string;
  year: number;
  obp_score: number | null;
  lgs_score: number | null;
  percentile: number | null;
  vocational_field_id: number | null;
  vocational_field?: VocationalField | null;
};

type Props = { scores: SchoolScore[] };

function getPercentileColor(p: number) {
  if (p <= 20) return "bg-rose-500";
  if (p <= 40) return "bg-orange-500";
  if (p <= 60) return "bg-amber-500";
  if (p <= 80) return "bg-emerald-500";
  return "bg-blue-500";
}

function getPercentileTextColor(p: number) {
  if (p <= 20) return "text-rose-600";
  if (p <= 40) return "text-orange-600";
  if (p <= 60) return "text-amber-600";
  if (p <= 80) return "text-emerald-600";
  return "text-blue-600";
}

function getPercentileLabel(p: number) {
  if (p <= 20) return "Çok yüksek başarı gerekiyor";
  if (p <= 40) return "Yüksek başarı gerekiyor";
  if (p <= 60) return "Orta düzey başarı gerekiyor";
  if (p <= 80) return "Düşük-orta başarı gerekiyor";
  return "Geniş kontenjan";
}

export function SchoolScoreCard({ scores }: Props) {
  // Hook'lar koşulsuz çağrılmalı: yıl listesini ve state'i erken return'den önce kur.
  const years = [...new Set((scores ?? []).map((s) => s.year))].sort((a, b) => b - a);
  const [activeYear, setActiveYear] = useState(years[0]);

  if (!scores || scores.length === 0) return null;

  const activeYearScores = scores.filter((s) => s.year === activeYear);

  const isSingleSchoolWide =
    activeYearScores.length === 1 && !activeYearScores[0].vocational_field_id;

  return (
    <SectionCard icon={TrendingUp} title="Puan Bilgileri">

      {/* Yıl Tabları */}
      <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1">
        {years.map((year) => (
          <button
            key={year}
            type="button"
            onClick={() => setActiveYear(year)}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-all duration-150 ${
              activeYear === year
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Tek okul geneli puan → büyük görünüm */}
      {isSingleSchoolWide &&
        (() => {
          const active = activeYearScores[0];
          return (
            <>
              {active.percentile != null && (
                <div className="mb-5">
                  <div className="mb-2 flex items-end justify-between">
                    <span className="text-sm text-slate-500">Taban Yüzdelik Dilim</span>
                    <span className="tabular text-3xl font-bold text-slate-900">
                      %{active.percentile.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${getPercentileColor(active.percentile)}`}
                      style={{ width: `${active.percentile}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400">
                    {getPercentileLabel(active.percentile)}
                  </p>
                </div>
              )}
              {active.obp_score != null && (
                <div className="flex items-center justify-between border-t border-slate-100 py-3">
                  <span className="text-sm text-slate-600">OBP Puanı</span>
                  <span className="font-semibold text-slate-800">
                    {active.obp_score.toFixed(2)}
                  </span>
                </div>
              )}
              {active.lgs_score != null && (
                <div className="flex items-center justify-between border-t border-slate-100 py-3">
                  <span className="text-sm text-slate-600">LGS Puanı</span>
                  <span className="font-semibold text-slate-800">
                    {active.lgs_score.toFixed(4)}
                  </span>
                </div>
              )}
              {active.percentile == null &&
                active.obp_score == null &&
                active.lgs_score == null && (
                  <p className="py-2 text-center text-sm text-slate-400">
                    {activeYear} yılı puan bilgisi henüz eklenmemiş.
                  </p>
                )}
            </>
          );
        })()}

      {/* Çok satır / meslek alanı bazlı → tablo */}
      {!isSingleSchoolWide && activeYearScores.length > 0 && (
        <div className="overflow-x-auto">
          <table className="tabular w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-1 py-2 text-left text-xs font-medium text-slate-500">
                  Meslek Alanı
                </th>
                <th className="px-1 py-2 text-right text-xs font-medium text-slate-500">OBP</th>
                <th className="px-1 py-2 text-right text-xs font-medium text-slate-500">LGS</th>
                <th className="px-1 py-2 text-right text-xs font-medium text-slate-500">
                  Yüzdelik
                </th>
              </tr>
            </thead>
            <tbody>
              {activeYearScores.map((score) => (
                <tr key={score.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-1 py-2.5 text-slate-700">
                    {score.vocational_field?.name ?? (
                      <span className="italic text-slate-400">Okul Geneli</span>
                    )}
                  </td>
                  <td className="px-1 py-2.5 text-right font-medium text-slate-800">
                    {score.obp_score != null ? score.obp_score.toFixed(2) : "—"}
                  </td>
                  <td className="px-1 py-2.5 text-right font-medium text-slate-800">
                    {score.lgs_score != null ? score.lgs_score.toFixed(4) : "—"}
                  </td>
                  <td className="px-1 py-2.5 text-right">
                    {score.percentile != null ? (
                      <span
                        className={`font-semibold ${getPercentileTextColor(score.percentile)}`}
                      >
                        %{score.percentile.toFixed(2)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeYearScores.length === 0 && (
        <p className="py-2 text-center text-sm text-slate-400">
          {activeYear} yılı puan bilgisi henüz eklenmemiş.
        </p>
      )}
    </SectionCard>
  );
}
