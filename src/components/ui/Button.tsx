import { cn } from "@/lib/cn";

// Birincil eylem butonu ve türevleri. DESIGN.md: Exam Blue tek eylem sinyali;
// secondary = slate dolgu, ghost = çıplak, danger = rose.
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700",
  secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  ghost: "text-slate-700 hover:bg-slate-100",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-sm",
};

// Link/anchor'lara stil vermek için sınıf üreticisi (bileşen <button> render eder).
export function buttonVariants({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}): string {
  return cn(
    base,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    className,
  );
}

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  type = "button",
  children,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={buttonVariants({ variant, size, fullWidth, className })}
      {...rest}
    >
      {children}
    </button>
  );
}
