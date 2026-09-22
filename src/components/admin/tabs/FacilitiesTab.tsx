"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AdminSubmitButton } from "@/components/admin/ui/AdminSubmitButton";
import type { Facility } from "@/types/schoolDetail";
import { adminInput } from "@/components/admin/ui/styles";

const inputCls = adminInput;

type Props = {
  schoolId: number;
  allFacilities: Facility[];
  selectedFacilityIds: string[];
  syncFacilities: (formData: FormData) => void | Promise<void>;
  addFacility: (formData: FormData) => void | Promise<void>;
};

export function FacilitiesTab({
  schoolId,
  allFacilities,
  selectedFacilityIds,
  syncFacilities,
  addFacility,
}: Props) {
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const filtered = allFacilities.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <section className="rounded-xl border border-admin-line bg-white p-5 shadow-admin-card">
      <div className="mb-5 border-b border-admin-line-soft pb-4">
        <h2 className="text-base font-bold text-admin-ink">Tesis ve imkânlar</h2>
        <p className="mt-1 text-sm text-admin-muted">
          Okulda mevcut olan tesisleri işaretleyin.
        </p>
      </div>

      {/* Arama */}
      <input
        type="text"
        placeholder="Tesis ara…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full rounded-xl border border-admin-line bg-admin-ground px-4 py-2.5 text-sm outline-none focus:border-admin-accent focus:ring-4 focus:ring-admin-accent/10"
      />

      {/* Checkbox listesi */}
      <form action={syncFacilities} className="space-y-3">
        <input type="hidden" name="school_id" value={schoolId} />

        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {filtered.map((facility) => (
            <label
              key={facility.id}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-admin-line bg-admin-ground px-4 py-3 transition-colors hover:bg-white"
            >
              <input
                type="checkbox"
                name="facility_ids"
                value={facility.id}
                defaultChecked={selectedFacilityIds.includes(facility.id)}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-admin-body">{facility.name}</span>
            </label>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="py-4 text-center text-sm text-admin-faint">Sonuç bulunamadı.</p>
        )}

        <div className="flex justify-end pt-2">
          <AdminSubmitButton label="Tesisleri Kaydet" pendingLabel="Kaydediliyor…" />
        </div>
      </form>

      {/* Yeni tesis ekle */}
      <div className="mt-6 border-t border-admin-line-soft pt-5">
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-admin-accent hover:text-admin-accent-deep"
        >
          <Plus className="h-4 w-4" />
          {showAddForm ? "İptal" : "Listeye Yeni Tesis Ekle"}
        </button>

        {showAddForm && (
          <form
            action={addFacility}
            onSubmit={() => setShowAddForm(false)}
            className="mt-4 flex gap-3"
          >
            <input
              name="name"
              required
              placeholder="Tesis adı"
              className={inputCls}
            />
            <AdminSubmitButton label="Ekle" pendingLabel="Ekleniyor…" />
          </form>
        )}
      </div>
    </section>
  );
}
