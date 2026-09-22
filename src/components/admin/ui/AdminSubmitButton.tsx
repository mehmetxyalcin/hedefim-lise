"use client";

import { useFormStatus } from "react-dom";
import { AdminButton, type AdminButtonVariant } from "@/components/admin/ui/Button";

// Server action'lı formlar için. useFormStatus <form> içindeki bir alt
// bileşenden çağrılmalı; bu bileşen o sarmalayıcıdır (ui/SubmitButton ile aynı).
type Props = {
  label: React.ReactNode;
  pendingLabel?: React.ReactNode;
  variant?: AdminButtonVariant;
  className?: string;
};

export function AdminSubmitButton({
  label,
  pendingLabel = "Kaydediliyor…",
  variant = "primary",
  className,
}: Props) {
  const { pending } = useFormStatus();

  return (
    <AdminButton type="submit" variant={variant} loading={pending} className={className}>
      {pending ? pendingLabel : label}
    </AdminButton>
  );
}
