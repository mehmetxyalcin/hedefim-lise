"use client";

import { useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { FormSubmitButton } from "@/components/admin/FormSubmitButton";
import type { SchoolScholarship } from "@/types/schoolDetail";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

type Props = {
  schoolId: number;
  scholarships: SchoolScholarship[];
  addScholarship: (formData: FormData) => void | Promise<void>;
  updateScholarship: (formData: FormData) => void | Promise<void>;
  deleteScholarship: (formData: FormData) => void | Promise<void>;
  reorderScholarship: (formData: FormData) => void | Promise<void>;
};

export function ScholarshipsTab({
  schoolId,
  scholarships,
  addScholarship,
  updateScholarship,
  deleteScholarship,
  reorderScholarship,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 border-b border-slate-100 pb-4">
        <h2 className="text-base font-bold text-slate-900">Burs İmkânları</h2>
        <p className="mt-1 text-sm text-slate-500">
          Her kayıt anında saklanır, sayfayı yenilemeniz gerekmez.
        </p>
      </div>

      {/* Mevcut burslar */}
      <div className="space-y-3">
        {scholarships.map((item, idx) => (
          <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            {editingId === item.id ? (
              <form
                action={updateScholarship}
                onSubmit={() => setEditingId(null)}
                className="space-y-3"
              >
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="school_id" value={schoolId} />
                <input
                  name="title"
                  required
                  defaultValue={item.title}
                  placeholder="Burs başlığı"
                  className={inputCls}
                />
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={item.description ?? ""}
                  placeholder="Açıklama (opsiyonel)"
                  className={inputCls}
                />
                <input
                  name="amount_info"
                  defaultValue={item.amountInfo ?? ""}
                  placeholder="Tutar bilgisi (opsiyonel) — Örn: Aylık 500 TL"
                  className={inputCls}
                />
                <div className="flex items-center gap-2">
                  <FormSubmitButton label="Kaydet" pendingLabel="Kaydediliyor…" />
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" /> İptal
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                  {item.description && (
                    <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                  )}
                  {item.amountInfo && (
                    <span className="mt-1.5 inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      {item.amountInfo}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {/* Yukarı */}
                  {idx > 0 && (
                    <form action={reorderScholarship}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="direction" value="up" />
                      <input type="hidden" name="school_id" value={schoolId} />
                      <button type="submit" className="rounded p-1 text-slate-400 hover:text-slate-700" title="Yukarı">↑</button>
                    </form>
                  )}
                  {/* Aşağı */}
                  {idx < scholarships.length - 1 && (
                    <form action={reorderScholarship}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="direction" value="down" />
                      <input type="hidden" name="school_id" value={schoolId} />
                      <button type="submit" className="rounded p-1 text-slate-400 hover:text-slate-700" title="Aşağı">↓</button>
                    </form>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingId(item.id)}
                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-blue-600"
                    title="Düzenle"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <form action={deleteScholarship}>
                    <input type="hidden" name="id" value={item.id} />
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
          </div>
        ))}

        {scholarships.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-400">Henüz burs eklenmedi.</p>
        )}
      </div>

      {/* Yeni burs ekle */}
      <div className="mt-6 border-t border-slate-100 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-700">Yeni Burs Ekle</h3>
        <form action={addScholarship} className="space-y-3">
          <input type="hidden" name="school_id" value={schoolId} />
          <input
            name="title"
            required
            placeholder="Burs başlığı — Örn: MEB Bursu"
            className={inputCls}
          />
          <textarea
            name="description"
            rows={2}
            placeholder="Açıklama (opsiyonel)"
            className={inputCls}
          />
          <input
            name="amount_info"
            placeholder="Tutar bilgisi (opsiyonel) — Örn: Aylık 500 TL"
            className={inputCls}
          />
          <div className="flex justify-end">
            <FormSubmitButton label="Burs Ekle" pendingLabel="Ekleniyor…" />
          </div>
        </form>
      </div>
    </section>
  );
}
