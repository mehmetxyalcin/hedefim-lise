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

    const markDirty = () => {
      if (!isSubmittingRef.current) {
        isDirtyRef.current = true;
      }
    };

    const markSubmitting = () => {
      isSubmittingRef.current = true;
      isDirtyRef.current = false;
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

    return () => {
      form.removeEventListener("input", markDirty);
      form.removeEventListener("change", markDirty);
      form.removeEventListener("submit", markSubmitting);
      document.removeEventListener("click", warnBeforeNavigation, true);
      window.removeEventListener("beforeunload", warnBeforeUnload);
    };
  }, []);

  return null;
}
