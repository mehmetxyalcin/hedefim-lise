"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { adminButton } from "@/components/admin/ui/Button";
import { adminInput } from "@/components/admin/ui/styles";
import {
  addVocationalField,
  updateVocationalField,
  deleteVocationalField,
  addBranch,
  updateBranch,
  deleteBranch,
} from "@/app/admin/meslek-alanlari/actions";

export type Branch = { id: string; name: string };
export type VocFieldWithBranches = {
  id: string;
  title: string;
  slug: string;
  vocational_branches: Branch[];
  school_count?: number;
};

type ModalState =
  | null
  | { kind: "add-field" }
  | { kind: "edit-field"; id: string; title: string }
  | { kind: "delete-field"; id: string; title: string; branchCount: number }
  | { kind: "add-branch"; fieldId: string; fieldTitle: string }
  | { kind: "edit-branch"; id: string; name: string }
  | { kind: "delete-branch"; id: string; name: string; fieldTitle: string };

const MODAL_TITLES: Record<NonNullable<ModalState>["kind"], string> = {
  "add-field": "Meslek alanı ekle",
  "edit-field": "Meslek alanını düzenle",
  "delete-field": "Meslek alanını sil",
  "add-branch": "Dal ekle",
  "edit-branch": "Dalı düzenle",
  "delete-branch": "Dalı sil",
};

