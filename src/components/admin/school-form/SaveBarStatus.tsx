"use client";

import { useEffect, useState } from "react";
import { CircleCheck } from "lucide-react";

// Kaydet çubuğunun sol tarafı: kaydedilmemiş değişiklik uyarısı ya da son
// başarılı kaydın bildirimi. Yeni bir düzenleme başlayınca uyarı öne geçer.
export function SaveBarStatus({ success }: { success: string | null }) {
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    function onDirty(event: Event) {
      setDirty(Boolean((event as CustomEvent<boolean>).detail));
    }
    window.addEventListener("admin-form-dirty", onDirty);
    return () => window.removeEventListener("admin-form-dirty", onDirty);
  }, []);

  if (dirty) {
    return (
      <p className="flex items-center gap-2 text-sm text-admin-body">
        <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-amber-600" />
        Kaydedilmemiş değişiklik var
      </p>
    );
  }

  if (success) {
    return (
      <p role="status" className="flex items-center gap-2 text-sm font-medium text-emerald-800">
        <CircleCheck aria-hidden="true" className="h-4 w-4 shrink-0" />
        {success}
      </p>
    );
  }

  return <p className="text-sm text-admin-muted">Kaydettiğinizde sitedeki sayfalar da güncellenir.</p>;
}
