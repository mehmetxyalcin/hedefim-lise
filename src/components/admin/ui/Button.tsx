import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { adminFocus } from "@/components/admin/ui/styles";

export type AdminButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type AdminButtonSize = "sm" | "md";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<AdminButtonVariant, string> = {
  primary: "bg-admin-accent text-white hover:bg-admin-accent-deep",
  secondary: "border border-admin-line-strong bg-white text-admin-body hover:bg-admin-line-soft",
  ghost: "text-admin-body hover:bg-admin-line-soft",
  danger: "text-rose-700 hover:bg-rose-50",
};

const sizes: Record<AdminButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
};

export function adminButton({
  variant = "secondary",
  size = "md",
  className,
}: { variant?: AdminButtonVariant; size?: AdminButtonSize; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], adminFocus, className);
}

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  loading?: boolean;
};

export function AdminButton({
  variant = "secondary",
  size = "md",
  loading = false,
  disabled,
  className,
  type = "button",
  children,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={adminButton({ variant, size, className: cn(loading && "cursor-wait", className) })}
      {...rest}
    >
      {loading && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