export function VocationalFieldsManager({
  initialFields,
}: {
  initialFields: VocFieldWithBranches[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [openFields, setOpenFields] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<ModalState>(null);
  const [inputValue, setInputValue] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const q = search.trim().toLocaleLowerCase("tr-TR");
  const filteredFields = q
    ? initialFields.filter(
        (f) =>
          f.title.toLocaleLowerCase("tr-TR").includes(q) ||
          f.vocational_branches.some((b) => b.name.toLocaleLowerCase("tr-TR").includes(q)),
      )
    : initialFields;

  function toggleField(id: string) {
    setOpenFields((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openModal(state: NonNullable<ModalState>, prefill = "") {
    setModal(state);
    setInputValue(prefill);
    setModalError(null);
  }

  function runAction(action: () => Promise<void>) {
    setModalError(null);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
        setModal(null);
      } catch (err) {
        setModalError(err instanceof Error ? err.message : "Bir hata oluştu.");
      }
    });
  }

  function handleSubmit() {
    const val = inputValue.trim();
    if (!val) {
      setModalError("Bu alan zorunludur.");
      return;
    }
    switch (modal?.kind) {
      case "add-field":
        runAction(() => addVocationalField(val));
        break;
      case "edit-field":
        runAction(() => updateVocationalField(modal.id, val));
        break;
      case "add-branch":
        runAction(() => addBranch(modal.fieldId, val));
        break;
      case "edit-branch":
        runAction(() => updateBranch(modal.id, val));
        break;
    }
  }

  function handleDelete() {
    switch (modal?.kind) {
      case "delete-field":
        runAction(() => deleteVocationalField(modal.id));
        break;
      case "delete-branch":
        runAction(() => deleteBranch(modal.id));
        break;
    }
  }

  const isTextModal =
    modal?.kind === "add-field" ||
    modal?.kind === "edit-field" ||
    modal?.kind === "add-branch" ||
    modal?.kind === "edit-branch";

  const isDeleteModal =
    modal?.kind === "delete-field" || modal?.kind === "delete-branch";

  return (
    <div>
      {/* Arama + Ekle */}
      <div className="mb-6 flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Meslek alanı veya dal ara..."
          className={cn(adminInput, "flex-1")}
        />
        <button
          type="button"
          onClick={() => openModal({ kind: "add-field" })}
          className={adminButton({ variant: "primary" })}
        >
          <Plus className="h-4 w-4" />
          Yeni meslek alanı
        </button>
      </div>

      {/* Liste */}
      {filteredFields.length === 0 ? (
        <div className="rounded-xl border border-dashed border-admin-line bg-white px-8 py-16 text-center">
          <p className="text-admin-muted">
            {search
              ? `"${search}" için sonuç bulunamadı.`
              : "Henüz meslek alanı eklenmemiş."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-admin-line overflow-hidden rounded-xl border border-admin-line bg-white shadow-admin-card">
          {filteredFields.map((field) => {
            const isOpen = openFields.has(field.id);
            return (
              <div key={field.id}>
                {/* Alan başlığı */}
                <div className="flex items-center gap-2 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleField(field.id)}
                    className="flex flex-1 items-center gap-2 text-left"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-admin-faint" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-admin-faint" />
                    )}
                    <span className="font-semibold text-admin-ink">{field.title}</span>
                    <span className="ml-1 shrink-0 rounded-full bg-admin-line-soft px-2 py-0.5 text-xs whitespace-nowrap text-admin-muted tabular-nums">
                      {field.vocational_branches.length} dal
                    </span>
                    {typeof field.school_count === "number" && (
                      <span className="shrink-0 text-xs whitespace-nowrap text-admin-muted tabular-nums">
                        {field.school_count} okul
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openModal(
                        { kind: "edit-field", id: field.id, title: field.title },
                        field.title,
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-admin-body hover:bg-admin-line-soft"
                  >
                    <Pencil className="h-3 w-3" />
                    Düzenle
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openModal({
                        kind: "delete-field",
                        id: field.id,
                        title: field.title,
                        branchCount: field.vocational_branches.length,
                      })
                    }
                    aria-label={`${field.title} alanını sil`}
                    title="Sil"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-admin-muted hover:bg-rose-50 hover:text-rose-700 focus-visible:text-rose-700"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>

                {/* Dallar (accordion içeriği) */}
                {isOpen && (
                  <div className="border-t border-admin-line-soft bg-admin-ground px-4 pt-3 pb-3">
                    <p className="mb-2 text-xs font-semibold text-admin-muted">
                      Dallar
                    </p>

                    {field.vocational_branches.length === 0 ? (
                      <p className="mb-3 text-sm text-admin-faint">
                        Bu alana henüz dal eklenmemiş.
                      </p>
                    ) : (
                      <ul className="mb-3 space-y-0.5">
                        {field.vocational_branches.map((branch) => (
                          <li
                            key={branch.id}
                            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white"
                          >
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-admin-line-strong" />
                            <span className="flex-1 text-sm text-admin-body">{branch.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                openModal(
                                  { kind: "edit-branch", id: branch.id, name: branch.name },
                                  branch.name,
                                )
                              }
                              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-admin-body hover:bg-admin-line-soft"
                            >
                              <Pencil className="h-3 w-3" />
                              Düzenle
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                openModal({
                                  kind: "delete-branch",
                                  id: branch.id,
                                  name: branch.name,
                                  fieldTitle: field.title,
                                })
                              }
                              aria-label={`${branch.name} dalını sil`}
                              title="Sil"
                              className="inline-flex h-7 w-7 items-center justify-center rounded text-admin-muted hover:bg-rose-50 hover:text-rose-700 focus-visible:text-rose-700"
                            >
                              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        openModal({
                          kind: "add-branch",
                          fieldId: field.id,
                          fieldTitle: field.title,
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-admin-body hover:bg-admin-line-soft"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Dal ekle
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-admin-ink/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPending) setModal(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape" && !isPending) setModal(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="voc-modal-title"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          >
            <h2 id="voc-modal-title" className="mb-5 text-lg font-bold text-admin-ink">
              {MODAL_TITLES[modal.kind]}
            </h2>

            {/* Metin girişi modali */}
            {isTextModal && (
              <div className="mb-5">
                <label className="mb-1.5 block text-sm font-semibold text-admin-body">
                  {modal.kind === "add-field" || modal.kind === "edit-field"
                    ? "Meslek alanı adı"
                    : "Dal adı"}
                </label>
                {modal.kind === "add-branch" && (
                  <p className="mb-2 text-xs text-admin-faint">Alan: {modal.fieldTitle}</p>
                )}
                <input
                  autoFocus
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                    if (e.key === "Escape") setModal(null);
                  }}
                  placeholder={
                    modal.kind === "add-field" || modal.kind === "edit-field"
                      ? "Örn: Bilişim Teknolojileri Alanı"
                      : "Örn: Yazılım Geliştirme"
                  }
                  className={adminInput}
                />
              </div>
            )}

            {/* Silme onay modali */}
            {isDeleteModal && (
              <div className="mb-5 space-y-3">
                <p className="text-sm text-admin-body">
                  {modal.kind === "delete-field" ? (
                    <>
                      <span className="font-semibold">“{modal.title}”</span> meslek alanını
                      silmek istediğinize emin misiniz?
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">“{modal.name}”</span> dalını silmek
                      istediğinize emin misiniz?
                    </>
                  )}
                </p>
                {modal.kind === "delete-field" && modal.branchCount > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Bu alana bağlı{" "}
                    <span className="font-semibold">{modal.branchCount} dal</span> da silinecek
                    ve okullardaki bağlantılar kaldırılacaktır.
                  </div>
                )}
                {modal.kind === "delete-branch" && (
                  <p className="text-xs text-admin-faint">Alan: {modal.fieldTitle}</p>
                )}
              </div>
            )}

            {/* Hata */}
            {modalError && (
              <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {modalError}
              </p>
            )}

            {/* Butonlar */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                disabled={isPending}
                className="rounded-xl border border-admin-line bg-white px-4 py-2.5 text-sm font-semibold text-admin-body hover:bg-admin-ground disabled:opacity-50"
              >
                İptal
              </button>
              {isTextModal && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending}
                  className={adminButton({ variant: "primary" })}
                >
                  {isPending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
                  Kaydet
                </button>
              )}
              {isDeleteModal && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Sil
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
