"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2, X } from "lucide-react";
import { AdminSubmitButton } from "@/components/admin/ui/AdminSubmitButton";
import type { SchoolScholarship } from "@/types/schoolDetail";
import { adminInput } from "@/components/admin/ui/styles";

const inputCls = adminInput;

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
    <section className="rounded-xl border border-admin-line bg-white p-5 shadow-admin-card">
      <div className="mb-5 border-b border-admin-line-soft pb-4">
        <h2 className="text-base font-bold text-admin-ink">Burs imkânları</h2>
        <p className="mt-1 text-sm text-admin-muted">
          Her kayıt anında saklanır, sayfayı yenilemeniz gerekmez.
        </p>
      </div>

      {/* Mevcut burslar */}
      <div className="space-y-3">
        {scholarships.map((item, idx) => (
          <div key={item.id} className="rounded-xl border border-admin-line bg-admin-ground p-4">
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
                  <AdminSubmitButton label="Kaydet" pendingLabel="Kaydediliyor…" />
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="flex items-center gap-1 text-sm text-admin-faint hover:text-admin-body"
                  >
                    <X className="h-4 w-4" /> İptal
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-admin-ink">{item.title}</p>
                  {item.description && (
                    <p className="mt-1 text-xs text-admin-muted">{item.description}</p>
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
                      <button type="submit" className="rounded p-1 text-admin-muted hover:bg-admin-line-soft hover:text-admin-ink" title="Yukarı taşı" aria-label="Yukarı taşı"><ChevronUp aria-hidden="true" className="h-4 w-4" /></button>
                    </form>
                  )}
                  {/* Aşağı */}
                  {idx < scholarships.length - 1 && (
                    <form action={reorderScholarship}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="direction" value="down" />
                      <input type="hidden" name="school_id" value={schoolId} />
                      <button type="submit" className="rounded p-1 text-admin-muted hover:bg-admin-line-soft hover:text-admin-ink" title="Aşağı taşı" aria-label="Aşağı taşı"><ChevronDown aria-hidden="true" className="h-4 w-4" /></button>
                    </form>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingId(item.id)}
                    className="rounded-lg border border-admin-line bg-white p-1.5 text-admin-muted hover:text-admin-accent"
                    title="Düzenle"
                    aria-label="Düzenle"
                  >
                    <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                  <form
  action={deleteScholarship}
  onSubmit={(event) => {
    if (!window.confirm("Bu burs kaydını silmek istediğinize emin misiniz?")) event.preventDefault();
  }}
>
                    <input type="hidden" name="id" value={item.id} />
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
          </div>
        ))}

        {scholarships.length === 0 && (
          <p className="py-4 text-center text-sm text-admin-faint">Henüz burs eklenmedi.</p>
        )}
      </div>

      {/* Yeni burs ekle */}
      <div className="mt-6 border-t border-admin-line-soft pt-5">
        <h3 className="mb-4 text-sm font-bold text-admin-body">Yeni burs ekle</h3>
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
            <AdminSubmitButton label="Burs Ekle" pendingLabel="Ekleniyor…" />
          </div>
        </form>
      </div>
    </section>
  );
}
