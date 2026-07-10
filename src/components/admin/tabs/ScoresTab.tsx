"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { FormSubmitButton } from "@/components/admin/FormSubmitButton";
import type { SchoolScore, SchoolQuota } from "@/types/schoolDetail";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

type VocationalFieldOption = { id: number; title: string };

type Props = {
  schoolId: number;
  scores: SchoolScore[];
  quotas: SchoolQuota[];
  schoolVocationalFields: VocationalFieldOption[];
  upsertScore: (formData: FormData) => void | Promise<void>;
  upsertQuota: (formData: FormData) => void | Promise<void>;
  deleteScore: (formData: FormData) => void | Promise<void>;
  deleteQuota: (formData: FormData) => void | Promise<void>;
};

// Puanlar 2025/2024/2023 olarak kalır; sadece kontenjan yıl aralığı değişir.
const YEARS = [2025, 2024, 2023];
const QUOTA_YEARS = [2026, 2025, 2024];

export function ScoresTab({
  schoolId,
  scores,
  quotas,
  schoolVocationalFields,
  upsertScore,
  upsertQuota,
  deleteScore,
  deleteQuota,
}: Props) {
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
  const [editingQuota, setEditingQuota] = useState<number | null>(null);

  function scoresForYear(year: number) {
    return scores.filter((s) => s.year === year);
  }

  function quotaForYear(year: number) {
    return quotas.find((q) => q.year === year);
  }

  function usedFieldIdsForYear(year: number): Set<number | null> {
    return new Set(scoresForYear(year).map((s) => s.vocationalFieldId));
  }

  return (
    <div className="space-y-6">
      {/* Puan tablosu */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900">Puan Bilgileri</h2>
          <p className="mt-1 text-sm text-slate-500">
            Yıl ve meslek alanı bazlı OBP, LGS ve yüzdelik dilim verileri.
          </p>
        </div>

        <div className="space-y-4">
          {YEARS.map((year) => {
            const yearScores = scoresForYear(year);
            const usedFieldIds = usedFieldIdsForYear(year);
            const isAddingNew = editingScoreId === `new-${year}`;
            const availableFields = schoolVocationalFields.filter(
              (f) => !usedFieldIds.has(f.id),
            );
            const canAddSchoolWide = !usedFieldIds.has(null);

            return (
              <div
                key={year}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">{year}</span>
                  {!isAddingNew && (
                    <button
                      type="button"
                      onClick={() => setEditingScoreId(`new-${year}`)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      <Plus className="h-3 w-3" />
                      Puan Ekle
                    </button>
                  )}
                </div>

                {/* Mevcut puanlar */}
                {yearScores.length > 0 && (
                  <div className="mb-3 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
                    {yearScores.map((score) => {
                      const isEditingThis = editingScoreId === score.id;
                      const fieldName =
                        score.vocationalField?.name ??
                        (score.vocationalFieldId !== null
                          ? schoolVocationalFields.find((f) => f.id === score.vocationalFieldId)
                              ?.title
                          : null);

                      return (
                        <div key={score.id} className="p-3">
                          {!isEditingThis && (
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-xs font-semibold text-slate-700">
                                  {fieldName ?? (
                                    <span className="italic text-slate-500">Okul Geneli</span>
                                  )}
                                </p>
                                <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                                  {score.obpScore !== null && (
                                    <span>
                                      OBP:{" "}
                                      <strong className="text-slate-800">{score.obpScore}</strong>
                                    </span>
                                  )}
                                  {score.lgsScore !== null && (
                                    <span>
                                      LGS:{" "}
                                      <strong className="text-slate-800">{score.lgsScore}</strong>
                                    </span>
                                  )}
                                  {score.percentile !== null && (
                                    <span>
                                      Yüzdelik:{" "}
                                      <strong className="text-slate-800">
                                        %{score.percentile}
                                      </strong>
                                    </span>
                                  )}
                                  {score.obpScore === null &&
                                    score.lgsScore === null &&
                                    score.percentile === null && (
                                      <span className="text-slate-400">Veri yok</span>
                                    )}
                                </div>
                              </div>
                              <div className="flex shrink-0 gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingScoreId(isEditingThis ? null : score.id)
                                  }
                                  className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                  Düzenle
                                </button>
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
                              </div>
                            </div>
                          )}

                          {isEditingThis && (
                            <form
                              action={upsertScore}
                              onSubmit={() => setEditingScoreId(null)}
                              className="space-y-3"
                            >
                              <input type="hidden" name="school_id" value={schoolId} />
                              <input type="hidden" name="year" value={year} />
                              <input type="hidden" name="id" value={score.id} />
                              <input
                                type="hidden"
                                name="vocational_field_id"
                                value={score.vocationalFieldId ?? ""}
                              />

                              <div>
                                <span className="mb-1 block text-xs font-semibold text-slate-600">
                                  Meslek Alanı
                                </span>
                                <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                  {fieldName ?? "Okul Geneli"}
                                </p>
                              </div>

                              <div className="grid grid-cols-3 gap-3">
                                <label className="block">
                                  <span className="mb-1 block text-xs font-semibold text-slate-600">
                                    OBP
                                  </span>
                                  <input
                                    type="number"
                                    name="obp_score"
                                    step="0.001"
                                    min="0"
                                    defaultValue={score.obpScore ?? ""}
                                    placeholder="0.000"
                                    className={inputCls}
                                  />
                                </label>
                                <label className="block">
                                  <span className="mb-1 block text-xs font-semibold text-slate-600">
                                    LGS
                                  </span>
                                  <input
                                    type="number"
                                    name="lgs_score"
                                    step="0.0001"
                                    min="0"
                                    defaultValue={score.lgsScore ?? ""}
                                    placeholder="0.0000"
                                    className={inputCls}
                                  />
                                </label>
                                <label className="block">
                                  <span className="mb-1 block text-xs font-semibold text-slate-600">
                                    Yüzdelik (%)
                                  </span>
                                  <input
                                    type="number"
                                    name="percentile"
                                    step="0.001"
                                    min="0"
                                    max="100"
                                    defaultValue={score.percentile ?? ""}
                                    placeholder="0.000"
                                    className={inputCls}
                                  />
                                </label>
                              </div>

                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingScoreId(null)}
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                  İptal
                                </button>
                                <FormSubmitButton label="Kaydet" pendingLabel="Kaydediliyor…" />
                              </div>
                            </form>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {yearScores.length === 0 && !isAddingNew && (
                  <p className="text-xs text-slate-400">Bu yıl için puan kaydı yok.</p>
                )}

                {/* Yeni puan ekleme formu */}
                {isAddingNew && (
                  <form
                    action={upsertScore}
                    onSubmit={() => setEditingScoreId(null)}
                    className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3"
                  >
                    <input type="hidden" name="school_id" value={schoolId} />
                    <input type="hidden" name="year" value={year} />

                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-slate-600">
                        Meslek Alanı
                      </span>
                      <select name="vocational_field_id" className={inputCls}>
                        {canAddSchoolWide && <option value="">Okul Geneli</option>}
                        {availableFields.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.title}
                          </option>
                        ))}
                      </select>
                      {!canAddSchoolWide && availableFields.length === 0 && (
                        <p className="mt-1 text-xs text-amber-600">
                          Bu yıl için tüm alanların puanı girilmiş.
                        </p>
                      )}
                    </label>

                    <div className="grid grid-cols-3 gap-3">
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-slate-600">
                          OBP
                        </span>
                        <input
                          type="number"
                          name="obp_score"
                          step="0.001"
                          min="0"
                          placeholder="0.000"
                          className={inputCls}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-slate-600">
                          LGS
                        </span>
                        <input
                          type="number"
                          name="lgs_score"
                          step="0.0001"
                          min="0"
                          placeholder="0.0000"
                          className={inputCls}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-slate-600">
                          Yüzdelik (%)
                        </span>
                        <input
                          type="number"
                          name="percentile"
                          step="0.001"
                          min="0"
                          max="100"
                          placeholder="0.000"
                          className={inputCls}
                        />
                      </label>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingScoreId(null)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        İptal
                      </button>
                      <FormSubmitButton label="Ekle" pendingLabel="Ekleniyor…" />
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
          {QUOTA_YEARS.map((year) => {
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
                      <span>
                        Sınavlı: <strong>{quota.sinavliCount}</strong>
                      </span>
                    )}
                    {quota.sinavsizCount !== null && (
                      <span>
                        Sınavsız: <strong>{quota.sinavsizCount}</strong>
                      </span>
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
                      <span className="mb-1 block text-xs font-semibold text-slate-600">
                        Sınavlı
                      </span>
                      <input
                        type="number"
                        name="sinavli_count"
                        min="0"
                        defaultValue={quota?.sinavliCount ?? ""}
                        className={inputCls}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-slate-600">
                        Sınavsız
                      </span>
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
