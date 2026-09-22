"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2, X } from "lucide-react";
import Image from "next/image";
import { AdminSubmitButton } from "@/components/admin/ui/AdminSubmitButton";
import type { SchoolProject } from "@/types/schoolDetail";
import { adminInput } from "@/components/admin/ui/styles";

const inputCls = adminInput;

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
    <section className="rounded-xl border border-admin-line bg-white p-5 shadow-admin-card">
      <div className="mb-5 border-b border-admin-line-soft pb-4">
        <h2 className="text-base font-bold text-admin-ink">Projeler</h2>
        <p className="mt-1 text-sm text-admin-muted">
          Her kayıt anında saklanır. Görsel opsiyoneldir.
        </p>
      </div>

      <div className="space-y-3">
        {projects.map((item, idx) => (
          <div key={item.id} className="rounded-xl border border-admin-line bg-admin-ground p-4">
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
                  <span className="mb-2 block text-sm font-semibold text-admin-body">
                    Görsel değiştir (opsiyonel)
                  </span>
                  <input
                    type="file"
                    name="image_file"
                    accept="image/png,image/jpeg,image/webp"
                    className="text-sm text-admin-body"
                  />
                  {item.imageUrl && (
                    <p className="mt-1 text-xs text-admin-faint">
                      Mevcut görsel korunur, yeni yükleme onu değiştirir.
                    </p>
                  )}
                </div>
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
                <div className="flex min-w-0 flex-1 gap-3">
                  {item.imageUrl && (
                    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-admin-line">
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
                    <p className="truncate text-sm font-semibold text-admin-ink">{item.title}</p>
                    {item.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-admin-muted">{item.description}</p>
                    )}
                    {item.linkUrl && (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block truncate text-xs text-admin-accent hover:underline"
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
                      <button type="submit" className="rounded p-1 text-admin-muted hover:bg-admin-line-soft hover:text-admin-ink" title="Yukarı taşı" aria-label="Yukarı taşı"><ChevronUp aria-hidden="true" className="h-4 w-4" /></button>
                    </form>
                  )}
                  {idx < projects.length - 1 && (
                    <form action={reorderProject}>
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
  action={deleteProject}
  onSubmit={(event) => {
    if (!window.confirm("Bu projeyi silmek istediğinize emin misiniz?")) event.preventDefault();
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

        {projects.length === 0 && (
          <p className="py-4 text-center text-sm text-admin-faint">Henüz proje eklenmedi.</p>
        )}
      </div>

      {/* Yeni proje ekle */}
      <div className="mt-6 border-t border-admin-line-soft pt-5">
        <h3 className="mb-4 text-sm font-bold text-admin-body">Yeni proje ekle</h3>
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
            <span className="mb-2 block text-sm font-semibold text-admin-body">
              Görsel (opsiyonel)
            </span>
            <input
              type="file"
              name="image_file"
              accept="image/png,image/jpeg,image/webp"
              className="text-sm text-admin-body"
            />
          </div>
          <div className="flex justify-end">
            <AdminSubmitButton label="Proje Ekle" pendingLabel="Ekleniyor…" />
          </div>
        </form>
      </div>
    </section>
  );
}
