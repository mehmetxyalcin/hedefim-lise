import { cn } from "@/lib/cn";

// Meta etiketleri ve durum rozetleri. DESIGN.md "The Meaning-Only Rule":
// tonlar anlam taşır (emerald=olumlu, rose=yıkıcı/uyarı, amber=dikkat), slate=nötr.
type BadgeTone = "blue" | "slate" | "emerald" | "amber" | "rose";
type BadgeVariant = "meta" | "soft";

const toneClasses: Record<BadgeTone, string> = {
  blue: "border-blue-100 bg-blue-50 text-blue-700",
  slate: "border-slate-200 bg-slate-100/80 text-slate-600",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
  amber: "border-amber-100 bg-amber-50 text-amber-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
};

const variantClasses: Record<BadgeVariant, string> = {
  // Küçük, kalın, geniş harf aralıklı büyük-harf meta etiketi (tür/ilçe).
  meta: "gap-1 rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
  // Normal boy yumuşak durum rozeti.
  soft: "gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold",
};

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  variant?: BadgeVariant;
};

export function Badge({
  tone = "blue",
  variant = "meta",
  className,
  children,
  ...rest
}: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center",
        variantClasses[variant],
        toneClasses[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
