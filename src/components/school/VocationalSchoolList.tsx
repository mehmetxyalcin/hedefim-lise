"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { School, SchoolScoreRaw } from "@/types/school";

type Props = {
  schools: School[];
  fieldId: number;
};

const INITIAL_COUNT = 5;

function getRelevantScore(
  scores: SchoolScoreRaw[],
  fieldId: number,
): SchoolScoreRaw | null {
  if (!scores?.length) return null;

  const fieldScores = scores
    .filter((s) => s.vocational_field_id === fieldId)
    .sort((a, b) => b.year - a.year);

  if (fieldScores.length > 0) return fieldScores[0];

  // == null catches both null and undefined (migration fallback)
  const generalScores = scores
    .filter((s) => s.vocational_field_id == null)
    .sort((a, b) => b.year - a.year);

  return generalScores[0] ?? null;
}

function percentileColor(p: number): string {
  if (p <= 20) return "text-red-600";
  if (p <= 40) return "text-orange-600";
  if (p <= 60) return "text-yellow-600";
  if (p <= 80) return "text-green-600";
  return "text-blue-600";
}

export function VocationalSchoolList({ schools, fieldId }: Props) {
  const [showAll, setShowAll] = useState(false);
  const visibleSchools = showAll ? schools : schools.slice(0, INITIAL_COUNT);

  if (schools.length === 0) {
    return (
      <p className="text-sm italic text-slate-400">
        Bu alana bağlı okul bulunamadı.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {visibleSchools.map((school) => {
        const score = getRelevantScore(school.scores ?? [], fieldId);
        const hasPercentile =
          score?.percentile != null && score.percentile > 0;
        const hasObp = score?.obp_score != null && score.obp_score > 0;
        const hasScore = hasPercentile || hasObp;

        return (
          <Link
            key={school.id}
            href={`/okullar/${school.slug}`}
            className="group block cursor-pointer rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md"
          >
            <div className="mb-3">
              <div className="line-clamp-2 text-sm font-bold leading-tight text-slate-900 transition-colors group-hover:text-blue-600">
                {school.name}
              </div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {school.district}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs">
              {hasScore ? (
                <div className="flex flex-wrap items-center gap-3 text-slate-600">
                  {hasPercentile && (
                    <span>
                      Yüzdelik:{" "}
                      <span
                        className={`ml-1 font-semibold ${percentileColor(score!.percentile!)}`}
                      >
                        %{score!.percentile!.toFixed(2)}
                      </span>
                    </span>
                  )}
                  {hasObp && (
                    <span>
                      OBP:{" "}
                      <span className="ml-1 font-semibold text-slate-800">
                        {score!.obp_score!.toFixed(2)}
                      </span>
                    </span>
                  )}
                  <span className="text-slate-400">({score!.year})</span>
                </div>
              ) : (
                <span className="italic text-slate-400">
                  Puan bilgisi henüz eklenmemiş
                </span>
              )}
              <span className="ml-2 flex shrink-0 items-center font-semibold text-blue-600">
                İncele
                <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        );
      })}

      {schools.length > INITIAL_COUNT && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-2 w-full rounded-xl border border-blue-200 py-2.5 text-sm font-medium text-blue-600 transition-colors hover:border-blue-300 hover:text-blue-700"
        >
          {showAll
            ? "Daha Az Göster ↑"
            : `${schools.length - INITIAL_COUNT} okul daha göster ↓`}
        </button>
      )}
    </div>
  );
}
