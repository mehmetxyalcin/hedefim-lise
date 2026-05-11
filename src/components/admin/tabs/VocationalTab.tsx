"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { FormSubmitButton } from "@/components/admin/FormSubmitButton";
import type { VocationalField } from "@/types/vocationalField";
import type { VocationalBranch } from "@/types/schoolDetail";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

type Props = {
  schoolId: number;
  allFields: Pick<VocationalField, "id" | "title">[];
  allBranches: VocationalBranch[];
  selectedFieldIds: number[];
  selectedBranchIds: string[];
  syncVocational: (formData: FormData) => void | Promise<void>;
  addBranch: (formData: FormData) => void | Promise<void>;
};

export function VocationalTab({
  schoolId,
  allFields,
  allBranches,
  selectedFieldIds,
  selectedBranchIds,
  syncVocational,
  addBranch,
}: Props) {
  const [localSelectedFields, setLocalSelectedFields] = useState<number[]>(selectedFieldIds);
  const [addingBranchForField, setAddingBranchForField] = useState<number | null>(null);

  const branchesForField = (fieldId: number) =>
    allBranches.filter((b) => b.vocationalFieldId === fieldId);

  function toggleField(fieldId: number) {
    setLocalSelectedFields((prev) =>
      prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId],
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 border-b border-slate-100 pb-4">
        <h2 className="text-base font-bold text-slate-900">Meslek Alanları ve Dallar</h2>
        <p className="mt-1 text-sm text-slate-500">
          Alan seçin, ardından o alana ait dalları işaretleyin.
        </p>
      </div>

      <form action={syncVocational}>
        <input type="hidden" name="school_id" value={schoolId} />

        <div className="space-y-4">
          {allFields.map((field) => {
            const isFieldSelected = localSelectedFields.includes(field.id);
            const fieldBranches = branchesForField(field.id);

            return (
              <div
                key={field.id}
                className={`rounded-xl border p-4 transition-colors ${
                  isFieldSelected
                    ? "border-blue-200 bg-blue-50/50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                {/* Alan seçimi */}
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    name="vocational_field_ids"
                    value={field.id}
                    checked={isFieldSelected}
                    onChange={() => toggleField(field.id)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-bold text-slate-800">{field.title}</span>
                </label>

                {/* Dal seçimi (sadece alan seçiliyse) */}
                {isFieldSelected && (
                  <div className="mt-4 pl-7">
                    {fieldBranches.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {fieldBranches.map((branch) => (
                          <label
                            key={branch.id}
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              name="branch_ids"
                              value={branch.id}
                              defaultChecked={selectedBranchIds.includes(branch.id)}
                              className="h-3.5 w-3.5"
                            />
                            {branch.name}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Bu alan için dal bulunmuyor.</p>
                    )}

                    {/* Yeni dal ekle */}
                    <div className="mt-3">
                      {addingBranchForField === field.id ? (
                        <form
                          action={addBranch}
                          onSubmit={() => setAddingBranchForField(null)}
                          className="flex gap-2"
                        >
                          <input type="hidden" name="vocational_field_id" value={field.id} />
                          <input
                            name="name"
                            required
                            placeholder="Dal adı"
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                          />
                          <FormSubmitButton label="Ekle" pendingLabel="…" />
                          <button
                            type="button"
                            onClick={() => setAddingBranchForField(null)}
                            className="text-xs text-slate-400 hover:text-slate-600"
                          >
                            İptal
                          </button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAddingBranchForField(field.id)}
                          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Yeni dal ekle
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <FormSubmitButton label="Alanları ve Dalları Kaydet" pendingLabel="Kaydediliyor…" />
        </div>
      </form>
    </section>
  );
}
