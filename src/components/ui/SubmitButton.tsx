"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";

// Server action'lı formlar için submit butonu. useFormStatus form'un pending
// durumunu okur; Button'ın loading tonunu (opacity yerine pending rengi) uygular
// ve pending sırasında etiketi değiştirir. useFormStatus zorunlu olarak <form>
// içindeki bir child bileşenden çağrılmalıdır — bu bileşen o sarmalayıcıdır.
type Props = {
  label: React.ReactNode;
  pendingLabel?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
};

export function SubmitButton({
  label,
  pendingLabel = "Kaydediliyor...",
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: Props) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      loading={pending}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      className={cn("min-h-12", className)}
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}
