"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";

type SchoolScore = {
  year: number;
  obp_score: number | null;
  lgs_score: number | null;
  percentile: number | null;
};

type Props = { scores: SchoolScore[] };

function getPercentileColor(p: number) {
  if (p <= 20) return "bg-red-500";
  if (p <= 40) return "bg-orange-500";
  if (p <= 60) return "bg-yellow-500";
  if (p <= 80) return "bg-green-500";
  return "bg-blue-500";
}

function getPercentileLabel(p: number) {
  if (p <= 20) return "Çok yüksek başarı gerekiyor";
  if (p <= 40) return "Yüksek başarı gerekiyor";
  if (p <= 60) return "Orta düzey başarı gerekiyor";
  if (p <= 80) return "Düşük-orta başarı gerekiyor";
  return "Geniş kontenjan";
}

export function SchoolScoreCard({ scores }: Props) {
  if (!scores || scores.length === 0) return null;

  const sorted = [...scores].sort((a, b) => b.year - a.year);

  const [activeYear, setActiveYear] = useState(sorted[0].year);
  const active = sorted.find((s) => s.year === activeYear)!;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">Puan Bilgileri</h2>
      </div>

      {/* Yıl Tabları */}
      <div className="mb-5 flex gap-1 rounded-xl bg-gray-100 p-1">
        {sorted.map((s) => (
          <button
            key={s.year}
            type="button"
            onClick={() => setActiveYear(s.year)}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-all duration-150 ${
              activeYear === s.year
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {s.year}
          </button>
        ))}
      </div>

      {/* Yüzdelik Dilim */}
      {active.percentile != null && (
        <div className="mb-5">
          <div className="mb-2 flex items-end justify-between">
            <span className="text-sm text-gray-500">Taban Yüzdelik Dilim</span>
            <span className="text-3xl font-bold text-gray-900">
              %{active.percentile.toFixed(2)}
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-100">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${getPercentileColor(active.percentile)}`}
              style={{ width: `${active.percentile}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            {getPercentileLabel(active.percentile)}
          </p>
        </div>
      )}

      {/* OBP Puanı */}
      {active.obp_score != null && (
        <div className="flex items-center justify-between border-t border-gray-100 py-3">
          <span className="text-sm text-gray-600">OBP Puanı</span>
          <span className="font-semibold text-gray-800">
            {active.obp_score.toFixed(2)}
          </span>
        </div>
      )}

      {/* LGS Puanı */}
      {active.lgs_score != null && (
        <div className="flex items-center justify-between border-t border-gray-100 py-3">
          <span className="text-sm text-gray-600">LGS Puanı</span>
          <span className="font-semibold text-gray-800">
            {active.lgs_score.toFixed(2)}
          </span>
        </div>
      )}

      {/* Hiç veri yoksa */}
      {active.percentile == null &&
        active.obp_score == null &&
        active.lgs_score == null && (
          <p className="py-2 text-center text-sm text-gray-400">
            {activeYear} yılı puan bilgisi henüz eklenmemiş.
          </p>
        )}
    </div>
  );
}
