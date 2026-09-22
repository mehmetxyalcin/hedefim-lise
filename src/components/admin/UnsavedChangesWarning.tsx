"use client";

import { useEffect, useRef } from "react";

export function UnsavedChangesWarning() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const isDirtyRef = useRef(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    const form = document.querySelector<HTMLFormElement>(
      "[data-admin-school-form='true']",
    );

    if (!form) {
      return;
    }

    formRef.current = form;

    const announce = (dirty: boolean) => {
      // Global CustomEvent yerine window.CustomEvent: test ortamı (vm + jsdom) global vermez.
      window.dispatchEvent(new window.CustomEvent("admin-form-dirty", { detail: dirty }));
    };

    const markDirty = () => {
      if (!isSubmittingRef.current && !isDirtyRef.current) {
        isDirtyRef.current = true;
        announce(true);
      }
    };

    const markSubmitting = () => {
      isSubmittingRef.current = true;
      isDirtyRef.current = false;
      announce(false);
    };

    // Kayıt sonucu gelince izleme yeniden başlar. Hata dönerse taslak hâlâ
    // kaydedilmemiştir: sayfadan ayrılırken uyarı yeniden devreye girer.
    const settle = (event: Event) => {
      isSubmittingRef.current = false;
      if ((event as CustomEvent<{ success: boolean }>).detail?.success === false) {
        isDirtyRef.current = true;
        announce(true);
      }
    };

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    const warnBeforeNavigation = (event: MouseEvent) => {
      if (!isDirtyRef.current) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest("a");

      if (!link) {
        return;
      }

      const confirmed = window.confirm(
        "Kaydedilmemiş değişiklikler var. Sayfadan ayrılmak istediğinize emin misiniz?",
      );

      if (!confirmed) {
        event.preventDefault();
      }
    };

    form.addEventListener("input", markDirty);
    form.addEventListener("change", markDirty);
    form.addEventListener("submit", markSubmitting);
    document.addEventListener("click", warnBeforeNavigation, true);
    window.addEventListener("beforeunload", warnBeforeUnload);
    window.addEventListener("admin-form-settled", settle);

    return () => {
      form.removeEventListener("input", markDirty);
      form.removeEventListener("change", markDirty);
      form.removeEventListener("submit", markSubmitting);
      document.removeEventListener("click", warnBeforeNavigation, true);
      window.removeEventListener("beforeunload", warnBeforeUnload);
      window.removeEventListener("admin-form-settled", settle);
    };
  }, []);

  return null;
}
