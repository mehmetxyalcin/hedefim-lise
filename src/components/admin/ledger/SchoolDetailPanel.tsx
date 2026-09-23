"use client";

import { useEffect, useRef } from "react";
import { ChevronRight, ExternalLink, Eye, EyeOff, Pencil, Trash2, X } from "lucide-react";
import { formatFullDate, type LedgerRow } from "@/lib/admin-ledger";
import { HealthPips } from "@/components/admin/ui/HealthPips";
import { Badge } from "@/components/admin/ui/Badge";
import { adminButton } from "@/components/admin/ui/Button";
import { adminFocus } from "@/components/admin/ui/styles";
import { cn } from "@/lib/cn";

type Action = (formData: FormData) => void | Promise<void>;

type Props = {
  row: LedgerRow;
  onClose: () => void;
  toggleStatusAction: Action;
  deleteAction: Action;
  // Defterin güncel adresi; action bu görünüme geri döner.
  returnTo: string;
};

// Düzenleme bağlantıları düz <a>: tam sayfa geçişiyle form sekmesine iner.
export function SchoolDetailPanel({ row, onClose, toggleStatusAction, deleteAction, returnTo }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const editHref = `/admin/okullar/${row.slug}/duzenle`;
  const missing = row.health.items.filter((item) => item.status === "missing");
  const okCount = row.health.items.filter((item) => item.status === "ok").length;
  const notRequired = row.health.items
    .filter((item) => item.status === "na")
    .map((item) => item.label.toLocaleLowerCase("tr-TR"));

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [row.slug, onClose]);

  return (
    <>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Paneli kapat"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-admin-ink/30 xl:hidden"
      />
      <aside
        aria-label={`${row.name} künyesi`}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col overflow-y-auto bg-white shadow-xl xl:sticky xl:top-20 xl:z-auto xl:max-h-[calc(100vh-6rem)] xl:w-auto xl:max-w-none xl:rounded-xl xl:border xl:border-admin-line xl:shadow-admin-card"
      >
        <div className="flex items-start gap-3 border-b border-admin-line p-5">
          <div className="min-w-0 flex-1">
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="text-base leading-snug font-bold text-admin-ink outline-none"
            >
              {row.name}
            </h2>
            <p className="mt-1 text-xs text-admin-muted">
              {row.district} · {row.type}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
              <Badge tone={row.isActive ? "success" : "warning"}>{row.isActive ? "Yayında" : "Pasif"}</Badge>
              <HealthPips items={row.health.items} size="md" />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Paneli kapat"
            className={cn("-m-1 rounded-lg p-1.5 text-admin-muted hover:bg-admin-line-soft hover:text-admin-ink", adminFocus)}
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 p-5">
          <section>
            <h3 className="mb-2 text-xs font-semibold text-admin-muted">
              {missing.length === 0 ? "Eksik yok" : `Eksikler (${missing.length})`}
            </h3>
            {missing.length > 0 && (
              <ul className="divide-y divide-admin-line-soft overflow-hidden rounded-lg border border-admin-line">
                {missing.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`${editHref}?tab=${item.tab}`}
                      className={cn("flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-admin-ground", adminFocus)}
                    >
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 shrink-0 rounded-[3px] border-[1.5px] border-admin-missing"
                      />
                      <span className="flex-1 text-admin-ink">{item.message}</span>
                      <span className="inline-flex items-center text-xs font-semibold text-admin-accent">
                        Düzelt
                        <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-admin-muted">
              {okCount} kontrol tamam
              {notRequired.length > 0 && ` · ${notRequired.join(", ")}: gerekmez`}
            </p>
          </section>
          <p className="text-xs text-admin-muted">Son güncelleme: {formatFullDate(row.updatedAt)}</p>
        </div>

        <div className="space-y-2 border-t border-admin-line p-5">
          <a href={editHref} className={adminButton({ className: "w-full" })}>
            <Pencil aria-hidden="true" className="h-4 w-4" />
            Düzenle
          </a>
          <div className="grid grid-cols-2 gap-2">
            {row.isActive ? (
              <a
                href={`/okullar/${row.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className={adminButton({ size: "sm" })}
              >
                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                Sitede aç
              </a>
            ) : (
              <span
                aria-disabled="true"
                title="Pasif okul sitede görünmez"
                className={adminButton({ size: "sm", className: "pointer-events-none opacity-50" })}
              >
                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                Sitede aç
              </span>
            )}
            <form
              action={toggleStatusAction}
              onSubmit={(event) => {
                if (
                  row.isActive &&
                  !window.confirm(
                    `"${row.name}" okulunu pasif hale getirmek istediğinize emin misiniz? Pasif okullar yayındaki listede görünmez.`,
                  )
                ) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="is_active" value={String(!row.isActive)} />
              <input type="hidden" name="return_to" value={returnTo} />
              <button type="submit" className={adminButton({ size: "sm", className: "w-full" })}>
                {row.isActive ? (
                  <EyeOff aria-hidden="true" className="h-3.5 w-3.5" />
                ) : (
                  <Eye aria-hidden="true" className="h-3.5 w-3.5" />
                )}
                {row.isActive ? "Pasifleştir" : "Aktifleştir"}
              </button>
            </form>
          </div>
          <form
            action={deleteAction}
            onSubmit={(event) => {
              if (
                !window.confirm(
                  `"${row.name}" okulunu silmek istediğinize emin misiniz? Bu işlem geri alınmaz.`,
                )
              ) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="return_to" value={returnTo} />
            <button type="submit" className={adminButton({ variant: "danger", size: "sm", className: "w-full" })}>
              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
              Okulu sil
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
