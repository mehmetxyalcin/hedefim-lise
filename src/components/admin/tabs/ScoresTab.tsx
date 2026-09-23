"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AdminSubmitButton } from "@/components/admin/ui/AdminSubmitButton";
import type { SchoolScore, SchoolQuota } from "@/types/schoolDetail";
import { adminInput } from "@/components/admin/ui/styles";
import { PROGRAM_LABELS, scoreScopeValue, type SchoolProgram } from "@/lib/school-programs";

const inputCls = adminInput;

type VocationalFieldOption = { id: number; title: string };

type Props = {
  schoolId: number;
  scores: SchoolScore[];
  quotas: SchoolQuota[];
  schoolVocationalFields: VocationalFieldOption[];
  schoolPrograms: SchoolProgram[];
  upsertScore: (formData: FormData) => void | Promise<void>;
  upsertQuota: (formData: FormData) => void | Promise<void>;
  deleteScore: (formData: FormData) => void | Promise<void>;
  deleteQuota: (formData: FormData) => void | Promise<void>;
};

// 2026'dan geriye dört puan yılı; kontenjan üç yıl.
const YEARS = [2026, 2025, 2024, 2023];
const QUOTA_YEARS = [2026, 2025, 2024];

export function ScoresTab({
  schoolId,
  scores,
  quotas,
  schoolVocationalFields,
  schoolPrograms,
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

  function usedScopesForYear(year: number): Set<string> {
    return new Set(scoresForYear(year).map((s) => scoreScopeValue(s.vocationalFieldId, s.program)));
  }

  return (
    <div className="space-y-6">
      {/* Puan tablosu */}
      <section className="rounded-xl border border-admin-line bg-white p-5 shadow-admin-card">
        <div className="mb-5 border-b border-admin-line-soft pb-4">
          <h2 className="text-base font-bold text-admin-ink">Puan bilgileri</h2>
          <p className="mt-1 text-sm text-admin-muted">
            Yıl ve meslek alanı bazlı OBP, LGS ve yüzdelik dilim verileri.
          </p>
        </div>

        <div className="space-y-4">
          {YEARS.map((year) => {
            const yearScores = scoresForYear(year);
            const usedScopes = usedScopesForYear(year);
            const isAddingNew = editingScoreId === `new-${year}`;
            const availableFields = schoolVocationalFields.filter(
              (f) => !usedScopes.has(scoreScopeValue(f.id, null)),
            );
            const availablePrograms = schoolPrograms.filter(
              (p) => !usedScopes.has(scoreScopeValue(null, p)),
            );
            const canAddSchoolWide = !usedScopes.has("");

            return (
              <div
                key={year}
                className="rounded-xl border border-admin-line-soft bg-admin-ground p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-admin-body">{year}</span>
                  {!isAddingNew && (
                    <button
                      type="button"
                      onClick={() => setEditingScoreId(`new-${year}`)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-admin-accent-soft bg-admin-tint px-3 py-1.5 text-xs font-semibold text-admin-accent-deep hover:bg-admin-tint"
                    >
                      <Plus className="h-3 w-3" />
                      Puan ekle
                    </button>
                  )}
                </div>

                {/* Mevcut puanlar */}
                {yearScores.length > 0 && (
                  <div className="mb-3 divide-y divide-admin-line-soft overflow-hidden rounded-lg border border-admin-line bg-white">
                    {yearScores.map((score) => {
                      const isEditingThis = editingScoreId === score.id;
                      const fieldName =
                        (score.program ? `${PROGRAM_LABELS[score.program]} programı` : null) ??
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
                                <p className="text-xs font-semibold text-admin-body">
                                  {fieldName ?? (
                                    <span className="italic text-admin-muted">Okul geneli</span>
                                  )}
                                </p>
                                <div className="mt-1 flex flex-wrap gap-3 text-xs text-admin-muted">
                                  {score.obpScore !== null && (
                                    <span>
                                      OBP:{" "}
                                      <strong className="text-admin-ink tabular-nums">{score.obpScore}</strong>
                                    </span>
                                  )}
                                  {score.lgsScore !== null && (
                                    <span>
                                      LGS:{" "}
                                      <strong className="text-admin-ink tabular-nums">{score.lgsScore}</strong>
                                    </span>
                                  )}
                                  {score.percentile !== null && (
                                    <span>
                                      Yüzdelik:{" "}
                                      <strong className="text-admin-ink tabular-nums">
                                        %{score.percentile}
                                      </strong>
                                    </span>
                                  )}
                                  {score.obpScore === null &&
                                    score.lgsScore === null &&
                                    score.percentile === null && (
                                      <span className="text-admin-faint">Veri yok</span>
                                    )}
                                </div>
                              </div>
                              <div className="flex shrink-0 gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingScoreId(isEditingThis ? null : score.id)
                                  }
                                  className="rounded-lg border border-admin-line bg-white px-3 py-1 text-xs font-semibold text-admin-body hover:bg-admin-ground"
                                >
                                  Düzenle
                                </button>
                                <form
  action={deleteScore}
  onSubmit={(event) => {
    if (!window.confirm("Bu puan kaydını silmek istediğinize emin misiniz?")) event.preventDefault();
  }}
>
                                  <input type="hidden" name="id" value={score.id} />
                                  <input type="hidden" name="school_id" value={schoolId} />
                                  <button
                                    type="submit"
                                    className="rounded-lg p-1.5 text-rose-700 hover:bg-rose-50"
                                    title="Sil"
                                    aria-label="Sil"
                                  >
                                    <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
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
                                name="scope"
                                value={scoreScopeValue(score.vocationalFieldId, score.program)}
                              />

                              <div>
                                <span className="mb-1 block text-xs font-semibold text-admin-body">
                                  Kapsam
                                </span>
                                <p className="rounded-xl border border-admin-line bg-admin-ground px-3 py-2 text-sm text-admin-body">
                                  {fieldName ?? "Okul geneli"}
                                </p>
                              </div>

                              <div className="grid grid-cols-3 gap-3">
                                <label className="block">
                                  <span className="mb-1 block text-xs font-semibold text-admin-body">
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
                                  <span className="mb-1 block text-xs font-semibold text-admin-body">
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
                                  <span className="mb-1 block text-xs font-semibold text-admin-body">
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
                                  className="rounded-xl border border-admin-line bg-white px-3 py-2 text-xs font-semibold text-admin-body hover:bg-admin-ground"
                                >
                                  İptal
                                </button>
                                <AdminSubmitButton label="Kaydet" pendingLabel="Kaydediliyor…" />
                              </div>
                            </form>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {yearScores.length === 0 && !isAddingNew && (
                  <p className="text-xs text-admin-faint">Bu yıl için puan kaydı yok.</p>
                )}

                {/* Yeni puan ekleme formu */}
                {isAddingNew && (
                  <form
                    action={upsertScore}
                    onSubmit={() => setEditingScoreId(null)}
                    className="space-y-3 rounded-lg border border-admin-tint bg-admin-tint/50 p-3"
                  >
                    <input type="hidden" name="school_id" value={schoolId} />
                    <input type="hidden" name="year" value={year} />

                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-admin-body">
                        Kapsam
                      </span>
                      <select name="scope" className={inputCls}>
                        {canAddSchoolWide && <option value="">Okul geneli</option>}
                        {availablePrograms.map((p) => (
                          <option key={p} value={scoreScopeValue(null, p)}>
                            {PROGRAM_LABELS[p]} programı
                          </option>
                        ))}
                        {availableFields.map((f) => (
                          <option key={f.id} value={scoreScopeValue(f.id, null)}>
                            {f.title}
                          </option>
                        ))}
                      </select>
                      {!canAddSchoolWide && availableFields.length === 0 && availablePrograms.length === 0 && (
                        <p className="mt-1 text-xs text-amber-600">
                          Bu yıl için tüm kapsamların puanı girilmiş.
                        </p>
                      )}
                    </label>

                    <div className="grid grid-cols-3 gap-3">
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-admin-body">
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
                        <span className="mb-1 block text-xs font-semibold text-admin-body">
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
                        <span className="mb-1 block text-xs font-semibold text-admin-body">
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
                        className="rounded-xl border border-admin-line bg-white px-3 py-2 text-xs font-semibold text-admin-body hover:bg-admin-ground"
                      >
                        İptal
                      </button>
                      <AdminSubmitButton label="Ekle" pendingLabel="Ekleniyor…" />
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Kontenjan tablosu */}
      <section className="rounded-xl border border-admin-line bg-white p-5 shadow-admin-card">
        <div className="mb-5 border-b border-admin-line-soft pb-4">
          <h2 className="text-base font-bold text-admin-ink">Kontenjan bilgileri</h2>
          <p className="mt-1 text-sm text-admin-muted">
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
                className="rounded-xl border border-admin-line-soft bg-admin-ground p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-admin-body">{year}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingQuota(isEditing ? null : year)}
                      className="rounded-lg border border-admin-line bg-white px-3 py-1.5 text-xs font-semibold text-admin-body hover:bg-admin-ground"
                    >
                      {isEditing ? "İptal" : quota ? "Düzenle" : "Ekle"}
                    </button>
                    {quota && !isEditing && (
                      <form
  action={deleteQuota}
  onSubmit={(event) => {
    if (!window.confirm("Bu kontenjan kaydını silmek istediğinize emin misiniz?")) event.preventDefault();
  }}
>
                        <input type="hidden" name="id" value={quota.id} />
                        <input type="hidden" name="school_id" value={schoolId} />
                        <button
                          type="submit"
                          className="rounded-lg p-1.5 text-rose-700 hover:bg-rose-50"
                          title="Sil"
                          aria-label="Sil"
                        >
                          <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {!isEditing && quota && (
                  <div className="flex gap-4 text-sm text-admin-body">
                    {quota.sinavliCount !== null && (
                      <span>
                        Sınavlı: <strong className="tabular-nums">{quota.sinavliCount}</strong>
                      </span>
                    )}
                    {quota.sinavsizCount !== null && (
                      <span>
                        Sınavsız: <strong className="tabular-nums">{quota.sinavsizCount}</strong>
                      </span>
                    )}
                  </div>
                )}
                {!isEditing && !quota && (
                  <p className="text-xs text-admin-faint">Kayıt yok</p>
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
                      <span className="mb-1 block text-xs font-semibold text-admin-body">
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
                      <span className="mb-1 block text-xs font-semibold text-admin-body">
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
                      <AdminSubmitButton label="Kaydet" pendingLabel="Kaydediliyor…" />
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
