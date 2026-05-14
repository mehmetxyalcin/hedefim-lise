"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Loader2, Plus, Pencil, Trash2 } from "lucide-react";
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
  "add-field": "Meslek Alanı Ekle",
  "edit-field": "Meslek Alanını Düzenle",
  "delete-field": "Meslek Alanını Sil",
  "add-branch": "Dal Ekle",
  "edit-branch": "Dalı Düzenle",
  "delete-branch": "Dalı Sil",
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
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />
        <button
          type="button"
          onClick={() => openModal({ kind: "add-field" })}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Yeni Meslek Alanı
        </button>
      </div>

      {/* Liste */}
      {filteredFields.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-8 py-16 text-center">
          <p className="text-slate-500">
            {search
              ? `"${search}" için sonuç bulunamadı.`
              : "Henüz meslek alanı eklenmemiş."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFields.map((field) => {
            const isOpen = openFields.has(field.id);
            return (
              <div
                key={field.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                {/* Alan başlığı */}
                <div className="flex items-center gap-2 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleField(field.id)}
                    className="flex flex-1 items-center gap-2 text-left"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                    )}
                    <span className="font-semibold text-slate-800">{field.title}</span>
                    <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      {field.vocational_branches.length} dal
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openModal(
                        { kind: "edit-field", id: field.id, title: field.title },
                        field.title,
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50"
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
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    Sil
                  </button>
                </div>

                {/* Dallar (accordion içeriği) */}
                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50 px-4 pb-3 pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Dallar
                    </p>

                    {field.vocational_branches.length === 0 ? (
                      <p className="mb-3 text-sm text-slate-400">
                        Bu alana henüz dal eklenmemiş.
                      </p>
                    ) : (
                      <ul className="mb-3 space-y-0.5">
                        {field.vocational_branches.map((branch) => (
                          <li
                            key={branch.id}
                            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white"
                          >
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                            <span className="flex-1 text-sm text-slate-700">{branch.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                openModal(
                                  { kind: "edit-branch", id: branch.id, name: branch.name },
                                  branch.name,
                                )
                              }
                              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
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
                              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-3 w-3" />
                              Sil
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
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-100"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Dal Ekle
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPending) setModal(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-5 text-lg font-bold text-slate-900">
              {MODAL_TITLES[modal.kind]}
            </h2>

            {/* Metin girişi modali */}
            {isTextModal && (
              <div className="mb-5">
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  {modal.kind === "add-field" || modal.kind === "edit-field"
                    ? "Meslek Alanı Adı"
                    : "Dal Adı"}
                </label>
                {modal.kind === "add-branch" && (
                  <p className="mb-2 text-xs text-slate-400">Alan: {modal.fieldTitle}</p>
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            )}

            {/* Silme onay modali */}
            {isDeleteModal && (
              <div className="mb-5 space-y-3">
                <p className="text-sm text-slate-700">
                  {modal.kind === "delete-field" ? (
                    <>
                      <span className="font-semibold">"{modal.title}"</span> meslek alanını
                      silmek istediğinize emin misiniz?
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">"{modal.name}"</span> dalını silmek
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
                  <p className="text-xs text-slate-400">Alan: {modal.fieldTitle}</p>
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
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                İptal
              </button>
              {isTextModal && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
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
