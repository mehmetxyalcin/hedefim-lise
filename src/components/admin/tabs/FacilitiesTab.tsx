"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { FormSubmitButton } from "@/components/admin/FormSubmitButton";
import type { Facility } from "@/types/schoolDetail";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

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
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 border-b border-slate-100 pb-4">
        <h2 className="text-base font-bold text-slate-900">Tesis ve İmkânlar</h2>
        <p className="mt-1 text-sm text-slate-500">
          Okulda mevcut olan tesisleri işaretleyin.
        </p>
      </div>

      {/* Arama */}
      <input
        type="text"
        placeholder="Tesis ara…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      />

      {/* Checkbox listesi */}
      <form action={syncFacilities} className="space-y-3">
        <input type="hidden" name="school_id" value={schoolId} />

        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {filtered.map((facility) => (
            <label
              key={facility.id}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-colors hover:bg-white"
            >
              <input
                type="checkbox"
                name="facility_ids"
                value={facility.id}
                defaultChecked={selectedFacilityIds.includes(facility.id)}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-slate-700">{facility.name}</span>
            </label>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-400">Sonuç bulunamadı.</p>
        )}

        <div className="flex justify-end pt-2">
          <FormSubmitButton label="Tesisleri Kaydet" pendingLabel="Kaydediliyor…" />
        </div>
      </form>

      {/* Yeni tesis ekle */}
      <div className="mt-6 border-t border-slate-100 pt-5">
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
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
            <FormSubmitButton label="Ekle" pendingLabel="Ekleniyor…" />
          </form>
        )}
      </div>
    </section>
  );
}
