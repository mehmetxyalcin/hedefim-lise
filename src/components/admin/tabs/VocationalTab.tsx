"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AdminSubmitButton } from "@/components/admin/ui/AdminSubmitButton";
import type { VocationalField } from "@/types/vocationalField";
import type { VocationalBranch } from "@/types/schoolDetail";

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
    <section className="rounded-xl border border-admin-line bg-white p-5 shadow-admin-card">
      <div className="mb-5 border-b border-admin-line-soft pb-4">
        <h2 className="text-base font-bold text-admin-ink">Meslek alanları ve dallar</h2>
        <p className="mt-1 text-sm text-admin-muted">
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
                    ? "border-admin-accent-soft bg-admin-tint/50"
                    : "border-admin-line bg-admin-ground"
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
                  <span className="text-sm font-bold text-admin-ink">{field.title}</span>
                </label>

                {/* Dal seçimi (sadece alan seçiliyse) */}
                {isFieldSelected && (
                  <div className="mt-4 pl-7">
                    {fieldBranches.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {fieldBranches.map((branch) => (
                          <label
                            key={branch.id}
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-admin-line bg-white px-3 py-1.5 text-xs font-medium text-admin-body hover:bg-admin-ground"
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
                      <p className="text-xs text-admin-faint">Bu alan için dal bulunmuyor.</p>
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
                            className="rounded-xl border border-admin-line bg-white px-3 py-2 text-sm outline-none focus:border-admin-accent focus:ring-4 focus:ring-admin-accent/10"
                          />
                          <AdminSubmitButton label="Ekle" pendingLabel="Ekleniyor…" />
                          <button
                            type="button"
                            onClick={() => setAddingBranchForField(null)}
                            className="text-xs text-admin-faint hover:text-admin-body"
                          >
                            İptal
                          </button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAddingBranchForField(field.id)}
                          className="flex items-center gap-1 text-xs font-semibold text-admin-accent hover:text-admin-accent-deep"
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
          <AdminSubmitButton label="Alanları ve dalları kaydet" pendingLabel="Kaydediliyor…" />
        </div>
      </form>
    </section>
  );
}
