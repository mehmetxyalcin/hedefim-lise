"use client";

import { useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import Image from "next/image";
import { FormSubmitButton } from "@/components/admin/FormSubmitButton";
import type { SchoolProject } from "@/types/schoolDetail";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

type Props = {
  schoolId: number;
  projects: SchoolProject[];
  addProject: (formData: FormData) => void | Promise<void>;
  updateProject: (formData: FormData) => void | Promise<void>;
  deleteProject: (formData: FormData) => void | Promise<void>;
  reorderProject: (formData: FormData) => void | Promise<void>;
};

export function ProjectsTab({
  schoolId,
  projects,
  addProject,
  updateProject,
  deleteProject,
  reorderProject,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 border-b border-slate-100 pb-4">
        <h2 className="text-base font-bold text-slate-900">Projeler</h2>
        <p className="mt-1 text-sm text-slate-500">
          Her kayıt anında saklanır. Görsel opsiyoneldir.
        </p>
      </div>

      <div className="space-y-3">
        {projects.map((item, idx) => (
          <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            {editingId === item.id ? (
              <form
                action={updateProject}
                onSubmit={() => setEditingId(null)}
                className="space-y-3"
              >
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="school_id" value={schoolId} />
                <input
                  name="title"
                  required
                  defaultValue={item.title}
                  placeholder="Proje adı"
                  className={inputCls}
                />
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={item.description ?? ""}
                  placeholder="Kısa açıklama (opsiyonel)"
                  className={inputCls}
                />
                <input
                  type="url"
                  name="link_url"
                  defaultValue={item.linkUrl ?? ""}
                  placeholder="Proje linki (opsiyonel)"
                  className={inputCls}
                />
                <div>
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Görsel değiştir (opsiyonel)
                  </span>
                  <input
                    type="file"
                    name="image_file"
                    accept="image/png,image/jpeg,image/webp"
                    className="text-sm text-slate-600"
                  />
                  {item.imageUrl && (
                    <p className="mt-1 text-xs text-slate-400">
                      Mevcut görsel korunur, yeni yükleme onu değiştirir.
                    </p>
                  )}
                </div>
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
                <div className="flex min-w-0 flex-1 gap-3">
                  {item.imageUrl && (
                    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200">
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{item.title}</p>
                    {item.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{item.description}</p>
                    )}
                    {item.linkUrl && (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block truncate text-xs text-blue-600 hover:underline"
                      >
                        {item.linkUrl}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {idx > 0 && (
                    <form action={reorderProject}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="direction" value="up" />
                      <input type="hidden" name="school_id" value={schoolId} />
                      <button type="submit" className="rounded p-1 text-slate-400 hover:text-slate-700" title="Yukarı">↑</button>
                    </form>
                  )}
                  {idx < projects.length - 1 && (
                    <form action={reorderProject}>
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
                  <form action={deleteProject}>
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

        {projects.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-400">Henüz proje eklenmedi.</p>
        )}
      </div>

      {/* Yeni proje ekle */}
      <div className="mt-6 border-t border-slate-100 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-700">Yeni Proje Ekle</h3>
        <form action={addProject} className="space-y-3">
          <input type="hidden" name="school_id" value={schoolId} />
          <input
            name="title"
            required
            placeholder="Proje adı — Örn: TÜBITAK 4006"
            className={inputCls}
          />
          <textarea
            name="description"
            rows={2}
            placeholder="Kısa açıklama (opsiyonel)"
            className={inputCls}
          />
          <input
            type="url"
            name="link_url"
            placeholder="Proje linki (opsiyonel)"
            className={inputCls}
          />
          <div>
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Görsel (opsiyonel)
            </span>
            <input
              type="file"
              name="image_file"
              accept="image/png,image/jpeg,image/webp"
              className="text-sm text-slate-600"
            />
          </div>
          <div className="flex justify-end">
            <FormSubmitButton label="Proje Ekle" pendingLabel="Ekleniyor…" />
          </div>
        </form>
      </div>
    </section>
  );
}
