"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { FormSubmitButton } from "@/components/admin/FormSubmitButton";
import type { SchoolScore, SchoolQuota } from "@/types/schoolDetail";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

type Props = {
  schoolId: number;
  scores: SchoolScore[];
  quotas: SchoolQuota[];
  upsertScore: (formData: FormData) => void | Promise<void>;
  upsertQuota: (formData: FormData) => void | Promise<void>;
  deleteScore: (formData: FormData) => void | Promise<void>;
  deleteQuota: (formData: FormData) => void | Promise<void>;
};

const YEARS = [2025, 2024, 2023];

export function ScoresTab({
  schoolId,
  scores,
  quotas,
  upsertScore,
  upsertQuota,
  deleteScore,
  deleteQuota,
}: Props) {
  const [editingScore, setEditingScore] = useState<number | null>(null);
  const [editingQuota, setEditingQuota] = useState<number | null>(null);

  function scoreForYear(year: number) {
    return scores.find((s) => s.year === year);
  }
  function quotaForYear(year: number) {
    return quotas.find((q) => q.year === year);
  }

  return (
    <div className="space-y-6">
      {/* Puan tablosu */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900">Puan Bilgileri</h2>
          <p className="mt-1 text-sm text-slate-500">
            Yıl bazlı OBP, LGS ve yüzdelik dilim verileri.
          </p>
        </div>

        <div className="space-y-3">
          {YEARS.map((year) => {
            const score = scoreForYear(year);
            const isEditing = editingScore === year;

            return (
              <div
                key={year}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">{year}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingScore(isEditing ? null : year)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      {isEditing ? "İptal" : score ? "Düzenle" : "Ekle"}
                    </button>
                    {score && !isEditing && (
                      <form action={deleteScore}>
                        <input type="hidden" name="id" value={score.id} />
                        <input type="hidden" name="school_id" value={schoolId} />
                        <button
                          type="submit"
                          className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-500 hover:bg-rose-100"
                          title="Sil"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {!isEditing && score && (
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    {score.obpScore !== null && (
                      <span>OBP: <strong>{score.obpScore}</strong></span>
                    )}
                    {score.lgsScore !== null && (
                      <span>LGS: <strong>{score.lgsScore}</strong></span>
                    )}
                    {score.percentile !== null && (
                      <span>Yüzdelik: <strong>%{score.percentile}</strong></span>
                    )}
                  </div>
                )}

                {!isEditing && !score && (
                  <p className="text-xs text-slate-400">Kayıt yok</p>
                )}

                {isEditing && (
                  <form
                    action={upsertScore}
                    onSubmit={() => setEditingScore(null)}
                    className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                  >
                    <input type="hidden" name="school_id" value={schoolId} />
                    <input type="hidden" name="year" value={year} />
                    {score?.id && <input type="hidden" name="id" value={score.id} />}

                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-slate-600">OBP</span>
                      <input
                        type="number"
                        name="obp_score"
                        step="0.001"
                        min="0"
                        max="100"
                        defaultValue={score?.obpScore ?? ""}
                        placeholder="0.000"
                        className={inputCls}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-slate-600">LGS Puanı</span>
                      <input
                        type="number"
                        name="lgs_score"
                        step="0.001"
                        min="0"
                        max="500"
                        defaultValue={score?.lgsScore ?? ""}
                        placeholder="0.000"
                        className={inputCls}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-slate-600">Yüzdelik (%)</span>
                      <input
                        type="number"
                        name="percentile"
                        step="0.001"
                        min="0"
                        max="100"
                        defaultValue={score?.percentile ?? ""}
                        placeholder="0.000"
                        className={inputCls}
                      />
                    </label>
                    <div className="col-span-full flex justify-end">
                      <FormSubmitButton label="Kaydet" pendingLabel="Kaydediliyor…" />
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Kontenjan tablosu */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900">Kontenjan Bilgileri</h2>
          <p className="mt-1 text-sm text-slate-500">
            Yıllık sınavlı ve sınavsız kontenjan sayıları.
          </p>
        </div>

        <div className="space-y-3">
          {YEARS.map((year) => {
            const quota = quotaForYear(year);
            const isEditing = editingQuota === year;

            return (
              <div
                key={year}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">{year}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingQuota(isEditing ? null : year)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      {isEditing ? "İptal" : quota ? "Düzenle" : "Ekle"}
                    </button>
                    {quota && !isEditing && (
                      <form action={deleteQuota}>
                        <input type="hidden" name="id" value={quota.id} />
                        <input type="hidden" name="school_id" value={schoolId} />
                        <button
                          type="submit"
                          className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-500 hover:bg-rose-100"
                          title="Sil"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {!isEditing && quota && (
                  <div className="flex gap-4 text-sm text-slate-600">
                    {quota.sinavliCount !== null && (
                      <span>Sınavlı: <strong>{quota.sinavliCount}</strong></span>
                    )}
                    {quota.sinavsizCount !== null && (
                      <span>Sınavsız: <strong>{quota.sinavsizCount}</strong></span>
                    )}
                  </div>
                )}
                {!isEditing && !quota && (
                  <p className="text-xs text-slate-400">Kayıt yok</p>
                )}

                {isEditing && (
                  <form
                    action={upsertQuota}
                    onSubmit={() => setEditingQuota(null)}
                    className="grid grid-cols-2 gap-3"
                  >
                    <input type="hidden" name="school_id" value={schoolId} />
                    <input type="hidden" name="year" value={year} />
                    {quota?.id && <input type="hidden" name="id" value={quota.id} />}

                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-slate-600">Sınavlı</span>
                      <input
                        type="number"
                        name="sinavli_count"
                        min="0"
                        defaultValue={quota?.sinavliCount ?? ""}
                        className={inputCls}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-slate-600">Sınavsız</span>
                      <input
                        type="number"
                        name="sinavsiz_count"
                        min="0"
                        defaultValue={quota?.sinavsizCount ?? ""}
                        className={inputCls}
                      />
                    </label>
                    <div className="col-span-full flex justify-end">
                      <FormSubmitButton label="Kaydet" pendingLabel="Kaydediliyor…" />
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
