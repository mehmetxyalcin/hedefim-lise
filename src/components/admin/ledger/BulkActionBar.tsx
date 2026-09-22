"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { AdminButton, adminButton } from "@/components/admin/ui/Button";

type Action = (formData: FormData) => void | Promise<void>;

export function BulkActionBar({
  ids,
  onClear,
  action,
}: {
  ids: number[];
  onClear: () => void;
  action: Action;
}) {
  if (ids.length === 0) return null;
  const hidden = ids.map((id) => <input key={id} type="hidden" name="ids" value={id} />);

  return (
    <div
      role="region"
      aria-label="Toplu işlemler"
      className="sticky bottom-4 z-20 mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-admin-line bg-white px-4 py-3 shadow-lg"
    >
      <p className="mr-auto text-sm font-semibold text-admin-ink tabular-nums">{ids.length} okul seçildi</p>
      <form action={action}>
        {hidden}
        <input type="hidden" name="is_active" value="true" />
        <button type="submit" className={adminButton({ size: "sm" })}>
          <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-emerald-700" />
          Aktif yap
        </button>
      </form>
      <form
        action={action}
        onSubmit={(event) => {
          if (
            !window.confirm(
              `${ids.length} okulu pasif hale getirmek istediğinize emin misiniz? Pasif okullar yayındaki listede görünmez.`,
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        {hidden}
        <input type="hidden" name="is_active" value="false" />
        <button type="submit" className={adminButton({ size: "sm" })}>
          <XCircle aria-hidden="true" className="h-3.5 w-3.5 text-amber-700" />
          Pasif yap
        </button>
      </form>
      <AdminButton variant="ghost" size="sm" onClick={onClear}>
        Seçimi temizle
      </AdminButton>
    </div>
  );
}
